import { _decorator, Button, Color, Component, Graphics, Layout, Node, Label, Slider, Sprite, Toggle, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import LoginCommand from "../../login/LoginCommand";
import MapCommand from "../MapCommand";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

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
    protected _keyArr:string[] = []
    protected _curFromIndex:number = -1;
    protected _curToIndex:number = -1;
    protected _fromChange:number = 0;
    protected _toChange:number = 0;
    private _referenceBuilt = false;
    private _referenceTradeBtn: Node = null;

    protected onLoad():void{
        this._nameObj = {
            wood: "Gỗ",
            iron: "Sắt",
            stone: "Đá",
            grain: "Lương",
        };
        this._keyArr = ["wood","iron","stone","grain"];
        this.buildReferenceMarketUI();
        EventMgr.on(LogicEvent.upateMyRoleRes, this.initView, this);
    }

    private buildReferenceMarketUI():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceMarketUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(11, 9, 8, 251), new Color(64, 43, 24, 255), 1, 0);
        this.makePanel(root, 'Header', 1240, 70, 0, 315, new Color(23, 16, 11, 252), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'CHỢ', -520, 315, 30, new Color(235, 196, 116, 255), true, 150);
        this.makeLabel(root, 'Subtitle', 'Trao đổi tài nguyên', -360, 315, 14, new Color(149, 130, 100, 255), false, 200);
        this.makeButton(root, 'Close', 'ĐÓNG', 550, 315, 100, 40, () => this.onClickClose(), false, 14);

        const left = this.makePanel(root, 'FromPanel', 300, 520, -435, -14, new Color(20, 15, 11, 248), new Color(120, 84, 43, 255), 2, 9);
        this.makeLabel(left, 'FromTitle', 'TÀI NGUYÊN ĐANG CÓ', 0, 220, 15, new Color(183, 154, 104, 255), true, 260);
        this.fromLayout.node.parent = left;
        this.fromLayout.node.active = true;
        this.fromLayout.node.setPosition(0, 25, 0);
        this.fromLayout.enabled = false;
        this.layoutResourceOptions(this.fromLayout.node);

        const right = this.makePanel(root, 'ToPanel', 300, 520, 435, -14, new Color(20, 15, 11, 248), new Color(120, 84, 43, 255), 2, 9);
        this.makeLabel(right, 'ToTitle', 'MUỐN NHẬN', 0, 220, 15, new Color(183, 154, 104, 255), true, 260);
        this.toLayout.node.parent = right;
        this.toLayout.node.active = true;
        this.toLayout.node.setPosition(0, 25, 0);
        this.toLayout.enabled = false;
        this.layoutResourceOptions(this.toLayout.node);

        const center = this.makePanel(root, 'ExchangePanel', 430, 520, 0, -14, new Color(16, 12, 9, 246), new Color(100, 69, 37, 255), 2, 9);
        this.makeLabel(center, 'RateTitle', 'TỶ LỆ TRAO ĐỔI', 0, 210, 13, new Color(149, 129, 97, 255), true, 220);
        this.rateLabel.node.parent = center;
        this.rateLabel.node.active = true;
        this.rateLabel.node.setPosition(0, 171, 0);
        this.styleLabel(this.rateLabel, 24, new Color(237, 203, 132, 255), true, 280);

        this.makeLabel(center, 'AmountTitle', 'SỐ LƯỢNG', 0, 105, 13, new Color(149, 129, 97, 255), true, 180);
        this.trLabel.node.parent = center;
        this.trLabel.node.active = true;
        this.trLabel.node.setPosition(0, 67, 0);
        this.styleLabel(this.trLabel, 22, new Color(226, 205, 163, 255), true, 300);

        this.trSlider.node.parent = center;
        this.trSlider.node.active = true;
        this.trSlider.node.setPosition(0, 5, 0);
        this.styleSlider();
        this.makeLabel(center, 'SliderHint', 'Kéo để chọn lượng tài nguyên muốn đổi', 0, -43, 12, new Color(122, 107, 84, 255), false, 350);

        this._referenceTradeBtn = this.makeButton(center, 'Trade', 'TRAO ĐỔI', 0, -143, 260, 60, () => this.onTransForm(), true, 19);
        this.makeLabel(center, 'TaxHint', 'Tỷ lệ đã bao gồm thuế thành trì hiện tại', 0, -205, 12, new Color(122, 107, 84, 255), false, 350);

        if (this.trNode) this.trNode.active = false;
        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
        this.refreshResourceOptions();
    }

    private layoutResourceOptions(container: Node):void{
        const children = container.children;
        children.forEach((child, index) => {
            child.active = true;
            child.setPosition(0, 130 - index * 82, 0);
            const transform = child.getComponent(UITransform);
            if (transform) transform.setContentSize(250, 60);
            const sprites = child.getComponentsInChildren(Sprite);
            sprites.forEach(sprite => sprite.enabled = false);
            const labelNode = child.getChildByName("New Label");
            const label = labelNode ? labelNode.getComponent(Label) : null;
            if (label) {
                label.fontSize = 15;
                label.lineHeight = 20;
                label.color = new Color(218, 198, 158, 255);
                label.isBold = true;
                label.horizontalAlign = Label.HorizontalAlign.CENTER;
                label.verticalAlign = Label.VerticalAlign.CENTER;
                const labelTransform = label.node.getComponent(UITransform);
                if (labelTransform) labelTransform.setContentSize(220, 42);
            }
            if (!child.getComponent(Graphics)) child.addComponent(Graphics);
        });
    }

    private refreshResourceOptions():void{
        this.drawOptionGroup(this.fromLayout.node);
        this.drawOptionGroup(this.toLayout.node);
    }

    private drawOptionGroup(container: Node):void{
        container.children.forEach(child => {
            const toggle = child.getComponent(Toggle);
            const selected = !!toggle && toggle.isChecked;
            const transform = child.getComponent(UITransform);
            const width = transform ? transform.contentSize.width : 250;
            const height = transform ? transform.contentSize.height : 60;
            const graphics = child.getComponent(Graphics);
            if (!graphics) return;
            graphics.clear();
            graphics.fillColor = selected ? new Color(76, 48, 23, 255) : new Color(27, 20, 15, 248);
            graphics.strokeColor = selected ? new Color(227, 176, 85, 255) : new Color(102, 73, 41, 255);
            graphics.lineWidth = selected ? 2 : 1;
            graphics.roundRect(-width / 2, -height / 2, width, height, 7);
            graphics.fill();
            graphics.stroke();
        });
    }

    private styleSlider():void{
        const transform = this.trSlider.node.getComponent(UITransform);
        if (transform) transform.setContentSize(350, 34);
        const rootSprite = this.trSlider.node.getComponent(Sprite);
        if (rootSprite) rootSprite.enabled = false;
        let graphics = this.trSlider.node.getComponent(Graphics);
        if (!graphics) graphics = this.trSlider.node.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(72, 52, 31, 255);
        graphics.roundRect(-175, -5, 350, 10, 5);
        graphics.fill();

        const handle = this.trSlider.handle;
        if (handle) {
            const handleSprite = handle.getComponent(Sprite);
            if (handleSprite) handleSprite.enabled = false;
            const handleTransform = handle.getComponent(UITransform);
            if (handleTransform) handleTransform.setContentSize(30, 30);
            let handleGraphics = handle.getComponent(Graphics);
            if (!handleGraphics) handleGraphics = handle.addComponent(Graphics);
            handleGraphics.clear();
            handleGraphics.fillColor = new Color(220, 171, 82, 255);
            handleGraphics.strokeColor = new Color(89, 57, 28, 255);
            handleGraphics.lineWidth = 2;
            handleGraphics.circle(0, 0, 13);
            handleGraphics.fill();
            handleGraphics.stroke();
        }
    }

    private getRate() :number {
        const cityId = MapCommand.getInstance().cityProxy.getMyMainCity().cityId;
        const addition = MapUICommand.getInstance().proxy.getMyCityAddition(cityId);
        return MapUICommand.getInstance().proxy.getTransformRate() + addition.taxRate;
    }

    public initView():void{
        this.updateView();
        this.updateBtn();
    }

    protected updateView():void{
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        let i = 0;
        const childrenFrom = this.fromLayout.node.children;
        for (const key in this._nameObj) {
            const labelNode = childrenFrom[i] && childrenFrom[i].getChildByName("New Label");
            if (labelNode) labelNode.getComponent(Label).string = this._nameObj[key] + "  " + roleRes[key];
            i++;
        }
        i = 0;
        const childrenTo = this.toLayout.node.children;
        for (const key in this._nameObj) {
            const labelNode = childrenTo[i] && childrenTo[i].getChildByName("New Label");
            if (labelNode) labelNode.getComponent(Label).string = this._nameObj[key] + "  " + roleRes[key];
            i++;
        }
        const rate = this.getRate();
        this.rateLabel.string = "1 / " + (rate/100);
        this.refreshResourceOptions();
    }

    protected updateBtn():void{
        this.trSlider.progress = 0.0;
        const valid = this._curFromIndex >= 0 && this._curToIndex >= 0 && this._curFromIndex !== this._curToIndex;
        if (this.trNode) this.trNode.active = false;
        if (this._referenceTradeBtn) this._referenceTradeBtn.active = valid;
        this.updateLable();
    }

    protected updateLable():void{
        const fromIndex = this.getFromSelectIndex();
        const toIndex = this.getToSelectIndex();
        if (fromIndex < 0 || toIndex < 0){
            this.trLabel.string = "Chọn hai loại tài nguyên";
        }else{
            const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
            const fromKey = this._keyArr[fromIndex];
            this._fromChange = Math.round(roleRes[fromKey] * this.trSlider.progress);
            const rate = this.getRate();
            this._toChange = Math.round(this._fromChange * rate / 100);
            this.trLabel.string = this._fromChange  + "  →  " + this._toChange;
        }
    }

    protected getFromSelectIndex():number{
        const children = this.fromLayout.node.children;
        for(let i = 0;i < children.length;i++){
            const toggle = children[i].getComponent(Toggle);
            if(toggle && toggle.isChecked) return i;
        }
        return -1;
    }

    protected getToSelectIndex():number{
        const children = this.toLayout.node.children;
        for(let i = 0;i < children.length;i++){
            const toggle = children[i].getComponent(Toggle);
            if(toggle && toggle.isChecked) return i;
        }
        return -1;
    }

    protected fromToggleHandle(event:any):void{
        this._curFromIndex = this.getFromSelectIndex();
        this.refreshResourceOptions();
        this.updateBtn();
    }

    protected toToggleHandle(event:any):void{
        this._curToIndex = this.getToSelectIndex();
        this.refreshResourceOptions();
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
        const from:number[] = [0,0,0,0];
        const to:number[] = [0,0,0,0];
        const fromIndex = this.getFromSelectIndex();
        const toIndex = this.getToSelectIndex();
        if(fromIndex < 0 || toIndex < 0 || fromIndex === toIndex){
            return;
        }
        from[fromIndex] = this._fromChange;
        to[toIndex] = this._toChange;
        MapUICommand.getInstance().interiorTransform(from,to);
    }

    private styleLabel(label: Label, fontSize: number, tint: Color, bold: boolean, width: number):void{
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, fontSize + 14);
    }

    private makePanel(parent: Node, name: string, width: number, height: number, x: number, y: number, fill: Color, stroke: Color, lineWidth: number, radius: number): Node {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = fill;
        graphics.strokeColor = stroke;
        graphics.lineWidth = lineWidth;
        if (radius > 0) graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        else graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();
        if (lineWidth > 0 && stroke.a > 0) graphics.stroke();
        return node;
    }

    private makeLabel(parent: Node, name: string, text: string, x: number, y: number, fontSize: number, tint: Color, bold: boolean, width: number): Label {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, fontSize + 14);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void, primary: boolean, fontSize: number): Node {
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(105, 68, 29, 255) : new Color(28, 20, 14, 248), primary ? new Color(231, 187, 97, 255) : new Color(119, 84, 43, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(232, 210, 170, 255), true, width - 10);
        return node;
    }
}