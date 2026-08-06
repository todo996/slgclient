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
            this.editName.string = data.username;
            this.editPass.string = data.password;
        }
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onLoginComplete(): void {
        this.node.active = false;
    }

    protected onClickRegister(): void {
        AudioManager.instance.playClick();

        if (!this.editName.string || !this.editPass.string) {
            EventMgr.emit(LogicEvent.showToast, "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        LoginCommand.getInstance().register(this.editName.string, this.editPass.string);
    }

    protected onClickLogin(): void {
        AudioManager.instance.playClick();

        if (!this.editName.string || !this.editPass.string) {
            EventMgr.emit(LogicEvent.showToast, "Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        LoginCommand.getInstance().accountLogin(this.editName.string, this.editPass.string);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }
}
