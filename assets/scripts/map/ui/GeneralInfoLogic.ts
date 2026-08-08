import { _decorator, Component, Label, Node, Prefab, ToggleContainer, instantiate } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    drawAncientPanel,
    findButtonByHandler,
    localizeNode,
    styleAncientButton,
    suppressLegacyChrome,
} from '../../common/AudioManager';
import { EventMgr } from '../../utils/EventMgr';
const { ccclass, property } = _decorator;

@ccclass('GeneralInfoLogic')
export default class GeneralInfoLogic extends Component {
    @property(Prefab)
    generalDesPrefab: Prefab = null;
    @property(Prefab)
    generalComposePrefab: Prefab = null;
    @property(Prefab)
    generalAddPrefab: Prefab = null;
    @property(ToggleContainer)
    generalToggleContainer: ToggleContainer = null;

    private _currData: any = null;
    private _cfgData: any = null;
    private _curIndex = 0;
    private _nodeList: Node[] = [];

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateOneGenerals, this.updateOnce, this);
        const des = instantiate(this.generalDesPrefab);
        des.parent = this.node;
        des.active = false;
        const comp = instantiate(this.generalComposePrefab);
        comp.parent = this.node;
        comp.active = false;
        const add = instantiate(this.generalAddPrefab);
        add.parent = this.node;
        add.active = false;
        this._nodeList[0] = des;
        this._nodeList[1] = comp;
        this._nodeList[2] = add;
        this.applyModernGeneralInfo();
    }

    private applyModernGeneralInfo(): void {
        localizeNode(this.node);
        applyAncientScreenChrome(this.node, 'Chi tiết tướng');
        suppressLegacyChrome(this.node, 3);
        for (const toggle of this.generalToggleContainer.toggleItems) {
            suppressLegacyChrome(toggle.node, 1);
            drawAncientPanel(toggle.node, 170, 44, 6, ANCIENT_UI.panelSoft);
            const label = toggle.node.getComponentInChildren(Label);
            if (label) {
                label.useSystemFont = true;
                label.fontFamily = 'Arial';
                label.fontSize = 16;
                label.color = ANCIENT_UI.goldSoft;
            }
        }
        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateOnce(curData: any): void {
        this.setData(this._cfgData, curData);
    }

    protected onDestroy(): void {
        this._nodeList = [];
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    public setData(cfgData: any, curData: any): void {
        this._currData = curData;
        this._cfgData = cfgData;
        this.setIndex(this._curIndex);
    }

    protected setIndex(index: number = 0): void {
        this._curIndex = index;
        this.allVisible();
        this._nodeList[index].active = true;
        this.generalToggleContainer.toggleItems[index].isChecked = true;
        const logicNameArr: string[] = ['GeneralDesLogic', 'GeneralComposeLogic', 'GeneralAddPrLogic'];
        const comp: any = this._nodeList[index].getComponent(logicNameArr[index]);
        if (comp) {
            comp.setData(this._cfgData, this._currData);
        }
    }

    protected allVisible(): void {
        for (let i = 0; i < this._nodeList.length; i += 1) {
            this._nodeList[i].active = false;
        }
    }

    protected selectHandle(event: any, other: any): void {
        AudioManager.instance.playClick();
        this.setIndex(other);
    }
}
