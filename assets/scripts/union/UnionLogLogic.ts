import { _decorator, Component, ScrollView } from 'cc';
import { LogicEvent } from '../common/LogicEvent';
import { MapCityData } from '../map/MapCityProxy';
import MapCommand from '../map/MapCommand';
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionLogLogic')
export default class UnionLogLogic extends Component {
    @property(ScrollView)
    logView: ScrollView | null = null;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.unionLog, this.updateLog, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected updateLog(data: any[]): void {
        if (!this.logView) {
            return;
        }
        const comp = this.logView.node.getComponent(ListLogic);
        if (comp) {
            comp.setData(data || []);
        }
    }

    protected getLog(): void {
        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        const unionData: Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if (unionData && unionData.isMajor(city.rid)) {
            UnionCommand.getInstance().unionLog();
        }
    }

    protected onEnable(): void {
        this.getLog();
    }
}
