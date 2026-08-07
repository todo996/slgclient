import { _decorator, Component, Prefab, Node, instantiate, TiledMapAsset, JsonAsset, SpriteFrame, sys, AudioSource, assert, resources } from 'cc';
const { ccclass, property } = _decorator;

import { GameConfig } from "./config/GameConfig";
import LoaderManager, { LoadData, LoadDataType } from "./core/LoaderManager";
import ArmyCommand from "./general/ArmyCommand";
import GeneralCommand from "./general/GeneralCommand";
import LoginCommand from "./login/LoginCommand";
import MapCommand from "./map/MapCommand";
import MapUICommand from "./map/ui/MapUICommand";
import { initMobileSupport } from './mobile/MobileSupport';
import { HttpManager } from "./network/http/HttpManager";
import { NetEvent } from "./network/socket/NetInterface";
import { NetManager } from "./network/socket/NetManager";
import { NetNodeType } from "./network/socket/NetNode";
import SkillCommand from "./skill/SkillCommand";
import Toast from "./utils/Toast";
import { Tools } from "./utils/Tools";
import { EventMgr } from './utils/EventMgr';
import { AudioManager } from './common/AudioManager';
import { LogicEvent } from './common/LogicEvent';
import { localizeData, localizeNode, translateText } from './i18n/I18n';
import { styleModernMapScene } from './ui/components/MapHudSurface';

@ccclass('Main')
export default class Main extends Component {
    @property(Prefab)
    loginScenePrefab: Prefab = null;

    @property(Prefab)
    mapScenePrefab: Prefab = null;
    @property(Prefab)
    mapUIScenePrefab: Prefab = null;

    @property(Prefab)
    loadingPrefab: Prefab = null;

    @property(Prefab)
    waitPrefab: Prefab = null;

    @property(Prefab)
    toastPrefab: Prefab = null;

    private _audioSource: AudioSource = null!;
    private toastNode: Node = null;
    protected _loginScene: Node = null;
    protected _mapScene: Node = null;
    protected _mapUIScene: Node = null;
    protected _loadingNode: Node = null;
    protected _waitNode: Node = null;
    private _retryTimes: number = 0;
    private _h5GeneralPicIndex: number = 0;
    private _h5GeneralPic = [];

    protected onLoad(): void {
        console.log("Khởi tạo trò chơi");
        initMobileSupport();
        localizeNode(this.node);

        const audioSource = this.getComponent(AudioSource)!;
        assert(audioSource);
        this._audioSource = audioSource;

        AudioManager.instance.init(this._audioSource);

        EventMgr.on(LogicEvent.enterMap, this.onEnterMap, this);
        EventMgr.on(LogicEvent.enterLogin, this.enterLogin, this);
        EventMgr.on(LogicEvent.showToast, this.onShowToast, this);
        EventMgr.on(LogicEvent.showWaiting, this.showWaitNode, this);
        EventMgr.on(LogicEvent.hideWaiting, this.hideWaitNode, this);

        EventMgr.on(NetEvent.ServerRequesting, this.showWaitNode, this);
        EventMgr.on(NetEvent.ServerRequestSucess, this.onServerRequest, this);

        NetManager.getInstance().connect({ url: GameConfig.serverUrl, type: NetNodeType.BaseServer });
        HttpManager.getInstance().setWebUrl(GameConfig.webUrl);

        LoginCommand.getInstance();
        MapCommand.getInstance();
        MapUICommand.getInstance();
        GeneralCommand.getInstance();
        ArmyCommand.getInstance();

        this.enterLogin();
    }

    protected onDestroy(): void {
        console.log("Đóng trò chơi");
        EventMgr.targetOff(this);
    }

    protected clearData(): void {
        MapCommand.getInstance().clearData();
        GeneralCommand.getInstance().clearData();
        ArmyCommand.getInstance().clearData();
    }

