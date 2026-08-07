import { _decorator, Component, ScrollView } from 'cc';
import { LogicEvent } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionLobbyLogic')
export default class UnionLobbyLogic extends Component {
    @property(ScrollView)
    scrollView: ScrollView | null = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateUnionList, this.updateUnion, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected updateUnion(data: any[]): void {
        if (!this.scrollView) {
            return;
        }
        const comp = this.scrollView.node.getComponent(ListLogic);
        const list: Union[] = UnionCommand.getInstance().proxy.getUnionList();
        if (comp) {
            comp.setData(list);
        }
    }

    protected onEnable(): void {
        UnionCommand.getInstance().unionList();
    }
}
