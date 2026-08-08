import {
    Button,
    Color,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    ScrollView,
    Sprite,
    Toggle,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import { createGameText, ensureChild, ensureTransform, styleGameButton } from '../components/GameSurface';
import { GameTheme } from '../theme/GameTheme';

const TAB_LABELS = ['QUÂN ĐỘI', 'THÀNH TRÌ', 'DẤU MAP'];

function visit(root: Node, callback: (node: Node) => void): void {
    callback(root);
    for (const child of root.children) {
        visit(child, callback);
    }
}

function component(node: Node, name: string): any {
    return node.getComponent(name) as any;
}

function styleLabel(
    label: Label,
    x: number,
    y: number,
    width: number,
    height: number,
    size: number,
    color: Color,
): void {
    if (!label) {
        return;
    }
    label.node.setPosition(x, y, 0);
    ensureTransform(label.node, width, height);
    label.useSystemFont = true;
    label.fontFamily = GameTheme.typography.bodyFont;
    label.fontSize = size;
    label.lineHeight = size + 6;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.LEFT;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = color;
    label.node.setSiblingIndex(label.node.parent.children.length - 1);
}

function styleScrollView(scrollView: ScrollView): void {
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

function drawCard(node: Node, name: string, width: number, height: number): Graphics {
    const surface = ensureChild(node, name);
    surface.setSiblingIndex(0);
    surface.setPosition(0, 0, 0);
    ensureTransform(surface, width, height);
    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(20, 17, 14, 244);
    graphics.roundRect(-width / 2, -height / 2, width, height, 10);
    graphics.fill();
    graphics.fillColor = new Color(70, 48, 27, 62);
    graphics.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 7);
    graphics.fill();
    graphics.strokeColor = new Color(151, 104, 51, 210);
    graphics.lineWidth = 1.5;
    graphics.roundRect(-width / 2, -height / 2, width, height, 10);
    graphics.stroke();
    return graphics;
}

function styleRightPanel(node: Node, logic: any): void {
    if (node.getChildByName('__RightSelectorSurface')) {
        // Refresh active tab colors/text only below.
    }
    const width = 356;
    const height = 574;
    ensureTransform(node, width, height);

    const surface = ensureChild(node, '__RightSelectorSurface');
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
        node,
        '__RightSelectorHeading',
        'QUẢN LÝ LÃNH ĐỊA',
        22,
        GameTheme.colors.gold300,
        310,
        42,
        true,
    );
    heading.node.setPosition(0, 247, 0);
    heading.node.setSiblingIndex(node.children.length - 1);

    const toggles: Toggle[] = logic.toggles || [];
    let active = toggles.findIndex((toggle) => toggle && toggle.isChecked);
    if (active < 0) {
        active = 0;
    }

    for (let index = 0; index < toggles.length; index += 1) {
        const toggle = toggles[index];
        if (!toggle) {
            continue;
        }
        const tabNode = toggle.node;
        tabNode.setPosition(-112 + index * 112, 202, 0);
        ensureTransform(tabNode, 104, 42);
        for (const sprite of tabNode.getComponentsInChildren(Sprite)) {
            sprite.enabled = false;
        }

        const tabSurface = ensureChild(tabNode, '__RightTabSurface');
        tabSurface.setSiblingIndex(0);
        tabSurface.setPosition(0, 0, 0);
        ensureTransform(tabSurface, 104, 42);
        const tg = tabSurface.getComponent(Graphics) || tabSurface.addComponent(Graphics);
        tg.clear();
        const selected = index === active;
        tg.fillColor = selected ? new Color(30, 93, 78, 248) : new Color(25, 22, 19, 245);
        tg.roundRect(-52, -21, 104, 42, 8);
        tg.fill();
        tg.strokeColor = selected ? new Color(107, 190, 154, 245) : new Color(134, 94, 49, 210);
        tg.lineWidth = selected ? 2 : 1.5;
        tg.roundRect(-52, -21, 104, 42, 8);
        tg.stroke();

        for (const label of tabNode.getComponentsInChildren(Label)) {
            if (label.node.name !== '__RightTabLabel') {
                label.node.active = false;
            }
        }
        const label = createGameText(
            tabNode,
            '__RightTabLabel',
            TAB_LABELS[index] || `MỤC ${index + 1}`,
            13,
            selected ? GameTheme.colors.ivory : GameTheme.colors.gold300,
            94,
            32,
        );
        label.node.active = true;
        label.node.setPosition(0, 0, 0);
        label.node.setSiblingIndex(tabNode.children.length - 1);
    }

    styleScrollView(logic.armyScrollView);
    styleScrollView(logic.cityScrollView);
    styleScrollView(logic.tagsScrollView);

    const section = createGameText(
        node,
        '__RightSelectorSection',
        active === 0 ? 'ĐỘI QUÂN ĐANG QUẢN LÝ' : active === 1 ? 'THÀNH TRÌ CỦA TA' : 'TỌA ĐỘ ĐÃ ĐÁNH DẤU',
        14,
        GameTheme.colors.muted,
        300,
        30,
    );
    section.horizontalAlign = HorizontalTextAlignment.LEFT;
    section.node.setPosition(-5, 165, 0);
    section.node.setSiblingIndex(node.children.length - 1);
}

