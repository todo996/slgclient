import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform } from 'cc';
const {ccclass, property} = _decorator;

import LoginCommand from "../../login/LoginCommand";
import DateUtil from "../../utils/DateUtil";
import { Tools } from "../../utils/Tools";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('CollectLogic')
export default class CollectLogic extends Component {

    @property(Label)
    cdLab: Label = null;

    @property(Label)
    timesLab: Label = null;

    @property(Label)
    goldLab: Label = null;

    @property(Button)
    collectBtn: Button = null;

    _data: any = null;
    private _referenceBuilt = false;
    private _referenceCollectBtn: Node = null;

    protected onEnable():void{
        if (!this._referenceBuilt) {
            this.buildReferenceCollectUI();
        }
        EventMgr.on(LogicEvent.interiorOpenCollect, this.onOpenCollect, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollect, this);

        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        this.goldLab.string = Tools.numberToShow(roleRes.gold_yield);
        MapUICommand.getInstance().interiorOpenCollect();
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    private buildReferenceCollectUI(): void {
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceCollectUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.makePanel(root, 'Shade', 1280, 720, 0, 0, new Color(3, 3, 3, 155), new Color(0, 0, 0, 0), 0, 0);

        const panel = this.makePanel(root, 'TaxPanel', 650, 520, 0, 0, new Color(20, 14, 10, 252), new Color(194, 145, 70, 255), 4, 14);
        this.makePanel(panel, 'InnerFrame', 618, 488, 0, 0, new Color(29, 20, 14, 246), new Color(91, 61, 33, 255), 1, 11);
        this.makeLabel(panel, 'Title', 'THU THUẾ', 0, 194, 34, new Color(237, 198, 119, 255), true, 350);
        this.makeLabel(panel, 'Subtitle', 'Quốc khố · Nguồn thu hằng ngày', 0, 153, 15, new Color(152, 132, 100, 255), false, 360);

        const reward = this.makePanel(panel, 'RewardBox', 500, 112, 0, 62, new Color(13, 11, 9, 244), new Color(121, 85, 43, 255), 2, 8);
        this.makeLabel(reward, 'RewardTitle', 'VÀNG NHẬN ĐƯỢC', 0, 27, 14, new Color(157, 136, 103, 255), true, 250);
        this.goldLab.node.parent = reward;
        this.goldLab.node.active = true;
        this.goldLab.node.setPosition(0, -17, 0);
        this.styleLabel(this.goldLab, 30, new Color(245, 204, 106, 255), true, 250);

        const state = this.makePanel(panel, 'StateBox', 500, 118, 0, -64, new Color(17, 13, 10, 242), new Color(91, 64, 36, 255), 1, 8);
        this.makeLabel(state, 'TimesTitle', 'Lượt hôm nay', -118, 24, 13, new Color(147, 126, 95, 255), false, 150);
        this.timesLab.node.parent = state;
        this.timesLab.node.active = true;
        this.timesLab.node.setPosition(-118, -17, 0);
        this.styleLabel(this.timesLab, 20, new Color(232, 207, 161, 255), true, 150);
        this.makeLabel(state, 'CdTitle', 'Hồi phục', 118, 24, 13, new Color(147, 126, 95, 255), false, 150);
        this.cdLab.node.parent = state;
        this.cdLab.node.active = true;
        this.cdLab.node.setPosition(118, -17, 0);
        this.styleLabel(this.cdLab, 16, new Color(232, 207, 161, 255), true, 210);

        this._referenceCollectBtn = this.makeButton(panel, 'CollectNow', 'THU THUẾ', 0, -171, 270, 60, () => this.onClickCollect(), true, 20);
        this.makeButton(panel, 'Close', 'ĐÓNG', 252, 208, 88, 38, () => this.onClickClose(), false, 13);

        if (this.collectBtn) this.collectBtn.node.active = false;
        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    protected onOpenCollect(msg:any):void{
        this._data = msg;
        this.startCountDown();
    }

    protected onCollect(msg:any):void{
        this._data = msg;
        this.startCountDown();
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickCollect(): void{
        AudioManager.instance.playClick();
        MapUICommand.getInstance().interiorCollect();
    }

    protected startCountDown(){
        this.stopCountDown();
        this.schedule(this.countDown, 1.0);
        this.countDown();
    }

    public countDown() {
        if (!this._data) return;
        this.timesLab.string = this._data.cur_times + "/" + this._data.limit;
        const diff = DateUtil.leftTime(this._data.next_time);
        const ready = diff <= 0;
        if (!ready){
            this.cdLab.string = DateUtil.leftTimeStr(this._data.next_time);
        }else{
            this.cdLab.string = "Có thể thu ngay";
        }
        if (this.collectBtn) this.collectBtn.node.active = false;
        if (this._referenceCollectBtn) this._referenceCollectBtn.active = ready;
    }

    public stopCountDown() {
        this.unschedule(this.countDown);
    }

    private styleLabel(label: Label, fontSize: number, tint: Color, bold: boolean, width: number): void {
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, fontSize + 16);
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
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(111, 72, 29, 255) : new Color(28, 20, 14, 248), primary ? new Color(233, 189, 95, 255) : new Color(116, 82, 43, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(242, 218, 169, 255), true, width - 10);
        return node;
    }
}