import DateUtil from "../utils/DateUtil";

/**Quân đội命令*/
export class ArmyCmd {
    static Idle: number = 0;//Nhàn rỗi
    static Attack: number = 1;//Tấn công
    static Garrison: number = 2;//Đồn trú
    static Reclaim: number = 3;//Đồn điền
    static Return: number = 4;//Rút lui
    static Conscript: number = 5;//Chiêu mộ
    static Transfer: number = 6;//Điều động
}

/**Quân đội数据*/
export class ArmyData {
    id: number = 0;
    cityId: number = 0;
    order: number = 0;
    generals: number[] = [];
    soldiers: number[] = [];
    conTimes: number[] = [];
    conCnts: number[] = [];
    cmd: number = 0;
    state: number = 0;
    fromX: number = 0;
    fromY: number = 0;
    toX: number = 0;
    toY: number = 0;
    startTime: number = 0;
    endTime: number = 0;
    x: number = 0;
    y: number = 0;

    static createFromServer(serverData: any, armyData: ArmyData = null): ArmyData {
        let data: ArmyData = armyData;
        if (armyData == null) {
            data = new ArmyData();
        }
        data.id = serverData.id;
        data.cityId = serverData.cityId;
        data.order = serverData.order;
        data.generals = serverData.generals;
        data.soldiers = serverData.soldiers;

        data.conTimes = serverData.con_times;
        data.conCnts = serverData.con_cnts;

        data.state = serverData.state;
        data.cmd = serverData.cmd;
        if (data.cmd == ArmyCmd.Return) {
            //Quay lại的时候 Toạ độ是反的
            data.fromX = serverData.to_x;
            data.fromY = serverData.to_y;
            data.toX = serverData.from_x;
            data.toY = serverData.from_y;
        } else {
            data.fromX = serverData.from_x;
            data.fromY = serverData.from_y;
            data.toX = serverData.to_x;
            data.toY = serverData.to_y;
        }
        if (data.cmd == ArmyCmd.Idle || data.cmd == ArmyCmd.Conscript) {
            //代表是Dừng lại在Thành trì中
            data.x = data.fromX;
            data.y = data.fromY;
        } else {
            data.x = data.toX;
            data.y = data.toY;
        }

        data.startTime = serverData.start * 1000;
        data.endTime = serverData.end * 1000;

        return data;
    }

    public isGenConEnd():boolean {
        for (let index = 0; index < this.conTimes.length; index++) {
            const conTime = this.conTimes[index];
            if (conTime == 0) {
                continue
            }
            if (DateUtil.isAfterServerTime(conTime*1000)){
                return true;
            }
        }
        return false
    }
}

export default class ArmyProxy {
    protected _maxArmyCnt: number = 5;//Một个Thành trì最大Quân độiSố lượng
    //Võ tướng基础Thiết lập数据
    protected _armys: Map<number, ArmyData[]> = new Map<number, ArmyData[]>();

    public clearData(): void {
        this._armys.clear();
    }

    public getArmyList(cityId: number): ArmyData[] {
        if (this._armys.has(cityId) == false) {
            return null;
        }
        return this._armys.get(cityId);
    }

    public updateArmys(cityId: number, datas: any[]): ArmyData[] {
        let list: ArmyData[] = this.getArmyList(cityId);
        if (list == null) {
            list = new Array(this._maxArmyCnt);
            this._armys.set(cityId, list);
        }
        for (var i = 0; i < datas.length; i++) {
            let armyData: ArmyData = ArmyData.createFromServer(datas[i]);
            list[armyData.order - 1] = armyData;
        }
        return list;
    }

    public updateArmy(cityId: number, data: any): ArmyData {
        let list: ArmyData[] = this.getArmyList(cityId);
        if (list == null) {
            list = new Array(this._maxArmyCnt);
            this._armys.set(cityId, list);
        }
        let armyData: ArmyData = list[data.order - 1];
        list[data.order - 1] = ArmyData.createFromServer(data, armyData);
        return list[data.order - 1];
    }


    public updateArmysNoCity(datas: any): ArmyData[] {
        let list: ArmyData[] = [];
        for(var i = 0; i < datas.length ;i++){
            let armyData: ArmyData = ArmyData.createFromServer(datas[i]);
            this.updateArmy(armyData.cityId,armyData);
            list.push(armyData)
        }

        return list;
    }

    /**根据id获取Quân đội*/
    public getArmyById(id: number, cityId: number): ArmyData {
        let list: ArmyData[] = this.getArmyList(cityId);
        if (list) {
            for (let i: number = 0; i < list.length; i++) {
                if (list[i] && list[i].id == id) {
                    return list[i];
                }
            }
        }
        return null;
    }

    /**根据位置获取Quân đội*/
    public getArmyByOrder(order: number, cityId: number): ArmyData {
        let list: ArmyData[] = this.getArmyList(cityId);
        console.log("getArmyByOrder", order, cityId, list);
        if (list) {
            return list[order - 1];
        }
        return null;
    }

    public getAllArmys(): ArmyData[] {
        let list:ArmyData[] = [];
        this._armys.forEach((datas:ArmyData[]) => {
            list = list.concat(datas);
        })
        return list;
    }

    public getArmysByPos(x: number, y: number) {
        let list:ArmyData[] = [];
        this._armys.forEach((armys:ArmyData[]) => {
            armys.forEach(army => {
                if (army.fromX == x && army.fromY == y){
                    list.push(army);
                }
            });
        })
        return list;
    }
}
