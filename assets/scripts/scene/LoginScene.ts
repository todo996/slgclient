import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Prefab,
    UITransform,
    VerticalTextAlignment,
    instantiate,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
const { ccclass, property } = _decorator;

import LoginCommand from "../login/LoginCommand";
import { NetEvent } from "../network/socket/NetInterface";
import { EventMgr } from '../utils/EventMgr';

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

    protected onLoad(): void {
        this.openLogin();
        EventMgr.on(LogicEvent.createRole, this.onCreate, this);
        EventMgr.on(LogicEvent.enterServerComplete, this.enterServer, this);
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

    /**
     * Hình nút gốc có chữ Trung được vẽ thẳng trong texture. Giữ nguyên viền
     * và hoa văn của ảnh, phủ bảng tên mới lên phần chữ rồi đặt nhãn tiếng Việt.
     */
    private redrawLoginButton(
        root: Node,
        buttonName: string,
        text: string,
        fillColor: Color,
    ): void {
        const button = this.findNode(root, buttonName);
        const background = button?.getChildByName('Background');
        const labelNode = background?.getChildByName('Label');
        const label = labelNode?.getComponent(Label);

        if (!button || !background || !labelNode || !label) {
            console.warn(`Không tìm thấy cấu trúc nút đăng nhập: ${buttonName}`);
            return;
        }

        let plate = background.getChildByName('VietnamesePlate');
        if (!plate) {
            plate = new Node('VietnamesePlate');
            plate.setParent(background);
            plate.setPosition(0, 0, 0);
            plate.setSiblingIndex(0);

            const transform = plate.addComponent(UITransform);
            transform.setContentSize(122, 42);

            const graphics = plate.addComponent(Graphics);

            // Lớp tối phía ngoài giúp che hoàn toàn ký tự cũ.
            graphics.fillColor = new Color(35, 22, 12, 245);
            graphics.roundRect(-61, -21, 122, 42, 8);
            graphics.fill();

            // Mặt nút mới, vẫn để lộ viền và hai đầu trang trí của ảnh gốc.
            graphics.fillColor = fillColor;
            graphics.roundRect(-58, -18, 116, 36, 7);
            graphics.fill();

            // Hai đường viền tạo cảm giác nổi đồng bộ phong cách Tam Quốc.
            graphics.strokeColor = new Color(246, 196, 74, 255);
            graphics.lineWidth = 2;
            graphics.roundRect(-58, -18, 116, 36, 7);
            graphics.stroke();

            graphics.strokeColor = new Color(255, 232, 150, 170);
            graphics.lineWidth = 1;
            graphics.roundRect(-54, -14, 108, 28, 5);
            graphics.stroke();
        }

        labelNode.active = true;
        labelNode.setPosition(0, 0, 0);
        labelNode.setSiblingIndex(background.children.length - 1);

        const labelTransform = labelNode.getComponent(UITransform);
        labelTransform?.setContentSize(112, 34);

        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        label.string = text;
        label.fontSize = 22;
        label.lineHeight = 28;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = new Color(255, 239, 184, 255);
    }

    private applyVietnameseLoginButtons(root: Node): void {
        this.redrawLoginButton(
            root,
            'zcBtn',
            'Đăng ký',
            new Color(137, 70, 13, 255),
        );
        this.redrawLoginButton(
            root,
            'dlbtn',
            'Đăng nhập',
            new Color(8, 91, 94, 255),
        );
    }

    protected openLogin(): void {
        if (this._loginNode == null) {
            this._loginNode = instantiate(this.loginPrefab);
            this._loginNode.parent = this.node;
            this.applyVietnameseLoginButtons(this._loginNode);
        } else {
            this._loginNode.active = true;
        }
    }

    protected onCreate(): void {
        if (this._createNode == null) {
            this._createNode = instantiate(this.createPrefab);
            this._createNode.parent = this.node;
        } else {
            this._createNode.active = true;
        }
    }

    protected enterServer(): void {
        console.log("enterServer");
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
