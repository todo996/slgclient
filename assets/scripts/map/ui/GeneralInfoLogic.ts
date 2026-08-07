import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Node,
    Prefab,
    Sprite,
    Toggle,
    ToggleContainer,
    instantiate,
} from 'cc';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { EventMgr } from '../../utils/EventMgr';
const { ccclass, property } = _decorator;
import {
    createGameText,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

const GENERAL_TABS = ['THÔNG TIN', 'TĂNG SAO', 'CỘNG ĐIỂM'];

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

@ccclass('GeneralInfoLogic')
export default class GeneralInfoLogic  extends Component {

    @property(Prefab)
    generalDesPrefab: Prefab = null;

    @property(Prefab)
    generalComposePrefab: Prefab = null;

    @property(Prefab)
    generalAddPrefab: Prefab = null;

    @property(ToggleContainer)
    generalToggleContainer: ToggleContainer = null;

    private _currData:any = null;
    private _cfgData:any = null;
    private _curIndex:number = 0;
    private _nodeList:Node[] = [];

    protected onLoad():void{
        EventMgr.on(LogicEvent.updateOneGenerals, this.updateOnce, this);

        var des = instantiate(this.generalDesPrefab);
        des.parent = this.node;
        des.active = false;

        var comp = instantiate(this.generalComposePrefab);
        comp.parent = this.node;
        comp.active = false;

        var addd = instantiate(this.generalAddPrefab);
        addd.parent = this.node;
        addd.active = false;

        this._nodeList[0] = des;
        this._nodeList[1] = comp;
        this._nodeList[2] = addd;
        this.applyModernShell();
    }

    protected onEnable(): void {
        this.applyModernShell();
    }

    private applyModernShell(): void {
        const panel = this.node.getChildByName('New Node');
        if (panel) {
            for (const sprite of panel.getComponents(Sprite)) {
                sprite.enabled = false;
            }
        }

        const width = 1180;
        const height = 650;
        const surface = ensureChild(this.node, '__GeneralInfoSurface');
        surface.setSiblingIndex(Math.min(1, this.node.children.length - 1));
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(8, 8, 7, 242);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.fillColor = new Color(56, 38, 23, 64);
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 8);
        graphics.fill();
        graphics.strokeColor = new Color(183, 130, 63, 235);
        graphics.lineWidth = 2.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();

        const title = createGameText(
            this.node,
            '__GeneralInfoTitle',
            'CHI TIẾT TƯỚNG',
            36,
            GameTheme.colors.gold300,
            460,
            54,
            true,
        );
        title.node.setPosition(0, 288, 0);
        title.node.setSiblingIndex(this.node.children.length - 1);

        const toggles = this.generalToggleContainer ? this.generalToggleContainer.toggleItems : [];
        for (let index = 0; index < toggles.length; index++) {
            const toggle = toggles[index] as Toggle;
            if (!toggle) {
                continue;
            }
            const node = toggle.node;
            node.setPosition(-230 + index * 230, 238, 0);
            ensureTransform(node, 210, 44);
            for (const sprite of node.getComponentsInChildren(Sprite)) {
                sprite.enabled = false;
            }

            const tabSurface = ensureChild(node, '__GeneralTabSurface');
            tabSurface.setSiblingIndex(0);
            tabSurface.setPosition(0, 0, 0);
            ensureTransform(tabSurface, 210, 44);
            const tg = tabSurface.getComponent(Graphics) || tabSurface.addComponent(Graphics);
            tg.clear();
            const selected = index === this._curIndex;
            tg.fillColor = selected ? new Color(29, 91, 77, 248) : new Color(27, 23, 19, 245);
            tg.roundRect(-105, -22, 210, 44, 8);
            tg.fill();
            tg.strokeColor = selected ? new Color(102, 184, 149, 240) : new Color(136, 96, 49, 205);
            tg.lineWidth = selected ? 2 : 1.5;
            tg.roundRect(-105, -22, 210, 44, 8);
            tg.stroke();

            for (const label of node.getComponentsInChildren(Label)) {
                if (label.node.name !== '__GeneralTabLabel') {
                    label.node.active = false;
                }
            }
            const tabLabel = createGameText(
                node,
                '__GeneralTabLabel',
                GENERAL_TABS[index] || `MỤC ${index + 1}`,
                15,
                selected ? GameTheme.colors.ivory : GameTheme.colors.gold300,
                190,
                34,
            );
            tabLabel.node.active = true;
            tabLabel.node.setPosition(0, 0, 0);
            tabLabel.node.setSiblingIndex(node.children.length - 1);
            node.setSiblingIndex(this.node.children.length - 1);
        }

        const close = this.node.getComponentsInChildren(Button)
            .find((button) => handlerOf(button) === 'onClickClose');
        if (close) {
            close.node.setPosition(-548, 288, 0);
            styleGameButton(close.node, '←', 'secondary', 72, 50);
            for (const label of close.node.getComponentsInChildren(Label)) {
                if (label.node.name !== '__GameLabel') {
                    label.node.active = false;
                }
            }
            const modern = close.node.getChildByName('__GameLabel');
            if (modern) {
                modern.active = true;
                modern.setSiblingIndex(close.node.children.length - 1);
            }
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateOnce(curData:any):void{
        this.setData(this._cfgData,curData)
    }

    protected onDestroy():void{
        this._nodeList = []
        EventMgr.targetOff(this);
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    public setData(cfgData:any,curData:any):void{
        this._currData = curData;
        this._cfgData = cfgData;
        this.setIndex(this._curIndex);
    }

    protected setIndex(index:number = 0):void{
        this._curIndex = index;
        this.allVisible();
        this._nodeList[index].active = true;
        this.generalToggleContainer.toggleItems[index].isChecked = true;
        this.applyModernShell();

        let logicNameArr:string[] = ["GeneralDesLogic","GeneralComposeLogic","GeneralAddPrLogic"]
        let com = this._nodeList[index].getComponent(logicNameArr[index]);
        if(com){
            com.setData(this._cfgData, this._currData);
        }
    }

    protected allVisible():void{
        for(var i = 0; i < this._nodeList.length; i++){
            this._nodeList[i].active = false;
        }
    }

    protected selectHandle(event:any,other:any):void{
        AudioManager.instance.playClick();
        this.setIndex(Number(other));
    }
}
