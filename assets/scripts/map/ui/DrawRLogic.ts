import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Layout,
    Node,
    Prefab,
    Sprite,
    Vec3,
    instantiate,
} from 'cc';
const { ccclass, property } = _decorator;

import GeneralItemLogic, { GeneralItemType } from "./GeneralItemLogic";
import { AudioManager } from '../../common/AudioManager';
import {
    createGameText,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

@ccclass('DrawRLogic')
export default class DrawRLogic extends Component {

    @property(Prefab)
    generalItemPrefab: Prefab = null;

    @property(Layout)
    tenLayout:Layout = null;

    @property(Layout)
    oneLayout:Layout = null;

    private _maxSize:number = 10;
    private _scale:number = 0.42;

    protected onLoad():void{
        this.applyModernShell();

        for(var i = 0; i < this._maxSize;i++){
            let _generalNode = instantiate(this.generalItemPrefab);
            _generalNode.parent = this.tenLayout.node;
            _generalNode.scale = new Vec3(this._scale, this._scale, this._scale);
            _generalNode.active = false;
        }

        let _generalNode = instantiate(this.generalItemPrefab);
        _generalNode.parent = this.oneLayout.node;
        _generalNode.scale = new Vec3(0.62, 0.62, 0.62);
        _generalNode.active = false;
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
        const surface = ensureChild(this.node, '__DrawResultSurface');
        surface.setSiblingIndex(Math.min(1, this.node.children.length - 1));
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(8, 8, 7, 242);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.fillColor = new Color(61, 41, 23, 74);
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 8);
        graphics.fill();
        graphics.strokeColor = new Color(189, 135, 65, 238);
        graphics.lineWidth = 2.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();

        const title = createGameText(
            this.node,
            '__DrawResultTitle',
            'KẾT QUẢ CHIÊU MỘ',
            38,
            GameTheme.colors.gold300,
            520,
            56,
            true,
        );
        title.node.setPosition(0, 286, 0);
        title.node.setSiblingIndex(this.node.children.length - 1);

        const subtitle = createGameText(
            this.node,
            '__DrawResultSubtitle',
            'Tướng vừa được chiêu mộ',
            15,
            GameTheme.colors.muted,
            360,
            30,
        );
        subtitle.node.setPosition(0, 247, 0);
        subtitle.node.setSiblingIndex(this.node.children.length - 1);

        this.tenLayout.node.setPosition(0, -32, 0);
        this.oneLayout.node.setPosition(0, -30, 0);
        ensureTransform(this.tenLayout.node, 1030, 480);
        ensureTransform(this.oneLayout.node, 640, 490);

        this.tenLayout.type = Layout.Type.GRID;
        this.tenLayout.spacingX = 12;
        this.tenLayout.spacingY = 12;
        this.tenLayout.paddingLeft = 12;
        this.tenLayout.paddingRight = 12;
        this.tenLayout.paddingTop = 12;
        this.tenLayout.paddingBottom = 12;

        const close = this.node.getComponentsInChildren(Button)
            .find((button) => handlerOf(button) === 'onClickClose');
        if (close) {
            close.node.setPosition(-548, 286, 0);
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

    public setData(data:any):void{
        this.applyModernShell();
        this.tenLayout.node.active = this.oneLayout.node.active = false;
        if(data.length == 1){
            this.oneLayout.node.active = true;
            var children = this.oneLayout.node.children;
            let com = children[0].getComponent(GeneralItemLogic);
            children[0].active = true;
            if(com){
                com.setData(data[0],GeneralItemType.GeneralNoThing);
            }
        }else{
            this.tenLayout.node.active = true;
            var children = this.tenLayout.node.children;
            for(var i = 0; i < this._maxSize;i++){
                var child = children[i];
                if(data[i]){
                    child.active = true;
                    let com = child.getComponent(GeneralItemLogic);
                    if(com){
                        com.setData(data[i],GeneralItemType.GeneralNoThing);
                    }
                }
                else{
                    child.active = false;
                }
            }
            this.tenLayout.updateLayout();
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }
}
