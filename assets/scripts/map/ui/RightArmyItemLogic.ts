import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Sprite,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;

import { ArmyCmd, ArmyData } from "../../general/ArmyProxy";
import GeneralCommand from "../../general/GeneralCommand";
import ArmyCommand from "../../general/ArmyCommand";
import { GeneralConfig, GeneralData } from "../../general/GeneralProxy";
import { MapCityData } from "../MapCityProxy";
import MapCommand from "../MapCommand";
import DateUtil from "../../utils/DateUtil";
import GeneralHeadLogic from "./GeneralHeadLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { ensureChild, ensureTransform, styleGameButton } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

@ccclass('RightArmyItemLogic')
export default class RightArmyItemLogic extends Component {
    @property(Label)
    labelInfo: Label = null;
    @property(Label)
    labelPos: Label = null;
    @property(Node)
    bottomNode: Node = null;
    @property(Sprite)
    headIcon: Sprite = null;
    @property(Label)
    labelSoldierCnt: Label = null;
    @property(Label)
    labelStrength: Label = null;
    @property(Label)
    labelMorale: Label = null;
    @property(Node)
    btnBack: Node = null;
    @property(Node)
    btnSetting: Node = null;

    public order: number = 0;
    protected _data: ArmyData = null;
    protected _firstGeneral: GeneralData = null;
    protected _qryReturnTime: number = 0;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateGeneral, this.onUpdateGeneral, this);
        const rootTransform = this.node.getComponent(UITransform);
        const bottomTransform = this.bottomNode.getComponent(UITransform);
        if (rootTransform && bottomTransform) {
            rootTransform.height -= bottomTransform.height;
        }
        this.bottomNode.active = false;
        this.applyModernLayout();
    }

    protected onEnable(): void {
        this.applyModernLayout();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._data = null;
    }

    private styleLabel(label: Label, x: number, y: number, width: number, size: number, color: Color): void {
        if (!label) {
            return;
        }
        label.node.setPosition(x, y, 0);
        ensureTransform(label.node, width, 26);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = size;
        label.lineHeight = size + 5;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = color;
        label.node.setSiblingIndex(this.node.children.length - 1);
    }

    private styleAction(node: Node, text: string, variant: 'secondary' | 'jade'): void {
        if (!node) {
            return;
        }
        const button = node.getComponent(Button) || node.addComponent(Button);
        styleGameButton(node, text, variant, 126, 38);
        for (const label of node.getComponentsInChildren(Label)) {
            if (label.node.name !== '__GameLabel') {
                label.node.active = false;
            }
        }
        const modern = node.getChildByName('__GameLabel');
        if (modern) {
            modern.active = true;
            modern.setSiblingIndex(node.children.length - 1);
        }
        button.interactable = true;
    }

    private applyModernLayout(): void {
        const width = 304;
        const collapsedHeight = 104;
        const expandedHeight = this.bottomNode && this.bottomNode.active ? 176 : collapsedHeight;
        ensureTransform(this.node, width, expandedHeight);

        const surface = ensureChild(this.node, '__ArmySelectorSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, expandedHeight);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(20, 17, 14, 246);
        graphics.roundRect(-width / 2, -expandedHeight / 2, width, expandedHeight, 11);
        graphics.fill();
        graphics.fillColor = new Color(66, 45, 27, 64);
        graphics.roundRect(-width / 2 + 6, -expandedHeight / 2 + 6, width - 12, expandedHeight - 12, 8);
        graphics.fill();
        graphics.strokeColor = new Color(153, 106, 52, 220);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -expandedHeight / 2, width, expandedHeight, 11);
        graphics.stroke();

        if (this.headIcon) {
            this.headIcon.node.setPosition(-112, this.bottomNode && this.bottomNode.active ? 34 : 0, 0);
            ensureTransform(this.headIcon.node, 54, 54);
            this.headIcon.node.setSiblingIndex(this.node.children.length - 1);
        }

        const yShift = this.bottomNode && this.bottomNode.active ? 34 : 0;
        this.styleLabel(this.labelInfo, -74, 24 + yShift, 176, 15, GameTheme.colors.gold300);
        this.styleLabel(this.labelPos, -74, -4 + yShift, 176, 13, GameTheme.colors.muted);
        this.styleLabel(this.labelSoldierCnt, -74, -31 + yShift, 112, 12, GameTheme.colors.ivory);
        this.styleLabel(this.labelStrength, 46, -31 + yShift, 122, 12, GameTheme.colors.ivory);
        if (this.labelMorale) {
            this.labelMorale.node.active = false;
        }

        if (this.bottomNode) {
            this.bottomNode.setPosition(0, -57, 0);
            ensureTransform(this.bottomNode, 286, 56);
            const panel = ensureChild(this.bottomNode, '__ArmyActionSurface');
            panel.setSiblingIndex(0);
            panel.setPosition(0, 0, 0);
            ensureTransform(panel, 286, 56);
            const pg = panel.getComponent(Graphics) || panel.addComponent(Graphics);
            pg.clear();
            pg.fillColor = new Color(15, 13, 11, 238);
            pg.roundRect(-143, -28, 286, 56, 8);
            pg.fill();
            pg.strokeColor = new Color(117, 83, 45, 180);
            pg.lineWidth = 1;
            pg.roundRect(-143, -28, 286, 56, 8);
            pg.stroke();

            if (this.btnSetting) {
                this.btnSetting.setPosition(-71, 0, 0);
                this.styleAction(this.btnSetting, 'ĐỘI HÌNH', 'jade');
            }
            if (this.btnBack) {
                this.btnBack.setPosition(71, 0, 0);
                this.styleAction(this.btnBack, 'RÚT QUÂN', 'secondary');
            }
        }
    }

    protected update(): void {
        if (this._data && (this._data.state > 0 || this._data.cmd == ArmyCmd.Reclaim)) {
            let nowTime: number = DateUtil.getServerTime();
            let time: number = 0;
            if (this._data.state > 0) {
                time = Math.max(0, this._data.endTime - nowTime);
            } else {
                time = Math.max(0, GeneralCommand.getInstance().proxy.getCommonCfg().reclamation_time * 1000 - (nowTime - this._data.endTime));
            }
            this.labelPos.string = "Còn " + DateUtil.converSecondStr(time);
        }
    }

    protected onUpdateGeneral(): void {
        if (this._data) {
            this.updateItem();
        }
    }

    protected onClickTop(): void {
        AudioManager.instance.playClick();
        this.bottomNode.active = !this.bottomNode.active;
        this.applyModernLayout();
    }

    protected onClickBack(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            let cityData: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            ArmyCommand.getInstance().generalAssignArmy(this._data.id, ArmyCmd.Return, cityData.x, cityData.y, null);
        }
    }

    protected onClickSetting(): void {
        AudioManager.instance.playClick();
        if (this._data) {
            EventMgr.emit(LogicEvent.openArmySetting, this._data.cityId, this.order);
        }
    }

    protected updateGeneralByData(): void {
        let stateStr: string = ArmyCommand.getInstance().getArmyStateDes(this._data);
        var teamName = "";
        if (this._firstGeneral) {
            let cfg: GeneralConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(this._firstGeneral.cfgId);
            teamName = cfg.name;
            this.headIcon.getComponent(GeneralHeadLogic).setHeadId(this._firstGeneral.cfgId);
            this.labelStrength.string = "Thể lực " + this._firstGeneral.physical_power + "/" + cfg.physical_power_limit;
        }
        this.labelInfo.string = "Đội " + this.order + " · " + stateStr + (teamName ? " · " + teamName : "");
    }

    protected updateItem(): void {
        if (this._data && this._data.generals[0] != 0) {
            this.node.active = true;
            this._firstGeneral = GeneralCommand.getInstance().proxy.getMyGeneral(this._data.generals[0]);
            this.updateGeneralByData();
            this.labelPos.string = "Tọa độ " + this._data.x + ", " + this._data.y;
            this.labelSoldierCnt.string = "Binh lực " + (this._data.soldiers[0] + this._data.soldiers[1] + this._data.soldiers[2]);

            if (this._data.cmd == ArmyCmd.Idle) {
                this.btnSetting.active = true;
                let cityData: MapCityData = MapCommand.getInstance().cityProxy.getMyCityById(this._data.cityId);
                this.btnBack.active = !(cityData && cityData.x == this._data.fromX && cityData.y == this._data.fromY);
            } else if (this._data.cmd == ArmyCmd.Conscript){
                this.btnSetting.active = false;
                this.btnBack.active = false;
            } else if (this._data.state == 0 && this._data.cmd != ArmyCmd.Reclaim) {
                this.btnSetting.active = false;
                this.btnBack.active = true;
            } else {
                this.btnSetting.active = false;
                this.btnBack.active = false;
            }
            this.applyModernLayout();
        } else {
            this._firstGeneral = null;
            this.node.active = false;
        }
    }

    public setArmyData(data: ArmyData): void {
        this._data = data;
        this.updateItem();
    }
}
