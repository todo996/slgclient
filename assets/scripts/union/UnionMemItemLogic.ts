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

import UnionCommand from "./UnionCommand";
import { Member } from "./UnionProxy";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { ensureChild, ensureTransform } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionMemItemLogic')
export default class UnionMemItemLogic extends Component {

    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Label)
    posLabel: Label = null;

    protected _menberData:Member = null;

    protected onLoad():void{
        this.applyLayout();
    }

    private applyLayout(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = transform.width > 0 ? transform.width : 980;
        const height = transform.height > 0 ? transform.height : 76;

        const surface = ensureChild(this.node, '__UnionMemberSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(20, 17, 14, 240);
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.fill();
        graphics.strokeColor = new Color(140, 97, 49, 190);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.stroke();

        this.styleLabel(this.nameLabel, -width * 0.31, 0, width * 0.38, 19, GameTheme.colors.gold300);
        this.styleLabel(this.titleLabel, 0, 0, width * 0.22, 15, GameTheme.colors.muted);
        this.styleLabel(this.posLabel, width * 0.31, 0, width * 0.30, 15, GameTheme.colors.ivory);
    }

    private styleLabel(label: Label, x: number, y: number, width: number, size: number, color: Color): void {
        label.node.setPosition(x, y, 0);
        ensureTransform(label.node, width, 38);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = color;
        label.node.setSiblingIndex(this.node.children.length - 1);
    }

    protected updateItem(data:Member):void{
        this._menberData = data;
        this.titleLabel.string = this._menberData.titleDes;
        this.nameLabel.string = this._menberData.name;
        this.posLabel.string = "Tọa độ: (" + this._menberData.x + "," + this._menberData.y+")";
    }

    protected click():void{
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.clickUnionMemberItem, this._menberData);
    }

    protected kick():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionKick(this._menberData.rid);
    }

    protected appoint():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAppoint(this._menberData.rid, 1);
    }

    protected abdicate():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAbdicate(this._menberData.rid);
    }

    protected jump():void{
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeUnion);
        EventMgr.emit(LogicEvent.scrollToMap, this._menberData.x, this._menberData.y);
    }
}
