import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Node,
    ScrollView,
    UITransform,
    instantiate,
} from 'cc';
const { ccclass, property } = _decorator;

import UnionCommand from "./UnionCommand";
import { Member, Union } from "./UnionProxy";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import UnionMemberItemOpLogic from "./UnionMemberItemOpLogic";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import ListLogic from '../utils/ListLogic';
import { createGameText, ensureChild, ensureTransform, styleGameButton } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button).find((button) => handlerOf(button) === handler) || null;
}

function styleButtonNode(node: Node, text: string, variant: 'primary' | 'secondary' | 'jade' | 'danger', width: number): void {
    const button = node.getComponent(Button) || node.addComponent(Button);
    styleGameButton(node, text, variant, width, 48);
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

@ccclass('UnionMemberLogic')
export default class UnionMemberLogic extends Component {

    @property(ScrollView)
    memberView:ScrollView = null;

    @property(Node)
    disMissButton: Node = null;

    @property(Node)
    exitButton: Node = null;

    @property(Node)
    opNode: Node = null;

    protected _op: Node = null;

    protected onLoad():void{
        this.applyLayout();
        EventMgr.on(LogicEvent.updateUnionMember,this.updateMember,this);
        EventMgr.on(LogicEvent.kickUnionSuccess,this.getMember,this);
        EventMgr.on(LogicEvent.unionAppoint,this.getMember,this);
        EventMgr.on(LogicEvent.unionAbdicate,this.getMember,this);
        EventMgr.on(LogicEvent.clickUnionMemberItem,this.onClickItem,this);
    }

    private applyLayout(): void {
        const heading = ensureChild(this.node, '__UnionMemberHeading');
        heading.setPosition(0, 230, 0);
        ensureTransform(heading, 1040, 54);
        const graphics = heading.getComponent(Graphics) || heading.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(28, 23, 18, 236);
        graphics.roundRect(-520, -27, 1040, 54, 9);
        graphics.fill();
        graphics.strokeColor = new Color(139, 96, 48, 195);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-520, -27, 1040, 54, 9);
        graphics.stroke();

        const title = createGameText(heading, '__UnionMemberTitle', 'THÀNH VIÊN LIÊN MINH', 20, GameTheme.colors.gold300, 360, 40, true);
        title.node.setPosition(-310, 0, 0);

        this.memberView.node.setPosition(0, -28, 0);
        ensureTransform(this.memberView.node, 1040, 440);
        const view = this.memberView.node.getChildByName('view');
        if (view) {
            ensureTransform(view, 1040, 440);
        }
        if (this.memberView.content) {
            const transform = this.memberView.content.getComponent(UITransform) || this.memberView.content.addComponent(UITransform);
            transform.width = 1040;
        }
        const list = this.memberView.node.getComponent(ListLogic) as any;
        if (list) {
            list.columnCount = 1;
            list.autoColumnCount = false;
            list.isHorizontal = false;
            list.spaceRow = 9;
        }

        if (this.disMissButton) {
            this.disMissButton.setPosition(392, -274, 0);
            styleButtonNode(this.disMissButton, 'GIẢI TÁN', 'danger', 190);
        }
        if (this.exitButton) {
            this.exitButton.setPosition(392, -274, 0);
            styleButtonNode(this.exitButton, 'RỜI LIÊN MINH', 'danger', 190);
        }

        const back = findButton(this.node, 'back');
        if (back) {
            back.node.setPosition(-460, -274, 0);
            styleButtonNode(back.node, 'QUAY LẠI', 'secondary', 160);
        }
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected click():void{
        AudioManager.instance.playClick();
        if(this._op != null){
            this._op.active = false;
        }
    }

    protected onClickItem(menberData):void{
        AudioManager.instance.playClick();
        if (this._op == null){
            var node = instantiate(this.opNode);
            node.parent = this.node;
            this._op = node;
        }
        this._op.active = true;
        this._op.getComponent(UnionMemberItemOpLogic).setData(menberData);
    }

    protected updateMember(data:any[]){
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);

        var comp = this.memberView.node.getComponent(ListLogic);
        var list:Member[] = UnionCommand.getInstance().proxy.getMemberList(unionData.id).concat();
        comp.setData(list);
        this.updateBtn();
    }

    protected updateBtn(){
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if(unionData.getChairman().rid == city.rid){
            this.exitButton.active = false;
            this.disMissButton.active = true;
        }else{
            this.exitButton.active = true;
            this.disMissButton.active = false;
        }
    }

    protected getMember():void{
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        UnionCommand.getInstance().unionMember(unionData.id);
    }

    protected onEnable():void{
        this.applyLayout();
        this.updateBtn();
        this.getMember();
    }

    protected dismiss():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionDismiss();
    }

    protected exit():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionExit();
    }
}
