import { _decorator, Component, ScrollView } from 'cc';
import { LogicEvent } from '../common/LogicEvent';
import { MapCityData } from '../map/MapCityProxy';
import MapCommand from '../map/MapCommand';
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionApplyLogic')
export default class UnionApplyLogic extends Component {
    @property(ScrollView)
    applyView: ScrollView | null = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateUnionApply, this.updateApply, this);
        EventMgr.on(LogicEvent.verifyUnionSuccess, this.getApply, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected updateApply(data: any[]): void {
        if (!this.applyView) {
            return;
        }
        const comp = this.applyView.node.getComponent(ListLogic);
        if (comp) {
            comp.setData(data || []);
        }
    }

    protected getApply(): void {
        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        const unionData: Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if (unionData && unionData.isMajor(city.rid)) {
            UnionCommand.getInstance().unionApplyList(unionData.id);
        }
    }

    protected onEnable(): void {
        this.getApply();
    }
}