function styleCityItem(node: Node, logic: any): void {
    const width = 304;
    const height = 74;
    ensureTransform(node, width, height);
    drawCard(node, '__CitySelectorSurface', width, height);

    const badgeSurface = ensureChild(node, '__CityBadgeSurface');
    badgeSurface.setSiblingIndex(1);
    badgeSurface.setPosition(-112, 0, 0);
    ensureTransform(badgeSurface, 58, 28);
    const bg = badgeSurface.getComponent(Graphics) || badgeSurface.addComponent(Graphics);
    bg.clear();
    bg.fillColor = new Color(30, 91, 77, 245);
    bg.roundRect(-29, -14, 58, 28, 6);
    bg.fill();
    bg.strokeColor = new Color(98, 182, 147, 230);
    bg.lineWidth = 1;
    bg.roundRect(-29, -14, 58, 28, 6);
    bg.stroke();

    const badge = createGameText(node, '__CityBadge', 'THÀNH', 12, GameTheme.colors.ivory, 56, 26);
    badge.node.setPosition(-112, 0, 0);
    badge.node.setSiblingIndex(node.children.length - 1);

    styleLabel(logic.labelInfo, -65, 13, 150, 30, 18, GameTheme.colors.gold300);
    if (logic.labelInfo) {
        logic.labelInfo.fontFamily = GameTheme.typography.titleFont;
    }
    styleLabel(logic.labelPos, -65, -16, 150, 26, 13, GameTheme.colors.muted);

    const jump = createGameText(node, '__CityJumpHint', 'ĐẾN →', 13, GameTheme.colors.gold300, 62, 28);
    jump.node.setPosition(112, 0, 0);
    jump.node.setSiblingIndex(node.children.length - 1);
}

function styleTagItem(node: Node, logic: any): void {
    const width = 304;
    const height = 68;
    ensureTransform(node, width, height);
    drawCard(node, '__TagSelectorSurface', width, height);

    const pin = createGameText(node, '__TagPin', '◆', 18, GameTheme.colors.gold300, 34, 34);
    pin.node.setPosition(-126, 0, 0);
    pin.node.setSiblingIndex(node.children.length - 1);

    styleLabel(logic.labelInfo, -54, 12, 170, 28, 16, GameTheme.colors.ivory);
    styleLabel(logic.labelPos, -54, -15, 170, 24, 13, GameTheme.colors.muted);

    const jump = createGameText(node, '__TagJumpHint', 'ĐẾN →', 12, GameTheme.colors.gold300, 58, 26);
    jump.node.setPosition(118, 0, 0);
    jump.node.setSiblingIndex(node.children.length - 1);
}

function styleAction(node: Node, text: string, variant: 'secondary' | 'jade'): void {
    if (!node) {
        return;
    }
    styleGameButton(node, text, variant, 126, 38);
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
}

function styleArmyItem(node: Node, logic: any): void {
    const width = 304;
    const height = 112;
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    if (transform.width <= 0) {
        transform.width = width;
    }
    drawCard(node, '__ArmySelectorSurface', width, height);

    if (logic.headIcon) {
        logic.headIcon.node.setPosition(-112, 0, 0);
        ensureTransform(logic.headIcon.node, 54, 54);
        logic.headIcon.node.setSiblingIndex(node.children.length - 1);
    }

    styleLabel(logic.labelInfo, -74, 30, 176, 28, 15, GameTheme.colors.gold300);
    styleLabel(logic.labelPos, -74, 3, 176, 24, 13, GameTheme.colors.muted);
    styleLabel(logic.labelSoldierCnt, -74, -28, 112, 22, 12, GameTheme.colors.ivory);
    styleLabel(logic.labelStrength, 46, -28, 122, 22, 12, GameTheme.colors.ivory);
    if (logic.labelMorale) {
        logic.labelMorale.node.active = false;
    }

    if (logic.bottomNode) {
        logic.bottomNode.setPosition(0, -70, 0);
        ensureTransform(logic.bottomNode, 286, 56);
        const panel = ensureChild(logic.bottomNode, '__ArmyActionSurface');
        panel.setSiblingIndex(0);
        panel.setPosition(0, 0, 0);
        ensureTransform(panel, 286, 56);
        const pg = panel.getComponent(Graphics) || panel.addComponent(Graphics);
        pg.clear();
        pg.fillColor = new Color(15, 13, 11, 238);
        pg.roundRect(-143, -28, 286, 56, 8);
        pg.fill();
        pg.strokeColor = new Color(117, 83, 45, 180);
        pg.lineWidth = 1;
        pg.roundRect(-143, -28, 286, 56, 8);
        pg.stroke();

        if (logic.btnSetting) {
            logic.btnSetting.setPosition(-71, 0, 0);
            styleAction(logic.btnSetting, 'ĐỘI HÌNH', 'jade');
        }
        if (logic.btnBack) {
            logic.btnBack.setPosition(71, 0, 0);
            styleAction(logic.btnBack, 'RÚT QUÂN', 'secondary');
        }
    }
}

/**
 * Skin an toàn cho các prefab selector legacy. Chỉ thay presentation;
 * mọi click handler và dữ liệu vẫn nằm trong component game gốc.
 */
export function styleRightSelectorTree(root: Node): void {
    visit(root, (node) => {
        const right = component(node, 'RightInfoNodeLogic');
        if (right) {
            styleRightPanel(node, right);
        }
        const city = component(node, 'RightCityItemLogic');
        if (city) {
            styleCityItem(node, city);
        }
        const tag = component(node, 'RightTagItemLogic');
        if (tag) {
            styleTagItem(node, tag);
        }
        const army = component(node, 'RightArmyItemLogic');
        if (army) {
            styleArmyItem(node, army);
        }
    });
}