    private enterLogin(): void {
        this.clearAllScene();
        this.clearData();
        this._loginScene = instantiate(this.loginScenePrefab);
        this._loginScene.parent = this.node;
        localizeNode(this._loginScene);
    }

    protected onEnterMap(): void {
        const dataList: LoadData[] = [];
        dataList.push(new LoadData("./world/map", LoadDataType.FILE, TiledMapAsset));
        dataList.push(new LoadData("./config/mapRes_0", LoadDataType.FILE, JsonAsset));
        dataList.push(new LoadData("./config/json/facility/", LoadDataType.DIR, JsonAsset));
        dataList.push(new LoadData("./config/json/general/", LoadDataType.DIR, JsonAsset));

        if (sys.isBrowser) {
            dataList.push(new LoadData("./generalpic1", LoadDataType.DIR, SpriteFrame));
        } else {
            dataList.push(new LoadData("./generalpic", LoadDataType.DIR, SpriteFrame));
        }

        dataList.push(new LoadData("./config/basic", LoadDataType.FILE, JsonAsset));
        dataList.push(new LoadData("./config/json/skill/", LoadDataType.DIR, JsonAsset));

        this.addLoadingNode();
        console.log("Đang tải bản đồ");
        LoaderManager.getInstance().startLoadList(dataList, null,
            (error: Error, paths: string[], datas: any[]) => {
                if (error != null) {
                    console.log("Không thể tải dữ liệu cấu hình");
                    this.showTopToast("Không thể tải dữ liệu trò chơi.");
                    return;
                }
                console.log("Đã tải dữ liệu", paths, datas);

                const mapConfig = datas[1] as JsonAsset;
                const facilityConfigs = datas[2] as JsonAsset[];
                const generalConfigs = datas[3] as JsonAsset[];
                const basicConfig = datas[5] as JsonAsset;
                const skillConfigs = datas[6] as JsonAsset[];

                localizeData(mapConfig.json);
                facilityConfigs.forEach(asset => localizeData(asset.json));
                generalConfigs.forEach(asset => localizeData(asset.json));
                localizeData(basicConfig.json);
                skillConfigs.forEach(asset => localizeData(asset.json));

                MapCommand.getInstance().proxy.tiledMapAsset = datas[0] as TiledMapAsset;
                MapCommand.getInstance().proxy.initMapResConfig(mapConfig.json);

                MapUICommand.getInstance().proxy.setAllFacilityCfg(facilityConfigs);
                GeneralCommand.getInstance().proxy.initGeneralConfig(generalConfigs, basicConfig.json);
                GeneralCommand.getInstance().proxy.initGeneralTex(datas[4]);
                MapUICommand.getInstance().proxy.setBasic(basicConfig);
                SkillCommand.getInstance().proxy.initSkillConfig(skillConfigs);

                const basicData = basicConfig.json;
                MapCommand.getInstance().proxy.setWarFree(basicData["build"].war_free);

                const cityId: number = MapCommand.getInstance().cityProxy.getMyMainCity().cityId;
                GeneralCommand.getInstance().qryMyGenerals();
                ArmyCommand.getInstance().qryArmyList(cityId);
                MapUICommand.getInstance().qryWarReport();
                SkillCommand.getInstance().qrySkillList();

                this.clearAllScene();

                this._mapScene = instantiate(this.mapScenePrefab);
                this._mapScene.parent = this.node;
                localizeNode(this._mapScene);

                this._mapUIScene = instantiate(this.mapUIScenePrefab);
                this._mapUIScene.parent = this.node;
                localizeNode(this._mapUIScene);
                styleModernMapScene(this._mapUIScene);

                this.addLoadingNode();
            },
            this
        );
    }

