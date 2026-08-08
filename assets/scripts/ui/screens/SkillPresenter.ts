import {
    Button,
    Color,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    ScrollView,
    Sprite,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import {
    createGameText,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../components/GameSurface';
import { GameTheme } from '../theme/GameTheme';

function visit(root: Node, callback: (node: Node) => void): void {
    callback(root);
    for (const child of root.children) {
        visit(child, callback);
    }
}

function component(node: Node, name: string): any {
    return node.getComponent(name) as any;
}

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

function disableDirectSprites(node: Node | null): void {
    if (!node) {
        return;
    }
    for (const sprite of node.getComponents(Sprite)) {
        sprite.enabled = false;
    }
}

function drawPanel(node: Node, width: number, height: number, radius: number = 12): void {
    ensureTransform(node, width, height);
    const graphics = node.getComponent(Graphics) || node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(8, 8, 7, 242);
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    graphics.fillColor = new Color(57, 39, 23, 64);
    graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, Math.max(6, radius - 4));
    graphics.fill();
    graphics.strokeColor = new Color(183, 130, 63, 235);
    graphics.lineWidth = 2.5;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.stroke();
    graphics.strokeColor = new Color(244, 211, 143, 80);
    graphics.lineWidth = 1;
    graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, Math.max(5, radius - 5));
    graphics.stroke();
}

function drawHeader(root: Node, name: string, titleText: string, width: number): Node {
    const header = ensureChild(root, name);
    header.setPosition(0, 288, 0);
    ensureTransform(header, width, 74);
    const graphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(12, 10, 9, 240);
    graphics.rect(-width / 2, -37, width, 74);
    graphics.fill();
    graphics.strokeColor = new Color(176, 124, 59, 225);
    graphics.lineWidth = 2;
    graphics.moveTo(-width / 2, -35);
    graphics.lineTo(width / 2, -35);
    graphics.stroke();

    const title = createGameText(
        header,
        `${name}Title`,
        titleText,
        36,
        GameTheme.colors.gold300,
        520,
        54,
        true,
    );
    title.node.setPosition(0, 0, 0);
    header.setSiblingIndex(root.children.length - 1);
    return header;
}

function styleActionButton(
    button: Button | null,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number,
): void {
    if (!button) {
        return;
    }
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

function styleSkillList(node: Node, logic: any): void {
    const panel = node.getChildByName('New Node');
    disableDirectSprites(panel);

    const surface = ensureChild(node, '__SkillRuntimeSurface');
    surface.setSiblingIndex(Math.min(1, node.children.length - 1));
    surface.setPosition(0, 0, 0);
    drawPanel(surface, 1180, 650, 12);

    drawHeader(node, '__SkillRuntimeHeader', 'KỸ NĂNG', 1130);

    const subtitle = createGameText(
        node,
        '__SkillRuntimeSubtitle',
        'Chọn kỹ năng để xem chi tiết',
        16,
        GameTheme.colors.muted,
        430,
        32,
    );
    subtitle.node.setPosition(0, 238, 0);
    subtitle.node.setSiblingIndex(node.children.length - 1);

    const scrollView = logic.scrollView as ScrollView;
    if (scrollView) {
        scrollView.node.setPosition(0, -34, 0);
        ensureTransform(scrollView.node, 1080, 500);
        const view = scrollView.node.getChildByName('view') || scrollView.node.getChildByName('View');
        if (view) {
            ensureTransform(view, 1080, 500);
        }
        if (scrollView.content) {
            const transform = scrollView.content.getComponent(UITransform) || scrollView.content.addComponent(UITransform);
            transform.width = 1080;
        }
        const list = scrollView.node.getComponent('ListLogic') as any;
        if (list) {
            list.isHorizontal = false;
            list.autoColumnCount = true;
            list.spaceColumn = 18;
            list.spaceRow = 18;
        }
        scrollView.node.setSiblingIndex(node.children.length - 1);
    }

    const close = findButton(node, 'onClickClose');
    if (close) {
        close.node.setPosition(-548, 288, 0);
        styleActionButton(close, '←', 'secondary', 72, 50);
        close.node.setSiblingIndex(node.children.length - 1);
    }
}

function styleSkillItem(node: Node, logic: any): void {
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    const width = Math.max(210, transform.width || 210);
    const height = Math.max(150, transform.height || 150);

    const surface = ensureChild(node, '__SkillRuntimeCard');
    surface.setSiblingIndex(0);
    surface.setPosition(0, 0, 0);
    ensureTransform(surface, width, height);
    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(18, 15, 12, 244);
    graphics.roundRect(-width / 2, -height / 2, width, height, 12);
    graphics.fill();
    graphics.fillColor = new Color(72, 49, 27, 76);
    graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 8);
    graphics.fill();
    graphics.strokeColor = new Color(176, 124, 59, 225);
    graphics.lineWidth = 2;
    graphics.roundRect(-width / 2, -height / 2, width, height, 12);
    graphics.stroke();

    if (logic.icon) {
        logic.icon.setPosition(-width * 0.28, 7, 0);
        logic.icon.setSiblingIndex(node.children.length - 1);
    }

    if (logic.nameLab) {
        const label = logic.nameLab as Label;
        ensureTransform(label.node, width * 0.56, 58);
        label.node.setPosition(width * 0.16, 20, 0);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.titleFont;
        label.fontSize = 19;
        label.lineHeight = 24;
        label.enableWrapText = true;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = GameTheme.colors.gold300;
        label.node.setSiblingIndex(node.children.length - 1);
    }

    if (logic.limitLab) {
        const label = logic.limitLab as Label;
        ensureTransform(label.node, width * 0.56, 34);
        label.node.setPosition(width * 0.16, -37, 0);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = 15;
        label.lineHeight = 20;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = GameTheme.colors.muted;
        label.node.setSiblingIndex(node.children.length - 1);
    }
}

