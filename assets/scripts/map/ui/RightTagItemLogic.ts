import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;

import { MapCityData } from "../MapCityProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { createGameText, ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

@ccclass('RightTagItemLogic')
export default class RightTagItemLogic extends Component {
    @property(Label)
    labelInfo: Label = null;
    @property(Label)
    labelPos: Label = null;

    protected _data: MapCityData = null;

    protected onLoad(): void {
        this.applyModernLayout();
    }

    protected onEnable(): void {
        this.applyModernLayout();
    }

    protected onDestroy(): void {
        this._data = null;
    }

    private applyModernLayout(): void {
        const width = 304;
        const height = 68;
        ensureTransform(this.node, width, height);

        const surface = ensureChild(this.node, '__TagSelectorSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(21, 18, 15, 242);
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.fill();
        graphics.strokeColor = new Color(130, 91, 48, 205);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 9);
        graphics.stroke();

        const pin = createGameText(
            this.node,
            '__TagPin',
            '◆',
            18,
            GameTheme.colors.gold300,
            34,
            34,
        );
        pin.node.setPosition(-126, 0, 0);
        pin.node.setSiblingIndex(this.node.children.length - 1);

        if (this.labelInfo) {
            this.labelInfo.node.setPosition(-54, 12, 0);
            ensureTransform(this.labelInfo.node, 170, 28);
            this.labelInfo.useSystemFont = true;
            this.labelInfo.fontFamily = GameTheme.typography.bodyFont;
            this.labelInfo.fontSize = 16;
            this.labelInfo.lineHeight = 21;
            this.labelInfo.enableWrapText = false;
            this.labelInfo.overflow = Label.Overflow.SHRINK;
            this.labelInfo.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.labelInfo.verticalAlign = VerticalTextAlignment.CENTER;
            this.labelInfo.color = GameTheme.colors.ivory;
            this.labelInfo.node.setSiblingIndex(this.node.children.length - 1);
        }

        if (this.labelPos) {
            this.labelPos.node.setPosition(-54, -15, 0);
            ensureTransform(this.labelPos.node, 170, 24);
            this.labelPos.useSystemFont = true;
            this.labelPos.fontFamily = GameTheme.typography.bodyFont;
            this.labelPos.fontSize = 13;
            this.labelPos.lineHeight = 18;
            this.labelPos.enableWrapText = false;
            this.labelPos.overflow = Label.Overflow.SHRINK;
            this.labelPos.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.labelPos.verticalAlign = VerticalTextAlignment.CENTER;
            this.labelPos.color = GameTheme.colors.muted;
            this.labelPos.node.setSiblingIndex(this.node.children.length - 1);
        }

        const jump = createGameText(
            this.node,
            '__TagJumpHint',
            'ĐẾN →',
            12,
            GameTheme.colors.gold300,
            58,
            26,
        );
        jump.node.setPosition(118, 0, 0);
        jump.node.setSiblingIndex(this.node.children.length - 1);
    }

    protected onClickBg(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            EventMgr.emit(LogicEvent.scrollToMap, this._data.x, this._data.y);
        }
    }

    public setData(data:any): void {
        this._data = data;
        this.applyModernLayout();
        if (this._data) {
            this.labelInfo.string = this._data.name;
            this.labelPos.string = "Tọa độ " + this._data.x + ", " + this._data.y;
        }
    }
}
