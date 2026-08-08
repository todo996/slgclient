import DateUtil from "../utils/DateUtil";
import { ChatMsg } from "./ChatProxy";
import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from "cc";

const { ccclass, property } = _decorator;

@ccclass('ChatItemLogic')
export default class ChatItemLogic extends Component {

    @property(Label)
    nameLabel: Label = null;

    private _referenceBuilt = false;

    protected onLoad():void{
        this.buildReferenceBubble();
    }

    private buildReferenceBubble():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];
        const itemTransform = this.node.getComponent(UITransform);
        const width = itemTransform && itemTransform.contentSize.width > 100 ? itemTransform.contentSize.width : 820;
        const height = itemTransform && itemTransform.contentSize.height > 30 ? itemTransform.contentSize.height : 58;

        const bubble = new Node('ReferenceChatBubble');
        bubble.parent = this.node;
        bubble.layer = this.node.layer;
        bubble.addComponent(UITransform).setContentSize(Math.max(200, width - 18), Math.max(48, height - 8));
        const graphics = bubble.addComponent(Graphics);
        graphics.fillColor = new Color(26, 19, 14, 238);
        graphics.strokeColor = new Color(82, 59, 34, 255);
        graphics.lineWidth = 1;
        graphics.roundRect(-(width - 18) / 2, -(height - 8) / 2, width - 18, height - 8, 7);
        graphics.fill();
        graphics.stroke();

        this.nameLabel.node.parent = bubble;
        this.nameLabel.node.active = true;
        this.nameLabel.node.setPosition(0, 0, 0);
        this.nameLabel.fontSize = 15;
        this.nameLabel.lineHeight = 21;
        this.nameLabel.color = new Color(226, 207, 171, 255);
        this.nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.nameLabel.overflow = Label.Overflow.SHRINK;
        const labelTransform = this.nameLabel.node.getComponent(UITransform);
        if (labelTransform) labelTransform.setContentSize(Math.max(160, width - 54), Math.max(38, height - 18));

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== bubble) child.active = false;
        });
    }

    protected updateItem(data:ChatMsg):void{
        const time = DateUtil.converTimeStr(data.time * 1000);
        this.nameLabel.string = time + "   " + data.nick_name + "  ·  " + data.msg;
    }
}