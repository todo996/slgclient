import { _decorator, Component, Node, Label, Sprite } from 'cc';
const { ccclass, property } = _decorator;

import { ArmyCmd, ArmyData } from "../../general/ArmyProxy";
import GeneralCommand from "../../general/GeneralCommand";
import ArmyCommand from "../../general/ArmyCommand";
import { GeneralConfig, GeneralData } from "../../general/GeneralProxy";
import { localizeNode } from "../../i18n/I18n";
import { styleModernArmyCard } from "../../ui/components/MapHudSurface";
import MapUICommand from "./MapUICommand";
import GeneralHeadLogic from "./GeneralHeadLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('CityArmyItemLogic')
export default class CityArmyItemLogic extends Component {
    @property(Node)
    infoNode: Node = null;
    @property(Node)
    maskNode: Node = null;
    @property(Node)
    tipNode: Node = null;
    @property(Label)
    labelTip: Label = null;
    @property(Sprite)
    headIcon: Sprite = null;
    @property(Label)
    labelId: Label = null;
    @property(Label)
    labelState: Label = null;
    @property(Label)
    labelLv: Label = null;
    @property(Label)
    labelName: Label = null;
    @property(Label)
    labelArms: Label = null;
    @property(Label)
    labelSoldierCnt: Label = null;
    @property(Label)
    labelVice1: Label = null;
    @property(Label)
    labelVice2: Label = null;

    public order: number = 0;
    protected _cityId: number = 0;
    protected _data: ArmyData = null;
    protected _isOpened: boolean = true;
    protected _isOut: boolean = true;

    protected onLoad(): void {
        localizeNode(this.node);
        styleModernArmyCard(this.node);
        EventMgr.on(LogicEvent.updateArmy, this.onUpdateArmy, this);
        this.tipNode.active = false;
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._data = null;
    }

    protected onUpdateArmy(armyData: ArmyData): void {
        if (this._data && armyData.id == this._data.id) {
            this.setArmyData(this._cityId, armyData);
        }
    }

    protected onClickItem(): void {
        AudioManager.instance.playClick();
        if (this.maskNode.active == false) {
            if (this._isOut) {
                if (this._data) {
                    EventMgr.emit(LogicEvent.openArmySetting, this._cityId, this._data.order);
                }
            } else {
                EventMgr.emit(LogicEvent.openArmySetting, this._cityId, this.order);
            }
        }
    }

    protected updateItem(): void {
        if (this._isOpened == false) {
            return;
        }

        if (this._data && this._data.generals[0] != 0) {
            this.tipNode.active = false;
            this.infoNode.active = true;
            const generals: GeneralData[] = ArmyCommand.getInstance().getArmyGenerals(this._data);
            const firstGeneralCfg: GeneralConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(generals[0].cfgId);
            const curSoldierCnt: number = ArmyCommand.getInstance().getArmyCurSoldierCnt(this._data);
            const totalSoldierCnt: number = ArmyCommand.getInstance().getArmyTotalSoldierCntByGenerals(generals);

            if (this._data.cmd == ArmyCmd.Reclaim) {
                this.labelState.string = "Đang đồn điền...";
            } else if (this._data.cmd == ArmyCmd.Conscript) {
                this.labelState.string = "Đang chiêu mộ...";
            } else if (this._data.cmd > 0) {
                this.labelState.string = "Đội quân đang làm nhiệm vụ...";
            } else {
                this.labelState.string = "";
            }

            this.labelId.string = `${this.order}`;
            this.headIcon.getComponent(GeneralHeadLogic).setHeadId(generals[0].cfgId);
            this.labelLv.string = `${generals[0].level}`;
            this.labelName.string = firstGeneralCfg.name;
            this.labelSoldierCnt.string = `${curSoldierCnt}/${totalSoldierCnt}`;

            if (generals[1]) {
                const secondGeneralCfg: GeneralConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(generals[1].cfgId);
                this.labelVice1.string = secondGeneralCfg.name;
            } else {
                this.labelVice1.string = "Không";
            }

            if (generals[2]) {
                const thirdGeneralCfg: GeneralConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(generals[2].cfgId);
                this.labelVice2.string = thirdGeneralCfg.name;
            } else {
                this.labelVice2.string = "Không";
            }
        } else if (this._isOut) {
            this.tipNode.active = true;
            this.infoNode.active = false;
            this.labelTip.string = "Chưa có đội quân";
        } else {
            this.tipNode.active = true;
            this.infoNode.active = false;
            this.labelTip.string = "Nhấn để biên chế đội quân";
        }
    }

    public isOpenedArmy(isOpened: boolean, isOut: boolean): void {
        this._isOpened = isOpened;
        this.infoNode.active = false;
        this.maskNode.active = !this._isOpened;
        this.tipNode.active = !this._isOpened;
        this._isOut = isOut;

        if (!this._isOpened) {
            if (this._isOut) {
                this.labelTip.string = `Mở khóa đội hình ở cấp ${this.order}`;
            } else {
                const facilityName: string = MapUICommand.getInstance().proxy.getFacilityCfgByType(13).name;
                this.labelTip.string = `${facilityName} cấp ${this.order} để mở khóa`;
            }
        }
    }

    public setArmyData(cityId: number, data: ArmyData): void {
        this._cityId = cityId;
        this._data = data;
        this.updateItem();
    }
}
