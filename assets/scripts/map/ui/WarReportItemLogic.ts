import { _decorator, Color, Component, Graphics, HorizontalTextAlignment, Label, Node, Sprite, UITransform } from 'cc';
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
import { ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

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

    protected onLoad():void{
        this.winNode.active = this.loseNode.active = false;
        this.applyVisualLayout();
    }

    private applyVisualLayout(): void {
        const legacyBg = this.node.getChildByName('New Sprite');
        if (legacyBg) {
            for (const sprite of legacyBg.getComponents(Sprite)) {
                sprite.enabled = false;
            }
        }

        const rootTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = Math.max(980, rootTransform.width || 980);
        const height = Math.max(190, rootTransform.height || 190);

        const surface = ensureChild(this.node, '__WarReportCardSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(14, 12, 10, 242);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.fillColor = new Color(52, 38, 25, 80);
        graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 8);
        graphics.fill();
        graphics.strokeColor = new Color(154, 107, 52, 225);
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();

        for (const label of [this.timeLabel, this.leftLabel, this.rightLabel, this.posLabel]) {
            if (!label) {
                continue;
            }
            label.useSystemFont = true;
            label.fontFamily = GameTheme.typography.bodyFont;
            label.enableWrapText = false;
            label.overflow = Label.Overflow.SHRINK;
        }

        if (this.timeLabel) {
            this.timeLabel.fontSize = 15;
            this.timeLabel.lineHeight = 20;
            this.timeLabel.color = GameTheme.colors.muted;
            this.timeLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
        }
        if (this.leftLabel) {
            this.leftLabel.fontSize = 21;
            this.leftLabel.lineHeight = 27;
            this.leftLabel.color = GameTheme.colors.gold300;
        }
        if (this.rightLabel) {
            this.rightLabel.fontSize = 21;
            this.rightLabel.lineHeight = 27;
            this.rightLabel.color = GameTheme.colors.gold300;
        }
        if (this.posLabel) {
            this.posLabel.fontSize = 16;
            this.posLabel.lineHeight = 22;
            this.posLabel.color = GameTheme.colors.ivory;
        }
    }

    protected updateItem(data:any):void{
        this._curData = data;

        var isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        this.readBg.active = isRead;

        this.setTeams(this.ackNode,this._curData.beg_attack_general);
        this.setTeams(this.defNode,this._curData.beg_defense_general);

        var roleData:Role = LoginCommand.getInstance().proxy.getRoleData();
        this.isMeWin(this._curData.attack_rid)

        this.leftLabel.string = roleData.rid == this._curData.attack_rid?"Ta":"Địch";
        this.rightLabel.string = roleData.rid == this._curData.defense_rid?"Ta":"Địch"

        this.timeLabel.string = DateUtil.converTimeStr(this._curData.ctime, "YYYY-MM-DD hh:mm:ss");

        this.posLabel.string = "(" + this._curData.x + "," + this._curData.y + ")";
    }

    protected isMeWin(rid:number = 0):void{
        var roleData:Role = LoginCommand.getInstance().proxy.getRoleData();
        this.winNode.active = this.loseNode.active = false;

        if(roleData.rid == rid){
            if(this._curData.result == 0){
                this.loseNode.active = true;
            }else if(this._curData.result == 1){

            }else{
                this.winNode.active = true;
            }
        }else{
            if(this._curData.result == 0){
                this.winNode.active = true;
            }else if(this._curData.result == 1){

            }else{
                this.loseNode.active = true;
            }
        }

    }

    protected setTeams(node:Node[],generals:any[]){
        for(var i = 0; i < node.length ;i++){
            let item:Node = node[i];
            let com = item.getComponent(GeneralItemLogic);
            var general = generals[i];
            if(general){
                item.active = true;
                if(com){
                    com.setWarReportData(general);
                }

            }else{
                item.active = false;
            }

        }
    }

    protected onClickItem():void{
        AudioManager.instance.playClick();

        var isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        if(!isRead){
            MapUICommand.getInstance().warRead(this._curData.id);
        }

        EventMgr.emit(LogicEvent.clickWarReport, this._curData);

    }

    protected onClickPos(){
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeReport);
        EventMgr.emit(LogicEvent.scrollToMap, this._curData.x, this._curData.y);
    }
}
