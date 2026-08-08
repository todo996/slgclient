import { _decorator, Component, Prefab, Node, instantiate, TiledMapAsset, JsonAsset, SpriteFrame, sys, AudioSource, assert, resources, Button, Color, EditBox, Graphics, HorizontalTextAlignment, Label, Sprite, UITransform, VerticalTextAlignment } from 'cc';
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


    private installAncientUiBridge(): void {
        const target = globalThis as any;
        if (target.__SLG_ANCIENT_UI__) {
            return;
        }

        const colors = {
            gold: new Color(231, 190, 109, 255),
            goldSoft: new Color(196, 168, 115, 235),
            text: new Color(239, 225, 198, 255),
            muted: new Color(177, 163, 139, 255),
            panel: new Color(17, 14, 12, 242),
            panelSoft: new Color(31, 25, 20, 236),
            border: new Color(152, 107, 54, 235),
            jade: new Color(38, 76, 63, 255),
            red: new Color(117, 47, 39, 255),
            success: new Color(111, 183, 97, 255),
        };

        const ensureUiTransform = (node: Node, width: number, height: number): UITransform => {
            const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
            transform.setContentSize(width, height);
            return transform;
        };
        const ensureUiChild = (parent: Node, name: string): Node => {
            let node = parent.getChildByName(name);
            if (!node) {
                node = new Node(name);
                node.setParent(parent);
            }
            return node;
        };
        const hideDirectUiSprites = (node: Node): void => {
            for (const sprite of node.getComponents(Sprite)) sprite.enabled = false;
        };
        const suppressLegacyChrome = (root: Node, maxDepth: number = 2): void => {
            const visit = (node: Node, depth: number): void => {
                if (depth > maxDepth) return;
                const name = node.name.toLowerCase();
                const protectedArt = /(icon|pic|head|avatar|portrait|general|skill|map|army|star)/.test(name);
                const chrome = /(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(name);
                if (chrome && !protectedArt) hideDirectUiSprites(node);
                for (const child of node.children) visit(child, depth + 1);
            };
            visit(root, 0);
        };
        const drawAncientPanel = (node: Node, width: number, height: number, radius: number = 12, fill: Color = colors.panel): void => {
            ensureUiTransform(node, width, height);
            const skin = ensureUiChild(node, '__AncientPanelSkin');
            skin.setPosition(0, 0, 0);
            skin.setSiblingIndex(0);
            ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
            graphics.clear();
            graphics.fillColor = new Color(0, 0, 0, 105);
            graphics.roundRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, radius + 2); graphics.fill();
            graphics.fillColor = fill;
            graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.fill();
            graphics.strokeColor = new Color(72, 48, 28, 255); graphics.lineWidth = 4;
            graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.stroke();
            graphics.strokeColor = colors.border; graphics.lineWidth = 1.6;
            graphics.roundRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, Math.max(4, radius - 4)); graphics.stroke();
        };
        const createUiText = (parent: Node, name: string, text: string, fontSize: number, color: Color, width: number, height: number, titleFont: boolean = false): Label => {
            const node = ensureUiChild(parent, name);
            ensureUiTransform(node, width, height);
            const label = node.getComponent(Label) || node.addComponent(Label);
            label.useSystemFont = true;
            label.fontFamily = titleFont ? 'Times New Roman' : 'Arial';
            label.string = text; label.fontSize = fontSize; label.lineHeight = Math.ceil(fontSize * 1.25);
            label.enableWrapText = false; label.overflow = Label.Overflow.SHRINK;
            label.horizontalAlign = HorizontalTextAlignment.CENTER; label.verticalAlign = VerticalTextAlignment.CENTER; label.color = color;
            return label;
        };
        const getButtonHandler = (button: Button): string => {
            for (const event of (button.clickEvents as any[]) || []) {
                if (event && typeof event.handler === 'string' && event.handler) return event.handler;
            }
            return '';
        };
        const findButtonByHandler = (root: Node, handler: string): Button | null => root.getComponentsInChildren(Button).find((button) => getButtonHandler(button) === handler) || null;
        const styleAncientButton = (buttonNode: Node, text: string, variant: 'gold' | 'dark' | 'jade' | 'red' = 'dark', width: number = 180, height: number = 50): Button => {
            ensureUiTransform(buttonNode, width, height); hideDirectUiSprites(buttonNode);
            const background = buttonNode.getChildByName('Background'); if (background) hideDirectUiSprites(background);
            const skin = ensureUiChild(buttonNode, '__AncientButtonSkin'); skin.setPosition(0, 0, 0); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics); graphics.clear();
            let fill = colors.panelSoft;
            if (variant === 'gold') fill = new Color(120, 78, 28, 255); else if (variant === 'jade') fill = colors.jade; else if (variant === 'red') fill = colors.red;
            graphics.fillColor = fill; graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill();
            graphics.strokeColor = variant === 'gold' ? colors.gold : colors.border; graphics.lineWidth = 2;
            graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6); graphics.stroke();
            for (const label of buttonNode.getComponentsInChildren(Label)) if (label.node.name !== '__AncientButtonLabel') label.node.active = false;
            const label = createUiText(buttonNode, '__AncientButtonLabel', text, variant === 'gold' ? 21 : 18, variant === 'gold' ? new Color(255, 239, 194, 255) : colors.text, width - 20, height - 8, true);
            label.node.active = true; label.node.setPosition(0, 0, 0); label.node.setSiblingIndex(buttonNode.children.length - 1);
            const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
            button.transition = Button.Transition.SCALE; button.zoomScale = 0.97; button.duration = 0.08;
            return button;
        };
        const styleAncientEditBox = (editBox: EditBox, placeholder: string, width: number, height: number): void => {
            const node = editBox.node; ensureUiTransform(node, width, height); hideDirectUiSprites(node);
            const skin = ensureUiChild(node, '__AncientInputSkin'); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics); graphics.clear(); graphics.fillColor = new Color(18, 16, 14, 238);
            graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill(); graphics.strokeColor = new Color(127, 105, 77, 220); graphics.lineWidth = 1.4;
            graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 7); graphics.stroke();
            editBox.placeholder = placeholder;
            if (editBox.placeholderLabel) { editBox.placeholderLabel.useSystemFont = true; editBox.placeholderLabel.fontFamily = 'Arial'; editBox.placeholderLabel.color = new Color(151, 139, 120, 255); }
            if (editBox.textLabel) { editBox.textLabel.useSystemFont = true; editBox.textLabel.fontFamily = 'Arial'; editBox.textLabel.color = colors.text; }
        };
        const addAncientScreenTitle = (root: Node, title: string): void => {
            const header = ensureUiChild(root, '__AncientScreenHeader'); header.setPosition(0, 320, 0); header.setSiblingIndex(root.children.length - 1); ensureUiTransform(header, 1120, 70);
            const graphics = header.getComponent(Graphics) || header.addComponent(Graphics); graphics.clear(); graphics.strokeColor = colors.border; graphics.lineWidth = 1.5;
            graphics.moveTo(-500, -24); graphics.lineTo(-150, -24); graphics.moveTo(150, -24); graphics.lineTo(500, -24); graphics.stroke();
            const label = createUiText(header, '__AncientScreenTitle', title, 39, colors.gold, 360, 58, true); label.node.setPosition(0, -2, 0); label.node.setSiblingIndex(header.children.length - 1);
        };
        const applyAncientScreenChrome = (root: Node, title: string): void => {
            localizeNode(root); suppressLegacyChrome(root, 2);
            const backdrop = ensureUiChild(root, '__AncientScreenBackdrop'); backdrop.setSiblingIndex(0); ensureUiTransform(backdrop, 1280, 720);
            const graphics = backdrop.getComponent(Graphics) || backdrop.addComponent(Graphics); graphics.clear(); graphics.fillColor = new Color(12, 10, 9, 205); graphics.rect(-640, -360, 1280, 720); graphics.fill();
            graphics.strokeColor = new Color(90, 61, 32, 210); graphics.lineWidth = 2; graphics.moveTo(-620, 299); graphics.lineTo(620, 299); graphics.moveTo(-620, -309); graphics.lineTo(620, -309); graphics.stroke();
            addAncientScreenTitle(root, title);
        };

        target.__SLG_ANCIENT_UI__ = {
            ANCIENT_UI: colors,
            localizeNode,
            ensureUiTransform,
            ensureUiChild,
            hideDirectUiSprites,
            suppressLegacyChrome,
            drawAncientPanel,
            createUiText,
            getButtonHandler,
            findButtonByHandler,
            styleAncientButton,
            styleAncientEditBox,
            addAncientScreenTitle,
            applyAncientScreenChrome,
        };
    }

    protected onLoad(): void {
        this.installAncientUiBridge();
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
