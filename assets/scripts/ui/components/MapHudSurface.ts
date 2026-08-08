import {
    Button,
    Color,
    Graphics,
    Label,
    Layout,
    Node,
    UITransform,
} from 'cc';
import { GameTheme } from '../theme/GameTheme';
import { createGameText, ensureChild, ensureTransform } from './GameSurface';

const HUD_SURFACE = '__ModernHudSurface';
const PANEL_SURFACE = '__ModernPanelSurface';
const ACTION_PLATE = '__MapActionPlate';
const ACTION_LABEL = '__MapActionLabel';

const ACTIONS: Record<string, { label: string; priority: number }> = {
    onClickGeneral: { label: 'Tướng', priority: 10 },
    openGeneral: { label: 'Tướng', priority: 10 },
    openDraw: { label: 'Chiêu mộ', priority: 20 },
    onClickDraw: { label: 'Chiêu mộ', priority: 20 },
    openWarReport: { label: 'Chiến báo', priority: 30 },
    onClickWarReport: { label: 'Chiến báo', priority: 30 },
    openUnion: { label: 'Liên minh', priority: 40 },
    onClickUnion: { label: 'Liên minh', priority: 40 },
    openChat: { label: 'Trò chuyện', priority: 50 },
    onClickChat: { label: 'Trò chuyện', priority: 50 },
    onClickSkillBtn: { label: 'Kỹ năng', priority: 60 },
    onOpenSkill: { label: 'Kỹ năng', priority: 60 },
    onClickCollection: { label: 'Thu thuế', priority: 70 },
    openTr: { label: 'Chuyển đổi', priority: 80 },
    onClickSetting: { label: 'Cài đặt', priority: 90 },
    onBack: { label: 'Đăng xuất', priority: 100 },
};

function drawSurface(
    parent: Node,
    name: string,
    width: number,
    height: number,
    radius: number,
    fill: Color,
    stroke: Color,
): void {
    if (width <= 0 || height <= 0) {
        return;
    }

    const surface = ensureChild(parent, name);
    surface.setPosition(0, 0, 0);
    surface.setSiblingIndex(0);
    ensureTransform(surface, width, height);

    const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
    graphics.clear();
    const halfW = width / 2;
    const halfH = height / 2;

    graphics.fillColor = new Color(0, 0, 0, 105);
    graphics.roundRect(-halfW - 3, -halfH - 3, width + 6, height + 6, radius + 2);
    graphics.fill();

    graphics.fillColor = fill;
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.fill();

    graphics.strokeColor = stroke;
    graphics.lineWidth = 2;
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.stroke();

    graphics.strokeColor = new Color(245, 210, 137, 80);
    graphics.lineWidth = 1;
    graphics.roundRect(-halfW + 5, -halfH + 5, width - 10, height - 10, Math.max(3, radius - 4));
    graphics.stroke();
}

function styleLabels(root: Node): void {
    for (const label of root.getComponentsInChildren(Label)) {
        label.useSystemFont = true;
        label.fontFamily = label.fontSize >= GameTheme.typography.titleMinSize
            ? GameTheme.typography.titleFont
            : GameTheme.typography.bodyFont;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;

        const neutral = Math.abs(label.color.r - label.color.g) < 38
            && Math.abs(label.color.g - label.color.b) < 38;
        if (label.fontSize >= GameTheme.typography.titleMinSize) {
            label.color = GameTheme.colors.gold300;
        } else if (neutral && label.color.a > 0) {
            label.color = GameTheme.colors.ivory;
        }
    }
}

function styleButtons(root: Node): void {
    for (const button of root.getComponentsInChildren(Button)) {
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        button.duration = GameTheme.motion.fast;

        const transform = button.node.getComponent(UITransform);
        if (transform) {
            const size = transform.contentSize;
            const width = Math.max(size.width, 44);
            const height = Math.max(size.height, 44);
            if (width !== size.width || height !== size.height) {
                transform.setContentSize(width, height);
            }
        }
    }
}

function getAction(button: Button): { label: string; priority: number } | null {
    const clickEvents = button.clickEvents || [];
    for (const event of clickEvents as any[]) {
        const handler = typeof event?.handler === 'string' ? event.handler : '';
        if (ACTIONS[handler]) {
            return ACTIONS[handler];
        }
    }
    return null;
}

function drawActionPlate(button: Button, action: { label: string; priority: number }): void {
    const transform = button.node.getComponent(UITransform);
    if (!transform) {
        return;
    }

    const width = Math.max(48, transform.contentSize.width);
    const height = Math.max(48, transform.contentSize.height);
    const plateWidth = Math.max(44, width - 6);
    const plateHeight = Math.min(28, Math.max(22, height * 0.3));
    const plateY = -height / 2 + plateHeight / 2 + 3;

    const plate = ensureChild(button.node, ACTION_PLATE);
    plate.setPosition(0, plateY, 0);
    plate.setSiblingIndex(button.node.children.length - 1);
    ensureTransform(plate, plateWidth, plateHeight);

    const graphics = plate.getComponent(Graphics) || plate.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(15, 13, 11, 225);
    graphics.roundRect(-plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight, 6);
    graphics.fill();
    graphics.strokeColor = new Color(184, 129, 58, 220);
    graphics.lineWidth = 1;
    graphics.roundRect(-plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight, 6);
    graphics.stroke();

    const label = createGameText(
        button.node,
        ACTION_LABEL,
        action.label,
        Math.min(16, Math.max(12, Math.round(plateHeight * 0.58))),
        GameTheme.colors.gold300,
        plateWidth - 6,
        plateHeight,
    );
    label.node.setPosition(0, plateY, 0);
    label.node.setSiblingIndex(button.node.children.length - 1);
}

