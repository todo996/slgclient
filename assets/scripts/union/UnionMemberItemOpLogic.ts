import { _decorator, Button, Component, Node } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { MapCityData } from '../map/MapCityProxy';
import MapCommand from '../map/MapCommand';
import UnionCommand from './UnionCommand';
import { Member, Union } from './UnionProxy';

const { ccclass, property } = _decorator;

@ccclass('UnionMemberItemOpLogic')
export default class UnionMemberItemOpLogic extends Component {
    @property(Button)
    kickButton: Button = null;

    @property(Button)
    abdicateButton: Button = null;

    @property(Button)
    appointButton: Button = null;

    @property(Button)
    unAppointButton: Button = null;

    protected _menberData: Member | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.click, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.click, this);
    }

    protected click(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data: Member): void {
        this._menberData = data;
        this.kickButton.node.active = false;
        this.abdicateButton.node.active = false;
        this.appointButton.node.active = false;
        this.unAppointButton.node.active = false;

        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        const unionData: Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if (!unionData || data.rid === city.rid) {
            this.node.active = false;
            return;
        }

        const chairman = unionData.getChairman();
        const viceChairman = unionData.getViceChairman();
        if (chairman.rid === city.rid) {
            this.unAppointButton.node.active = viceChairman.rid === data.rid;
            this.kickButton.node.active = unionData.isMajor(city.rid);
            this.abdicateButton.node.active = true;
            this.appointButton.node.active = viceChairman.rid !== data.rid;
            this.node.active = true;
            return;
        }

        if (viceChairman.rid === city.rid) {
            if (chairman.rid === data.rid) {
                this.node.active = false;
                return;
            }
            this.kickButton.node.active = true;
            this.node.active = true;
            return;
        }

        this.node.active = false;
    }

    protected kick(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionKick(this._menberData.rid);
        }
        this.node.active = false;
    }

    protected appoint(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionAppoint(this._menberData.rid, 1);
        }
        this.node.active = false;
    }

    protected unAppoint(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionAppoint(this._menberData.rid, 2);
        }
        this.node.active = false;
    }

    protected abdicate(): void {
        AudioManager.instance.playClick();
        if (this._menberData) {
            UnionCommand.getInstance().unionAbdicate(this._menberData.rid);
        }
        this.node.active = false;
    }
}
