import {
    _decorator,
    Component,
    EditBox,
    HorizontalTextAlignment,
    Label,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { GameTheme } from '../ui/theme/GameTheme';
import { EventMgr } from '../utils/EventMgr';
import { LocalCache } from '../utils/LocalCache';
import LoginCommand from './LoginCommand';
const { ccclass, property } = _decorator;

const ACCOUNT_PATTERN = /^[A-Za-z0-9_.@+\-]+$/;

@ccclass('LoginLogic')
export default class LoginLogic extends Component {
    @property(EditBox)
    editName: EditBox = null;

    @property(EditBox)
    editPass: EditBox = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.loginComplete, this.onLoginComplete, this);

        this.prepareEditBox(this.editName, 50);
        this.prepareEditBox(this.editPass, 72);

        const data = LocalCache.getLoginValidation();
        if (data) {
            this.editName.string = data.username || '';
        }
        this.editPass.string = '';
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    private prepareEditBox(editBox: EditBox, maxLength: number): void {
        if (!editBox) {
            return;
        }
        editBox.maxLength = maxLength;

        const transform = editBox.node.getComponent(UITransform);
        const width = Math.max(240, (transform?.contentSize.width || 454) - 92);
        const height = Math.max(38, (transform?.contentSize.height || 66) - 12);
        this.prepareInputLabel(editBox.textLabel, width, height);
        this.prepareInputLabel(editBox.placeholderLabel, width, height);
    }

    private prepareInputLabel(label: Label, width: number, height: number): void {
        if (!label) {
            return;
        }
        const transform = label.node.getComponent(UITransform) || label.node.addComponent(UITransform);
        transform.setContentSize(width, height);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = 21;
        label.lineHeight = 30;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.CLAMP;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
    }

    private showValidationError(message: string): void {
        EventMgr.emit(LogicEvent.authStateChanged, {
            busy: false,
            message,
            tone: 'error',
        });
    }

    protected onLoginComplete(): void {
        this.editPass.string = '';
        this.node.active = false;
    }

    protected onClickRegister(): void {
        AudioManager.instance.playClick();
        const username = this.editName.string.trim();
        const password = this.editPass.string;

        if (!username || !password) {
            this.showValidationError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            return;
        }

        const usernameLength = Array.from(username).length;
        if (usernameLength < 3 || usernameLength > 50) {
            this.showValidationError('Tên đăng nhập phải có từ 3 đến 50 ký tự.');
            return;
        }
        if (!ACCOUNT_PATTERN.test(username)) {
            this.showValidationError('Tên đăng nhập chỉ được dùng chữ, số và các ký tự _ - . @ +.');
            return;
        }

        const passwordBytes = new TextEncoder().encode(password).length;
        if (passwordBytes < 8 || passwordBytes > 72) {
            this.showValidationError('Mật khẩu phải có từ 8 đến 72 byte.');
            return;
        }

        LoginCommand.getInstance().register(username, password);
    }

    protected onClickLogin(): void {
        AudioManager.instance.playClick();
        const username = this.editName.string.trim();
        const password = this.editPass.string;

        if (!username || !password) {
            this.showValidationError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            return;
        }

        LoginCommand.getInstance().accountLogin(username, password);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.editPass.string = '';
        this.node.active = false;
    }
}
