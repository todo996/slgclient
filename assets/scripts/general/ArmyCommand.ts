
import { ServerConfig } from "../config/ServerConfig";
import LoginCommand from "../login/LoginCommand";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import { NetManager } from "../network/socket/NetManager";
import ArmyProxy, { ArmyCmd, ArmyData } from "./ArmyProxy";
import GeneralCommand from "./GeneralCommand";
import { GenaralLevelConfig, GeneralConfig, GeneralData } from "./GeneralProxy";
import { EventMgr } from "../utils/EventMgr";
import { LogicEvent } from "../common/LogicEvent";


export default class ArmyCommand {
    //单例
    protected static _instance: ArmyCommand;
    public static getInstance(): ArmyCommand {
        if (this._instance == null) {
            this._instance = new ArmyCommand();
        }
        return this._instance;
    }

    public static destory(): boolean {
        if (this._instance) {
            this._instance.onDestory();
            this._instance = null;
            return true;
        }
        return false;
    }

    //数据model
    protected _proxy: ArmyProxy = new ArmyProxy();

    constructor() {
        EventMgr.on(ServerConfig.army_myList, this.onQryArmyList, this);
        EventMgr.on(ServerConfig.army_myOne, this.onQryArmyOne, this);

        EventMgr.on(ServerConfig.army_dispose, this.onGeneralDispose, this);
        EventMgr.on(ServerConfig.army_conscript, this.onGeneralConscript, this);
        EventMgr.on(ServerConfig.army_assign, this.onGeneralAssignArmy, this);
        EventMgr.on(ServerConfig.army_push, this.onGeneralArmyStatePush, this);
        EventMgr.on(ServerConfig.nationMap_scanBlock, this.onNationMapScanBlock, this);

        //定时检测Bản thân的Quân đội是否有Võ tướng已经Chiêu mộ完，如果是请求刷新
        setInterval(() => {
            let myCity: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            if (myCity != null){
                let armyList: ArmyData[] = this.proxy.getArmyList(myCity.cityId);
                if (armyList == null){
                    return
                }

                for (let i: number = 0; i < armyList.length; i++) {
                    var army = armyList[i];
                    if (army != null && army.isGenConEnd()){
                        console.log("Có võ tướng đã hoàn tất chiêu mộ");
                        this.qryArmyOne(army.cityId, army.order);
                    }
                }
            }

         }, 1000);
    }

    public onDestory(): void {
        EventMgr.targetOff(this);
    }

    public clearData(): void {
        this._proxy.clearData();
    }

    public get proxy(): ArmyProxy {
        return this._proxy;
    }

    /**Quân đội列表回调*/
    protected onQryArmyList(data: any, otherData: any): void {
        console.log("onQryArmyList", data);
        if (data.code == 0) {
            let armyDatas: ArmyData[] = this._proxy.updateArmys(data.msg.cityId, data.msg.armys);
            EventMgr.emit(LogicEvent.updateArmyList, armyDatas);
        }
    }

    protected onQryArmyOne(data: any, otherData: any): void {
        console.log("onQryArmyOne", data);
        if (data.code == 0) {
            let armyData = this._proxy.updateArmy(data.msg.army.cityId, data.msg.army);
            let armyDatas: ArmyData[] = this._proxy.getArmyList(data.msg.army.cityId);
            EventMgr.emit(LogicEvent.updateArmyList, armyDatas);
            EventMgr.emit(LogicEvent.updateArmy, armyData);
        }
    }



    /**Thiết lậpTướng回调*/
    protected onGeneralDispose(data: any, otherData: any): void {
        console.log("onGeneralDispose", data);
        if (data.code == 0) {
            let armyData: ArmyData = this._proxy.updateArmy(data.msg.army.cityId, data.msg.army);
            console.log("armyData", armyData);
            EventMgr.emit(LogicEvent.updateArmy, armyData);
        }
    }

