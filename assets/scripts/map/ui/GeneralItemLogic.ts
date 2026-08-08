import { _decorator, Color, Component, Label, Layout, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralCampType, GeneralData } from '../../general/GeneralProxy';
import { EventMgr } from '../../utils/EventMgr';
import GeneralHeadLogic from './GeneralHeadLogic';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


export class GeneralItemType {
    static GeneralInfo = 0;
    static GeneralDispose = 1;
    static GeneralConScript = 2;
    static GeneralNoThing = 3;
    static GeneralSelect = 4;
}

@ccclass('GeneralItemLogic')
export default class GeneralItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    lvLabel: Label = null;
    @property(Sprite)
    spritePic: Sprite = null;
    @property(Label)
    costLabel: Label = null;
    @property(Label)
    campLabel: Label = null;
    @property(Label)
    armLabel: Label = null;
    @property(Layout)
    starLayout: Layout = null;
    @property(Node)
    delNode: Node = null;
    @property(Node)
    useNode: Node = null;
    @property(Node)
    selectNode: Node = null;

    private _curData: any = null;
    private _type = -1;
    private _position = 0;
    private _cityData: any = null;
    private _orderId = 1;
    private _isSelect = false;

    protected onLoad(): void {
        this.delNode.active = false;
        this._isSelect = false;
        this.applyModernCard();
    }

    private applyModernCard(): void {
        ui().localizeNode(this.node);
        ui().suppressLegacyChrome(this.node, 1);
        ui().drawAncientPanel(this.node, 342, 466, 8, new Color(22, 18, 15, 246));

        if (this.spritePic) {
            this.spritePic.enabled = true;
            this.spritePic.node.setSiblingIndex(this.node.children.length - 2);
        }

        const labels = [this.nameLabel, this.lvLabel, this.costLabel, this.campLabel, this.armLabel];
        for (const label of labels) {
            if (!label) {
                continue;
            }
            label.node.active = true;
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.enableWrapText = false;
            label.overflow = Label.Overflow.SHRINK;
            label.color = ui().ANCIENT_UI.text;
        }

        if (this.nameLabel) {
            this.nameLabel.fontFamily = 'Times New Roman';
            this.nameLabel.fontSize = 25;
            this.nameLabel.lineHeight = 30;
            this.nameLabel.color = ui().ANCIENT_UI.gold;
        }
        if (this.lvLabel) {
            this.lvLabel.fontSize = 17;
            this.lvLabel.lineHeight = 22;
            this.lvLabel.color = ui().ANCIENT_UI.text;
        }
        if (this.campLabel) {
            this.campLabel.fontSize = 16;
            this.campLabel.color = ui().ANCIENT_UI.goldSoft;
        }
        if (this.armLabel) {
            this.armLabel.fontSize = 17;
            this.armLabel.color = ui().ANCIENT_UI.text;
        }
        if (this.costLabel) {
            this.costLabel.fontSize = 16;
            this.costLabel.color = ui().ANCIENT_UI.muted;
        }
    }

    public setData(curData: GeneralData, type: number = 0, position: number = 0): void {
        this.updateItem(curData);
    }

    public updateItem(curData: any): void {
        this.updateView(curData);
        this._type = this._curData.type == undefined ? -1 : this._curData.type;
        this._position = this._curData.position == undefined ? 0 : this._curData.position;
    }

    protected updateView(curData: any): void {
        this._curData = curData;
        const cfgData = GeneralCommand.getInstance().proxy.getGeneralCfg(this._curData.cfgId);
        this.nameLabel.string = cfgData.name;
        this.lvLabel.string = `Lv.${this._curData.level}`;
        this.spritePic.getComponent(GeneralHeadLogic).setHeadId(this._curData.cfgId);
        this.showStar(cfgData.star, this._curData.star_lv);
        this.delNode.active = false;

        if (cfgData.camp == GeneralCampType.Han) {
            this.campLabel.string = 'Hán';
        } else if (cfgData.camp == GeneralCampType.Qun) {
            this.campLabel.string = 'Quần Hùng';
        } else if (cfgData.camp == GeneralCampType.Wei) {
            this.campLabel.string = 'Ngụy';
        } else if (cfgData.camp == GeneralCampType.Shu) {
            this.campLabel.string = 'Thục';
        } else if (cfgData.camp == GeneralCampType.Wu) {
            this.campLabel.string = 'Ngô';
        }

        this.armLabel.string = this.armstr(cfgData.arms);
        if (this.useNode) {
            this.useNode.active = this._type == GeneralItemType.GeneralInfo && this._curData.order > 0;
        }
        if (this.costLabel) {
            this.costLabel.string = `${cfgData.cost}`;
        }
        this.select(false);
    }

    protected armstr(arms: number[]): string {
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            return 'Bộ';
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            return 'Cung';
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            return 'Kỵ';
        }
        return '';
    }

    public select(flag: boolean): void {
        if (this.selectNode) {
            this.selectNode.active = flag;
        }
        this._isSelect = flag;
    }

    protected showStar(star: number = 3, star_lv: number = 0): void {
        const children = this.starLayout.node.children;
        for (let i = 0; i < children.length; i += 1) {
            if (i < star) {
                children[i].active = true;
                const sprite = children[i].getComponent(Sprite);
                if (sprite) {
                    sprite.color = i < star_lv
                        ? new Color(203, 74, 55, 255)
                        : ui().ANCIENT_UI.gold;
                }
            } else {
                children[i].active = false;
            }
        }
    }

    protected setOtherData(cityData: any, orderId: number = 1): void {
        this._cityData = cityData;
        this._orderId = orderId;
        this.delNode.active = true;
    }

    protected onClickGeneral(event: any): void {
        AudioManager.instance.playClick();
        if (!this._curData) {
            return;
        }
        const cfgData = this._curData.config;
        if (this._type == GeneralItemType.GeneralInfo) {
            EventMgr.emit(LogicEvent.openGeneralDes, cfgData, this._curData);
        } else if (this._type == GeneralItemType.GeneralDispose) {
            EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, this._position);
        } else if (this._type == GeneralItemType.GeneralConScript) {
            EventMgr.emit(LogicEvent.openArmyConscript, this._orderId, this._cityData);
        } else if (this._type == GeneralItemType.GeneralSelect) {
            this._isSelect = !this._isSelect;
            this.select(this._isSelect);
            EventMgr.emit(LogicEvent.openGeneralSelect, cfgData, this._curData, this.node);
        }
    }

    protected onDelete(): void {
        const cfgData = this._curData.config;
        EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, -1);
    }

    public setWarReportData(curData: any): void {
        this.updateView(curData);
    }
}
