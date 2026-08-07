import { _decorator, Color, Component, Graphics, ScrollView, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import UnionCommand from "./UnionCommand";
import { Union } from "./UnionProxy";
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import { LogicEvent } from '../common/LogicEvent';
import { createGameText, ensureChild, ensureTransform } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionLobbyLogic')
export default class UnionLobbyLogic extends Component {
    @property(ScrollView)
    scrollView:ScrollView | null = null;

    protected onLoad():void{
        EventMgr.on(LogicEvent.updateUnionList,this.updateUnion,this);
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    private applyLayout(): void {
        const heading = ensureChild(this.node, '__UnionLobbyHeading');
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
            '__UnionLobbyTitle',
            'DANH SÁCH LIÊN MINH',
            20,
            GameTheme.colors.gold300,
            360,
            40,
            true,
        );
        title.node.setPosition(-320, 0, 0);

        if (this.scrollView) {
            this.scrollView.node.setPosition(0, -34, 0);
            ensureTransform(this.scrollView.node, 1040, 455);
            const view = this.scrollView.node.getChildByName('view');
            if (view) {
                ensureTransform(view, 1040, 455);
            }
            if (this.scrollView.content) {
                const transform = this.scrollView.content.getComponent(UITransform) || this.scrollView.content.addComponent(UITransform);
                transform.width = 1040;
            }
            const list = this.scrollView.node.getComponent(ListLogic) as any;
            if (list) {
                list.columnCount = 1;
                list.autoColumnCount = false;
                list.isHorizontal = false;
                list.spaceRow = 10;
            }
        }
    }

    protected updateUnion(data:any[]){
        var comp = this.scrollView.node.getComponent(ListLogic);
        var list:Union[] = UnionCommand.getInstance().proxy.getUnionList();
        comp.setData(list);
    }

    protected onEnable():void{
        this.applyLayout();
        UnionCommand.getInstance().unionList();
    }
}
