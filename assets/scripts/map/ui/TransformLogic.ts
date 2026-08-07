import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Layout,
    Node,
    Slider,
    Sprite,
    Toggle,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;
import LoginCommand from "../../login/LoginCommand";
import MapCommand from "../MapCommand";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => handlerOf(button) === handler) || null;
}

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number,
): void {
    styleGameButton(button.node, text, variant, width, height);
    for (const label of button.node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
    const modern = button.node.getChildByName('__GameLabel');
    if (modern) {
        modern.active = true;
        modern.setSiblingIndex(button.node.children.length - 1);
    }
}

@ccclass('TransformLogic')
export default class TransformLogic extends Component {

    @property(Layout)
    fromLayout:Layout = null;

    @property(Layout)
    toLayout:Layout = null;

    @property(Node)
    trNode:Node = null;

    @property(Label)
    trLabel:Label = null;

    @property(Label)
    rateLabel:Label = null;

    @property(Slider)
    trSlider:Slider = null;

    protected _nameObj: any = {};
    protected _keyArr:string[] = [];
    protected _curFromIndex:number = -1;
    protected _curToIndex:number = -1;
    protected _fromChange:number = 0;
    protected _toChange:number = 0;

    protected onLoad():void{
        this._nameObj = {
            wood: "Gỗ: ",
            iron: "Sắt: ",
            stone: "Đá: ",
            grain: "Lương thực: ",
        };

        this._keyArr = ["wood","iron","stone","grain"];

        EventMgr.on(LogicEvent.upateMyRoleRes, this.initView, this);
        localizeNode(this.node);
        this.applyMarketLayout();
    }

    protected onEnable(): void {
        localizeNode(this.node);
        this.applyMarketLayout();
    }

    private drawColumnPanel(name: string, x: number, titleText: string): void {
        const panel = ensureChild(this.node, name);
        panel.setSiblingIndex(0);
        panel.setPosition(x, 22, 0);
        ensureTransform(panel, 390, 352);
        const graphics = panel.getComponent(Graphics) || panel.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(23, 19, 16, 240);
        graphics.roundRect(-195, -176, 390, 352, 14);
        graphics.fill();
        graphics.fillColor = new Color(75, 51, 28, 62);
        graphics.roundRect(-186, -167, 372, 334, 10);
        graphics.fill();
        graphics.strokeColor = new Color(157, 109, 54, 215);
        graphics.lineWidth = 2;
        graphics.roundRect(-195, -176, 390, 352, 14);
        graphics.stroke();

        const title = createGameText(
            panel,
            '__ColumnTitle',
            titleText,
            21,
            GameTheme.colors.gold300,
            300,
            38,
            true,
        );
        title.node.setPosition(0, 142, 0);
    }

    private styleResourceLayout(layout: Layout, x: number, checkedIndex: number): void {
        const node = layout.node;
        node.setPosition(x, 1, 0);
        ensureTransform(node, 320, 268);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 8;
        layout.paddingTop = 0;
        layout.paddingBottom = 0;
        layout.paddingLeft = 0;
        layout.paddingRight = 0;

        for (let index = 0; index < node.children.length; index++) {
            const child = node.children[index];
            child.active = true;
            ensureTransform(child, 300, 58);

            for (const sprite of child.getComponentsInChildren(Sprite)) {
                sprite.enabled = false;
            }

            const surface = ensureChild(child, '__MarketOptionSurface');
            surface.setSiblingIndex(0);
            surface.setPosition(0, 0, 0);
            ensureTransform(surface, 300, 58);
            const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
            graphics.clear();
            const selected = index === checkedIndex;
            graphics.fillColor = selected
                ? new Color(24, 76, 65, 244)
                : new Color(29, 25, 21, 244);
            graphics.roundRect(-150, -29, 300, 58, 9);
            graphics.fill();
            graphics.strokeColor = selected
                ? new Color(100, 183, 148, 235)
                : new Color(131, 94, 50, 205);
            graphics.lineWidth = selected ? 2.5 : 1.5;
            graphics.roundRect(-150, -29, 300, 58, 9);
            graphics.stroke();

            const labels = child.getComponentsInChildren(Label).filter((label) => label.node.name !== '__MarketCheck');
            for (const label of labels) {
                label.node.active = true;
                label.useSystemFont = true;
                label.fontFamily = GameTheme.typography.bodyFont;
                label.fontSize = 16;
                label.lineHeight = 22;
                label.enableWrapText = false;
                label.overflow = Label.Overflow.SHRINK;
                label.horizontalAlign = HorizontalTextAlignment.LEFT;
                label.verticalAlign = VerticalTextAlignment.CENTER;
                label.color = selected ? GameTheme.colors.ivory : GameTheme.colors.gold300;
                ensureTransform(label.node, 230, 40);
                label.node.setPosition(-18, 0, 0);
                label.node.setSiblingIndex(child.children.length - 1);
            }

            const check = createGameText(
                child,
                '__MarketCheck',
                selected ? '✓' : '',
                22,
                GameTheme.colors.ivory,
                34,
                34,
            );
            check.node.setPosition(125, 0, 0);
            check.node.setSiblingIndex(child.children.length - 1);
        }
        layout.updateLayout();
    }

    private applyMarketLayout(): void {
        const legacyPanel = this.node.getChildByName('New Node') || this.node.children.find((child) => child.name !== 'mask');
        if (legacyPanel) {
            for (const sprite of legacyPanel.getComponents(Sprite)) {
                sprite.enabled = false;
            }
            drawGamePanel(legacyPanel, 1180, 650, 10);
        }

        const header = ensureChild(this.node, '__MarketHeader');
        header.setPosition(0, 318, 0);
        ensureTransform(header, 1130, 76);
        const headerGraphics = header.getComponent(Graphics) || header.addComponent(Graphics);
        headerGraphics.clear();
        headerGraphics.fillColor = new Color(12, 10, 9, 238);
        headerGraphics.rect(-565, -38, 1130, 76);
        headerGraphics.fill();
        headerGraphics.strokeColor = new Color(176, 124, 59, 225);
        headerGraphics.lineWidth = 2;
        headerGraphics.moveTo(-565, -36);
        headerGraphics.lineTo(565, -36);
        headerGraphics.stroke();

        const title = createGameText(
            header,
            '__MarketTitle',
            'CHỢ',
            40,
            GameTheme.colors.gold300,
            360,
            58,
            true,
        );
        title.node.setPosition(0, 0, 0);

        const subtitle = createGameText(
            this.node,
            '__MarketSubtitle',
            'TRAO ĐỔI TÀI NGUYÊN',
            17,
            GameTheme.colors.muted,
            390,
            34,
            true,
        );
        subtitle.node.setPosition(0, 258, 0);

        this.drawColumnPanel('__MarketFromPanel', -246, 'TÀI NGUYÊN ĐỔI');
        this.drawColumnPanel('__MarketToPanel', 246, 'TÀI NGUYÊN NHẬN');
        this.styleResourceLayout(this.fromLayout, -246, this.getFromSelectIndex());
        this.styleResourceLayout(this.toLayout, 246, this.getToSelectIndex());

        const arrow = createGameText(
            this.node,
            '__MarketArrow',
            '⇄',
            38,
            GameTheme.colors.gold300,
            72,
            58,
            true,
        );
        arrow.node.setPosition(0, 45, 0);

        this.rateLabel.node.setParent(this.node);
        this.rateLabel.node.setPosition(0, -16, 0);
        ensureTransform(this.rateLabel.node, 180, 36);
        this.rateLabel.useSystemFont = true;
        this.rateLabel.fontFamily = GameTheme.typography.bodyFont;
        this.rateLabel.fontSize = 17;
        this.rateLabel.lineHeight = 23;
        this.rateLabel.enableWrapText = false;
        this.rateLabel.overflow = Label.Overflow.SHRINK;
        this.rateLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.rateLabel.verticalAlign = VerticalTextAlignment.CENTER;
        this.rateLabel.color = GameTheme.colors.gold300;

        const rateCaption = createGameText(
            this.node,
            '__MarketRateCaption',
            'Tỷ lệ hiện tại',
            14,
            GameTheme.colors.muted,
            170,
            28,
        );
        rateCaption.node.setPosition(0, -47, 0);

        this.trSlider.node.setParent(this.node);
        this.trSlider.node.setPosition(0, -205, 0);
        ensureTransform(this.trSlider.node, 670, 44);

        const amountCaption = createGameText(
            this.node,
            '__MarketAmountCaption',
            'Kéo để chọn số lượng trao đổi',
            15,
            GameTheme.colors.muted,
            380,
            30,
        );
        amountCaption.node.setPosition(0, -169, 0);

        this.trNode.setParent(this.node);
        this.trNode.setPosition(0, -278, 0);
        ensureTransform(this.trNode, 640, 74);

        this.trLabel.node.setParent(this.trNode);
        this.trLabel.node.setPosition(-170, 0, 0);
        ensureTransform(this.trLabel.node, 260, 42);
        this.trLabel.useSystemFont = true;
        this.trLabel.fontFamily = GameTheme.typography.bodyFont;
        this.trLabel.fontSize = 18;
        this.trLabel.lineHeight = 24;
        this.trLabel.enableWrapText = false;
        this.trLabel.overflow = Label.Overflow.SHRINK;
        this.trLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.trLabel.verticalAlign = VerticalTextAlignment.CENTER;
        this.trLabel.color = GameTheme.colors.gold300;

        const convert = findButton(this.node, 'onTransForm');
        if (convert) {
            convert.node.setParent(this.trNode);
            convert.node.setPosition(150, 0, 0);
            styleRealButton(convert, 'TRAO ĐỔI', 'primary', 240, 56);
        }

        const close = findButton(this.node, 'onClickClose');
        if (close) {
            close.node.setParent(this.node);
            close.node.setPosition(-574, 318, 0);
            styleRealButton(close, '←', 'secondary', 72, 52);
        }
    }

    private getRate() :number {
        var cityId = MapCommand.getInstance().cityProxy.getMyMainCity().cityId;
        var _addition = MapUICommand.getInstance().proxy.getMyCityAddition(cityId);
        var rate = MapUICommand.getInstance().proxy.getTransformRate() + _addition.taxRate;
        return rate;
    }

    public initView():void{
        this.updateView();
        this.updateBtn();
    }

    protected updateView():void{
        var roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        var i = 0;
        let children_from = this.fromLayout.node.children;
        for (var key in this._nameObj) {
            children_from[i].getChildByName("New Label").getComponent(Label).string = this._nameObj[key] + roleRes[key];
            i++;
        }
        i = 0;
        let children_to = this.toLayout.node.children;
        for (var key in this._nameObj) {
            children_to[i].getChildByName("New Label").getComponent(Label).string = this._nameObj[key] + roleRes[key];
            i++;
        }

        var rate = this.getRate();
        this.rateLabel.string = "1 → " + (rate/100);
    }

    protected updateBtn():void{
        this.trSlider.progress = 0.0;
        this.trNode.active = this._curFromIndex >= 0
            && this._curToIndex >= 0
            && this._curFromIndex != this._curToIndex;
        this.styleResourceLayout(this.fromLayout, -246, this.getFromSelectIndex());
        this.styleResourceLayout(this.toLayout, 246, this.getToSelectIndex());
        this.updateLable();
    }

    protected updateLable():void{
        var from_index = this.getFromSelectIndex();
        var to_index = this.getToSelectIndex();
        if (from_index < 0 || to_index < 0){
            this.trLabel.string = "";
        }else{
            var roleRes = LoginCommand.getInstance().proxy.getRoleResData();
            var from_key = this._keyArr[from_index];
            this._fromChange = Math.round(roleRes[from_key] * this.trSlider.progress);

            var rate = this.getRate();
            this._toChange = Math.round(this._fromChange * rate / 100);
            this.trLabel.string = "Đổi " + this._fromChange + " → Nhận " + this._toChange;
        }
    }

    protected getFromSelectIndex():number{
        let children_from = this.fromLayout.node.children;
        for(var i = 0;i < children_from.length;i++){
            if(children_from[i].getComponent(Toggle).isChecked){
                return i;
            }
        }
        return -1;
    }

    protected getToSelectIndex():number{
        let children_to = this.toLayout.node.children;
        for(var i = 0;i < children_to.length;i++){
            if(children_to[i].getComponent(Toggle).isChecked){
                return i;
            }
        }
        return -1;
    }

    protected fromToggleHandle(event:any):void{
        this._curFromIndex = this.getFromSelectIndex();
        this.updateBtn();
    }

    protected toToggleHandle(event:any):void{
        this._curToIndex = this.getToSelectIndex();
        this.updateBtn();
    }

    protected slideHandle():void{
        this.updateLable();
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onTransForm():void{
        AudioManager.instance.playClick();
        let from:number[] = [0,0,0,0];
        let to:number[] = [0,0,0,0];

        var from_index = this.getFromSelectIndex();
        var to_index = this.getToSelectIndex();

        if(from_index < 0 || to_index < 0 || from_index === to_index || this._fromChange <= 0){
            return;
        }

        from[from_index] = this._fromChange;
        to[to_index] = this._toChange;

        MapUICommand.getInstance().interiorTransform(from,to);
    }
}
