import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Prefab,
    ScrollView,
    Sprite,
    Toggle,
    UITransform,
    VerticalTextAlignment,
    instantiate,
} from 'cc';
const { ccclass, property } = _decorator;

import { ArmyData } from "../../general/ArmyProxy";
import ArmyCommand from "../../general/ArmyCommand";
import MapCommand from "../MapCommand";
import RightArmyItemLogic from "./RightArmyItemLogic";
import { MapCityData } from "../MapCityProxy";
import RightCityItemLogic from "./RightCityItemLogic";
import RightTagItemLogic from "./RightTagItemLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { createGameText, ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

const TAB_LABELS = ['QUÂN ĐỘI', 'THÀNH TRÌ', 'DẤU MAP'];

@ccclass('RightInfoNodeLogic')
export default class RightInfoNodeLogic extends Component {
    @property([Toggle])
    toggles: Toggle[] = [];
    @property(ScrollView)
    armyScrollView: ScrollView = null;
    @property(ScrollView)
    cityScrollView: ScrollView = null;
    @property(ScrollView)
    tagsScrollView: ScrollView = null;

    @property(Prefab)
    armyItemPrefabs: Prefab = null;
    @property(Prefab)
    cityItemPrefabs: Prefab = null;
    @property(Prefab)
    tagItemPrefabs: Prefab = null;

