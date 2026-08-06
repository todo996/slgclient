import { createGame, type GameRuntime } from "../game/game";
import { LogicEvent } from "../legacy/common/logic-event";
import { EventMgr } from "../legacy/events/event-manager";
import { LoginCommand } from "../legacy/login/login-command";
import { MapBootstrapCommand } from "../legacy/map/map-bootstrap-command";
import { HttpManager } from "../legacy/network/http/http-manager";
import {
  NetEvent,
  type NetTimeoutData,
} from "../legacy/network/socket/net-interface";
import {
  NetNodeState,
  NetNodeType,
  type NetworkStateSnapshot,
} from "../legacy/network/socket/net-node";
import { NetManager } from "../legacy/network/socket/net-manager";
import { Tools } from "../legacy/utils/tools";
import type { AppShell } from "../ui/create-app-shell";
import { createRolePanel } from "../ui/panels/create-role-panel";
import { createLoginPanel } from "../ui/panels/login-panel";
import { UIManager } from "../ui/ui-manager";
import { loadRuntimeConfig } from "./runtime-config";

type ServerResponse = {
  code?: number;
};

export class Bootstrap {
  private gameRuntime: GameRuntime | null = null;
  private readonly uiManager: UIManager;
  private retryTimes = 0;

  constructor(private readonly shell: AppShell) {
    this.uiManager = new UIManager(shell.panelRoot);
  }

  start(): void {
    const runtimeConfig = loadRuntimeConfig();

    this.shell.setConnectionStatus("Đang khởi tạo");
    this.shell.setPhase("Đăng nhập để tiếp tục");

    this.gameRuntime = createGame({
      parent: this.shell.gameCanvasId,
    });

    this.registerEvents();
    LoginCommand.getInstance();
    MapBootstrapCommand.getInstance();

    HttpManager.getInstance().setWebUrl(
      runtimeConfig.httpUrl,
    );

    this.enterLogin();

    NetManager.getInstance().connect({
      url: runtimeConfig.wsUrl,
      autoReconnect: 3,
      type: NetNodeType.BaseServer,
    });

    window.addEventListener(
      "beforeunload",
      this.destroy,
      { once: true },
    );
  }

  private registerEvents(): void {
    EventMgr.on(
      NetEvent.NetworkStateChanged,
      this.onNetworkStateChanged,
      this,
    );
    EventMgr.on(
      NetEvent.NetworkError,
      this.onNetworkError,
      this,
    );
    EventMgr.on(
      NetEvent.ServerTimeOut,
      this.onServerTimeout,
      this,
    );
    EventMgr.on(
      NetEvent.ServerRequestSucess,
      this.onServerRequest,
      this,
    );
    EventMgr.on(
      LogicEvent.enterLogin,
      this.enterLogin,
      this,
    );
    EventMgr.on(
      LogicEvent.createRole,
      this.openCreateRole,
      this,
    );
    EventMgr.on(
      LogicEvent.enterMap,
      this.onEnterMap,
      this,
    );
    EventMgr.on(
      LogicEvent.showToast,
      this.onShowToast,
      this,
    );
    EventMgr.on(
      LogicEvent.showWaiting,
      this.showWaiting,
      this,
    );
    EventMgr.on(
      LogicEvent.hideWaiting,
      this.hideWaiting,
      this,
    );
    EventMgr.on(
      LogicEvent.robLoginUI,
      this.onRobLogin,
      this,
    );
  }

  private readonly enterLogin = (): void => {
    this.retryTimes = 0;
    this.shell.showWaiting(false);
    this.shell.setPhase("Đăng nhập để tiếp tục");
    this.uiManager.closeAll();
    MapBootstrapCommand.getInstance().clearData();
    this.uiManager.open(
      createLoginPanel(LoginCommand.getInstance()),
    );
  };

  private readonly openCreateRole = (): void => {
    this.shell.showWaiting(false);
    this.shell.setPhase("Tạo nhân vật");
    this.uiManager.closeAll();
    this.uiManager.open(
      createRolePanel(LoginCommand.getInstance()),
    );
  };

  private readonly onEnterMap = (): void => {
    this.shell.showWaiting(false);
    this.shell.setPhase("Đã tải dữ liệu nền tảng bản đồ");
    this.uiManager.closeAll();
    this.gameRuntime?.game.events.emit(
      "legacy-map-bootstrap-ready",
    );
  };

  private readonly onNetworkStateChanged = (
    snapshot: NetworkStateSnapshot,
  ): void => {
    const labels: Record<NetNodeState, string> = {
      [NetNodeState.Closed]: "Đã ngắt kết nối",
      [NetNodeState.Connecting]: "Đang kết nối",
      [NetNodeState.Checking]: "Đang bắt tay",
      [NetNodeState.Working]: "Đã kết nối",
    };

    this.shell.setConnectionStatus(
      labels[snapshot.state],
    );
  };

  private readonly onNetworkError = (): void => {
    this.shell.showWaiting(false);
    this.shell.setConnectionStatus(
      "Lỗi kết nối, đang thử lại",
    );
  };

  private readonly onServerTimeout = (
    _message: NetTimeoutData,
  ): void => {
    this.shell.showWaiting(false);
    this.shell.showToast(
      "Máy chủ phản hồi quá lâu. Vui lòng thử lại.",
    );
  };

  private readonly onServerRequest = (
    message: ServerResponse,
  ): void => {
    this.shell.showWaiting(false);

    if (
      message.code === undefined ||
      message.code === 0 ||
      message.code === 9
    ) {
      this.retryTimes = 0;
      return;
    }

    if (
      [-1, -2, -3, -4].includes(message.code) &&
      this.retryTimes < 3
    ) {
      const session = LoginCommand
        .getInstance()
        .proxy
        .getSession();

      if (session) {
        this.retryTimes += 1;
        LoginCommand
          .getInstance()
          .roleEnterServer(session, false);
        return;
      }
    }

    this.shell.showToast(Tools.getCodeStr(message.code));
  };

  private readonly onShowToast = (message: string): void => {
    this.shell.showToast(message);
  };

  private readonly showWaiting = (): void => {
    this.shell.showWaiting(true);
  };

  private readonly hideWaiting = (): void => {
    this.shell.showWaiting(false);
  };

  private readonly onRobLogin = (): void => {
    this.shell.showToast(
      "Tài khoản đã đăng nhập ở thiết bị khác.",
    );
    this.enterLogin();
  };

  private readonly destroy = (): void => {
    this.uiManager.closeAll();
    EventMgr.targetOff(this);
    LoginCommand.destroy();
    MapBootstrapCommand.destroy();
    NetManager.getInstance().destroy();
    this.gameRuntime?.destroy();
    this.gameRuntime = null;
  };
}
