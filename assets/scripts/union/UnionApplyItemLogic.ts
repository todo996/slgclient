import { _decorator, Component, Label } from 'cc';
import { AudioManager } from '../common/AudioManager';
import UnionCommand from './UnionCommand';
import { Apply } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionApplyItemLogic')
export default class UnionApplyItemLogic extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    protected _applyData: Apply | null = null;

    protected updateItem(data: Apply): void {
        this._applyData = data;
        if (this.nameLabel) {
            this.nameLabel.string = data.nick_name;
        }
    }

    protected verify(event: any, decide: number = 0): void {
        AudioManager.instance.playClick();
        if (!this._applyData) {
            return;
        }
        UnionCommand.getInstance().unionVerify(this._applyData.id, Number(decide));
    }
}
