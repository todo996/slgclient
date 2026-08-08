import { _decorator, Component, Label, Layout, Node, Slider, Toggle, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import LoginCommand from '../../login/LoginCommand';
import MapCommand from '../MapCommand';
import { EventMgr } from '../../utils/EventMgr';
import MapUICommand from './MapUICommand';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


@ccclass('TransformLogic')
export default class TransformLogic extends Component {
    @property(Layout)
    fromLayout: Layout = null;
    @property(Layout)
    toLayout: Layout = null;
    @property(Node)
    trNode: Node = null;
    @property(Label)
    trLabel: Label = null;
    @property(Label)
    rateLabel: Label = null;
    @property(Slider)
    trSlider: Slider = null;

    protected _nameObj: any = {};
    protected _keyArr: string[] = [];
    protected _curFromIndex = -1;
    protected _curToIndex = -1;
    protected _fromChange = 0;
    protected _toChange = 0;

    protected onLoad(): void {
        this._nameObj = {
            wood: 'Gỗ',
            iron: 'Sắt',
            stone: 'Đá',
            grain: 'Lương thực',
        };
        this._keyArr = ['wood', 'iron', 'stone', 'grain'];
        EventMgr.on(LogicEvent.upateMyRoleRes, this.initView, this);
        this.applyModernMarket();
    }

    private applyModernMarket(): void {
        ui().localizeNode(this.node);
        ui().applyAncientScreenChrome(this.node, 'Chợ');

        const left = ui().ensureUiChild(this.node, '__MarketLeftPanel');
        left.setPosition(-370, 20, 0);
        left.setSiblingIndex(0);
        ui().drawAncientPanel(left, 400, 490, 10);
        const leftTitle = ui().createUiText(left, '__MarketLeftTitle', 'TÀI NGUYÊN ĐANG CÓ', 19, ui().ANCIENT_UI.success, 330, 42, true);
        leftTitle.node.setPosition(0, 205, 0);

        const right = ui().ensureUiChild(this.node, '__MarketRightPanel');
        right.setPosition(370, 20, 0);
        right.setSiblingIndex(0);
        ui().drawAncientPanel(right, 400, 490, 10);
        const rightTitle = ui().createUiText(right, '__MarketRightTitle', 'MUỐN NHẬN', 19, ui().ANCIENT_UI.success, 330, 42, true);
        rightTitle.node.setPosition(0, 205, 0);

        this.fromLayout.node.setPosition(-370, 2, 0);
        this.toLayout.node.setPosition(370, 2, 0);
        this.fromLayout.type = Layout.Type.VERTICAL;
        this.toLayout.type = Layout.Type.VERTICAL;
        this.fromLayout.spacingY = 10;
        this.toLayout.spacingY = 10;
        ui().ensureUiTransform(this.fromLayout.node, 355, 330);
        ui().ensureUiTransform(this.toLayout.node, 355, 330);

        this.styleResourceRows(this.fromLayout);
        this.styleResourceRows(this.toLayout);

        const rateCaption = ui().createUiText(this.node, '__MarketRateCaption', 'TỈ LỆ GIAO DỊCH', 16, ui().ANCIENT_UI.goldSoft, 220, 34, true);
        rateCaption.node.setPosition(0, 95, 0);
        this.rateLabel.node.setPosition(0, 42, 0);
        this.rateLabel.useSystemFont = true;
        this.rateLabel.fontFamily = 'Times New Roman';
        this.rateLabel.fontSize = 39;
        this.rateLabel.lineHeight = 46;
        this.rateLabel.color = ui().ANCIENT_UI.gold;
        ui().ensureUiTransform(this.rateLabel.node, 220, 54);

        this.trSlider.node.setPosition(-145, -226, 0);
        ui().ensureUiTransform(this.trSlider.node, 500, 42);
        this.trLabel.node.setPosition(190, -226, 0);
        this.trLabel.useSystemFont = true;
        this.trLabel.fontFamily = 'Arial';
        this.trLabel.fontSize = 18;
        this.trLabel.color = ui().ANCIENT_UI.success;
        ui().ensureUiTransform(this.trLabel.node, 260, 40);

        const exchange = ui().findButtonByHandler(this.node, 'onTransForm');
        if (exchange) {
            exchange.node.setPosition(480, -300, 0);
            ui().styleAncientButton(exchange.node, 'TRAO ĐỔI', 'jade', 235, 58);
            exchange.node.setSiblingIndex(this.node.children.length - 1);
        }
        const close = ui().findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            ui().styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    private styleResourceRows(layout: Layout): void {
        for (const child of layout.node.children) {
            ui().suppressLegacyChrome(child, 1);
            const transform = child.getComponent(UITransform);
            const width = transform && transform.width > 60 ? transform.width : 330;
            const height = transform && transform.height > 30 ? transform.height : 66;
            ui().drawAncientPanel(child, Math.min(width, 340), Math.min(Math.max(height, 58), 72), 6, ui().ANCIENT_UI.panelSoft);
            const label = child.getChildByName('New Label')?.getComponent(Label);
            if (label) {
                label.useSystemFont = true;
                label.fontFamily = 'Arial';
                label.fontSize = 17;
                label.color = ui().ANCIENT_UI.text;
            }
        }
    }

    private getRate(): number {
        const cityId = MapCommand.getInstance().cityProxy.getMyMainCity().cityId;
        const addition = MapUICommand.getInstance().proxy.getMyCityAddition(cityId);
        return MapUICommand.getInstance().proxy.getTransformRate() + addition.taxRate;
    }

    public initView(): void {
        this.updateView();
        this.updateBtn();
    }

    protected updateView(): void {
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        let i = 0;
        const childrenFrom = this.fromLayout.node.children;
        for (const key in this._nameObj) {
            const label = childrenFrom[i].getChildByName('New Label').getComponent(Label);
            label.string = `${this._nameObj[key]}  ${roleRes[key]}`;
            i += 1;
        }
        i = 0;
        const childrenTo = this.toLayout.node.children;
        for (const key in this._nameObj) {
            const label = childrenTo[i].getChildByName('New Label').getComponent(Label);
            label.string = `${this._nameObj[key]}  ${roleRes[key]}`;
            i += 1;
        }
        const rate = this.getRate();
        this.rateLabel.string = `1 : ${rate / 100}`;
    }

    protected updateBtn(): void {
        this.trSlider.progress = 0;
        this.trNode.active = this._curFromIndex != this._curToIndex;
        this.updateLable();
    }

    protected updateLable(): void {
        const fromIndex = this.getFromSelectIndex();
        const toIndex = this.getToSelectIndex();
        if (fromIndex < 0 || toIndex < 0) {
            this.trLabel.string = 'Chọn tài nguyên để trao đổi';
            return;
        }
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        const fromKey = this._keyArr[fromIndex];
        this._fromChange = Math.round(roleRes[fromKey] * this.trSlider.progress);
        const rate = this.getRate();
        this._toChange = Math.round(this._fromChange * rate / 100);
        this.trLabel.string = `${this._fromChange}  →  ${this._toChange}`;
    }

    protected getFromSelectIndex(): number {
        const children = this.fromLayout.node.children;
        for (let i = 0; i < children.length; i += 1) {
            if (children[i].getComponent(Toggle).isChecked) {
                return i;
            }
        }
        return -1;
    }

    protected getToSelectIndex(): number {
        const children = this.toLayout.node.children;
        for (let i = 0; i < children.length; i += 1) {
            if (children[i].getComponent(Toggle).isChecked) {
                return i;
            }
        }
        return -1;
    }

    protected fromToggleHandle(event: any): void {
        this._curFromIndex = this.getFromSelectIndex();
        this.updateBtn();
    }

    protected toToggleHandle(event: any): void {
        this._curToIndex = this.getToSelectIndex();
        this.updateBtn();
    }

    protected slideHandle(): void {
        this.updateLable();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onTransForm(): void {
        AudioManager.instance.playClick();
        const from: number[] = [0, 0, 0, 0];
        const to: number[] = [0, 0, 0, 0];
        const fromIndex = this.getFromSelectIndex();
        const toIndex = this.getToSelectIndex();
        if (fromIndex < 0 || toIndex < 0) {
            return;
        }
        from[fromIndex] = this._fromChange;
        to[toIndex] = this._toChange;
        MapUICommand.getInstance().interiorTransform(from, to);
    }
}
