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
     * Dựng hierarchy đăng nhập mới theo ảnh tham chiếu.
     * EditBox và handler thật được tái sử dụng để giữ nguyên protocol/server.
     */
    private buildReferenceLoginUI(): void {
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceLoginUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        // Chỉ phủ nhẹ để vẫn nhìn rõ thành cổ trong ảnh nền gốc.
        this.makePanel(root, 'BackdropShade', 1280, 720, 0, 0, new Color(5, 4, 4, 70), new Color(0, 0, 0, 0), 0, 0);

        // Hai dải cờ đỏ viền đồng như ảnh mẫu, chỉ trang trí và không tạo chức năng giả.
        this.makeBanner(root, 'LeftBanner', -398, 52, 86, 490);
        this.makeBanner(root, 'RightBanner', 398, 52, 86, 490);

        // Khung nền đen rộng phía sau panel để tạo chiều sâu nhưng không che kiến trúc.
        this.makePanel(root, 'CardShadow', 546, 526, 0, -18, new Color(0, 0, 0, 132), new Color(0, 0, 0, 0), 0, 22);

        const panel = this.makePanel(root, 'LoginPanel', 500, 500, 0, -15, new Color(18, 13, 10, 244), new Color(188, 139, 66, 255), 3, 16);
        this.makePanel(panel, 'PanelInner', 472, 472, 0, 0, new Color(25, 18, 14, 226), new Color(90, 57, 31, 255), 1, 12);

        // Thanh tiêu đề và huy hiệu trung tâm dạng đồng tối.
        this.makePanel(panel, 'TitlePlate', 318, 62, 0, 202, new Color(45, 27, 16, 255), new Color(213, 166, 87, 255), 2, 10);
        this.makeMedallion(panel, 0, 238);
        this.makeLabel(panel, 'Title', 'ĐĂNG NHẬP', 0, 201, 31, new Color(241, 205, 130, 255), true);
        this.makeLabel(panel, 'Subtitle', 'Chinh chiến thiên hạ', 0, 149, 15, new Color(176, 151, 112, 255), false);

        // Dividers làm khung giống giao diện mẫu thay cho mặt phẳng trống.
        this.makePanel(panel, 'TopDivider', 402, 2, 0, 123, new Color(118, 78, 37, 190), new Color(0, 0, 0, 0), 0, 0);

        // Di chuyển EditBox thật sang hierarchy mới rồi tự vẽ lại khung.
        this.editName.node.parent = panel;
        this.editPass.node.parent = panel;
        this.styleEditBox(this.editName, 0, 67, 'Tài khoản');
        this.styleEditBox(this.editPass, 0, -7, 'Mật khẩu');

        this.makeButton(panel, 'LoginButton', 'ĐĂNG NHẬP', 0, -98, 400, 62, () => this.onClickLogin());
        this.makeLabel(panel, 'DividerText', 'HOẶC', 0, -151, 14, new Color(151, 126, 88, 255), true);
        this.makePanel(panel, 'DividerLeft', 142, 1, -111, -151, new Color(91, 61, 35, 220), new Color(0, 0, 0, 0), 0, 0);
        this.makePanel(panel, 'DividerRight', 142, 1, 111, -151, new Color(91, 61, 35, 220), new Color(0, 0, 0, 0), 0, 0);
        this.makeButton(panel, 'RegisterButton', 'ĐĂNG KÝ', 0, -201, 400, 52, () => this.onClickRegister(), false);

        // Footer đúng câu chữ mẫu, đặt ngoài panel để giữ bố cục thoáng.
        this.makeLabel(root, 'Footer', 'Chinh chiến thiên hạ - Thống nhất giang sơn', 0, -326, 15, new Color(181, 153, 105, 230), false);

        // Chỉ sau khi EditBox thật đã được chuyển sang hierarchy mới mới tắt UI cũ.
        legacyRoots.forEach((child) => {
            if (child !== root) {
                child.active = false;
            }
        });
    }

    private makeBanner(parent: Node, name: string, x: number, y: number, width: number, height: number): Node {
        const banner = this.makePanel(
            parent,
            name,
            width,
            height,
            x,
            y,
            new Color(76, 17, 14, 220),
            new Color(145, 89, 43, 230),
            2,
            3,
        );
        this.makePanel(banner, `${name}Inner`, width - 16, height - 26, 0, 6, new Color(100, 21, 16, 165), new Color(54, 28, 20, 230), 1, 2);
        this.makePanel(banner, `${name}Top`, width + 26, 10, 0, height / 2 - 8, new Color(111, 67, 31, 255), new Color(216, 164, 79, 230), 1, 3);
        this.makePanel(banner, `${name}Bottom`, width + 14, 8, 0, -height / 2 + 10, new Color(66, 39, 23, 255), new Color(157, 105, 51, 220), 1, 2);
        return banner;
    }

    private makeMedallion(parent: Node, x: number, y: number): Node {
        const node = new Node('LoginMedallion');
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(78, 78);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(31, 20, 13, 255);
        graphics.strokeColor = new Color(214, 167, 89, 255);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, 36);
        graphics.fill();
        graphics.stroke();
        graphics.strokeColor = new Color(111, 71, 36, 255);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 27);
        graphics.stroke();
        graphics.strokeColor = new Color(203, 151, 74, 220);
        graphics.lineWidth = 2;
        graphics.moveTo(-13, 0);
        graphics.lineTo(13, 0);
        graphics.moveTo(0, -13);
        graphics.lineTo(0, 13);
        graphics.stroke();
        return node;
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
        transform.setContentSize(400, 58);

        const oldFrame = node.getChildByName('ReferenceFieldFrame');
        if (oldFrame) {
            oldFrame.destroy();
        }

        const frame = new Node('ReferenceFieldFrame');
        frame.parent = node;
        frame.setSiblingIndex(0);
        frame.layer = node.layer;
        frame.addComponent(UITransform).setContentSize(400, 58);
        const graphics = frame.addComponent(Graphics);
        graphics.fillColor = new Color(10, 9, 8, 241);
        graphics.strokeColor = new Color(130, 92, 46, 255);
        graphics.lineWidth = 2;
        graphics.roundRect(-200, -29, 400, 58, 7);
        graphics.fill();
        graphics.stroke();
        graphics.strokeColor = new Color(67, 43, 25, 255);
        graphics.lineWidth = 1;
        graphics.roundRect(-194, -23, 388, 46, 5);
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
            primary ? new Color(119, 75, 30, 255) : new Color(34, 24, 17, 255),
            primary ? new Color(235, 194, 105, 255) : new Color(146, 105, 57, 255),
            2,
            7,
        );
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.97;
        node.on(Button.EventType.CLICK, callback, this);
        this.makePanel(node, `${name}Inner`, width - 10, height - 10, 0, 0, new Color(0, 0, 0, 0), primary ? new Color(91, 55, 26, 255) : new Color(73, 48, 29, 255), 1, 5);
        this.makeLabel(node, `${name}Label`, text, 0, 0, primary ? 20 : 17, new Color(246, 226, 181, 255), true);
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