function styleInfoValue(label: Label | null, x: number, y: number, width: number): void {
    if (!label) {
        return;
    }
    label.node.setPosition(x, y, 0);
    ensureTransform(label.node, width, 38);
    label.useSystemFont = true;
    label.fontFamily = GameTheme.typography.bodyFont;
    label.fontSize = 17;
    label.lineHeight = 23;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.LEFT;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = GameTheme.colors.ivory;
}

function styleSkillInfo(node: Node, logic: any): void {
    const legacyPanel = node.getChildByName('New Node') || node.children.find((child) => child.name !== 'mask');
    disableDirectSprites(legacyPanel || null);

    const surface = ensureChild(node, '__SkillInfoRuntimeSurface');
    surface.setSiblingIndex(Math.min(1, node.children.length - 1));
    surface.setPosition(0, 0, 0);
    drawPanel(surface, 980, 640, 14);

    const header = drawHeader(node, '__SkillInfoRuntimeHeader', '', 930);
    header.setPosition(0, 302, 0);

    if (logic.nameLab) {
        const nameLab = logic.nameLab as Label;
        nameLab.node.setParent(header);
        nameLab.node.setPosition(36, 0, 0);
        ensureTransform(nameLab.node, 560, 54);
        nameLab.useSystemFont = true;
        nameLab.fontFamily = GameTheme.typography.titleFont;
        nameLab.fontSize = 32;
        nameLab.lineHeight = 40;
        nameLab.enableWrapText = false;
        nameLab.overflow = Label.Overflow.SHRINK;
        nameLab.horizontalAlign = HorizontalTextAlignment.CENTER;
        nameLab.verticalAlign = VerticalTextAlignment.CENTER;
        nameLab.color = GameTheme.colors.gold300;
        nameLab.node.setSiblingIndex(header.children.length - 1);
    }

    if (logic.icon) {
        logic.icon.setPosition(-350, 151, 0);
        logic.icon.setSiblingIndex(node.children.length - 1);
    }

    const stats = ensureChild(node, '__SkillInfoRuntimeStats');
    stats.setPosition(91, 151, 0);
    ensureTransform(stats, 590, 170);
    const sg = stats.getComponent(Graphics) || stats.addComponent(Graphics);
    sg.clear();
    sg.fillColor = new Color(27, 22, 18, 240);
    sg.roundRect(-295, -85, 590, 170, 12);
    sg.fill();
    sg.strokeColor = new Color(146, 101, 49, 210);
    sg.lineWidth = 1.5;
    sg.roundRect(-295, -85, 590, 170, 12);
    sg.stroke();

    const captions = [
        ['__TriggerCaption', 'Kích hoạt', -255, 50],
        ['__RateCaption', 'Tỷ lệ', 35, 50],
        ['__TargetCaption', 'Mục tiêu', -255, -22],
        ['__ArmCaption', 'Binh chủng', 35, -22],
    ] as const;
    for (const [name, text, x, y] of captions) {
        const label = createGameText(stats, name, text, 14, GameTheme.colors.muted, 105, 28);
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.node.setPosition(x, y, 0);
    }

    for (const label of [logic.triggerLab, logic.rateLab, logic.targetLab, logic.armLab]) {
        if (label) {
            label.node.setParent(stats);
        }
    }
    styleInfoValue(logic.triggerLab || null, -130, 50, 160);
    styleInfoValue(logic.rateLab || null, 155, 50, 120);
    styleInfoValue(logic.targetLab || null, -130, -22, 160);
    styleInfoValue(logic.armLab || null, 155, -22, 120);

    if (logic.lvLab) {
        const lvLab = logic.lvLab as Label;
        lvLab.node.setPosition(-350, 76, 0);
        ensureTransform(lvLab.node, 180, 36);
        lvLab.useSystemFont = true;
        lvLab.fontFamily = GameTheme.typography.bodyFont;
        lvLab.fontSize = 17;
        lvLab.lineHeight = 23;
        lvLab.color = GameTheme.colors.gold300;
        lvLab.node.setSiblingIndex(node.children.length - 1);
    }

    const description = ensureChild(node, '__SkillInfoRuntimeDescriptions');
    description.setPosition(0, -72, 0);
    ensureTransform(description, 850, 240);
    const dg = description.getComponent(Graphics) || description.addComponent(Graphics);
    dg.clear();
    dg.fillColor = new Color(22, 18, 15, 238);
    dg.roundRect(-425, -120, 850, 240, 12);
    dg.fill();
    dg.strokeColor = new Color(133, 93, 47, 195);
    dg.lineWidth = 1.5;
    dg.roundRect(-425, -120, 850, 240, 12);
    dg.stroke();

    const currentCaption = createGameText(
        description,
        '__CurrentCaption',
        'Hiệu quả hiện tại',
        15,
        GameTheme.colors.gold300,
        190,
        30,
    );
    currentCaption.horizontalAlign = HorizontalTextAlignment.LEFT;
    currentCaption.node.setPosition(-310, 88, 0);

    const nextCaption = createGameText(
        description,
        '__NextCaption',
        'Cấp tiếp theo',
        15,
        GameTheme.colors.gold300,
        190,
        30,
    );
    nextCaption.horizontalAlign = HorizontalTextAlignment.LEFT;
    nextCaption.node.setPosition(-310, -18, 0);

    const descriptionLabels: Array<[Label | null, number]> = [
        [logic.curDesLab || null, 45],
        [logic.nextDesLab || null, -61],
    ];
    for (const [label, y] of descriptionLabels) {
        if (!label) {
            continue;
        }
        label.node.setParent(description);
        label.node.setPosition(0, y, 0);
        ensureTransform(label.node, 770, 72);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = 16;
        label.lineHeight = 22;
        label.enableWrapText = true;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = GameTheme.colors.ivory;
        label.node.setSiblingIndex(description.children.length - 1);
    }

    const learnBtn = logic.learnBtn as Button;
    const lvBtn = logic.lvBtn as Button;
    const giveUpBtn = logic.giveUpBtn as Button;
    if (learnBtn) {
        learnBtn.node.setParent(node);
        learnBtn.node.setPosition(0, -260, 0);
        styleActionButton(learnBtn, 'HỌC KỸ NĂNG', 'primary', 260, 54);
        learnBtn.node.setSiblingIndex(node.children.length - 1);
    }
    if (lvBtn) {
        lvBtn.node.setParent(node);
        lvBtn.node.setPosition(-145, -260, 0);
        styleActionButton(lvBtn, 'NÂNG CẤP', 'jade', 240, 54);
        lvBtn.node.setSiblingIndex(node.children.length - 1);
    }
    if (giveUpBtn) {
        giveUpBtn.node.setParent(node);
        giveUpBtn.node.setPosition(145, -260, 0);
        styleActionButton(giveUpBtn, 'QUÊN KỸ NĂNG', 'danger', 240, 54);
        giveUpBtn.node.setSiblingIndex(node.children.length - 1);
    }

    const close = findButton(node, 'onClickClose');
    if (close) {
        close.node.setPosition(-474, 302, 0);
        styleActionButton(close, '←', 'secondary', 72, 50);
        close.node.setSiblingIndex(node.children.length - 1);
    }
}

/**
 * Presenter không serialize: chỉ thay presentation của UI Kỹ năng.
 * Command Học/Nâng cấp/Quên vẫn nằm trong các component gameplay gốc.
 */
export function styleSkillTree(root: Node): void {
    visit(root, (node) => {
        const skill = component(node, 'SkillLogic');
        if (skill) {
            styleSkillList(node, skill);
        }
        const item = component(node, 'SkillItemLogic');
        if (item) {
            styleSkillItem(node, item);
        }
        const info = component(node, 'SkillInfoLogic');
        if (info) {
            styleSkillInfo(node, info);
        }
    });
}
