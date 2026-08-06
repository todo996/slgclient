import { _decorator, Component, EditBox } from 'cc';
const { ccclass, property } = _decorator;

import { LocalCache } from "../utils/LocalCache";
import LoginCommand from "./LoginCommand";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('LoginLogic')
export default class LoginLogic extends Component {

    @property(EditBox)
    editName: EditBox = null;

    @property(EditBox)
    editPass: EditBox = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.loginComplete, this.onLoginComplete, this);

        const data = LocalCache.getLoginValidation();
        if (data) {
            this.editName.string = data.username || "";
        }
        this.editPass.string = "";
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onLoginComplete(): void {
        this.editPass.string = "";
        this.node.active = false;
    }

    protected onClickRegister(): void {
        AudioManager.instance.playClick();
        const username = this.editName.string.trim();
        const password = this.editPass.string;

        if (!username || !password) {
            EventMgr.emit(LogicEvent.showToast, "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        const usernameLength = Array.from(username).length;
        if (usernameLength < 3 || usernameLength > 20) {
            EventMgr.emit(LogicEvent.showToast, "Tài khoản phải có từ 3 đến 20 ký tự.");
            return;
        }

        const passwordBytes = new TextEncoder().encode(password).length;
        if (passwordBytes < 8 || passwordBytes > 72) {
            EventMgr.emit(LogicEvent.showToast, "Mật khẩu phải có từ 8 đến 72 byte.");
            return;
        }

        LoginCommand.getInstance().register(username, password);
    }

    protected onClickLogin(): void {
        AudioManager.instance.playClick();
        const username = this.editName.string.trim();
        const password = this.editPass.string;

        if (!username || !password) {
            EventMgr.emit(LogicEvent.showToast, "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        // Không áp giới hạn tối thiểu khi đăng nhập để tài khoản cũ có mật khẩu
        // ngắn vẫn vào được và được server tự nâng cấp sang bcrypt.
        LoginCommand.getInstance().accountLogin(username, password);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.editPass.string = "";
        this.node.active = false;
    }
}