    private h5LoadGeneralTex() {
        if (!sys.isBrowser) {
            return;
        }

        if (this._h5GeneralPic.length == 0) {
            const generalpic = resources.getDirWithPath("./generalpic");
            generalpic.forEach(v => {
                if (v.ctor == SpriteFrame) {
                    this._h5GeneralPic.push(v);
                }
            });
        }

        const loadNext = () => {
            for (let index = this._h5GeneralPicIndex; index < this._h5GeneralPic.length; index++) {
                const pic = this._h5GeneralPic[index];

                let name = pic.path.replaceAll("spriteFrame", "");
                name = name.replaceAll("/", "");
                name = name.replaceAll("\\", "");

                const id: number = Number(String(name).split("_")[1]);
                const frame = GeneralCommand.getInstance().proxy.getGeneralTex(id);
                this._h5GeneralPicIndex = index + 1;

                if (!frame) {
                    resources.load(pic.path, SpriteFrame,
                        (_finish: number, _total: number) => {
                        },
                        (error: Error, asset: any) => {
                            if (error != null) {
                                console.log("Không thể tải ảnh võ tướng:", error.message);
                            } else {
                                GeneralCommand.getInstance().proxy.setGeneralTex(id, asset);
                            }
                        });
                    break;
                }
            }
            if (this._h5GeneralPicIndex >= this._h5GeneralPic.length) {
                this.unschedule(loadNext);
                console.log("Đã tải xong ảnh võ tướng");
            }
        };

        this.schedule(loadNext, 0.01);
    }

    protected addLoadingNode(): void {
        if (this.loadingPrefab) {
            if (this._loadingNode == null) {
                this._loadingNode = instantiate(this.loadingPrefab);
                localizeNode(this._loadingNode);
            }

            this._loadingNode.parent = this.node;
            this._loadingNode.setSiblingIndex(this.topLayer() + 1);
        }
    }

    protected showWaitNode(): void {
        if (this._waitNode == null) {
            this._waitNode = instantiate(this.waitPrefab);
            this._waitNode.parent = this.node;
            localizeNode(this._waitNode);
        }
        this._waitNode.setSiblingIndex(this.topLayer() + 2);
        this._waitNode.active = true;
    }

    protected hideWaitNode(): void {
        if (this._waitNode == null) {
            this._waitNode = instantiate(this.waitPrefab);
            this._waitNode.parent = this.node;
            this._waitNode.setSiblingIndex(this.topLayer() + 2);
            localizeNode(this._waitNode);
        }
        this._waitNode.active = false;
    }

    protected showTopToast(text: string = ""): void {
        if (this.toastNode == null) {
            const toast = instantiate(this.toastPrefab);
            toast.parent = this.node;
            this.toastNode = toast;
            localizeNode(this.toastNode);
        }
        this.toastNode.active = true;
        this.toastNode.setSiblingIndex(this.topLayer() + 10);
        this.toastNode.getComponent(Toast).setText(translateText(text));
    }

    private onServerRequest(msg: any): void {
        if (msg.code == undefined || msg.code == 0 || msg.code == 9) {
            this._retryTimes = 0;
            return;
        }

        if (msg.code == -1 || msg.code == -2 || msg.code == -3 || msg.code == -4) {
            if (this._retryTimes < 3) {
                LoginCommand.getInstance().role_enterServer(LoginCommand.getInstance().proxy.getSession(), false);
                this._retryTimes += 1;
                return;
            }
        }

        this.showTopToast(Tools.getCodeStr(msg.code));
    }

    private onShowToast(msg: string) {
        this.showTopToast(msg);
    }

    protected clearAllScene() {
        if (this._mapScene) {
            this._mapScene.destroy();
            this._mapScene = null;
        }

        if (this._mapUIScene) {
            this._mapUIScene.destroy();
            this._mapUIScene = null;
        }

        if (this._loginScene) {
            this._loginScene.destroy();
            this._loginScene = null;
        }

        if (this._waitNode) {
            this._waitNode.destroy();
            this._waitNode = null;
        }
    }

    public topLayer(): number {
        return this.node.children.length + 1;
    }
}
