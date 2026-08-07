import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;

import DateUtil from "../utils/DateUtil";
import { ensureChild, ensureTransform } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionLogItemLogic')
export default class UnionApplyItemLogic extends Component {
    @property(Label)
    desLabel: Label | null = null;
    @property(Label)
    timeLabel: Label | null = null;

    protected onLoad(): void {
        this.applyLayout();
    }

    private applyLayout(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = transform.width > 0 ? transform.width : 980;
        const height = transform.height > 0 ? transform.height : 76;

        const surface = ensureChild(this.node, '__UnionLogSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(20, 17, 14, 240);
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.fill();
        graphics.strokeColor = new Color(137, 95, 49, 185);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.stroke();

        if (this.desLabel) {
            this.desLabel.node.setPosition(-width * 0.20, 0, 0);
            ensureTransform(this.desLabel.node, width * 0.62, 42);
            this.desLabel.useSystemFont = true;
            this.desLabel.fontFamily = GameTheme.typography.bodyFont;
            this.desLabel.fontSize = 16;
            this.desLabel.lineHeight = 22;
            this.desLabel.enableWrapText = false;
            this.desLabel.overflow = Label.Overflow.SHRINK;
            this.desLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.desLabel.verticalAlign = VerticalTextAlignment.CENTER;
            this.desLabel.color = GameTheme.colors.ivory;
            this.desLabel.node.setSiblingIndex(this.node.children.length - 1);
        }

        if (this.timeLabel) {
            this.timeLabel.node.setPosition(width * 0.35, 0, 0);
            ensureTransform(this.timeLabel.node, width * 0.24, 38);
            this.timeLabel.useSystemFont = true;
            this.timeLabel.fontFamily = GameTheme.typography.bodyFont;
            this.timeLabel.fontSize = 14;
            this.timeLabel.lineHeight = 20;
            this.timeLabel.enableWrapText = false;
            this.timeLabel.overflow = Label.Overflow.SHRINK;
            this.timeLabel.horizontalAlign = HorizontalTextAlignment.RIGHT;
            this.timeLabel.verticalAlign = VerticalTextAlignment.CENTER;
            this.timeLabel.color = GameTheme.colors.muted;
            this.timeLabel.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateItem(data:any):void{
        this.desLabel.string = data.des;
        this.timeLabel.string = DateUtil.converTimeStr(data.ctime,  "YYYY-MM-DD hh:mm:ss");
    }
}
