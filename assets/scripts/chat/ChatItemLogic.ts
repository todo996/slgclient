import DateUtil from "../utils/DateUtil";
import { ChatMsg } from "./ChatProxy";
import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    UITransform,
    VerticalTextAlignment,
} from "cc";
import { ensureChild, ensureTransform } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

const { ccclass, property } = _decorator;
@ccclass('ChatItemLogic')
export default class ChatItemLogic extends Component {

    @property(Label)
    nameLabel: Label = null;

    protected onLoad():void{
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = Math.max(900, transform.width || 900);
        const height = Math.max(54, transform.height || 54);

        const surface = ensureChild(this.node, '__ChatMessageSurface');
        surface.setSiblingIndex(0);
        ensureTransform(surface, width, height);
        surface.setPosition(0, 0, 0);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(22, 19, 16, 225);
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.fill();
        graphics.strokeColor = new Color(116, 83, 45, 170);
        graphics.lineWidth = 1;
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.stroke();

        if (this.nameLabel) {
            ensureTransform(this.nameLabel.node, width - 36, height - 10);
            this.nameLabel.useSystemFont = true;
            this.nameLabel.fontFamily = GameTheme.typography.bodyFont;
            this.nameLabel.fontSize = 16;
            this.nameLabel.lineHeight = 21;
            this.nameLabel.enableWrapText = false;
            this.nameLabel.overflow = Label.Overflow.SHRINK;
            this.nameLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.nameLabel.verticalAlign = VerticalTextAlignment.CENTER;
            this.nameLabel.color = GameTheme.colors.ivory;
            this.nameLabel.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateItem(data:ChatMsg):void{
        var time = DateUtil.converTimeStr(data.time * 1000);
        this.nameLabel.string = time + "  " + data.nick_name + ": " + data.msg;
    }
}
