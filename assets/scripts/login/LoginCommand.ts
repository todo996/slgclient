import { HttpConfig } from "../config/HttpConfig";
import { ServerConfig } from "../config/ServerConfig";
import { HttpManager } from "../network/http/HttpManager";
import { NetManager } from "../network/socket/NetManager";
import { Tools } from "../utils/Tools";
import LoginProxy from "./LoginProxy";
import { NetEvent } from "../network/socket/NetInterface";
import MapCommand from "../map/MapCommand";
import { LocalCache } from "../utils/LocalCache";
import DateUtil from "../utils/DateUtil";
import { EventMgr } from "../utils/EventMgr";
import { Md5 } from "../libs/crypto/md5";
import { LogicEvent } from "../common/LogicEvent";

export default class LoginCommand {
    protected static _instance: LoginCommand;

    public static getInstance(): LoginCommand {
        if (this._instance == null) {
            this._instance = new LoginCommand();
        }
        return this._instance;
    }

    public static destory(): boolean {
        if (!this._instance) {
            return false;
        }
        this._instance.onDestory();
        this._instance = null;
        return true;
    }

    protected _proxy: LoginProxy = new LoginProxy();

    constructor() {
        EventMgr.on(NetEvent.ServerCheckLogin, this.onServerConneted, this);
        EventMgr.on(HttpConfig.register.name, this.onRegister, this);
        EventMgr.on(ServerConfig.account_login, this.onAccountLogin, this);
        EventMgr.on(ServerConfig.role_enterServer, this.onEnterServer, this);
        EventMgr.on(ServerConfig.account_reLogin, this.onAccountRelogin, this);
        EventMgr.on(ServerConfig.role_create, this.onRoleCreate, this);
        EventMgr.on(ServerConfig.account_logout, this.onAccountLogout, this);
        EventMgr.on(ServerConfig.account_robLogin, this.onAccountRobLogin, this);
        EventMgr.on(ServerConfig.chat_login, this.onChatLogin, this);
    }

    public onDestory(): void {
        EventMgr.targetOff(this);
    }

    private onAccountRobLogin(): void {
        EventMgr.emit(LogicEvent.robLoginUI);
    }

    private onRegister(data: any, otherData: { username: string; password: string }): void {
        if (data.code === 0) {
            this.rememberUsername(otherData.username);
            this.accountLogin(otherData.username, otherData.password);
        }
    }

    private onAccountLogin(data: any, otherData: { username: string }): void {
        if (data.code !== 0) {
            return;
        }

        this._proxy.saveLoginData(data.msg);
        this.rememberUsername(otherData.username);
        this.role_enterServer(this._proxy.getSession());
        EventMgr.emit(LogicEvent.loginComplete, data.code);
    }

    private onEnterServer(data: any, isLoadMap: boolean): void {
        if (data.code === 9) {
            EventMgr.emit(LogicEvent.createRole);
            DateUtil.setServerTime(data.msg.time);
            return;
        }

        if (data.code !== 0) {
            return;
        }

        this._proxy.saveEnterData(data.msg);
        DateUtil.setServerTime(data.msg.time);

        if (isLoadMap) {
            MapCommand.getInstance().enterMap();
            EventMgr.emit(LogicEvent.enterServerComplete);
        } else {
            EventMgr.emit(NetEvent.ServerHandShake);
        }
    }

    private onServerConneted(): void {
        const loginData = this._proxy.getLoginData();
        if (loginData) {
            this.account_reLogin(loginData.session);
        } else {
            EventMgr.emit(NetEvent.ServerHandShake);
        }
    }

    private onAccountRelogin(data: any): void {
        if (data.code === 0) {
            this.role_enterServer(this._proxy.getSession(), false);
        }
    }

    private onRoleCreate(data: any): void {
        if (data.code === 0) {
            this.role_enterServer(this._proxy.getSession());
        }
    }

    private onAccountLogout(data: any): void {
        if (data.code === 0) {
            this._proxy.clear();
            EventMgr.emit(LogicEvent.enterLogin);
        }
    }

    private onChatLogin(_data: any): void {
        // Kết nối chat dùng chung gateway; không ghi token hoặc dữ liệu nhạy cảm ra console.
    }

    private rememberUsername(username: string): void {
        LocalCache.setLoginValidation({ username });
    }

    public get proxy(): LoginProxy {
        return this._proxy;
    }

    public register(name: string, password: string): void {
        const passwordValue = Md5.encrypt(password);
        const params = new URLSearchParams({
            username: name,
            password: passwordValue,
            hardware: Tools.getUUID(),
        }).toString();

        const otherData = { username: name, password };
        HttpManager.getInstance().doPost(
            HttpConfig.register.name,
            HttpConfig.register.url,
            params,
            otherData,
        );
    }

    public accountLogin(name: string, password: string): void {
        const sendData = {
            name: ServerConfig.account_login,
            msg: {
                username: name,
                password: Md5.encrypt(password),
                hardware: Tools.getUUID(),
            },
        };
        NetManager.getInstance().send(sendData, { username: name });
    }

    public role_create(
        uid: string,
        nickName: string,
        sex: number = 0,
        sid: number = 0,
        headId: number = 0,
    ): void {
        NetManager.getInstance().send({
            name: ServerConfig.role_create,
            msg: { uid, nickName, sex, sid, headId },
        });
    }

    public role_enterServer(session: string, isLoadMap: boolean = true): void {
        NetManager.getInstance().send({
            name: ServerConfig.role_enterServer,
            msg: { session },
        }, isLoadMap);
    }

    public account_reLogin(session: string): void {
        NetManager.getInstance().send({
            name: ServerConfig.account_reLogin,
            msg: {
                session,
                hardware: Tools.getUUID(),
            },
        });
    }

    public account_logout(): void {
        NetManager.getInstance().send({
            name: ServerConfig.account_logout,
            msg: {},
        });
    }

    public chatLogin(rid: number, token: string, nickName: string = ""): void {
        NetManager.getInstance().send({
            name: ServerConfig.chat_login,
            msg: { rid, token, nickName },
        });
    }
}