    protected _armys: Node[] = [];

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateArmyList, this.onUpdateArmyList, this);
        EventMgr.on(LogicEvent.updateArmy, this.onUpdateArmy, this);
        EventMgr.on(LogicEvent.updateTag, this.onUpdateTag, this);

        this.armyScrollView.node.active = true;
        this.cityScrollView.node.active = false;
        this.tagsScrollView.node.active = false;
        this.applyModernLayout();
        this.initArmys();
        this.initCitys();
        this.initTags();
    }

    protected onEnable(): void {
        this.applyModernLayout();
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
        this._armys.length = 0;
        this._armys = null;
    }

    private activeTabIndex(): number {
        const index = this.toggles.findIndex((toggle) => toggle && toggle.isChecked);
        return index >= 0 ? index : 0;
    }

    private applyModernLayout(): void {
        const width = 356;
        const height = 574;
        ensureTransform(this.node, width, height);

        const surface = ensureChild(this.node, '__RightSelectorSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(10, 9, 8, 220);
        graphics.roundRect(-width / 2, -height / 2, width, height, 16);
        graphics.fill();
        graphics.fillColor = new Color(35, 28, 21, 238);
        graphics.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 12);
        graphics.fill();
        graphics.strokeColor = new Color(183, 130, 63, 235);
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -height / 2, width, height, 16);
        graphics.stroke();
        graphics.strokeColor = new Color(244, 211, 143, 80);
        graphics.lineWidth = 1;
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 10);
        graphics.stroke();

        const heading = createGameText(
            this.node,
            '__RightSelectorHeading',
            'QUẢN LÝ LÃNH ĐỊA',
            22,
            GameTheme.colors.gold300,
            310,
            42,
            true,
        );
        heading.node.setPosition(0, 247, 0);
        heading.node.setSiblingIndex(this.node.children.length - 1);

        const active = this.activeTabIndex();
        for (let index = 0; index < this.toggles.length; index++) {
            const toggle = this.toggles[index];
            if (!toggle) {
                continue;
            }
            const node = toggle.node;
            node.setPosition(-112 + index * 112, 202, 0);
            ensureTransform(node, 104, 42);
            for (const sprite of node.getComponentsInChildren(Sprite)) {
                sprite.enabled = false;
            }

            const tabSurface = ensureChild(node, '__RightTabSurface');
            tabSurface.setSiblingIndex(0);
            tabSurface.setPosition(0, 0, 0);
            ensureTransform(tabSurface, 104, 42);
            const tg = tabSurface.getComponent(Graphics) || tabSurface.addComponent(Graphics);
            tg.clear();
            const selected = index === active;
            tg.fillColor = selected
                ? new Color(30, 93, 78, 248)
                : new Color(25, 22, 19, 245);
            tg.roundRect(-52, -21, 104, 42, 8);
            tg.fill();
            tg.strokeColor = selected
                ? new Color(107, 190, 154, 245)
                : new Color(134, 94, 49, 210);
            tg.lineWidth = selected ? 2 : 1.5;
            tg.roundRect(-52, -21, 104, 42, 8);
            tg.stroke();

            for (const label of node.getComponentsInChildren(Label)) {
                if (label.node.name !== '__RightTabLabel') {
                    label.node.active = false;
                }
            }
            const tabLabel = createGameText(
                node,
                '__RightTabLabel',
                TAB_LABELS[index] || `MỤC ${index + 1}`,
                13,
                selected ? GameTheme.colors.ivory : GameTheme.colors.gold300,
                94,
                32,
            );
            tabLabel.node.active = true;
            tabLabel.node.setPosition(0, 0, 0);
            tabLabel.node.setSiblingIndex(node.children.length - 1);
        }

        this.styleScrollView(this.armyScrollView);
        this.styleScrollView(this.cityScrollView);
        this.styleScrollView(this.tagsScrollView);

        const section = createGameText(
            this.node,
            '__RightSelectorSection',
            active === 0 ? 'ĐỘI QUÂN ĐANG QUẢN LÝ' : active === 1 ? 'THÀNH TRÌ CỦA TA' : 'TỌA ĐỘ ĐÃ ĐÁNH DẤU',
            14,
            GameTheme.colors.muted,
            300,
            30,
        );
        section.horizontalAlign = HorizontalTextAlignment.LEFT;
        section.verticalAlign = VerticalTextAlignment.CENTER;
        section.node.setPosition(-5, 165, 0);
        section.node.setSiblingIndex(this.node.children.length - 1);
    }

    private styleScrollView(scrollView: ScrollView): void {
        if (!scrollView) {
            return;
        }
        scrollView.node.setPosition(0, -45, 0);
        ensureTransform(scrollView.node, 324, 382);
        const view = scrollView.node.getChildByName('view') || scrollView.node.getChildByName('View');
        if (view) {
            ensureTransform(view, 324, 382);
        }
        if (scrollView.content) {
            const transform = scrollView.content.getComponent(UITransform) || scrollView.content.addComponent(UITransform);
            transform.width = 316;
        }
    }

    protected initArmys(): void {
        let cityId: number = MapCommand.getInstance().cityProxy.getMyMainCity().cityId;
        let datas: ArmyData[] = ArmyCommand.getInstance().proxy.getArmyList(cityId);
        this.armyScrollView.content.removeAllChildren();
        if (datas) {
            this._armys.length = datas.length;
            for (let i: number = 0; i < datas.length; i++) {
                let item: Node = instantiate(this.armyItemPrefabs);
                item.parent = this.armyScrollView.content;
                this._armys[i] = item;
                item.getComponent(RightArmyItemLogic).order = i + 1;
                item.getComponent(RightArmyItemLogic).setArmyData(datas[i]);
            }
        }
    }

    protected initCitys():void {
        let citys: MapCityData[] = MapCommand.getInstance().cityProxy.getMyCitys();
        this.cityScrollView.content.removeAllChildren();
        if (citys && citys.length > 0) {
            for (let i: number = 0; i < citys.length; i++) {
                let item: Node = instantiate(this.cityItemPrefabs);
                item.parent = this.cityScrollView.content;
                item.getComponent(RightCityItemLogic).setArmyData(citys[i]);
            }
        }
    }

    protected initTags(): void {
        let tags = MapCommand.getInstance().proxy.getPosTags();
        this.tagsScrollView.content.removeAllChildren();
        for (let i: number = 0; i < tags.length; i++) {
            var tag = tags[i];
            let item: Node = instantiate(this.tagItemPrefabs);
            item.parent = this.tagsScrollView.content;
            item.getComponent(RightTagItemLogic).setData(tag);
        }
    }

    protected onUpdateArmyList(datas: ArmyData[]): void {
        this.initArmys();
    }

    protected onUpdateArmy(data: ArmyData): void {
        if (MapCommand.getInstance().cityProxy.getMyMainCity().cityId == data.cityId) {
            const item = this._armys[data.order - 1];
            if (item) {
                item.getComponent(RightArmyItemLogic).setArmyData(data);
            }
        }
    }

    protected onUpdateTag():void {
        this.initTags();
    }

    onClockToggle(toggle: Toggle): void {
        AudioManager.instance.playClick();
        let index: number = this.toggles.indexOf(toggle);
        if (index == 1) {
            this.armyScrollView.node.active = false;
            this.cityScrollView.node.active = true;
            this.tagsScrollView.node.active = false;
            this.initCitys();
        } else if(index == 0){
            this.armyScrollView.node.active = true;
            this.cityScrollView.node.active = false;
            this.tagsScrollView.node.active = false;
            this.initArmys();
        }else{
            this.armyScrollView.node.active = false;
            this.cityScrollView.node.active = false;
            this.tagsScrollView.node.active = true;
            this.initTags();
        }
        this.applyModernLayout();
    }
}
