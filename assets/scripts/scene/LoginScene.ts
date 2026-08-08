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
import { EventMgr } from '../utils/EventMgr';

const { ccclass, property } = _decorator;

type AuthTone = 'info' | 'success' | 'error';
type AuthUiState = {
    busy: boolean;
    message?: string;
    tone?: AuthTone;
};

const GOLD = new Color(231, 190, 109, 255);
const GOLD_SOFT = new Color(196, 168, 115, 235);
const TEXT = new Color(239, 225, 198, 255);
const MUTED = new Color(177, 163, 139, 255);
const PANEL = new Color(17, 14, 12, 246);
const PANEL_2 = new Color(32, 25, 19, 246);
const BORDER = new Color(152, 107, 54, 235);
const JADE = new Color(35, 74, 64, 255);
const DANGER = new Color(226, 102, 86, 255);
const SUCCESS = new Color(111, 183, 97, 255);

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

    private ensureTransform(node: Node, width: number, height: number): UITransform {
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(width, height);
        return transform;
    }

    private ensureChild(parent: Node, name: string): Node {
        let node = parent.getChildByName(name);
        if (!node) {
            node = new Node(name);
            node.setParent(parent);
        }
        return node;
    }

    private disableDirectSprites(node: Node): void {
        for (const sprite of node.getComponents(Sprite)) {
            sprite.enabled = false;
        }
    }

    private drawPanel(node: Node, width: number, height: number, radius: number = 18): void {
        this.ensureTransform(node, width, height);
        const skin = this.ensureChild(node, '__VietnamesePanelSkin');
        skin.setPosition(0, 0, 0);
        skin.setSiblingIndex(0);
        this.ensureTransform(skin, width, height);
        const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
        graphics.clear();

        graphics.fillColor = new Color(5, 5, 5, 125);
        graphics.roundRect(-width / 2 - 7, -height / 2 - 7, width + 14, height + 14, radius + 4);
        graphics.fill();

        graphics.fillColor = PANEL;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();

        graphics.strokeColor = new Color(78, 53, 30, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.stroke();

        graphics.strokeColor = BORDER;
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, Math.max(6, radius - 5));
        graphics.stroke();

        const corner = 26;
        graphics.strokeColor = GOLD;
        graphics.lineWidth = 2;
        graphics.moveTo(-width / 2 + 10, height / 2 - corner);
        graphics.lineTo(-width / 2 + 10, height / 2 - 10);
        graphics.lineTo(-width / 2 + corner, height / 2 - 10);
        graphics.moveTo(width / 2 - corner, height / 2 - 10);
        graphics.lineTo(width / 2 - 10, height / 2 - 10);
        graphics.lineTo(width / 2 - 10, height / 2 - corner);
        graphics.moveTo(-width / 2 + 10, -height / 2 + corner);
        graphics.lineTo(-width / 2 + 10, -height / 2 + 10);
        graphics.lineTo(-width / 2 + corner, -height / 2 + 10);
        graphics.moveTo(width / 2 - corner, -height / 2 + 10);
        graphics.lineTo(width / 2 - 10, -height / 2 + 10);
        graphics.lineTo(width / 2 - 10, -height / 2 + corner);
        graphics.stroke();
    }

    private createText(
        parent: Node,
        name: string,
        text: string,
        fontSize: number,
        color: Color,
        width: number,
        height: number,
        titleFont: boolean = false,
    ): Label {
        const node = this.ensureChild(parent, name);
        this.ensureTransform(node, width, height);
        const label = node.getComponent(Label) || node.addComponent(Label);
        label.useSystemFont = true;
        label.fontFamily = titleFont ? 'Times New Roman' : 'Arial';
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.ceil(fontSize * 1.25);
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = color;
        return label;
    }

    private styleButton(
        buttonNode: Node,
        text: string,
        variant: 'gold' | 'dark' | 'jade',
        width: number,
        height: number,
    ): Button {
        this.ensureTransform(buttonNode, width, height);
        this.disableDirectSprites(buttonNode);
        const background = buttonNode.getChildByName('Background');
        if (background) {
            this.disableDirectSprites(background);
        }

        const skin = this.ensureChild(buttonNode, '__VietnameseButtonSkin');
        skin.setPosition(0, 0, 0);
        skin.setSiblingIndex(0);
        this.ensureTransform(skin, width, height);
        const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
        graphics.clear();

        const fill = variant === 'gold'
            ? new Color(122, 78, 27, 255)
            : variant === 'jade'
                ? JADE
                : PANEL_2;
        graphics.fillColor = fill;
        graphics.roundRect(-width / 2, -height / 2, width, height, 8);
        graphics.fill();
        graphics.strokeColor = variant === 'gold' ? GOLD : BORDER;
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 7);
        graphics.stroke();
        graphics.strokeColor = new Color(244, 215, 155, variant === 'gold' ? 145 : 75);
        graphics.lineWidth = 1;
        graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 5);
        graphics.stroke();

        for (const label of buttonNode.getComponentsInChildren(Label)) {
            if (label.node.name !== '__VietnameseButtonLabel') {
                label.node.active = false;
            }
        }
        const label = this.createText(
            buttonNode,
            '__VietnameseButtonLabel',
            text,
            variant === 'gold' ? 23 : 19,
            variant === 'gold' ? new Color(255, 237, 188, 255) : TEXT,
            width - 24,
            height - 10,
            true,
        );
        label.node.active = true;
        label.node.setPosition(0, 0, 0);
        label.node.setSiblingIndex(buttonNode.children.length - 1);

        const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.97;
        button.duration = 0.08;
        return button;
    }

    private styleInput(editBox: EditBox, placeholder: string, width: number, height: number): void {
        const node = editBox.node;
        this.ensureTransform(node, width, height);
        this.disableDirectSprites(node);
        const background = node.getChildByName('Background');
        if (background) {
            this.disableDirectSprites(background);
        }

        const skin = this.ensureChild(node, '__VietnameseInputSkin');
        skin.setPosition(0, 0, 0);
        skin.setSiblingIndex(0);
        this.ensureTransform(skin, width, height);
        const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(18, 16, 14, 238);
        graphics.roundRect(-width / 2, -height / 2, width, height, 8);
        graphics.fill();
        graphics.strokeColor = new Color(127, 105, 77, 220);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 8);
        graphics.stroke();

        editBox.placeholder = placeholder;
        if (editBox.placeholderLabel) {
            const label = editBox.placeholderLabel;
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.fontSize = 18;
            label.lineHeight = 24;
            label.color = new Color(151, 139, 120, 255);
            label.horizontalAlign = HorizontalTextAlignment.LEFT;
            label.verticalAlign = VerticalTextAlignment.CENTER;
            this.ensureTransform(label.node, width - 62, height - 14);
            label.node.setPosition(12, 0, 0);
        }
        if (editBox.textLabel) {
            const label = editBox.textLabel;
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.fontSize = 19;
            label.lineHeight = 25;
            label.color = TEXT;
            label.horizontalAlign = HorizontalTextAlignment.LEFT;
            label.verticalAlign = VerticalTextAlignment.CENTER;
            this.ensureTransform(label.node, width - 62, height - 14);
            label.node.setPosition(12, 0, 0);
        }
    }

    private configureTitle(panel: Node): void {
        const titleRoot = this.findNode(panel, 'tipsbiaoti');
        const titleLabel = this.findNode(panel, 'titleLab')?.getComponent(Label);
        if (titleRoot) {
            this.disableDirectSprites(titleRoot);
            titleRoot.setPosition(0, 246, 0);
            this.ensureTransform(titleRoot, 440, 72);
        }
        if (!titleLabel) {
            const fallback = this.createText(panel, '__LoginTitle', 'ĐĂNG NHẬP', 44, GOLD, 430, 64, true);
            fallback.node.setPosition(0, 246, 0);
            return;
        }

        this.ensureTransform(titleLabel.node, 430, 64);
        titleLabel.node.setPosition(0, 0, 0);
        titleLabel.node.active = true;
        titleLabel.string = 'ĐĂNG NHẬP';
        titleLabel.useSystemFont = true;
        titleLabel.fontFamily = 'Times New Roman';
        titleLabel.fontSize = 44;
        titleLabel.lineHeight = 54;
        titleLabel.enableWrapText = false;
        titleLabel.overflow = Label.Overflow.SHRINK;
        titleLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        titleLabel.verticalAlign = VerticalTextAlignment.CENTER;
        titleLabel.color = GOLD;
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
        this.styleInput(this._accountInput, 'Tên đăng nhập', 454, 66);

        this._passwordInput.node.name = 'PasswordInput';
        this._passwordInput.node.setPosition(0, 38, 0);
        this._passwordInput.maxLength = 72;
        this._passwordInput.inputFlag = EditBox.InputFlag.PASSWORD;
        this.styleInput(this._passwordInput, 'Mật khẩu', 454, 66);

        this.createPasswordToggle(this._passwordInput.node);
    }

    private createPasswordToggle(inputNode: Node): void {
        const toggleNode = this.ensureChild(inputNode, '__PasswordToggle');
        this.ensureTransform(toggleNode, 68, 44);
        toggleNode.setPosition(177, 0, 0);
        toggleNode.setSiblingIndex(inputNode.children.length - 1);

        const button = toggleNode.getComponent(Button) || toggleNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.94;
        button.duration = 0.08;
        toggleNode.off(Button.EventType.CLICK, this.onTogglePassword, this);
        toggleNode.on(Button.EventType.CLICK, this.onTogglePassword, this);

        this._passwordToggleLabel = this.createText(
            toggleNode,
            '__PasswordToggleLabel',
            'Hiện',
            15,
            GOLD,
            64,
            38,
        );
        this._passwordToggleLabel.node.setPosition(0, 0, 0);
    }

    private createSeparator(panel: Node): void {
        const separator = this.ensureChild(panel, '__AuthSeparator');
        this.ensureTransform(separator, 410, 34);
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

        const label = this.createText(separator, '__SeparatorText', 'HOẶC', 15, MUTED, 92, 30);
        label.node.setPosition(0, 0, 0);
    }

    private configureActions(panel: Node): void {
        const registerNode = this.findNode(panel, 'zcBtn');
        const loginNode = this.findNode(panel, 'dlbtn');
        if (!registerNode || !loginNode) {
            EventMgr.emit(LogicEvent.showToast, 'Không tìm thấy nút đăng ký hoặc đăng nhập.');
            return;
        }

        loginNode.setPosition(0, -100, 0);
        this._loginButton = this.styleButton(loginNode, 'ĐĂNG NHẬP', 'gold', 356, 64);

        registerNode.setPosition(0, -220, 0);
        this._registerButton = this.styleButton(registerNode, 'ĐĂNG KÝ TÀI KHOẢN', 'dark', 330, 54);

        this.createSeparator(panel);

        this._statusLabel = this.createText(panel, '__AuthStatus', '', 16, MUTED, 460, 34);
        this._statusLabel.node.setPosition(0, -50, 0);

        const tagline = this.createText(
            panel,
            '__AuthTagline',
            'Chinh chiến thiên hạ · Thống nhất giang sơn',
            15,
            GOLD_SOFT,
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
        this.drawPanel(panel, 650, 620, 22);

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
        if (state.tone === 'error') {
            this._statusLabel.color = DANGER;
        } else if (state.tone === 'success') {
            this._statusLabel.color = SUCCESS;
        } else {
            this._statusLabel.color = GOLD;
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
