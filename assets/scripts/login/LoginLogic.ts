import { _decorator, Component, EditBox, Label } from 'cc';
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
    editPass: Label = null;

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

        LoginCommand.getInstance().accountLogin(username, password);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.editPass.string = "";
        this.node.active = false;
    }
}
