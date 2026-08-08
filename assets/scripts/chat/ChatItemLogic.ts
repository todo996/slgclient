import DateUtil from "../utils/DateUtil";
import { ChatMsg } from "./ChatProxy";
import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from "cc";

const { ccclass, property } = _decorator;

@ccclass('ChatItemLogic')
export default class ChatItemLogic extends Component {

    @property(Label)
    nameLabel: Label = null;

    private _referenceBuilt = false;
    private _timeLabel: Label = null;
    private _contentLabel: Label = null;

    protected onLoad():void{
        this.buildReferenceBubble();
    }

    /**
     * Thay phần hiển thị item chat cũ bằng bubble mới.
     * Vẫn dùng đúng ChatMsg từ server; không tạo dữ liệu hoặc thao tác giả.
     */
    private buildReferenceBubble():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;

        const legacyRoots = [...this.node.children];
        const itemTransform = this.node.getComponent(UITransform);
        const width = itemTransform && itemTransform.contentSize.width > 100 ? itemTransform.contentSize.width : 820;
        const height = Math.max(72, itemTransform && itemTransform.contentSize.height > 30 ? itemTransform.contentSize.height : 72);
        if (itemTransform) itemTransform.setContentSize(width, height);

        const bubbleWidth = Math.max(200, width - 18);
        const bubbleHeight = height - 8;
        const bubble = new Node('ReferenceChatBubble');
        bubble.parent = this.node;
        bubble.layer = this.node.layer;
        bubble.addComponent(UITransform).setContentSize(bubbleWidth, bubbleHeight);

        const graphics = bubble.addComponent(Graphics);
        graphics.fillColor = new Color(24, 18, 13, 242);
        graphics.strokeColor = new Color(89, 63, 35, 255);
        graphics.lineWidth = 1;
        graphics.roundRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 7);
        graphics.fill();
        graphics.stroke();

        // Label serialized cũ được giữ làm tên người gửi để không phá prefab/controller.
        this.nameLabel.node.parent = bubble;
        this.nameLabel.node.active = true;
        this.nameLabel.node.setPosition(0, 15, 0);
        this.nameLabel.fontSize = 14;
        this.nameLabel.lineHeight = 18;
        this.nameLabel.color = new Color(235, 194, 111, 255);
        this.nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.nameLabel.overflow = Label.Overflow.SHRINK;
        const nameTransform = this.nameLabel.node.getComponent(UITransform);
        if (nameTransform) nameTransform.setContentSize(Math.max(160, bubbleWidth - 42), 24);

        this._timeLabel = this.makeLabel(bubble, 'Time', 0, 15, 12, new Color(128, 111, 87, 255), Label.HorizontalAlign.RIGHT, bubbleWidth - 42, 24);
        this._contentLabel = this.makeLabel(bubble, 'Content', 0, -14, 15, new Color(226, 211, 183, 255), Label.HorizontalAlign.LEFT, bubbleWidth - 42, 32);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== bubble) child.active = false;
        });
    }

    protected updateItem(data:ChatMsg):void{
        const time = DateUtil.converTimeStr(data.time * 1000);
        this.nameLabel.string = data.nick_name || 'Người chơi';
        if (this._timeLabel) this._timeLabel.string = time;
        if (this._contentLabel) this._contentLabel.string = data.msg || '';
    }

    private makeLabel(parent:Node, name:string, x:number, y:number, fontSize:number, color:Color, align:Label.HorizontalAlign, width:number, height:number):Label{
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = color;
        label.horizontalAlign = align;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }
}
