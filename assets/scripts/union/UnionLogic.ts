import { _decorator, Button, Color, Component, Graphics, Node, Label, UITransform } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import { EventMgr } from '../utils/EventMgr';

@ccclass('UnionLogic')
export default class UnionLogic extends Component {
    @property(Node)
    createNode:Node | null = null;
    @property(Node)
    mainNode:Node | null = null;
    @property(Node)
    lobbyNode:Node | null = null;
    @property(Node)
    memberNode:Node | null = null;
    @property(Node)
    applyNode:Node | null = null;
    @property(Node)
    logNode:Node | null = null;
    @property(Label)
    nameLab:Label | null = null;

    private _referenceBuilt = false;
    private _createAction: Node = null;
    private _memberAction: Node = null;
    private _applyAction: Node = null;
    private _logAction: Node = null;

    protected onLoad():void{
        this.buildReferenceUnionUI();
        this.visibleView();
        EventMgr.on(LogicEvent.openMyUnion,this.openMyUnion,this);
        EventMgr.on(LogicEvent.dismissUnionSuccess,this.onDismiss,this);
        EventMgr.on(LogicEvent.closeUnion,this.closeUnion,this);
        EventMgr.on(LogicEvent.createUnionSuccess,this.openMyUnion,this);
    }

    private buildReferenceUnionUI():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceUnionUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(10, 8, 7, 251), new Color(64, 43, 24, 255), 1, 0);
        this.makePanel(root, 'Header', 1240, 70, 0, 315, new Color(23, 16, 11, 252), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'LIÊN MINH', -475, 315, 30, new Color(235, 196, 116, 255), true, 240);
        this.makeLabel(root, 'Subtitle', 'Cùng chư hầu dựng nghiệp', -255, 315, 14, new Color(149, 130, 100, 255), false, 260);
        this.makeButton(root, 'Close', 'ĐÓNG', 552, 315, 96, 40, () => this.onClickClose(), false, 13);

        const nav = this.makePanel(root, 'Nav', 1160, 54, 0, 254, new Color(17, 13, 10, 248), new Color(92, 64, 35, 255), 1, 7);
        this._createAction = this.makeButton(nav, 'Create', 'TẠO LIÊN MINH', -420, 0, 170, 38, () => this.openCreate(), true, 12);
        this._memberAction = this.makeButton(nav, 'Members', 'THÀNH VIÊN', -170, 0, 160, 38, () => this.onClickMember(), false, 12);
        this._applyAction = this.makeButton(nav, 'Applications', 'ĐƠN XIN', 20, 0, 150, 38, () => this.onClickApply(), false, 12);
        this._logAction = this.makeButton(nav, 'Logs', 'NHẬT KÝ', 195, 0, 150, 38, () => this.onClickLog(), false, 12);
        this.makeButton(nav, 'Home', 'TỔNG QUAN', 390, 0, 160, 38, () => this.back(), false, 12);

        const content = this.makePanel(root, 'AllianceContent', 1160, 500, 0, -35, new Color(14, 11, 9, 244), new Color(91, 63, 35, 255), 2, 9);
        const views = [this.createNode, this.mainNode, this.lobbyNode, this.memberNode, this.applyNode, this.logNode];
        views.forEach(view => {
            if (!view) return;
            view.parent = content;
            view.setPosition(0, 0, 0);
            view.layer = this.node.layer;
            const transform = view.getComponent(UITransform);
            if (transform) transform.setContentSize(1140, 480);
        });

        if (this.nameLab && this.nameLab.node.parent === this.node) this.nameLab.node.active = false;
        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    private refreshNav(joined:boolean):void{
        if (this._createAction) this._createAction.active = !joined;
        if (this._memberAction) this._memberAction.active = joined;
        if (this._applyAction) this._applyAction.active = joined;
        if (this._logAction) this._logAction.active = joined;
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.closeUnion();
    }

    protected onClickMember(): void {
        AudioManager.instance.playClick();
        this.visibleView();
        this.memberNode.active = true;
    }

    protected onClickApply(): void {
        AudioManager.instance.playClick();
        this.visibleView();
        this.applyNode.active = true;
    }

    protected onClickLog(): void {
        AudioManager.instance.playClick();
        this.visibleView();
        this.logNode.active = true;
    }

    protected openCreate():void{
        AudioManager.instance.playClick();
        this.visibleView();
        this.createNode.active = true;
    }

    protected visibleView():void{
        this.memberNode.active = false;
        this.createNode.active = false;
        this.lobbyNode.active = false;
        this.applyNode.active = false;
        this.logNode.active = false;
        this.mainNode.active = false;
    }

    protected closeUnion(){
        this.node.active = false;
    }

    protected openMyUnion():void{
        this.visibleView();
        this.mainNode.active = true;
        this.refreshNav(true);
    }

    protected onEnable():void{
        const city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if(city.unionId > 0){
            this.openMyUnion();
        }else{
            this.visibleView();
            this.lobbyNode.active = true;
            this.refreshNav(false);
        }
    }

    protected onDisable():void{
        this.visibleView();
    }

    protected back():void{
        AudioManager.instance.playClick();
        const city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if(city.unionId > 0){
            this.openMyUnion();
        }else{
            this.visibleView();
            this.lobbyNode.active = true;
            this.refreshNav(false);
        }
    }

    protected onDismiss():void{
        this.visibleView();
        this.lobbyNode.active = true;
        this.refreshNav(false);
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
