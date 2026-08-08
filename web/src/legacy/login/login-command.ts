import { LogicEvent } from "../common/logic-event";
import { HttpConfig } from "../config/http-config";
import { ServerConfig } from "../config/server-config";
import { EventMgr } from "../events/event-manager";
import { MapBootstrapCommand } from "../map/map-bootstrap-command";
import { HttpManager } from "../network/http/http-manager";
import { NetEvent } from "../network/socket/net-interface";
import { NetManager } from "../network/socket/net-manager";
import { DateUtil } from "../utils/date-util";
import { LocalCache } from "../utils/local-cache";
import { Tools } from "../utils/tools";
import { LoginProxy } from "./login-proxy";

type ServerResponse = {
  code?: number;
  msg?: any;
};

type LoginMetadata = {
  username: string;
};

type RegisterMetadata = LoginMetadata & {
  password: string;
};

export class LoginCommand {
  private static instance: LoginCommand | null = null;
  private readonly loginProxy = new LoginProxy();

  static getInstance(): LoginCommand {
    if (!LoginCommand.instance) {
      LoginCommand.instance = new LoginCommand();
    }

    return LoginCommand.instance;
  }

  static destroy(): void {
    LoginCommand.instance?.onDestroy();
    LoginCommand.instance = null;
  }

  private constructor() {
    EventMgr.on(
      NetEvent.ServerCheckLogin,
      this.onServerConnected,
      this,
    );
    EventMgr.on(
      HttpConfig.register.name,
      this.onRegister,
      this,
    );
    EventMgr.on(
      ServerConfig.account_login,
      this.onAccountLogin,
      this,
    );
    EventMgr.on(
      ServerConfig.role_enterServer,
      this.onEnterServer,
      this,
    );
    EventMgr.on(
      ServerConfig.account_reLogin,
      this.onAccountRelogin,
      this,
    );
    EventMgr.on(
      ServerConfig.role_create,
      this.onRoleCreate,
      this,
    );
    EventMgr.on(
      ServerConfig.account_logout,
      this.onAccountLogout,
      this,
    );
    EventMgr.on(
      ServerConfig.account_robLogin,
      this.onAccountRobLogin,
      this,
    );
  }

  get proxy(): LoginProxy {
    return this.loginProxy;
  }

  register(username: string, password: string): void {
    const params = new URLSearchParams({
      username,
      password,
      hardware: Tools.getUUID(),
    }).toString();

    HttpManager.getInstance().doPost(
      HttpConfig.register.name,
      HttpConfig.register.url,
      params,
      { username, password } satisfies RegisterMetadata,
    );
  }

  accountLogin(username: string, password: string): void {
    NetManager.getInstance().send(
      {
        name: ServerConfig.account_login,
        msg: {
          username,
          password,
          hardware: Tools.getUUID(),
        },
      },
      { username } satisfies LoginMetadata,
    );
  }

  roleCreate(
    uid: string | number,
    nickname: string,
    sex = 0,
    serverId = 0,
    headId = 0,
  ): void {
    NetManager.getInstance().send({
      name: ServerConfig.role_create,
      msg: {
        uid,
        nickName: nickname,
        sex,
        sid: serverId,
        headId,
      },
    });
  }

  roleEnterServer(
    session: string,
    loadMap = true,
  ): void {
    NetManager.getInstance().send(
      {
        name: ServerConfig.role_enterServer,
        msg: { session },
      },
      loadMap,
    );
  }

  accountRelogin(session: string): void {
    NetManager.getInstance().send({
      name: ServerConfig.account_reLogin,
      msg: {
        session,
        hardware: Tools.getUUID(),
      },
    });
  }

  accountLogout(): void {
    NetManager.getInstance().send({
      name: ServerConfig.account_logout,
      msg: {},
    });
  }

  private readonly onRegister = (
    data: ServerResponse,
    otherData: RegisterMetadata,
  ): void => {
    if (data.code !== 0) return;

    this.rememberUsername(otherData.username);
    this.accountLogin(
      otherData.username,
      otherData.password,
    );
  };

  private readonly onAccountLogin = (
    data: ServerResponse,
    otherData: LoginMetadata,
  ): void => {
    if (data.code !== 0 || !data.msg) return;

    this.loginProxy.saveLoginData(data.msg);
    this.rememberUsername(otherData.username);
    this.roleEnterServer(this.loginProxy.getSession());
    EventMgr.emit(LogicEvent.loginComplete, data.code);
  };

  private readonly onEnterServer = (
    data: ServerResponse,
    loadMap = true,
  ): void => {
    if (data.code === 9) {
      if (typeof data.msg?.time === "number") {
        DateUtil.setServerTime(data.msg.time);
      }
      EventMgr.emit(LogicEvent.createRole);
      return;
    }

    if (data.code !== 0 || !data.msg) return;

    this.loginProxy.saveEnterData(data.msg);
    if (typeof data.msg.time === "number") {
      DateUtil.setServerTime(data.msg.time);
    }

    if (loadMap) {
      MapBootstrapCommand.getInstance().enterMap();
      EventMgr.emit(LogicEvent.enterServerComplete);
    } else {
      EventMgr.emit(NetEvent.ServerHandShake);
    }
  };

  private readonly onServerConnected = (): void => {
    const loginData = this.loginProxy.getLoginData();
    const session = loginData?.session;

    if (session) {
      this.accountRelogin(session);
      return;
    }

    EventMgr.emit(NetEvent.ServerHandShake);
  };

  private readonly onAccountRelogin = (
    data: ServerResponse,
  ): void => {
    if (data.code === 0) {
      this.roleEnterServer(
        this.loginProxy.getSession(),
        false,
      );
    }
  };

  private readonly onRoleCreate = (
    data: ServerResponse,
  ): void => {
    if (data.code === 0) {
      this.roleEnterServer(this.loginProxy.getSession());
    }
  };

  private readonly onAccountLogout = (
    data: ServerResponse,
  ): void => {
    if (data.code !== 0) return;

    this.loginProxy.clear();
    MapBootstrapCommand.getInstance().clearData();
    EventMgr.emit(LogicEvent.enterLogin);
  };

  private readonly onAccountRobLogin = (): void => {
    EventMgr.emit(LogicEvent.robLoginUI);
  };

  private rememberUsername(username: string): void {
    LocalCache.setLoginValidation({ username });
  }

  private onDestroy(): void {
    EventMgr.targetOff(this);
    this.loginProxy.clear();
  }
}
