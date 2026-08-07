import { _decorator, Component, Label } from 'cc';
import DateUtil from '../utils/DateUtil';

const { ccclass, property } = _decorator;

@ccclass('UnionLogItemLogic')
export default class UnionLogItemLogic extends Component {
    @property(Label)
    desLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    protected updateItem(data: any): void {
        if (this.desLabel) {
            this.desLabel.string = data.des;
        }
        if (this.timeLabel) {
            this.timeLabel.string = DateUtil.converTimeStr(data.ctime, 'YYYY-MM-DD hh:mm:ss');
        }
    }
}
