import {
    Button,
    Color,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Layout,
    Node,
    Sprite,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import {
    createGameText,
    ensureChild,
    ensureTransform,
} from '../components/GameSurface';
import { GameTheme } from '../theme/GameTheme';

type MenuSpec = {
    handler: string;
    label: string;
};

const LEFT_MENU: MenuSpec[] = [
    { handler: 'onClickGeneral', label: 'Tướng' },
    { handler: 'openDraw', label: 'Chiêu mộ' },
    { handler: 'openWarReport', label: 'Chiến báo' },
    { handler: 'openUnion', label: 'Liên minh' },
    { handler: 'openChat', label: 'Trò chuyện' },
    { handler: 'onClickSkillBtn', label: 'Kỹ năng' },
    { handler: 'onClickCollection', label: 'Thu thuế' },
];

function allButtons(root: Node): Button[] {
    return root.getComponentsInChildren(Button);
}

function buttonHandler(button: Button): string {
    const events = button.clickEvents as any[];
    for (const event of events || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return allButtons(root).find((button) => buttonHandler(button) === handler) || null;
}

function disableDirectSprites(node: Node): void {
    for (const sprite of node.getComponents(Sprite)) {
        sprite.enabled = false;
    }
}

function hideLegacyLabels(node: Node): void {
    for (const label of node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__HudMenuLabel') {
            label.node.active = false;
        }
    }
}

function drawHudButton(node: Node, labelText: string): void {
    disableDirectSprites(node);
    ensureTransform(node, 164, 54);

    const surface = ensureChild(node, '__HudMenuSurface');
    surface.active = true;
    surface.setSiblingIndex(0);
    surface.setPosition(0, 0, 0);
    ensureTransform(surface, 164, 54);
    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();

    graphics.fillColor = new Color(8, 8, 8, 185);
    graphics.roundRect(-82, -27, 164, 54, 12);
    graphics.fill();

    graphics.fillColor = new Color(38, 30, 23, 244);
    graphics.roundRect(-78, -23, 156, 46, 10);
    graphics.fill();

    graphics.strokeColor = new Color(190, 139, 69, 235);
    graphics.lineWidth = 2;
    graphics.roundRect(-82, -27, 164, 54, 12);
    graphics.stroke();

    graphics.strokeColor = new Color(246, 211, 137, 95);
    graphics.lineWidth = 1;
    graphics.roundRect(-74, -19, 148, 38, 8);
    graphics.stroke();

    hideLegacyLabels(node);
    const label = createGameText(
        node,
        '__HudMenuLabel',
        labelText,
        19,
        GameTheme.colors.ivory,
        142,
        42,
    );
    label.node.active = true;
    label.node.setPosition(0, 0, 0);
    label.node.setSiblingIndex(node.children.length - 1);

    const button = node.getComponent(Button) || node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.96;
    button.duration = GameTheme.motion.fast;
}

function drawResourceChip(node: Node): void {
    disableDirectSprites(node);
    ensureTransform(node, 122, 42);

    const surface = ensureChild(node, '__ResourceSurface');
    surface.setSiblingIndex(0);
    surface.setPosition(0, 0, 0);
    ensureTransform(surface, 122, 42);
    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(21, 18, 15, 235);
    graphics.roundRect(-61, -21, 122, 42, 7);
    graphics.fill();
    graphics.strokeColor = new Color(145, 103, 51, 220);
    graphics.lineWidth = 1.5;
    graphics.roundRect(-61, -21, 122, 42, 7);
    graphics.stroke();

    const labels = node.getComponentsInChildren(Label);
    for (const label of labels) {
        label.node.active = true;
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = 16;
        label.lineHeight = 21;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = GameTheme.colors.gold300;
        ensureTransform(label.node, 112, 34);
        label.node.setPosition(0, 0, 0);
        label.node.setSiblingIndex(node.children.length - 1);
    }
}

function styleProfile(nameLabel: Label, ridLabel: Label): void {
    const profileRoot = nameLabel.node.parent || ridLabel.node.parent;
    if (!profileRoot) {
        return;
    }

    profileRoot.setPosition(-492, 302, 0);
    ensureTransform(profileRoot, 272, 92);
    disableDirectSprites(profileRoot);

    const surface = ensureChild(profileRoot, '__ProfileSurface');
    surface.setSiblingIndex(0);
    surface.setPosition(0, 0, 0);
    ensureTransform(surface, 272, 92);
    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(16, 13, 11, 230);
    graphics.roundRect(-136, -46, 272, 92, 14);
    graphics.fill();
    graphics.strokeColor = new Color(181, 126, 58, 235);
    graphics.lineWidth = 2;
    graphics.roundRect(-136, -46, 272, 92, 14);
    graphics.stroke();

    nameLabel.node.setPosition(23, 16, 0);
    ridLabel.node.setPosition(23, -19, 0);
    for (const [label, size] of [[nameLabel, 20], [ridLabel, 14]] as Array<[Label, number]>) {
        ensureTransform(label.node, 208, 32);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = size;
        label.lineHeight = size + 5;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = label === nameLabel ? GameTheme.colors.gold300 : GameTheme.colors.muted;
        label.node.setSiblingIndex(profileRoot.children.length - 1);
    }
}

function styleResourceBar(resourceLayout: Layout): void {
    const node = resourceLayout.node;
    node.setPosition(192, 320, 0);
    ensureTransform(node, 790, 52);
    resourceLayout.type = Layout.Type.HORIZONTAL;
    resourceLayout.spacingX = 7;
    resourceLayout.paddingLeft = 0;
    resourceLayout.paddingRight = 0;
    resourceLayout.paddingTop = 0;
    resourceLayout.paddingBottom = 0;

    const children = node.children;
    for (let index = 0; index < children.length; index += 1) {
        const child = children[index];
        // HUD mẫu chỉ giữ Lệnh + 5 tài nguyên chính. Sản lượng vẫn còn trong dữ liệu
        // và logic, chỉ không chiếm diện tích bản đồ ở thanh chính.
        child.active = index <= 5;
        if (child.active) {
            drawResourceChip(child);
        }
    }
    resourceLayout.updateLayout();
}

function styleLeftMenu(root: Node): void {
    const menuRoot = ensureChild(root, '__ModernLeftMenu');
    ensureTransform(menuRoot, 180, 454);
    menuRoot.setPosition(-548, 70, 0);

    let visibleIndex = 0;
    for (const spec of LEFT_MENU) {
        const button = findButton(root, spec.handler);
        if (!button) {
            continue;
        }
        const buttonNode = button.node;
        buttonNode.setParent(menuRoot);
        buttonNode.active = true;
        buttonNode.setPosition(0, 196 - visibleIndex * 62, 0);
        drawHudButton(buttonNode, spec.label);
        visibleIndex += 1;
    }
}

function styleSettings(root: Node): void {
    const button = findButton(root, 'onClickSetting');
    if (!button) {
        return;
    }
    const node = button.node;
    node.setParent(root);
    node.setPosition(554, -318, 0);
    drawHudButton(node, 'Cài đặt');
    ensureTransform(node, 142, 52);
}

/**
 * Bố cục HUD bản đồ theo concept người dùng cung cấp.
 * Chỉ di chuyển/thay presentation của node hiện có; không tạo handler hay dữ liệu giả.
 */
export function applyMapHUDLayout(
    root: Node,
    resourceLayout: Layout,
    nameLabel: Label,
    ridLabel: Label,
): void {
    styleProfile(nameLabel, ridLabel);
    styleResourceBar(resourceLayout);
    styleLeftMenu(root);
    styleSettings(root);
}
