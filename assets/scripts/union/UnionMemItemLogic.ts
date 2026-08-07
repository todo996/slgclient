import { _decorator, Component, Label } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import UnionCommand from './UnionCommand';
import { Member } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionMemItemLogic')
export default class UnionMemItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Label)
    posLabel: Label = null;

    protected _menberData: Member | null = null;

    protected updateItem(data: Member): void {
        this._menberData = data;
        this.titleLabel.string = data.titleDes;
        this.nameLabel.string = data.name;
        this.posLabel.string = `Tọa độ: (${data.x},${data.y})`;
    }

    protected click(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            EventMgr.emit(LogicEvent.clickUnionMemberItem, this._menberData);
        }
    }

    protected kick(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionKick(this._menberData.rid);
        }
    }

    protected appoint(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionAppoint(this._menberData.rid, 1);
        }
    }

    protected abdicate(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionAbdicate(this._menberData.rid);
        }
    }

    protected jump(): void {
        AudioManager.instance.playClick();
        if (!this._menberData) {
            return;
        }
        EventMgr.emit(LogicEvent.closeUnion);
        EventMgr.emit(LogicEvent.scrollToMap, this._menberData.x, this._menberData.y);
    }
}
