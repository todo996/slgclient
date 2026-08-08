import { _decorator, Button, Color, Component, EditBox, Graphics, Label, Node, UITransform } from 'cc';
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

        this.buildReferenceLoginUI();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onLoginComplete(): void {
        this.editPass.string = "";
        this.node.active = false;
    }

    /**
     * Thay toàn bộ giao diện đăng nhập cũ bằng hierarchy mới.
     * Giữ nguyên EditBox thật và các hàm đăng nhập/đăng ký để không đổi protocol server.
     */
    private buildReferenceLoginUI(): void {
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceLoginUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        // Lớp phủ tối giúp nền thành cổ/chiến trường phía sau nổi đúng tinh thần ảnh mẫu.
        this.makePanel(root, 'BackdropShade', 1280, 720, 0, 0, new Color(8, 6, 5, 118), new Color(0, 0, 0, 0), 0, 0);

        // Huy hiệu trung tâm phía trên panel.
        this.makePanel(root, 'CrestOuter', 120, 120, 0, 248, new Color(24, 17, 12, 245), new Color(198, 151, 75, 255), 4, 60);
        this.makePanel(root, 'CrestInner', 88, 88, 0, 248, new Color(52, 28, 18, 255), new Color(110, 69, 37, 255), 2, 44);
        this.makeLabel(root, 'CrestMark', 'III', 0, 248, 34, new Color(229, 190, 112, 255), true);

        // Panel chính mới hoàn toàn.
        const panel = this.makePanel(root, 'LoginPanel', 520, 500, 0, -8, new Color(18, 13, 10, 244), new Color(181, 132, 65, 255), 3, 18);
        this.makePanel(panel, 'PanelInner', 492, 472, 0, 0, new Color(25, 18, 14, 232), new Color(83, 54, 30, 255), 1, 14);

        this.makeLabel(panel, 'Title', 'ĐĂNG NHẬP', 0, 166, 38, new Color(232, 196, 124, 255), true);
        this.makeLabel(panel, 'Subtitle', 'Chinh chiến thiên hạ · Thống nhất giang sơn', 0, 127, 16, new Color(177, 156, 124, 255), false);

        // Di chuyển hai EditBox thật sang UI mới rồi tự vẽ lại toàn bộ khung.
        this.editName.node.parent = panel;
        this.editPass.node.parent = panel;
        this.styleEditBox(this.editName, 0, 61, 'Tài khoản');
        this.styleEditBox(this.editPass, 0, -13, 'Mật khẩu');

        this.makeButton(panel, 'LoginButton', 'ĐĂNG NHẬP', 0, -102, 404, 62, () => this.onClickLogin());
        this.makeLabel(panel, 'DividerText', 'HOẶC', 0, -154, 14, new Color(144, 122, 89, 255), true);
        this.makeButton(panel, 'RegisterButton', 'ĐĂNG KÝ TÀI KHOẢN', 0, -202, 404, 54, () => this.onClickRegister(), false);

        // Chỉ sau khi hai EditBox thật đã được chuyển sang hierarchy mới mới tắt UI cũ.
        legacyRoots.forEach((child) => {
            if (child !== root) {
                child.active = false;
            }
        });
    }

    private styleEditBox(editBox: EditBox, x: number, y: number, placeholder: string): void {
        const node = editBox.node;
        node.active = true;
        node.setPosition(x, y, 0);
        node.layer = this.node.layer;

        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        transform.setContentSize(404, 58);

        // Bỏ sprite nền cũ của EditBox; text/placeholder thật vẫn hoạt động.
        for (const child of node.children) {
            const childLabel = child.getComponent(Label);
            const childGraphics = child.getComponent(Graphics);
            if (!childLabel && !childGraphics) {
                child.active = true;
            }
        }

        const oldFrame = node.getChildByName('ReferenceFieldFrame');
        if (oldFrame) {
            oldFrame.destroy();
        }

        const frame = new Node('ReferenceFieldFrame');
        frame.parent = node;
        frame.setSiblingIndex(0);
        frame.layer = node.layer;
        frame.addComponent(UITransform).setContentSize(404, 58);
        const graphics = frame.addComponent(Graphics);
        graphics.fillColor = new Color(12, 10, 9, 238);
        graphics.strokeColor = new Color(119, 86, 48, 255);
        graphics.lineWidth = 2;
        graphics.roundRect(-202, -29, 404, 58, 8);
        graphics.fill();
        graphics.stroke();

        editBox.placeholder = placeholder;
        editBox.fontSize = 19;
        editBox.placeholderFontSize = 18;
        editBox.textLabel && (editBox.textLabel.color = new Color(238, 225, 201, 255));
        editBox.placeholderLabel && (editBox.placeholderLabel.color = new Color(128, 111, 88, 255));
    }

    private makePanel(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
        fill: Color,
        stroke: Color,
        lineWidth: number,
        radius: number,
    ): Node {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = fill;
        graphics.strokeColor = stroke;
        graphics.lineWidth = lineWidth;
        if (radius > 0) {
            graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        } else {
            graphics.rect(-width / 2, -height / 2, width, height);
        }
        graphics.fill();
        if (lineWidth > 0 && stroke.a > 0) {
            graphics.stroke();
        }
        return node;
    }

    private makeLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color: Color,
        bold: boolean,
    ): Label {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(460, Math.max(34, fontSize + 12));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        callback: () => void,
        primary: boolean = true,
    ): Node {
        const node = this.makePanel(
            parent,
            name,
            width,
            height,
            x,
            y,
            primary ? new Color(112, 73, 32, 255) : new Color(32, 23, 17, 255),
            primary ? new Color(229, 187, 102, 255) : new Color(137, 101, 56, 255),
            2,
            8,
        );
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.97;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}Label`, text, 0, 0, primary ? 20 : 17, new Color(244, 224, 180, 255), true);
        return node;
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