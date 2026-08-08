import { _decorator, Button, Color, Component, Graphics, Node, Label, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import { Role } from "../../login/LoginProxy";
import DateUtil from "../../utils/DateUtil";
import MapUICommand from "./MapUICommand";
import { WarReport } from "./MapUIProxy";
import { EventMgr } from '../../utils/EventMgr';
import GeneralItemLogic from './GeneralItemLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('WarReportItemLogic')
export default class WarReportItemLogic extends Component {

    private _curData:WarReport = null;

    @property(Node)
    readBg:Node = null;

    @property([Node])
    ackNode:Node[] = [];

    @property([Node])
    defNode:Node[] = [];

    @property(Node)
    winNode:Node = null;

    @property(Node)
    loseNode:Node = null;

    @property(Label)
    timeLabel: Label = null;

    @property(Label)
    leftLabel: Label = null;

    @property(Label)
    rightLabel: Label = null;

    @property(Label)
    posLabel: Label = null;

    private _referenceBuilt = false;
    private _referenceCard: Node = null;
    private _referenceType: Label = null;
    private _referenceResult: Label = null;
    private _referenceUnread: Node = null;

    protected onLoad():void{
        this.winNode.active = this.loseNode.active = false;
        this.buildReferenceItem();
    }

    private buildReferenceItem():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.contentSize.width > 100 ? transform.contentSize.width : 390;
        const height = transform && transform.contentSize.height > 50 ? transform.contentSize.height : 122;

        const oldButton = this.node.getComponent(Button);
        if (oldButton) oldButton.enabled = false;

        this._referenceCard = this.makePanel(this.node, 'ReferenceReportCard', Math.max(360, width - 12), Math.max(104, height - 8), 0, 0, new Color(25, 18, 13, 248), new Color(96, 67, 37, 255), 1, 7);
        const button = this._referenceCard.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.98;
        this._referenceCard.on(Button.EventType.CLICK, this.onClickItem, this);

        this._referenceType = this.makeLabel(this._referenceCard, 'Type', '', -105, 30, 14, new Color(190, 158, 103, 255), true, 132);
        this._referenceResult = this.makeLabel(this._referenceCard, 'Result', '', 95, 30, 14, new Color(230, 199, 133, 255), true, 124);

        this.timeLabel.node.parent = this._referenceCard;
        this.timeLabel.node.active = true;
        this.timeLabel.node.setPosition(-66, -12, 0);
        this.styleLabel(this.timeLabel, 11, new Color(133, 116, 89, 255), false, 220);

        this.posLabel.node.parent = this._referenceCard;
        this.posLabel.node.active = true;
        this.posLabel.node.setPosition(103, -43, 0);
        this.styleLabel(this.posLabel, 12, new Color(177, 151, 108, 255), true, 140);

        this.leftLabel.node.parent = this._referenceCard;
        this.leftLabel.node.active = true;
        this.leftLabel.node.setPosition(-112, -43, 0);
        this.styleLabel(this.leftLabel, 12, new Color(165, 142, 104, 255), false, 90);

        this.rightLabel.node.parent = this._referenceCard;
        this.rightLabel.node.active = true;
        this.rightLabel.node.setPosition(-35, -43, 0);
        this.styleLabel(this.rightLabel, 12, new Color(165, 142, 104, 255), false, 90);

        this._referenceUnread = this.makePanel(this._referenceCard, 'Unread', 8, Math.max(76, height - 34), -(Math.max(360, width - 12) / 2) + 9, 0, new Color(205, 146, 59, 255), new Color(0, 0, 0, 0), 0, 3);

        if (this.readBg) this.readBg.active = false;
        this.ackNode.forEach(node => node.active = false);
        this.defNode.forEach(node => node.active = false);
        if (this.winNode) this.winNode.active = false;
        if (this.loseNode) this.loseNode.active = false;
        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== this._referenceCard) child.active = false;
        });
    }

    protected updateItem(data:any):void{
        this._curData = data;
        const isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        if (this._referenceUnread) this._referenceUnread.active = !isRead;

        const roleData:Role = LoginCommand.getInstance().proxy.getRoleData();
        const isAttacker = roleData.rid == this._curData.attack_rid;
        if (this._referenceType) this._referenceType.string = isAttacker ? 'TẤN CÔNG' : 'PHÒNG THỦ';
        if (this._referenceResult) {
            let result = 'HÒA';
            if (this._curData.result !== 1) {
                const attackerWon = this._curData.result !== 0;
                result = (isAttacker ? attackerWon : !attackerWon) ? 'THẮNG' : 'THUA';
            }
            this._referenceResult.string = result;
            this._referenceResult.color = result === 'THẮNG' ? new Color(226, 187, 102, 255) : result === 'THUA' ? new Color(190, 101, 72, 255) : new Color(165, 145, 108, 255);
        }

        this.leftLabel.string = isAttacker ? 'Ta' : 'Địch';
        this.rightLabel.string = roleData.rid == this._curData.defense_rid ? 'Ta' : 'Địch';
        this.timeLabel.string = DateUtil.converTimeStr(this._curData.ctime, "YYYY-MM-DD hh:mm:ss");
        this.posLabel.string = "(" + this._curData.x + ", " + this._curData.y + ")";
    }

    protected isMeWin(rid:number = 0):void{
        const roleData:Role = LoginCommand.getInstance().proxy.getRoleData();
        this.winNode.active = this.loseNode.active = false;
        if(roleData.rid == rid){
            if(this._curData.result == 0){
                this.loseNode.active = true;
            }else if(this._curData.result != 1){
                this.winNode.active = true;
            }
        }else{
            if(this._curData.result == 0){
                this.winNode.active = true;
            }else if(this._curData.result != 1){
                this.loseNode.active = true;
            }
        }
    }

    protected setTeams(node:Node[],generals:any[]){
        for(let i = 0; i < node.length ;i++){
            const item:Node = node[i];
            const com = item.getComponent(GeneralItemLogic);
            const general = generals[i];
            if(general){
                item.active = true;
                if(com) com.setWarReportData(general);
            }else{
                item.active = false;
            }
        }
    }

    protected onClickItem():void{
        AudioManager.instance.playClick();
        const isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        if(!isRead){
            MapUICommand.getInstance().warRead(this._curData.id);
            if (this._referenceUnread) this._referenceUnread.active = false;
        }
        EventMgr.emit(LogicEvent.clickWarReport, this._curData);
    }

    protected onClickPos(){
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeReport);
        EventMgr.emit(LogicEvent.scrollToMap, this._curData.x, this._curData.y);
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
        if (transform) transform.setContentSize(width, fontSize + 12);
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
        node.addComponent(UITransform).setContentSize(width, fontSize + 12);
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
}