    /**Chiêu mộ回调*/
    protected onGeneralConscript(data: any, otherData: any): void {
        console.log("onGeneralConscript", data);
        if (data.code == 0) {
            LoginCommand.getInstance().proxy.saveEnterData(data.msg);
            EventMgr.emit(LogicEvent.upateMyRoleRes);

            let armyData: ArmyData = this._proxy.updateArmy(data.msg.army.cityId, data.msg.army);
            EventMgr.emit(LogicEvent.updateArmy, armyData);

        }
    }

    /**Xuất chinh回调*/
    protected onGeneralAssignArmy(data: any, otherData: any): void {
        console.log("onGeneralAssignArmy", data);
        if (data.code == 0) {
            let armyData: ArmyData = this._proxy.updateArmy(data.msg.army.cityId, data.msg.army);
            EventMgr.emit(LogicEvent.updateArmy, armyData);
        }
    }

    /**Quân độiTrạng thái变更*/
    protected onGeneralArmyStatePush(data: any): void {
        console.log("onGeneralArmyState", data);
        if (data.code == 0) {
            let armyData: ArmyData = this._proxy.updateArmy(data.msg.cityId, data.msg);
            EventMgr.emit(LogicEvent.updateArmy, armyData);
        }
    }

    protected onNationMapScanBlock(data: any): void {
        if (data.code == 0) {
            for (let i: number = 0; i < data.msg.armys.length; i++) {
                let armyData: ArmyData = this._proxy.updateArmy(data.msg.armys[i].cityId, data.msg.armys[i]);
                EventMgr.emit(LogicEvent.updateArmy, armyData);
            }
        }
    }

    /**Ta的Nhân vật属性*/
    public updateMyProperty(datas: any[]): void {
        if (datas.length > 0) {
            let armyDatas: ArmyData[] = this._proxy.updateArmys(datas[0].cityId, datas);
            EventMgr.emit(LogicEvent.updateArmyList, armyDatas);
        }
    }

    /**获取Quân đội当前Thể lực*/
    public getArmyPhysicalPower(armyData: ArmyData): number {
        let minPower: number = 100;
        for (let i: number = 0; i < armyData.generals.length; i++) {
            let general: GeneralData = GeneralCommand.getInstance().proxy.getMyGeneral(armyData.generals[i]);
            if (general && minPower > general.physical_power) {
                minPower = general.physical_power;
            }
        }
        return minPower;
    }

    /**获取Quân độiTướng列表*/
    public getArmyGenerals(armyData: ArmyData): GeneralData[] {
        let list: GeneralData[] = [];
        for (let i: number = 0; i < armyData.generals.length; i++) {
            let general: GeneralData = GeneralCommand.getInstance().proxy.getMyGeneral(armyData.generals[i]);
            list.push(general);
        }
        return list;
    }

    /**根据Tướng列表获取Quân độiThể lực*/
    public getArmyPhysicalPowerByGenerals(generals: GeneralData[]): number {
        let minPower: number = 100;
        for (let i: number = 0; i < generals.length; i++) {
            if (generals[i] && minPower > generals[i].physical_power) {
                minPower = generals[i].physical_power;
            }
        }
        return minPower;
    }

    /**获取Quân đội当前Binh lực数*/
    public getArmyCurSoldierCnt(armyData: ArmyData): number {
        let cnt: number = 0;
        for (let i: number = 0; i < armyData.soldiers.length; i++) {
            cnt += armyData.soldiers[i];
        }
        return cnt;
    }

    /**根据Tướng列表获取Quân đội总Binh lực数*/
    public getArmyTotalSoldierCntByGenerals(generals: GeneralData[]): number {
        let cnt: number = 0;
        let levelCfg: GenaralLevelConfig = null;
        for (let i: number = 0; i < generals.length; i++) {
            if (generals[i]) {
                levelCfg = GeneralCommand.getInstance().proxy.getGeneralLevelCfg(generals[i].level);
                cnt += levelCfg.soldiers;
            }
        }
        return cnt;
    }

