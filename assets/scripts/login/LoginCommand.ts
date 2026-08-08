import { LogicEvent } from '../common/LogicEvent';
import { HttpConfig } from '../config/HttpConfig';
import { ServerConfig } from '../config/ServerConfig';
import MapCommand from '../map/MapCommand';
import { HttpManager } from '../network/http/HttpManager';
import { NetEvent } from '../network/socket/NetInterface';
import { NetManager } from '../network/socket/NetManager';
import DateUtil from '../utils/DateUtil';
import { EventMgr } from '../utils/EventMgr';
import { LocalCache } from '../utils/LocalCache';
import { Tools } from '../utils/Tools';
import LoginProxy from './LoginProxy';

type AuthTone = 'info' | 'success' | 'error';

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
    private _loginTimeout: any = null;
    private _registerTimeout: any = null;

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
        this.clearLoginTimeout();
        this.clearRegisterTimeout();
        EventMgr.targetOff(this);
    }

    private emitAuthState(
        busy: boolean,
        message: string = '',
        tone: AuthTone = 'info',
    ): void {
        EventMgr.emit(LogicEvent.authStateChanged, { busy, message, tone });
    }

    private showToast(message: string): void {
        EventMgr.emit(LogicEvent.showToast, message);
    }

    private getResponseMessage(data: any, fallback: string): string {
        if (!data) {
            return fallback;
        }
        const message = data.errmsg || data.message || data.msg;
        return typeof message === 'string' && message.trim() !== ''
            ? message.trim()
            : fallback;
    }

    private clearLoginTimeout(): void {
        if (this._loginTimeout !== null) {
            clearTimeout(this._loginTimeout);
            this._loginTimeout = null;
        }
    }

    private clearRegisterTimeout(): void {
        if (this._registerTimeout !== null) {
            clearTimeout(this._registerTimeout);
            this._registerTimeout = null;
        }
    }

    private onAccountRobLogin(): void {
        this.emitAuthState(false, 'Tài khoản đã đăng nhập trên thiết bị khác.', 'error');
        EventMgr.emit(LogicEvent.robLoginUI);
    }

    private onRegister(data: any, otherData: { username: string; password: string }): void {
        this.clearRegisterTimeout();
        if (!data || data.code !== 0) {
            const message = this.getResponseMessage(
                data,
                'Không thể đăng ký. Vui lòng kiểm tra kết nối máy chủ rồi thử lại.',
            );
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
            return;
        }

        this.rememberUsername(otherData.username);
        this.emitAuthState(true, 'Đăng ký thành công. Đang đăng nhập...', 'success');
        this.accountLogin(otherData.username, otherData.password);
    }

    private onAccountLogin(data: any, otherData: { username: string }): void {
        this.clearLoginTimeout();
        if (!data || data.code !== 0) {
            const message = this.getResponseMessage(
                data,
                'Đăng nhập thất bại. Tài khoản hoặc mật khẩu không đúng.',
            );
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
            return;
        }

        if (!data.msg) {
            const message = 'Máy chủ trả về dữ liệu đăng nhập không hợp lệ.';
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
            return;
        }

        this._proxy.saveLoginData(data.msg);
        this.rememberUsername(otherData.username);
        this.emitAuthState(true, 'Đăng nhập thành công. Đang vào máy chủ...', 'success');
        this.role_enterServer(this._proxy.getSession());
        EventMgr.emit(LogicEvent.loginComplete, data.code);
    }

    private onEnterServer(data: any, isLoadMap: boolean): void {
        if (!data) {
            const message = 'Không nhận được dữ liệu từ máy chủ game.';
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
            return;
        }

        if (data.code === 9) {
            this.emitAuthState(false, '', 'info');
            EventMgr.emit(LogicEvent.createRole);
            if (data.msg?.time) {
                DateUtil.setServerTime(data.msg.time);
            }
            return;
        }

        if (data.code !== 0) {
            const message = this.getResponseMessage(data, 'Không thể vào máy chủ game.');
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
            return;
        }

        this.emitAuthState(false, '', 'success');
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
        if (data?.code === 0) {
            this.role_enterServer(this._proxy.getSession(), false);
        }
    }

    private onRoleCreate(data: any): void {
        if (data?.code === 0) {
            this.role_enterServer(this._proxy.getSession());
        }
    }

    private onAccountLogout(data: any): void {
        if (data?.code === 0) {
            this._proxy.clear();
            EventMgr.emit(LogicEvent.enterLogin);
        }
    }

    private onChatLogin(_data: any): void {
        // Kết nối chat dùng chung gateway; không ghi dữ liệu nhạy cảm ra console.
    }

    private rememberUsername(username: string): void {
        LocalCache.setLoginValidation({ username });
    }

    public get proxy(): LoginProxy {
        return this._proxy;
    }

    public register(name: string, password: string): void {
        this.clearRegisterTimeout();
        this.emitAuthState(true, 'Đang tạo tài khoản...', 'info');
        this._registerTimeout = setTimeout(() => {
            this._registerTimeout = null;
            const message = 'Không nhận được phản hồi đăng ký từ máy chủ.';
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
        }, 15000);

        const params = new URLSearchParams({
            username: name,
            password,
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
        this.clearLoginTimeout();
        this.emitAuthState(true, 'Đang xác thực tài khoản...', 'info');
        this._loginTimeout = setTimeout(() => {
            this._loginTimeout = null;
            const message = 'Không nhận được phản hồi đăng nhập từ máy chủ.';
            this.emitAuthState(false, message, 'error');
            this.showToast(message);
        }, 15000);

        NetManager.getInstance().send({
            name: ServerConfig.account_login,
            msg: {
                username: name,
                password,
                hardware: Tools.getUUID(),
            },
        }, { username: name });
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

    public chatLogin(rid: number, token: string, nickName: string = ''): void {
        NetManager.getInstance().send({
            name: ServerConfig.chat_login,
            msg: { rid, token, nickName },
        });
    }
}
