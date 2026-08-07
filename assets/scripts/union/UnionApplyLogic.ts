import { _decorator, Color, Component, Graphics, ScrollView, UITransform } from 'cc';
const {ccclass, property} = _decorator;

import UnionCommand from "./UnionCommand";
import { Union } from "./UnionProxy";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import { LogicEvent } from '../common/LogicEvent';
import { createGameText, ensureChild, ensureTransform } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionApplyLogic')
export default class UnionApplyLogic extends Component {
    @property(ScrollView)
    applyView:ScrollView | null = null;

    protected onLoad():void{
        EventMgr.on(LogicEvent.updateUnionApply,this.updateApply,this);
        EventMgr.on(LogicEvent.verifyUnionSuccess,this.getApply,this);
    }

    private applyLayout(): void {
        const heading = ensureChild(this.node, '__UnionApplyHeading');
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

        const title = createGameText(
            heading,
            '__UnionApplyTitle',
            'ĐƠN XIN GIA NHẬP',
            20,
            GameTheme.colors.gold300,
            360,
            40,
            true,
        );
        title.node.setPosition(-320, 0, 0);

        const hint = createGameText(
            heading,
            '__UnionApplyHint',
            'Chỉ Minh chủ và Phó minh chủ được xét duyệt',
            14,
            GameTheme.colors.muted,
            430,
            34,
        );
        hint.node.setPosition(245, 0, 0);

        if (!this.applyView) {
            return;
        }
        this.applyView.node.setPosition(0, -32, 0);
        ensureTransform(this.applyView.node, 1040, 455);
        const view = this.applyView.node.getChildByName('view');
        if (view) {
            ensureTransform(view, 1040, 455);
        }
        if (this.applyView.content) {
            const transform = this.applyView.content.getComponent(UITransform) || this.applyView.content.addComponent(UITransform);
            transform.width = 1040;
        }
        const list = this.applyView.node.getComponent(ListLogic) as any;
        if (list) {
            list.columnCount = 1;
            list.autoColumnCount = false;
            list.isHorizontal = false;
            list.spaceRow = 10;
        }
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected updateApply(data:any[]){
        var comp = this.applyView.node.getComponent(ListLogic);
        comp.setData(data?data:[]);
    }

    protected getApply():void{
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if(unionData && unionData.isMajor(city.rid)){
            UnionCommand.getInstance().unionApplyList(unionData.id);
        }
    }

    protected onEnable():void{
        this.applyLayout();
        this.getApply();
    }
}
