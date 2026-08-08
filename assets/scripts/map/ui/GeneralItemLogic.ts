import { _decorator, Button, Color, Component, Label, Sprite, Layout, Node, Graphics, UITransform, color } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import { GeneralCampType, GeneralData } from "../../general/GeneralProxy";
import GeneralHeadLogic from "./GeneralHeadLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

export class GeneralItemType {
    static GeneralInfo: number = 0;
    static GeneralDispose: number = 1;
    static GeneralConScript: number = 2;
    static GeneralNoThing: number = 3;
    static GeneralSelect: number = 4;
}

@ccclass('GeneralItemLogic')
export default class GeneralItemLogic extends Component {

    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    lvLabel: Label = null;

    @property(Sprite)
    spritePic:Sprite = null;

    @property(Label)
    costLabel: Label = null;

    @property(Label)
    campLabel: Label = null;

    @property(Label)
    armLabel: Label = null;

    @property(Layout)
    starLayout:Layout = null;

    @property(Node)
    delNode:Node = null;

    @property(Node)
    useNode:Node = null;

    @property(Node)
    selectNode:Node = null;

    private _curData:any = null;
    private _type:number = -1;
    private _position:number = 0;
    private _cityData:any = null;
    private _orderId:number = 1;
    private _isSelect:boolean = false;
    private _referenceBuilt = false;
    private _referenceSelectFrame: Node = null;
    private _referenceUseBadge: Node = null;
    private _referenceRemoveButton: Node = null;

    protected onLoad():void{
        this._isSelect = false;
        this.buildReferenceCard();
    }

    /**
     * Dựng card Tướng mới hoàn toàn nhưng tái sử dụng portrait/label/sao thật.
     * Các node trang trí cũ bị tắt khỏi runtime.
     */
    private buildReferenceCard(): void {
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const oldRootButton = this.node.getComponent(Button);
        if (oldRootButton) {
            oldRootButton.enabled = false;
        }

        const card = new Node('ReferenceHeroCard');
        card.parent = this.node;
        card.layer = this.node.layer;
        card.addComponent(UITransform).setContentSize(352, 480);

        this.makePanel(card, 'CardFrame', 344, 472, 0, 0, new Color(18, 13, 10, 252), new Color(172, 124, 62, 255), 4, 12);
        this.makePanel(card, 'PortraitWell', 326, 344, 0, 47, new Color(9, 8, 7, 255), new Color(92, 62, 34, 255), 2, 8);
        this.makePanel(card, 'InfoBand', 326, 112, 0, -171, new Color(25, 18, 13, 250), new Color(100, 70, 38, 255), 1, 8);

        const cardButton = card.addComponent(Button);
        cardButton.transition = Button.Transition.SCALE;
        cardButton.zoomScale = 0.97;
        card.on(Button.EventType.CLICK, this.onClickGeneral, this);

        // Portrait thật từ dữ liệu tướng.
        this.moveNode(this.spritePic && this.spritePic.node, card, 0, 48);
        if (this.spritePic) {
            const portraitTransform = this.spritePic.node.getComponent(UITransform);
            if (portraitTransform) portraitTransform.setContentSize(316, 336);
        }

        this.moveNode(this.nameLabel && this.nameLabel.node, card, -42, -137);
        this.styleLabel(this.nameLabel, 23, new Color(239, 207, 139, 255), true, 220);

        this.moveNode(this.lvLabel && this.lvLabel.node, card, 112, -139);
        this.styleLabel(this.lvLabel, 15, new Color(220, 198, 158, 255), true, 82);

        this.moveNode(this.campLabel && this.campLabel.node, card, -93, -184);
        this.styleLabel(this.campLabel, 14, new Color(186, 158, 111, 255), true, 100);

        this.moveNode(this.armLabel && this.armLabel.node, card, 10, -184);
        this.styleLabel(this.armLabel, 14, new Color(226, 190, 119, 255), true, 82);

        this.moveNode(this.costLabel && this.costLabel.node, card, 118, 198);
        this.styleLabel(this.costLabel, 15, new Color(238, 211, 157, 255), true, 72);

        if (this.starLayout) {
            this.moveNode(this.starLayout.node, card, -62, 194);
            this.starLayout.node.setScale(0.76, 0.76, 1);
        }

        // Trạng thái mới thay cho sprite cũ.
        this._referenceSelectFrame = this.makePanel(card, 'SelectedFrame', 338, 466, 0, 0, new Color(0, 0, 0, 0), new Color(241, 193, 91, 255), 7, 12);
        this._referenceSelectFrame.active = false;

        this._referenceUseBadge = this.makePanel(card, 'FormationBadge', 104, 30, -106, 204, new Color(91, 49, 24, 245), new Color(216, 166, 82, 255), 1, 6);
        this.makeLabel(this._referenceUseBadge, 'FormationBadgeLabel', 'ĐỘI HÌNH', 0, 0, 12, new Color(245, 219, 166, 255), true, 92);
        this._referenceUseBadge.active = false;

        this._referenceRemoveButton = this.makeButton(card, 'RemoveButton', 'RỜI ĐỘI', 101, -215, 116, 34, () => this.onDelete());
        this._referenceRemoveButton.active = false;

        if (this.delNode) this.delNode.active = false;
        if (this.useNode) this.useNode.active = false;
        if (this.selectNode) this.selectNode.active = false;

        // Những root cũ không chứa dữ liệu đã reparent đều bị loại khỏi phần nhìn thấy.
        legacyRoots.forEach((child) => {
            if (child.parent === this.node && child !== card) {
                child.active = false;
            }
        });
    }

