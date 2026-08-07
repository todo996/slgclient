import { _decorator, Component, Node, Vec2, TiledMap } from 'cc';
const { ccclass, property } = _decorator;

import MapResBuildLogic from "../map/MapResBuildLogic";
import MapBuildTipsLogic from "../map/MapBuildTipsLogic";
import MapCityLogic from "../map/MapCityLogic";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import MapLogic from "../map/MapLogic";
import { MapAreaData, MapResType } from "../map/MapProxy";
import MapResLogic from "../map/MapResLogic";
import MapUtil from "../map/MapUtil";
import MapFacilityBuildLogic from "../map/MapFacilityBuildLogic";
import MapBuildTagLogic from "../map/MapBuildTagLogic";
import MapSysCityLogic from "../map/MapSysCityLogic";
import { EventMgr } from '../utils/EventMgr';
import { LogicEvent } from '../common/LogicEvent';
import { CoreEvent } from '../core/coreEvent';
import { localizeNode } from '../i18n/I18n';
import { styleModernMapScene } from '../ui/components/MapHudSurface';

@ccclass('MapScene')
export default class MapScene extends Component {
    @property(Node)
    mapLayer: Node = null;

    protected _cmd: MapCommand = null;
    protected _centerX: number = 0;
    protected _centerY: number = 0;
    protected _lastUpPosTime: number = 0;

    protected onLoad(): void {
        this._cmd = MapCommand.getInstance();

        // Giữ nguyên TiledMap và toàn bộ dữ liệu bản đồ gốc.
        const tiledMap: TiledMap = this.mapLayer.addComponent(TiledMap);
        tiledMap.tmxAsset = this._cmd.proxy.tiledMapAsset;

        MapUtil.initMapConfig(tiledMap);
        this._cmd.initData();
        EventMgr.on(LogicEvent.mapShowAreaChange, this.onMapShowAreaChange, this);
        EventMgr.on(LogicEvent.scrollToMap, this.onScrollToMap, this);

        // Chỉ làm mới các thành phần UI đang nằm trên scene; không thay tile/camera.
        this.scheduleOnce(() => {
            localizeNode(this.node);
            styleModernMapScene(this.node);
        }, 0);

        this.scheduleOnce(() => {
            const myCity: MapCityData = this._cmd.cityProxy.getMyMainCity();
            this.node.getComponent(MapLogic).setTiledMap(tiledMap);
            this.node.getComponent(MapLogic).scrollToMapPoint(new Vec2(myCity.x, myCity.y));
            this.onTimer();
        }, 0.1);

        this.schedule(this.onTimer, 0.2);

        this.scheduleOnce(() => {
            EventMgr.emit(CoreEvent.loadComplete);
        }, 0.6);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._cmd.proxy.clearData();
        this._cmd = null;
    }

    protected onTimer(): void {
        if (this._cmd.proxy.qryAreaIds && this._cmd.proxy.qryAreaIds.length > 0) {
            const qryIndex: number = this._cmd.proxy.qryAreaIds.shift();
            const qryData: MapAreaData = this._cmd.proxy.getMapAreaData(qryIndex);
            if (qryData.checkAndUpdateQryTime()) {
                this._cmd.qryNationMapScanBlock(qryData);
            }
        }

        const nowTime: number = Date.now();
        if (nowTime - this._lastUpPosTime > 1000) {
            this._lastUpPosTime = nowTime;
            const point: Vec2 = MapCommand.getInstance().proxy.getCurCenterPoint();
            if (point != null && (this._centerX != point.x || this._centerY != point.y)) {
                this._centerX = point.x;
                this._centerY = point.y;
                MapCommand.getInstance().upPosition(point.x, point.y);
            }
        }
    }

    protected onMapShowAreaChange(
        centerPoint: Vec2,
        centerAreaId: number,
        addIds: number[],
        removeIds: number[],
    ): void {
        const resLogic: MapResLogic = this.node.getComponent(MapResLogic);
        const buildResLogic: MapResBuildLogic = this.node.getComponent(MapResBuildLogic);
        const buildFacilityLogic: MapFacilityBuildLogic = this.node.getComponent(MapFacilityBuildLogic);
        const tagLogic: MapBuildTagLogic = this.node.getComponent(MapBuildTagLogic);
        const buildTipsLogic: MapBuildTipsLogic = this.node.getComponent(MapBuildTipsLogic);
        const cityLogic: MapCityLogic = this.node.getComponent(MapCityLogic);
        const sysCityLogic: MapSysCityLogic = this.node.getComponent(MapSysCityLogic);

        resLogic.udpateShowAreas(addIds, removeIds);
        buildResLogic.udpateShowAreas(addIds, removeIds);
        buildFacilityLogic.udpateShowAreas(addIds, removeIds);
        tagLogic.udpateShowAreas(addIds, removeIds);
        buildTipsLogic.udpateShowAreas(addIds, removeIds);
        cityLogic.udpateShowAreas(addIds, removeIds);
        sysCityLogic.udpateShowAreas(addIds, removeIds);

        for (let i: number = 0; i < addIds.length; i++) {
            const areaData: MapAreaData = this._cmd.proxy.getMapAreaData(addIds[i]);
            for (let x: number = areaData.startCellX; x < areaData.endCellX; x++) {
                for (let y: number = areaData.startCellY; y < areaData.endCellY; y++) {
                    const cellId: number = MapUtil.getIdByCellPoint(x, y);
                    const resourceData = this._cmd.proxy.getResData(cellId);
                    const buildData = this._cmd.buildProxy.getBuild(cellId);

                    if (resourceData) {
                        resLogic.addItem(addIds[i], resourceData);

                        if (resourceData.type == MapResType.SYS_CITY) {
                            sysCityLogic.addItem(addIds[i], resourceData);
                        }

                        if (resourceData.type <= MapResType.FORTRESS) {
                            tagLogic.addItem(addIds[i], resourceData);
                        }
                    }

                    if (buildData != null) {
                        if (buildData.type == MapResType.SYS_CITY) {
                            sysCityLogic.addItem(addIds[i], buildData);
                        } else if (buildData.type == MapResType.SYS_FORTRESS) {
                            resLogic.addItem(addIds[i], buildData);
                        } else {
                            buildResLogic.addItem(addIds[i], buildData);
                        }

                        buildFacilityLogic.addItem(addIds[i], buildData);
                        buildTipsLogic.addItem(addIds[i], buildData);
                    }

                    const cityData = this._cmd.cityProxy.getCity(cellId);
                    if (cityData != null) {
                        cityLogic.addItem(addIds[i], cityData);
                    }
                }
            }
        }
    }

    protected onScrollToMap(x: number, y: number): void {
        const old = this.node.getComponent(MapLogic).curCameraPoint();
        const cur = this.node.getComponent(MapLogic).toCameraPoint(new Vec2(x, y));

        EventMgr.emit(LogicEvent.beforeScrollToMap, cur.x, cur.y, old.x, old.y);
        this.node.getComponent(MapLogic).scrollToMapPoint(new Vec2(x, y));
    }
}
