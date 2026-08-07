import { _decorator, Component, ScrollView, Prefab, Node, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import MapUICommand from "./MapUICommand";
import { WarReport } from "./MapUIProxy";
import WarReportDesLogic from './WarReportDesLogic';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import { styleModernCityPanel } from '../../ui/components/MapHudSurface';

@ccclass('WarReportLogic')
export default class WarReportLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Prefab)
    warPortDesPrefab: Prefab = null;
    private _warPortDesNode: Node = null;

    protected onEnable(): void {
        localizeNode(this.node);
        styleModernCityPanel(this.node);
        EventMgr.on(LogicEvent.upateWarReport, this.initView, this);
        EventMgr.on(LogicEvent.clickWarReport, this.openWarPortDes, this);
        EventMgr.on(LogicEvent.closeReport, this.close, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private close(): void {
        this.node.active = false;
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.close();
    }

    protected initView(): void {
        var report: WarReport[] = MapUICommand.getInstance().proxy.getWarReport();
        var comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(report);
    }

    public updateView(): void {
        this.initView();
        MapUICommand.getInstance().qryWarReport();
    }

    protected openWarPortDes(data: WarReport): void {
        if (this._warPortDesNode == null) {
            this._warPortDesNode = instantiate(this.warPortDesPrefab);
            this._warPortDesNode.parent = this.node;
        } else {
            this._warPortDesNode.active = true;
        }

        localizeNode(this._warPortDesNode);
        styleModernCityPanel(this._warPortDesNode);
        this._warPortDesNode.getComponent(WarReportDesLogic).setData(data);
    }

    protected allRead(): void {
        AudioManager.instance.playClick();
        MapUICommand.getInstance().warRead(0);
    }
}
