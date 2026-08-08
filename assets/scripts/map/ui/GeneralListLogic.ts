import { _decorator, Component, Label, ScrollView, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    ensureUiTransform,
    findButtonByHandler,
    localizeNode,
    styleAncientButton,
} from '../../i18n/I18n';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import MapUICommand from './MapUICommand';

@ccclass('GeneralListLogic')
export default class GeneralListLogic extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Label)
    cntLab: Label = null;

    private _cunGeneral: number[] = [];
    private _type = 0;
    private _position = 0;

    protected onEnable(): void {
        this.applyModernRoster();
        EventMgr.on(LogicEvent.updateMyGenerals, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.generalConvert, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.chosedGeneral, this.onClickClose, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private applyModernRoster(): void {
        localizeNode(this.node);
        applyAncientScreenChrome(this.node, 'Tướng');

        const list = this.scrollView.node.getComponent(ListLogic) as any;
        if (list) {
            list.scale = 0.55;
            list.columnCount = 5;
            list.autoColumnCount = false;
            list.isHorizontal = false;
            list.spaceColumn = 12;
            list.spaceRow = 14;
            const prefab = list.itemPrefab;
            if (prefab?.data) {
                const transform = prefab.data.getComponent(UITransform);
                if (transform) {
                    list._itemWidth = transform.width * 0.55;
                    list._itemHeight = transform.height * 0.55;
                }
            }
        }

        this.scrollView.horizontal = false;
        this.scrollView.vertical = true;
        this.scrollView.node.setPosition(0, -18, 0);
        ensureUiTransform(this.scrollView.node, 1110, 510);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 1110, 510);
        }
        if (this.scrollView.content) {
            ensureUiTransform(this.scrollView.content, 1110, 510);
        }

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
        }

        const convert = findButtonByHandler(this.node, 'onClickConvert');
        if (convert) {
            convert.node.setPosition(330, -319, 0);
            styleAncientButton(convert.node, 'Chuyển đổi', 'jade', 180, 48);
        }

        const roster = findButtonByHandler(this.node, 'onTuJianConvert');
        if (roster) {
            roster.node.setPosition(510, -319, 0);
            styleAncientButton(roster.node, 'Đồ giám', 'gold', 150, 48);
        }

        if (this.cntLab) {
            this.cntLab.useSystemFont = true;
            this.cntLab.fontFamily = 'Arial';
            this.cntLab.fontSize = 19;
            this.cntLab.lineHeight = 24;
            this.cntLab.enableWrapText = false;
            this.cntLab.overflow = Label.Overflow.SHRINK;
            this.cntLab.color = ANCIENT_UI.gold;
            this.cntLab.node.setPosition(-430, -319, 0);
            ensureUiTransform(this.cntLab.node, 180, 34);
        }

        for (const label of this.node.getComponentsInChildren(Label)) {
            if (label !== this.cntLab && (label.string === 'Tướng' || label.string === 'Võ tướng')) {
                label.node.active = false;
            }
        }
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    protected onClickConvert(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openGeneralConvert);
        this.node.active = false;
    }

    protected onTuJianConvert(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openGeneralRoster);
        this.node.active = false;
    }

    protected initGeneralCfg(): void {
        const basic = MapUICommand.getInstance().proxy.getBasicGeneral();
        const cnt = GeneralCommand.getInstance().proxy.getMyActiveGeneralCnt();
        this.cntLab.string = `Tướng sở hữu: ${cnt}/${basic.limit}`;

        const list: any[] = GeneralCommand.getInstance().proxy.getUseGenerals();
        const listTemp = list.concat();

        listTemp.forEach((item) => {
            item.type = this._type;
            item.position = this._position;
        });

        for (let i = 0; i < listTemp.length; i += 1) {
            if (this._cunGeneral.indexOf(listTemp[i].id) >= 0) {
                listTemp.splice(i, 1);
                i -= 1;
            }
        }

        const comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(listTemp);
    }

    public setData(data: number[], type: number = 0, position: number = 0): void {
        this._cunGeneral = [];
        if (data && data.length > 0) {
            this._cunGeneral = data;
        }
        this._type = type;
        this._position = position;
        this.initGeneralCfg();
        GeneralCommand.getInstance().qryMyGenerals();
    }
}