    private moveNode(node: Node, parent: Node, x: number, y: number): void {
        if (!node) return;
        node.parent = parent;
        node.active = true;
        node.setPosition(x, y, 0);
        node.layer = this.node.layer;
    }

    private styleLabel(label: Label, size: number, tint: Color, bold: boolean, width: number): void {
        if (!label) return;
        label.fontSize = size;
        label.lineHeight = size + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, size + 12);
    }

    public setData(curData:GeneralData,type:number = 0,position:number = 0):void{
        this.updateItem(curData);
    }

    public updateItem(curData:any):void{
        this.updateView(curData);
        this._type = this._curData.type == undefined?-1:this._curData.type;
        this._position = this._curData.position == undefined?0:this._curData.position;
        this.refreshStateBadges();
    }

    protected updateView(curData:any):void{
        this._curData = curData;

        const cfgData = GeneralCommand.getInstance().proxy.getGeneralCfg(this._curData.cfgId);
        this.nameLabel.string = cfgData.name;
        this.lvLabel.string = "Cấp " +  this._curData.level;
        this.spritePic.getComponent(GeneralHeadLogic).setHeadId(this._curData.cfgId);
        this.showStar(cfgData.star,this._curData.star_lv);

        if(cfgData.camp == GeneralCampType.Han){
            this.campLabel.string = "Hán";
        }else if(cfgData.camp == GeneralCampType.Qun){
            this.campLabel.string = "Quần Hùng";
        }else if(cfgData.camp == GeneralCampType.Wei){
            this.campLabel.string = "Ngụy";
        }else if(cfgData.camp == GeneralCampType.Shu){
            this.campLabel.string = "Thục";
        }else if(cfgData.camp == GeneralCampType.Wu){
            this.campLabel.string = "Ngô";
        }

        this.armLabel.string = this.armstr(cfgData.arms);

        if(this.costLabel){
            this.costLabel.string = cfgData.cost + "";
        }
        this.select(false);
    }

    private refreshStateBadges(): void {
        if (this._referenceUseBadge) {
            this._referenceUseBadge.active = this._type == GeneralItemType.GeneralInfo && (this._curData.order || 0) > 0;
        }
    }

    protected armstr(arms:number []): string{
        let str = "";
        if(arms.indexOf(1)>=0 || arms.indexOf(4)>=0 || arms.indexOf(7)>=0){
            str += "Bộ";
        }else if(arms.indexOf(2)>=0 || arms.indexOf(5)>=0 || arms.indexOf(8)>=0){
            str += "Cung";
        }else if(arms.indexOf(3)>=0 || arms.indexOf(6)>=0 || arms.indexOf(9)>=0){
            str += "Kỵ";
        }
        return str;
    }

    public select(flag:boolean):void{
        if(this.selectNode){
            this.selectNode.active = false;
        }
        if (this._referenceSelectFrame) {
            this._referenceSelectFrame.active = flag;
        }
        this._isSelect = flag;
    }

    protected showStar(star:number = 3,star_lv:number = 0):void{
        const childen = this.starLayout.node.children;
        for(let i = 0;i<childen.length;i++){
            if(i < star){
                childen[i].active = true;
                if(i < star_lv){
                    childen[i].getComponent(Sprite).color = color(238,111,68);
                }else{
                    childen[i].getComponent(Sprite).color = color(232,185,88);
                }
            }else{
                childen[i].active = false;
            }
        }
    }

    protected setOtherData(cityData:any,orderId:number = 1):void{
        this._cityData = cityData;
        this._orderId = orderId;
        if (this.delNode) this.delNode.active = false;
        if (this._referenceRemoveButton) this._referenceRemoveButton.active = true;
    }

    protected onClickGeneral(event:any): void {
        AudioManager.instance.playClick();
        if(this._curData){
            const cfgData = this._curData.config;

            if(this._type == GeneralItemType.GeneralInfo){
                EventMgr.emit(LogicEvent.openGeneralDes, cfgData, this._curData);
            }
            else if(this._type == GeneralItemType.GeneralDispose){
                EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, this._position);
            }
            else if(this._type == GeneralItemType.GeneralConScript){
                EventMgr.emit(LogicEvent.openArmyConscript, this._orderId, this._cityData);
            }
            else if(this._type == GeneralItemType.GeneralSelect){
                this._isSelect = !this._isSelect;
                this.select(this._isSelect);
                EventMgr.emit(LogicEvent.openGeneralSelect, cfgData, this._curData, this.node);
            }
        }
    }

    protected onDelete():void{
        const cfgData = this._curData.config;
        EventMgr.emit(LogicEvent.chosedGeneral,cfgData,this._curData,-1);
    }

    public setWarReportData(curData:any):void{
        this.updateView(curData);
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
        node.addComponent(UITransform).setContentSize(width, fontSize + 10);
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

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void): Node {
        const node = this.makePanel(parent, name, width, height, x, y, new Color(53, 31, 18, 250), new Color(181, 128, 63, 255), 2, 6);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, 12, new Color(240, 214, 163, 255), true, width - 8);
        return node;
    }
}