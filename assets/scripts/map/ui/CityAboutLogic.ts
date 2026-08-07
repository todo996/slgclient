import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import ArmyCommand from "../../general/ArmyCommand";
import { ArmyData } from "../../general/ArmyProxy";
import { localizeNode } from "../../i18n/I18n";
import { styleModernArmyCard, styleModernCityPanel } from "../../ui/components/MapHudSurface";
import { MapCityData } from "../MapCityProxy";
import CityArmyItemLogic from "./CityArmyItemLogic";
import MapUICommand from "./MapUICommand";
import { CityAddition } from "./MapUIProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('CityAboutLogic')
export default class CityAboutLogic extends Component {
    @property(Node)
    armyLayer: Node = null;
    @property(Prefab)
    armyItem: Prefab = null;

    protected _armyCnt: number = 5;
    protected _cityData: MapCityData = null;
    protected _armyComps: CityArmyItemLogic[] = [];

    protected onEnable(): void {
        EventMgr.off(LogicEvent.updateCityAddition, this.onUpdateCityAdditon, this);
        EventMgr.on(LogicEvent.updateCityAddition, this.onUpdateCityAdditon, this);
        localizeNode(this.node);
        styleModernCityPanel(this.node);
        this.initView();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected initView(): void {
        this.armyLayer.removeAllChildren();
        this._armyComps = [];

        for (let i: number = 0; i < this._armyCnt; i++) {
            const item = instantiate(this.armyItem);
            item.parent = this.armyLayer;
            styleModernArmyCard(item);
            const comp: CityArmyItemLogic = item.getComponent(CityArmyItemLogic);
            comp.order = i + 1;
            this._armyComps.push(comp);
        }
    }

    protected onUpdateCityAdditon(cityId: number): void {
        if (this._cityData && this._cityData.cityId == cityId) {
            this.updateArmyList();
        }
    }

    protected updateArmyList(): void {
        if (!this._cityData) {
            return;
        }

        const additon: CityAddition = MapUICommand.getInstance().proxy.getMyCityAddition(this._cityData.cityId);
        const armyList: ArmyData[] = ArmyCommand.getInstance().proxy.getArmyList(this._cityData.cityId);
        for (let i: number = 0; i < this._armyComps.length; i++) {
            if (i >= additon.armyCnt) {
                this._armyComps[i].isOpenedArmy(false, false);
            } else {
                this._armyComps[i].isOpenedArmy(true, false);
                this._armyComps[i].setArmyData(this._cityData.cityId, armyList[i]);
            }
        }
    }

    public setData(data: MapCityData): void {
        this._cityData = data;
        this.updateArmyList();
        MapUICommand.getInstance().qryCityFacilities(this._cityData.cityId);
    }

    protected onClickFacility(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openFacility, this._cityData);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
        EventMgr.emit(LogicEvent.closeCityAbout, this._cityData);
    }
}
