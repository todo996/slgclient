import {
    _decorator,
    Button,
    Color,
    Component,
    EditBox,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Prefab,
    Sprite,
    UITransform,
    VerticalTextAlignment,
    instantiate,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { localizeNode } from '../i18n/I18n';
import LoginCommand from '../login/LoginCommand';
import { NetEvent } from '../network/socket/NetInterface';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
    styleGameInput,
} from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';
import { EventMgr } from '../utils/EventMgr';
const { ccclass, property } = _decorator;

type AuthTone = 'info' | 'success' | 'error';

type AuthUiState = {
    busy: boolean;
    message?: string;
    tone?: AuthTone;
};

@ccclass('LoginScene')
export default class LoginScene extends Component {
    @property(Prefab)
    loginPrefab: Prefab = null;
    @property(Prefab)
    createPrefab: Prefab = null;
    @property(Prefab)
    serverListPrefab: Prefab = null;

    protected _loginNode: Node = null;
    protected _createNode: Node = null;
    protected _serverListNode: Node = null;
    protected _enterNode: Node = null;

    private _accountInput: EditBox = null;
    private _passwordInput: EditBox = null;
    private _loginButton: Button = null;
    private _registerButton: Button = null;
    private _statusLabel: Label = null;
    private _passwordToggleLabel: Label = null;
    private _passwordVisible = false;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.createRole, this.onCreate, this);
        EventMgr.on(LogicEvent.enterServerComplete, this.enterServer, this);
        EventMgr.on(LogicEvent.authStateChanged, this.onAuthStateChanged, this);
        this.openLogin();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._loginNode = null;
        this._serverListNode = null;
    }

    private findNode(root: Node, name: string): Node | null {
        if (root.name === name) {
            return root;
        }
        for (const child of root.children) {
            const found = this.findNode(child, name);
            if (found) {
                return found;
            }
        }
        return null;
    }

    private disableDirectSprites(node: Node): void {
        for (const sprite of node.getComponents(Sprite)) {
            sprite.enabled = false;
        }
    }

    private configureTitle(panel: Node): void {
        const titleRoot = this.findNode(panel, 'tipsbiaoti');
        const titleLabel = this.findNode(panel, 'titleLab')?.getComponent(Label);
        if (titleRoot) {
            this.disableDirectSprites(titleRoot);
            titleRoot.setPosition(0, 246, 0);
            ensureTransform(titleRoot, 440, 72);
        }
        if (!titleLabel) {
            return;
        }

        ensureTransform(titleLabel.node, 430, 64);
        titleLabel.node.setPosition(0, 0, 0);
        titleLabel.string = 'ĐĂNG NHẬP';
        titleLabel.useSystemFont = true;
        titleLabel.fontFamily = GameTheme.typography.titleFont;
        titleLabel.fontSize = 44;
        titleLabel.lineHeight = 54;
        titleLabel.enableWrapText = false;
        titleLabel.overflow = Label.Overflow.SHRINK;
        titleLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        titleLabel.verticalAlign = VerticalTextAlignment.CENTER;
        titleLabel.color = GameTheme.colors.gold300;
    }

    private configureInputs(panel: Node): void {
        const inputs = panel.getComponentsInChildren(EditBox);
        if (inputs.length < 2) {
            EventMgr.emit(LogicEvent.showToast, 'Không tìm thấy các ô nhập tài khoản.');
            return;
        }

        this._accountInput = inputs[0];
        this._passwordInput = inputs[1];

        this._accountInput.node.name = 'AccountInput';
        this._accountInput.node.setPosition(0, 125, 0);
        this._accountInput.maxLength = 50;
        styleGameInput(this._accountInput, 'Tên đăng nhập', 'user', 454, 66);

        this._passwordInput.node.name = 'PasswordInput';
        this._passwordInput.node.setPosition(0, 38, 0);
        this._passwordInput.maxLength = 72;
        this._passwordInput.inputFlag = EditBox.InputFlag.PASSWORD;
        styleGameInput(this._passwordInput, 'Mật khẩu', 'lock', 454, 66);

        this.createPasswordToggle(this._passwordInput.node);
    }

    private createPasswordToggle(inputNode: Node): void {
        const toggleNode = ensureChild(inputNode, '__PasswordToggle');
        ensureTransform(toggleNode, 68, 44);
        toggleNode.setPosition(177, 0, 0);
        toggleNode.setSiblingIndex(inputNode.children.length - 1);

        const button = toggleNode.getComponent(Button) || toggleNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.94;
        button.duration = GameTheme.motion.fast;
        toggleNode.off(Button.EventType.CLICK, this.onTogglePassword, this);
        toggleNode.on(Button.EventType.CLICK, this.onTogglePassword, this);

        this._passwordToggleLabel = createGameText(
            toggleNode,
            '__PasswordToggleLabel',
            'Hiện',
            16,
            GameTheme.colors.gold300,
            64,
            38,
        );
        this._passwordToggleLabel.node.setPosition(0, 0, 0);
    }

    private createSeparator(panel: Node): void {
        const separator = ensureChild(panel, '__AuthSeparator');
        ensureTransform(separator, 410, 34);
        separator.setPosition(0, -166, 0);

        const graphics = separator.getComponent(Graphics) || separator.addComponent(Graphics);
        graphics.clear();
        graphics.strokeColor = new Color(152, 111, 55, 150);
        graphics.lineWidth = 1;
        graphics.moveTo(-205, 0);
        graphics.lineTo(-54, 0);
        graphics.moveTo(54, 0);
        graphics.lineTo(205, 0);
        graphics.stroke();

        const label = createGameText(
            separator,
            '__SeparatorText',
            'HOẶC',
            15,
            GameTheme.colors.muted,
            92,
            30,
        );
        label.node.setPosition(0, 0, 0);
    }

    private configureActions(panel: Node): void {
        const registerNode = this.findNode(panel, 'zcBtn');
        const loginNode = this.findNode(panel, 'dlbtn');
        if (!registerNode || !loginNode) {
            EventMgr.emit(LogicEvent.showToast, 'Không tìm thấy nút đăng ký hoặc đăng nhập.');
            return;
        }

        loginNode.setPosition(0, -112, 0);
        this._loginButton = styleGameButton(loginNode, 'ĐĂNG NHẬP', 'primary', 356, 64);

        registerNode.setPosition(0, -224, 0);
        this._registerButton = styleGameButton(
            registerNode,
            'ĐĂNG KÝ TÀI KHOẢN',
            'secondary',
            330,
            54,
        );

        this.createSeparator(panel);

        const forgot = createGameText(
            panel,
            '__ForgotPassword',
            'Quên mật khẩu? · Chưa hỗ trợ',
            16,
            GameTheme.colors.muted,
            310,
            34,
        );
        forgot.node.setPosition(70, -18, 0);
        forgot.horizontalAlign = HorizontalTextAlignment.RIGHT;

        this._statusLabel = createGameText(
            panel,
            '__AuthStatus',
            '',
            16,
            GameTheme.colors.muted,
            460,
            34,
        );
        this._statusLabel.node.setPosition(0, -66, 0);

        const tagline = createGameText(
            panel,
            '__AuthTagline',
            'Chinh chiến thiên hạ · Thống nhất giang sơn',
            15,
            new Color(196, 168, 115, 230),
            500,
            32,
            true,
        );
        tagline.node.setPosition(0, -286, 0);
    }

    private redesignLogin(root: Node): void {
        localizeNode(root);

        const panel = this.findNode(root, 'diban1_23') || this.findNode(root, 'New Node');
        if (!panel) {
            EventMgr.emit(LogicEvent.showToast, 'Không tìm thấy khung đăng nhập.');
            return;
        }

        this.disableDirectSprites(panel);
        panel.setPosition(0, -2, 0);
        drawGamePanel(panel, 650, 620, 22);

        this.configureTitle(panel);
        this.configureInputs(panel);
        this.configureActions(panel);
        this.onAuthStateChanged({ busy: false, message: '', tone: 'info' });
    }

    private onTogglePassword(): void {
        if (!this._passwordInput) {
            return;
        }
        AudioManager.instance.playClick();
        this._passwordVisible = !this._passwordVisible;
        this._passwordInput.inputFlag = this._passwordVisible
            ? EditBox.InputFlag.DEFAULT
            : EditBox.InputFlag.PASSWORD;
        if (this._passwordToggleLabel) {
            this._passwordToggleLabel.string = this._passwordVisible ? 'Ẩn' : 'Hiện';
        }
    }

    private onAuthStateChanged(state: AuthUiState): void {
        const busy = Boolean(state?.busy);
        if (this._loginButton) {
            this._loginButton.interactable = !busy;
        }
        if (this._registerButton) {
            this._registerButton.interactable = !busy;
        }
        if (this._accountInput) {
            this._accountInput.enabled = !busy;
        }
        if (this._passwordInput) {
            this._passwordInput.enabled = !busy;
        }
        if (!this._statusLabel) {
            return;
        }

        this._statusLabel.string = busy
            ? (state.message || 'Đang kết nối máy chủ...')
            : (state.message || '');
        switch (state.tone) {
            case 'error':
                this._statusLabel.color = new Color(230, 108, 91, 255);
                break;
            case 'success':
                this._statusLabel.color = GameTheme.colors.success;
                break;
            default:
                this._statusLabel.color = GameTheme.colors.gold300;
                break;
        }
    }

    protected openLogin(): void {
        if (this._loginNode == null) {
            this._loginNode = instantiate(this.loginPrefab);
            this._loginNode.parent = this.node;
            this.redesignLogin(this._loginNode);
        } else {
            this._loginNode.active = true;
        }
    }

    protected onCreate(): void {
        if (this._createNode == null) {
            this._createNode = instantiate(this.createPrefab);
            this._createNode.parent = this.node;
            localizeNode(this._createNode);
        } else {
            this._createNode.active = true;
        }
    }

    protected enterServer(): void {
        EventMgr.emit(NetEvent.ServerRequesting, true);
    }

    protected onClickEnter(): void {
        AudioManager.instance.playClick();
        const loginData = LoginCommand.getInstance().proxy.getLoginData();
        if (loginData == null) {
            this.openLogin();
            return;
        }
        LoginCommand.getInstance().role_enterServer(LoginCommand.getInstance().proxy.getSession());
    }
}
