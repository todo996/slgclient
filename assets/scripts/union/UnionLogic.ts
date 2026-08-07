import { _decorator, Component, Label, Node } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { MapCityData } from '../map/MapCityProxy';
import MapCommand from '../map/MapCommand';
import { EventMgr } from '../utils/EventMgr';

const { ccclass, property } = _decorator;

@ccclass('UnionLogic')
export default class UnionLogic extends Component {
    @property(Node)
    createNode: Node | null = null;

    @property(Node)
    mainNode: Node | null = null;

    @property(Node)
    lobbyNode: Node | null = null;

    @property(Node)
    memberNode: Node | null = null;

    @property(Node)
    applyNode: Node | null = null;

    @property(Node)
    logNode: Node | null = null;

    @property(Label)
    nameLab: Label | null = null;

    protected onLoad(): void {
        this.visibleView();
        EventMgr.on(LogicEvent.openMyUnion, this.openMyUnion, this);
        EventMgr.on(LogicEvent.dismissUnionSuccess, this.onDismiss, this);
        EventMgr.on(LogicEvent.closeUnion, this.closeUnion, this);
        EventMgr.on(LogicEvent.createUnionSuccess, this.openMyUnion, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.closeUnion();
    }

    protected onClickMember(): void {
        AudioManager.instance.playClick();
        if (this.memberNode) {
            this.memberNode.active = true;
        }
        if (this.mainNode) {
            this.mainNode.active = false;
        }
    }

    protected onClickApply(): void {
        AudioManager.instance.playClick();
        if (this.mainNode) {
            this.mainNode.active = false;
        }
        if (this.applyNode) {
            this.applyNode.active = true;
        }
    }

    protected onClickLog(): void {
        AudioManager.instance.playClick();
        if (this.mainNode) {
            this.mainNode.active = false;
        }
        if (this.logNode) {
            this.logNode.active = true;
        }
    }

    protected openCreate(): void {
        AudioManager.instance.playClick();
        if (this.createNode) {
            this.createNode.active = true;
        }
    }

    protected visibleView(): void {
        if (this.memberNode) {
            this.memberNode.active = false;
        }
        if (this.createNode) {
            this.createNode.active = false;
        }
        if (this.lobbyNode) {
            this.lobbyNode.active = false;
        }
        if (this.applyNode) {
            this.applyNode.active = false;
        }
        if (this.logNode) {
            this.logNode.active = false;
        }
    }

    protected closeUnion(): void {
        this.node.active = false;
    }

    protected openMyUnion(): void {
        this.visibleView();
        if (this.mainNode) {
            this.mainNode.active = true;
        }
    }

    protected onEnable(): void {
        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (city && city.unionId > 0) {
            this.openMyUnion();
            return;
        }

        if (this.mainNode) {
            this.mainNode.active = false;
        }
        if (this.lobbyNode) {
            this.lobbyNode.active = true;
        }
    }

    protected onDisable(): void {
        this.visibleView();
    }

    protected back(): void {
        AudioManager.instance.playClick();
        this.openMyUnion();
    }

    protected onDismiss(): void {
        this.visibleView();
        if (this.lobbyNode) {
            this.lobbyNode.active = true;
        }
    }
}
