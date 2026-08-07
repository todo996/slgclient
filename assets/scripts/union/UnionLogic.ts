import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Node,
    Sprite,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import { EventMgr } from '../utils/EventMgr';
import { localizeNode } from '../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../ui/components/GameSurface';
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
    return root.getComponentsInChildren(Button)
        .find((button) => handlerOf(button) === handler) || null;
}

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number = 50,
): void {
    styleGameButton(button.node, text, variant, width, height);
    for (const label of button.node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
    const modern = button.node.getChildByName('__GameLabel');
    if (modern) {
        modern.active = true;
        modern.setSiblingIndex(button.node.children.length - 1);
    }
}

@ccclass('UnionLogic')
export default class UnionLogic extends Component {
    @property(Node)
    createNode: Node | null = null;
    @property(Node)
    mainNode: Node | null = null;
    @property(Node)
    lobbyNode: Node | null = null;
    @property(Node)
    memberNode: Node | null = null;
    @property(Node)
    applyNode: Node | null = null;
    @property(Node)
    logNode: Node | null = null;
    @property(Label)
    nameLab: Label | null = null;

    protected onLoad(): void {
        localizeNode(this.node);
        this.applyShellLayout();
        this.visibleView();
        EventMgr.on(LogicEvent.openMyUnion, this.openMyUnion, this);
        EventMgr.on(LogicEvent.dismissUnionSuccess, this.onDismiss, this);
        EventMgr.on(LogicEvent.closeUnion, this.closeUnion, this);
        EventMgr.on(LogicEvent.createUnionSuccess, this.openMyUnion, this);
    }

    private applyShellLayout(): void {
        const panel = this.node.getChildByName('New Node') || this.node.children.find((child) => child.name !== 'mask');
        if (panel) {
            for (const sprite of panel.getComponents(Sprite)) {
                sprite.enabled = false;
            }
            drawGamePanel(panel, 1180, 650, 10);
        }

        const header = ensureChild(this.node, '__UnionHeader');
        header.setPosition(0, 318, 0);
        ensureTransform(header, 1130, 76);
        const graphics = header.getComponent(Graphics) || header.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(12, 10, 9, 238);
        graphics.rect(-565, -38, 1130, 76);
        graphics.fill();
        graphics.strokeColor = new Color(176, 124, 59, 225);
        graphics.lineWidth = 2;
        graphics.moveTo(-565, -36);
        graphics.lineTo(565, -36);
        graphics.stroke();

        const title = createGameText(
            header,
            '__UnionTitle',
            'LIÊN MINH',
            40,
            GameTheme.colors.gold300,
            420,
            58,
            true,
        );
        title.node.setPosition(0, 0, 0);

        const close = findButton(this.node, 'onClickClose');
        if (close) {
            close.node.setParent(this.node);
            close.node.active = true;
            close.node.setPosition(-574, 318, 0);
            styleRealButton(close, '←', 'secondary', 72, 52);
        }

        const specs: Array<[string, string, 'primary' | 'secondary' | 'jade' | 'danger', number]> = [
            ['onClickMember', 'THÀNH VIÊN', 'secondary', 190],
            ['onClickApply', 'ĐƠN XIN', 'secondary', 170],
            ['onClickLog', 'NHẬT KÝ', 'secondary', 160],
            ['openCreate', 'TẠO LIÊN MINH', 'primary', 220],
            ['back', 'QUAY LẠI', 'secondary', 150],
        ];
        for (const [handler, text, variant, width] of specs) {
            const button = findButton(this.node, handler);
            if (button) {
                styleRealButton(button, text, variant, width);
            }
        }
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
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
        this.memberNode.active =
        this.logNode.active = false;
    }

    protected closeUnion() {
        this.node.active = false;
    }

    protected openMyUnion(): void {
        this.visibleView();
        this.mainNode.active = true;
    }

    protected onEnable(): void {
        localizeNode(this.node);
        this.applyShellLayout();
        let city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
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
