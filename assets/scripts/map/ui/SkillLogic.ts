import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Node,
    ScrollView,
    Sprite,
    UITransform,
} from 'cc';
const { ccclass, property } = _decorator;

import { GeneralData } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import ListLogic from '../../utils/ListLogic';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
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

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => handlerOf(button) === handler) || null;
}

function styleRealButton(button: Button, text: string): void {
    styleGameButton(button.node, text, 'secondary', 72, 52);
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

function applySkillLayout(root: Node, scrollView: ScrollView): void {
    const panel = root.getChildByName('New Node');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 1180, 650, 10);
    }

    const header = ensureChild(root, '__SkillHeader');
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
        '__SkillTitle',
        'KỸ NĂNG',
        40,
        GameTheme.colors.gold300,
        420,
        58,
        true,
    );
    title.node.setPosition(0, 0, 0);

    const subtitle = createGameText(
        root,
        '__SkillSubtitle',
        'Chọn kỹ năng để xem chi tiết',
        16,
        GameTheme.colors.muted,
        420,
        32,
    );
    subtitle.node.setPosition(0, 260, 0);

    scrollView.node.setPosition(0, -26, 0);
    ensureTransform(scrollView.node, 1080, 500);
    const view = scrollView.node.getChildByName('view');
    if (view) {
        ensureTransform(view, 1080, 500);
    }
    if (scrollView.content) {
        const transform = scrollView.content.getComponent(UITransform) || scrollView.content.addComponent(UITransform);
        transform.width = 1080;
    }

    const list = scrollView.node.getComponent(ListLogic) as any;
    if (list) {
        list.isHorizontal = false;
        list.autoColumnCount = true;
        list.spaceColumn = 18;
        list.spaceRow = 18;
    }

    const close = findButton(root, 'onClickClose');
    if (close) {
        close.node.setParent(root);
        close.node.active = true;
        close.node.setPosition(-574, 318, 0);
        styleRealButton(close, '←');
    }
}

@ccclass('SkillLogic')
export default class SkillLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    _general: GeneralData = null;
    _type: number = 0;
    _skillPos: number = -1;

    protected onEnable(): void {
        localizeNode(this.node);
        applySkillLayout(this.node, this.scrollView);
        EventMgr.on(LogicEvent.skillListInfo, this.onSkillList, this);
        SkillCommand.getInstance().qrySkillList();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected onSkillList() {
        var skills = SkillCommand.getInstance().proxy.skills;
        var skillConfs = SkillCommand.getInstance().proxy.skillConfs;

        var arr = [];
        for (let i = 0; i < skillConfs.length; i++) {
            var found = false;
            let cfg = skillConfs[i];

            let dSkill = new Skill();
            dSkill.cfgId = cfg.cfgId;
            dSkill.generals = [];

            for (let j = 0; j < skills.length; j++) {
                var skill = skills[j];
                if (skill.cfgId == cfg.cfgId) {
                    found = true;
                    arr.push(skill);
                    break;
                }
            }
            if (found == false) {
                arr.push(dSkill);
            }
        }

        var comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(arr);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickItem(data: Skill, target): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openSkillInfo, data, this._type, this._general, this._skillPos);
    }

    /** type: 0 hiển thị, 1 học, 2 xem từ tướng. */
    public setData(type: number, general: GeneralData, skillPos: number) {
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;
    }
}
