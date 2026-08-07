import {
    _decorator,
    Button,
    Color,
    Component,
    EditBox,
    Graphics,
    Label,
    Node,
} from 'cc';
const { ccclass, property } = _decorator;

import UnionCommand from "./UnionCommand";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { createName } from '../libs/NameDict';
import { LogicEvent } from '../common/LogicEvent';
import { localizeNode } from '../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
    styleGameInput,
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

@ccclass('UnionCreateLogic')
export default class UnionCreateLogic extends Component {
    @property(EditBox)
    editName: EditBox | null = null;

    protected onLoad():void{
        localizeNode(this.node);
        this.applyLayout();
        EventMgr.on(LogicEvent.createUnionSuccess, this.onUnCreateOk,this)
        this.editName.string = this.getRandomName();
    }

    protected onEnable(): void {
        this.applyLayout();
    }

    private applyLayout(): void {
        const card = ensureChild(this.node, '__UnionCreateCard');
        card.setPosition(0, 0, 0);
        drawGamePanel(card, 700, 430, 16);

        const title = createGameText(
            card,
            '__UnionCreateTitle',
            'TẠO LIÊN MINH',
            34,
            GameTheme.colors.gold300,
            420,
            54,
            true,
        );
        title.node.setPosition(0, 154, 0);

        const hint = createGameText(
            card,
            '__UnionCreateHint',
            'Đặt tên cho liên minh của bạn',
            16,
            GameTheme.colors.muted,
            420,
            34,
        );
        hint.node.setPosition(0, 112, 0);

        if (this.editName) {
            this.editName.node.setParent(card);
            this.editName.node.setPosition(0, 42, 0);
            styleGameInput(this.editName, 'Tên liên minh', 'none', 500, 62);
        }

        const random = findButton(this.node, 'onRandomName');
        if (random) {
            random.node.setParent(card);
            random.node.setPosition(0, -29, 0);
            styleRealButton(random, 'ĐỔI TÊN NGẪU NHIÊN', 'secondary', 270, 46);
        }

        const create = findButton(this.node, 'onCreate');
        if (create) {
            create.node.setParent(card);
            create.node.setPosition(0, -112, 0);
            styleRealButton(create, 'TẠO LIÊN MINH', 'primary', 300, 58);
        }

        const close = findButton(this.node, 'onClickClose');
        if (close) {
            close.node.setParent(card);
            close.node.setPosition(-304, 166, 0);
            styleRealButton(close, '←', 'secondary', 68, 48);
        }
    }

    protected onCreate() {
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionCreate(this.editName.string);
    }

    protected onRandomName():void{
        AudioManager.instance.playClick();
        this.editName.string = this.getRandomName();
    }

    protected getRandomName():string{
        let name = createName("boy");
        return name
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected onUnCreateOk(){
        this.node.active = false;
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }
}
