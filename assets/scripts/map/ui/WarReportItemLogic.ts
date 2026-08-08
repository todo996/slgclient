import { _decorator, Component, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import LoginCommand from '../../login/LoginCommand';
import { Role } from '../../login/LoginProxy';
import DateUtil from '../../utils/DateUtil';
import { EventMgr } from '../../utils/EventMgr';
import GeneralItemLogic from './GeneralItemLogic';
import MapUICommand from './MapUICommand';
import { WarReport } from './MapUIProxy';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


@ccclass('WarReportItemLogic')
export default class WarReportItemLogic extends Component {
    private _curData: WarReport = null;

    @property(Node)
    readBg: Node = null;
    @property([Node])
    ackNode: Node[] = [];
    @property([Node])
    defNode: Node[] = [];
    @property(Node)
    winNode: Node = null;
    @property(Node)
    loseNode: Node = null;
    @property(Label)
    timeLabel: Label = null;
    @property(Label)
    leftLabel: Label = null;
    @property(Label)
    rightLabel: Label = null;
    @property(Label)
    posLabel: Label = null;

    protected onLoad(): void {
        this.winNode.active = this.loseNode.active = false;
        this.applyModernRow();
    }

    private applyModernRow(): void {
        ui().localizeNode(this.node);
        ui().suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 100 ? transform.width : 580;
        const height = transform && transform.height > 40 ? transform.height : 100;
        ui().drawAncientPanel(this.node, width, height, 7, ui().ANCIENT_UI.panelSoft);
        for (const label of [this.timeLabel, this.leftLabel, this.rightLabel, this.posLabel]) {
            if (!label) {
                continue;
            }
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.color = ui().ANCIENT_UI.text;
        }
        this.timeLabel.color = ui().ANCIENT_UI.muted;
        this.posLabel.color = ui().ANCIENT_UI.success;
        this.leftLabel.color = ui().ANCIENT_UI.gold;
        this.rightLabel.color = ui().ANCIENT_UI.goldSoft;
    }

    protected updateItem(data: any): void {
        this._curData = data;
        const isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        this.readBg.active = isRead;
        this.setTeams(this.ackNode, this._curData.beg_attack_general);
        this.setTeams(this.defNode, this._curData.beg_defense_general);
        const roleData: Role = LoginCommand.getInstance().proxy.getRoleData();
        this.isMeWin(this._curData.attack_rid);
        this.leftLabel.string = roleData.rid == this._curData.attack_rid ? 'Ta' : 'Địch';
        this.rightLabel.string = roleData.rid == this._curData.defense_rid ? 'Ta' : 'Địch';
        this.timeLabel.string = DateUtil.converTimeStr(this._curData.ctime, 'YYYY-MM-DD hh:mm:ss');
        this.posLabel.string = `(${this._curData.x}, ${this._curData.y})`;
    }

    protected isMeWin(rid: number = 0): void {
        const roleData: Role = LoginCommand.getInstance().proxy.getRoleData();
        this.winNode.active = this.loseNode.active = false;
        if (roleData.rid == rid) {
            if (this._curData.result == 0) {
                this.loseNode.active = true;
            } else if (this._curData.result != 1) {
                this.winNode.active = true;
            }
        } else if (this._curData.result == 0) {
            this.winNode.active = true;
        } else if (this._curData.result != 1) {
            this.loseNode.active = true;
        }
    }

    protected setTeams(node: Node[], generals: any[]): void {
        for (let i = 0; i < node.length; i += 1) {
            const item = node[i];
            const comp = item.getComponent(GeneralItemLogic);
            const general = generals[i];
            if (general) {
                item.active = true;
                if (comp) {
                    comp.setWarReportData(general);
                }
            } else {
                item.active = false;
            }
        }
    }

    protected onClickItem(): void {
        AudioManager.instance.playClick();
        const isRead = MapUICommand.getInstance().proxy.isRead(this._curData.id);
        if (!isRead) {
            MapUICommand.getInstance().warRead(this._curData.id);
        }
        EventMgr.emit(LogicEvent.clickWarReport, this._curData);
    }

    protected onClickPos(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeReport);
        EventMgr.emit(LogicEvent.scrollToMap, this._curData.x, this._curData.y);
    }
}