    /**获取Tốc độ**/
    public getArmySpeed(generals: GeneralData[]): number {
        let empyt: boolean = true;
        let speed: number = 1000000;
        let cfg: GeneralConfig = null;
        for (let i: number = 0; i < generals.length; i++) {
            if (generals[i]) {
                cfg = GeneralCommand.getInstance().proxy.getGeneralCfg(generals[i].cfgId);
                speed = Math.min(speed, GeneralData.getPrValue(cfg.speed, cfg.speed_grow*generals[i].level, generals[i].speed_added));
                empyt = false;
            }
        }
        if (empyt){
            return 0;
        }else{
            return speed;
        }
    }

    public getArmyDestroy(generals: GeneralData[]): number {
        let empyt: boolean = true;
        let destory: number = 0;
        let cfg: GeneralConfig = null;
        for (let i: number = 0; i < generals.length; i++) {
            if (generals[i]) {
                cfg = GeneralCommand.getInstance().proxy.getGeneralCfg(generals[i].cfgId);
                destory += GeneralData.getPrValue(cfg.destroy, cfg.destroy_grow*generals[i].level, generals[i].destroy_added);
                empyt = false;
            }
        }
        if (empyt){
            return 0;
        }else{
            return destory;
        }
    }

    /**根据Tướng列表获取Quân độiThế lực*/
    public getArmyCamp(generals: GeneralData[]): number {
        let cnt: number = 0;
        let lastCamp: number = 0;
        for (let i: number = 0; i < generals.length; i++) {
            if (generals[i] && (generals[i].config.camp == lastCamp || lastCamp == 0)) {
                lastCamp = generals[i].config.camp;
                cnt++;
            } else {
                break;
            }
        }
        if (cnt >= 3) {
            return lastCamp;
        }
        return 0;
    }

    public getArmyStateDes(armyData: ArmyData): string {
        let stateStr: string = "";
        if (armyData.state > 0) {
            if (armyData.cmd == ArmyCmd.Return) {
                stateStr = "[Rút lui]";
            } else {
                stateStr = "[Hành quân]";
            }
        } else {
            if (armyData.cmd == ArmyCmd.Idle) {
                stateStr = "[Chờ lệnh]";
            } else if (armyData.cmd == ArmyCmd.Reclaim) {
                stateStr = "[Đồn điền]";
            } else if (armyData.cmd == ArmyCmd.Conscript) {
                stateStr = "[Chiêu mộ]";
            } else if (armyData.cmd == ArmyCmd.Garrison) {
                stateStr = "[Đồn trú]";
            }else {
                stateStr = "[Dừng lại]";
            }
        }
        return stateStr;
    }

    /**请求Bản thân的Quân đội信息*/
    public qryArmyList(cityId: number): void {
        let sendData: any = {
            name: ServerConfig.army_myList,
            msg: {
                cityId: cityId
            }
        };
        NetManager.getInstance().send(sendData);
    }

    public qryArmyOne(cityId: number, order: number): void {
        let sendData: any = {
            name: ServerConfig.army_myOne,
            msg: {
                cityId: cityId,
                order:order,
            }
        };
        NetManager.getInstance().send(sendData);
    }

    /**给Quân độiThiết lậpTướng*/
    public generalDispose(cityId: number = 0, generalId: number = 0, order: number = 0, position: number = 0, otherData: any): void {
        let sendData: any = {
            name: ServerConfig.army_dispose,
            msg: {
                cityId: cityId,
                generalId: generalId,
                order: order,
                position: position,
            }
        };
        NetManager.getInstance().send(sendData, otherData);
    }

    /**给Quân độiChiêu mộ*/
    public generalConscript(armyId: number = 0, cnts: number[] = [], otherData: any): void {
        let sendData: any = {
            name: ServerConfig.army_conscript,
            msg: {
                armyId: armyId,
                cnts: cnts,
            }
        };
        NetManager.getInstance().send(sendData, otherData);
    }

    /**出兵*/
    public generalAssignArmy(armyId: number = 0, cmd: number = 0, x: number = 0, y: Number = 0, otherData: any = null): void {
        let sendData: any = {
            name: ServerConfig.army_assign,
            msg: {
                armyId: armyId,
                cmd: cmd,
                x: x,
                y: y,
            }
        };
        NetManager.getInstance().send(sendData, otherData);
    }
}
