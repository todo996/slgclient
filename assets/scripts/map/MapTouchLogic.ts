import { _decorator, Component, Prefab, Node, Vec2, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

import { MapBuildData } from "./MapBuildProxy";
import { MapCityData } from "./MapCityProxy";
import MapClickUILogic from "./MapClickUILogic";
import MapCommand from "./MapCommand";
import { MapResData } from "./MapProxy";
import MapUtil from "./MapUtil";
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('MapTouchLogic')
export default class MapTouchLogic extends Component {
    @property(Prefab)
    clickUIPrefab: Prefab = null;

    @property(Node)
    touch:Node = null;

    protected _cmd: MapCommand;
    protected _clickUINode: Node = null;

    protected onLoad(): void {
        this._cmd = MapCommand.getInstance();
        EventMgr.on(LogicEvent.touchMap, this.onTouchMap, this);
        EventMgr.on(LogicEvent.moveMap, this.onMoveMap, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._cmd = null;
        this._clickUINode = null;
    }

    protected onTouchMap(mapPoint: Vec2, clickPixelPoint: Vec2): void {
        console.log("Đã chọn khu vực (" + mapPoint.x + "," + mapPoint.y + ")");
        this.removeClickUINode();
        if (MapUtil.isVaildCellPoint(mapPoint) == false) {
            console.log("Đã chọn khu vực không hợp lệ");
            return;
        }

        let cellId: number = MapUtil.getIdByCellPoint(mapPoint.x, mapPoint.y);
        let cityData: MapCityData = this._cmd.cityProxy.getCity(cellId);;
        if (cityData != null) {
            //代表点击的是城市
            clickPixelPoint = MapUtil.mapCellToPixelPoint(new Vec2(cityData.x, cityData.y));
            this.showClickUINode(cityData, clickPixelPoint);
            return;
        }

        let buildData: MapBuildData = this._cmd.buildProxy.getBuild(cellId);
        if (buildData != null) {
            if(buildData.isSysCity() == false){
                //代表Đã chọn khu vực đã bị chiếm
                console.log("Đã chọn khu vực đã bị chiếm", buildData);
                this.showClickUINode(buildData, clickPixelPoint);
                return;
            }

        }

        let resData: MapResData = this._cmd.proxy.getResData(cellId);
        if (resData.type > 0) {
            var temp = MapCommand.getInstance().proxy.getSysCityResData(resData.x, resData.y);
            if (temp){
                clickPixelPoint = MapUtil.mapCellToPixelPoint(new Vec2(temp.x, temp.y));
                let cellId: number = MapUtil.getIdByCellPoint(temp.x, temp.y);
                let buildData: MapBuildData = this._cmd.buildProxy.getBuild(cellId);
                if(buildData){
                    this.showClickUINode(buildData, clickPixelPoint);
                }else{
                    this.showClickUINode(temp, clickPixelPoint);
                }
                console.log("Đã chọn thành trì ngoài bản đồ", temp);
            }else{
                this.showClickUINode(resData, clickPixelPoint);
                console.log("Đã chọn khu vực ngoài thành", resData);
            }

        } else {
            console.log("Đã chọn khu vực núi hoặc sông");
        }
    }

    protected onMoveMap(): void {
        this.removeClickUINode();
    }

    public showClickUINode(data: any, pos: Vec2): void {
        if (this._clickUINode == null) {
            this._clickUINode = instantiate(this.clickUIPrefab);

        }
        this._clickUINode.parent = this.touch;
        this._clickUINode.setPosition(new Vec3(pos.x, pos.y, 0));
        this._clickUINode.getComponent(MapClickUILogic).setCellData(data, pos);
    }

    public removeClickUINode(): void {
        if (this._clickUINode) {
            this._clickUINode.parent = null;
        }
    }
}
