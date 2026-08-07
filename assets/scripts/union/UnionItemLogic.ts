import { _decorator, Component, Label, Node } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionItemLogic')
export default class UnionItemLogic extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Node)
    joinButtonNode: Node | null = null;

    protected _unionData: Union | null = null;

    protected onLoad(): void {
        if (this.joinButtonNode) {
            this.joinButtonNode.active = false;
        }
    }

    protected updateItem(data: Union): void {
        this._unionData = data;
        if (this.nameLabel) {
            this.nameLabel.string = data.name;
        }
        if (this.joinButtonNode) {
            this.joinButtonNode.active = this.isCanJoin();
        }
    }

    protected isCanJoin(): boolean {
        return !UnionCommand.getInstance().proxy.isMeInUnion();
    }

    protected join(): void {
        AudioManager.instance.playClick();
        if (this._unionData) {
            UnionCommand.getInstance().unionJoin(this._unionData.id);
        }
    }

    protected click(): void {
        AudioManager.instance.playClick();
        if (this._unionData && !this.isCanJoin()) {
            EventMgr.emit(LogicEvent.openMyUnion, this._unionData);
        }
    }
}