/**
 * Dùng chính handler đã serialize trong Button.clickEvents để xác định chức năng.
 * Nhờ vậy UI không tạo nút giả và không cần đoán tên node/prefab.
 */
function labelRealActionButtons(root: Node): void {
    for (const button of root.getComponentsInChildren(Button)) {
        const action = getAction(button);
        if (action) {
            drawActionPlate(button, action);
        }
    }
}

/**
 * Chỉ đổi thứ tự hiển thị khi các nút chức năng thật nằm trong cùng một Layout.
 * Không sửa clickEvents, target, component hoặc dữ liệu gameplay.
 */
function reorderRealActionLayouts(root: Node): void {
    const visit = (parent: Node, depth: number): void => {
        const layout = parent.getComponent(Layout);
        if (layout && parent.children.length >= 4) {
            const ranked = parent.children.map((child, originalIndex) => {
                const buttons = child.getComponentsInChildren(Button);
                let action: { label: string; priority: number } | null = null;
                for (const button of buttons) {
                    action = getAction(button);
                    if (action) {
                        break;
                    }
                }
                return { child, originalIndex, action };
            });

            const recognized = ranked.filter(item => item.action !== null);
            if (recognized.length >= 4) {
                ranked.sort((left, right) => {
                    if (left.action && right.action) {
                        return left.action.priority - right.action.priority;
                    }
                    if (left.action) {
                        return -1;
                    }
                    if (right.action) {
                        return 1;
                    }
                    return left.originalIndex - right.originalIndex;
                });
                ranked.forEach((item, index) => item.child.setSiblingIndex(index));
            }
        }

        if (depth >= 5) {
            return;
        }
        const children = [...parent.children];
        for (const child of children) {
            if (!child.name.startsWith('__')) {
                visit(child, depth + 1);
            }
        }
    };

    visit(root, 0);
}

function findPanelCandidate(root: Node): Node | null {
    let best: Node | null = null;
    let bestArea = 0;

    const visit = (node: Node, depth: number): void => {
        const transform = node.getComponent(UITransform);
        if (transform) {
            const { width, height } = transform.contentSize;
            const isPopupSize = width >= 280 && width <= 1000 && height >= 180 && height <= 760;
            const area = width * height;
            if (isPopupSize && area > bestArea) {
                best = node;
                bestArea = area;
            }
        }
        if (depth >= 3) {
            return;
        }
        for (const child of node.children) {
            visit(child, depth + 1);
        }
    };

    visit(root, 0);
    return best;
}

/**
 * Chuẩn hoá HUD trên bản đồ mà không thay sprite bản đồ, camera hoặc handler.
 * Chỉ thêm nền bán trong suốt vào các cụm UI có kích thước hợp lý.
 */
export function styleModernHudCluster(root: Node | null): void {
    if (!root) {
        return;
    }

    styleLabels(root);
    styleButtons(root);

    const transform = root.getComponent(UITransform);
    if (!transform) {
        return;
    }
    const { width, height } = transform.contentSize;
    if (width < 80 || height < 36 || width > 1100 || height > 260) {
        return;
    }

    drawSurface(
        root,
        HUD_SURFACE,
        width,
        height,
        Math.min(14, height * 0.18),
        new Color(18, 16, 14, 220),
        new Color(151, 108, 52, 210),
    );
}

/**
 * Tự nhận diện thanh tài nguyên/menu trên scene bản đồ dựa trên mật độ UI.
 * Không đụng TiledMap, SpriteFrame tướng, toạ độ camera hoặc node gameplay.
 */
export function styleModernMapScene(root: Node): void {
    styleLabels(root);
    styleButtons(root);
    labelRealActionButtons(root);
    reorderRealActionLayouts(root);

    const visit = (node: Node, depth: number): void => {
        const children = [...node.children];
        if (node !== root && !node.name.startsWith('__')) {
            const transform = node.getComponent(UITransform);
            if (transform) {
                const { width, height } = transform.contentSize;
                const compact = width >= 120 && width <= 1180 && height >= 36 && height <= 220;
                if (compact) {
                    const buttonCount = node.getComponentsInChildren(Button).length;
                    const labelCount = node.getComponentsInChildren(Label).length;
                    if (buttonCount >= 2 || labelCount >= 3) {
                        styleModernHudCluster(node);
                    }
                }
            }
        }

        if (depth >= 5) {
            return;
        }
        for (const child of children) {
            visit(child, depth + 1);
        }
    };

    visit(root, 0);
}

/** Tạo khung popup thành kiểu mực tối - đồng - vàng, giữ nguyên dữ liệu và ảnh tướng. */
export function styleModernCityPanel(root: Node): void {
    styleLabels(root);
    styleButtons(root);

    const panel = findPanelCandidate(root);
    if (!panel) {
        return;
    }

    const transform = panel.getComponent(UITransform);
    if (!transform) {
        return;
    }
    const { width, height } = transform.contentSize;
    drawSurface(
        panel,
        PANEL_SURFACE,
        width,
        height,
        GameTheme.radius.large,
        new Color(23, 19, 16, 246),
        GameTheme.colors.bronze500,
    );
}

/** Bề mặt thẻ đội quân; không can thiệp GeneralHead/SpriteFrame và dữ liệu đội hình. */
export function styleModernArmyCard(root: Node): void {
    styleLabels(root);
    styleButtons(root);

    const transform = root.getComponent(UITransform);
    if (!transform) {
        return;
    }
    const { width, height } = transform.contentSize;
    if (width < 120 || height < 48 || width > 1000 || height > 240) {
        return;
    }

    drawSurface(
        root,
        HUD_SURFACE,
        width,
        height,
        Math.min(GameTheme.radius.medium, height * 0.12),
        new Color(28, 24, 20, 228),
        new Color(119, 82, 41, 205),
    );
}
