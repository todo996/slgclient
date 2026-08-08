import { _decorator, Component, Label, Node } from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    drawAncientPanel,
    findButtonByHandler,
    styleAncientButton,
    suppressLegacyChrome,
} from '../common/AudioManager';
const { ccclass, property } = _decorator;

import MapCommand from '../map/MapCommand';
import { MapCityData } from '../map/MapCityProxy';
import { EventMgr } from '../utils/EventMgr';

@ccclass('UnionLogic')
export default class UnionLogic extends Component {
    @property(Node)
    createNode: Node = null;
    @property(Node)
    mainNode: Node = null;
    @property(Node)
    lobbyNode: Node = null;
    @property(Node)
    memberNode: Node = null;
    @property(Node)
    applyNode: Node = null;
    @property(Node)
    logNode: Node = null;
    @property(Label)
    nameLab: Label = null;

    protected onLoad(): void {
        this.applyModernUnion();
        this.visibleView();
        EventMgr.on(LogicEvent.openMyUnion, this.openMyUnion, this);
        EventMgr.on(LogicEvent.dismissUnionSuccess, this.onDismiss, this);
        EventMgr.on(LogicEvent.closeUnion, this.closeUnion, this);
        EventMgr.on(LogicEvent.createUnionSuccess, this.openMyUnion, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    private applyModernUnion(): void {
        applyAncientScreenChrome(this.node, 'Liên minh');
        for (const panel of [this.createNode, this.mainNode, this.lobbyNode, this.memberNode, this.applyNode, this.logNode]) {
            if (!panel) {
                continue;
            }
            suppressLegacyChrome(panel, 2);
        }

        if (this.nameLab) {
            this.nameLab.useSystemFont = true;
            this.nameLab.fontFamily = 'Times New Roman';
            this.nameLab.color = ANCIENT_UI.gold;
            this.nameLab.fontSize = 27;
        }

        const controls: Array<[string, string, 'gold' | 'dark' | 'jade' | 'red', number]> = [
            ['onClickClose', '←', 'dark', 72],
            ['openCreate', 'Tạo liên minh', 'jade', 190],
            ['onClickMember', 'Thành viên', 'dark', 170],
            ['onClickApply', 'Đơn gia nhập', 'dark', 170],
            ['onClickLog', 'Nhật ký', 'dark', 150],
            ['back', 'Quay lại', 'dark', 140],
        ];
        for (const [handler, text, variant, width] of controls) {
            const button = findButtonByHandler(this.node, handler);
            if (!button) {
                continue;
            }
            styleAncientButton(button.node, text, variant, width, handler === 'onClickClose' ? 52 : 48);
            if (handler === 'onClickClose') {
                button.node.setPosition(-574, 320, 0);
                button.node.setSiblingIndex(this.node.children.length - 1);
            }
        }
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.closeUnion();
    }

    protected onClickMember(): void {
        AudioManager.instance.playClick();
        this.memberNode.active = true;
        this.mainNode.active = false;
    }

    protected onClickApply(): void {
        AudioManager.instance.playClick();
        this.mainNode.active = false;
        this.applyNode.active = true;
    }

    protected onClickLog(): void {
        AudioManager.instance.playClick();
        this.mainNode.active = false;
        this.logNode.active = true;
    }

    protected openCreate(): void {
        AudioManager.instance.playClick();
        this.createNode.active = true;
    }

    protected visibleView(): void {
        this.memberNode.active =
            this.createNode.active =
            this.lobbyNode.active =
            this.applyNode.active =
            this.logNode.active = false;
    }

    protected closeUnion(): void {
        this.node.active = false;
    }

    protected openMyUnion(): void {
        this.visibleView();
        this.mainNode.active = true;
    }

    protected onEnable(): void {
        this.applyModernUnion();
        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (city.unionId > 0) {
            this.openMyUnion();
        } else {
            this.mainNode.active = false;
            this.lobbyNode.active = true;
        }
    }

    protected onDisable(): void {
        this.visibleView();
    }

    protected back(): void {
        AudioManager.instance.playClick();
        this.openMyUnion();
    }

    protected onDismiss(): void {
        this.visibleView();
        this.lobbyNode.active = true;
    }
}
