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

import { MapCityData } from "../MapCityProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { createGameText, ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

@ccclass('RightCityItemLogic')
export default class RightCityItemLogic extends Component {
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
        const height = 74;
        ensureTransform(this.node, width, height);

        const surface = ensureChild(this.node, '__CitySelectorSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(21, 18, 15, 244);
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.fill();
        graphics.fillColor = new Color(74, 49, 27, 64);
        graphics.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 7);
        graphics.fill();
        graphics.strokeColor = new Color(154, 107, 52, 220);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.stroke();

        const badge = createGameText(
            this.node,
            '__CityBadge',
            'THÀNH',
            12,
            GameTheme.colors.ivory,
            56,
            26,
        );
        badge.node.setPosition(-112, 0, 0);
        const badgeSurface = ensureChild(this.node, '__CityBadgeSurface');
        badgeSurface.setSiblingIndex(1);
        badgeSurface.setPosition(-112, 0, 0);
        ensureTransform(badgeSurface, 58, 28);
        const bg = badgeSurface.getComponent(Graphics) || badgeSurface.addComponent(Graphics);
        bg.clear();
        bg.fillColor = new Color(30, 91, 77, 245);
        bg.roundRect(-29, -14, 58, 28, 6);
        bg.fill();
        bg.strokeColor = new Color(98, 182, 147, 230);
        bg.lineWidth = 1;
        bg.roundRect(-29, -14, 58, 28, 6);
        bg.stroke();
        badge.node.setSiblingIndex(this.node.children.length - 1);

        if (this.labelInfo) {
            this.labelInfo.node.setPosition(-65, 13, 0);
            ensureTransform(this.labelInfo.node, 150, 30);
            this.labelInfo.useSystemFont = true;
            this.labelInfo.fontFamily = GameTheme.typography.titleFont;
            this.labelInfo.fontSize = 18;
            this.labelInfo.lineHeight = 23;
            this.labelInfo.enableWrapText = false;
            this.labelInfo.overflow = Label.Overflow.SHRINK;
            this.labelInfo.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.labelInfo.verticalAlign = VerticalTextAlignment.CENTER;
            this.labelInfo.color = GameTheme.colors.gold300;
            this.labelInfo.node.setSiblingIndex(this.node.children.length - 1);
        }

        if (this.labelPos) {
            this.labelPos.node.setPosition(-65, -16, 0);
            ensureTransform(this.labelPos.node, 150, 26);
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
            '__CityJumpHint',
            'ĐẾN →',
            13,
            GameTheme.colors.gold300,
            62,
            28,
        );
        jump.node.setPosition(112, 0, 0);
        jump.node.setSiblingIndex(this.node.children.length - 1);
    }

    protected onClickBg(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            EventMgr.emit(LogicEvent.scrollToMap, this._data.x, this._data.y);
        }
    }

    public setArmyData(data: MapCityData): void {
        this._data = data;
        this.applyModernLayout();
        if (this._data) {
            this.labelInfo.string = this._data.name;
            this.labelPos.string = "Tọa độ " + this._data.x + ", " + this._data.y;
        }
    }
}
