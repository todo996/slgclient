import {
    Button,
    Color,
    EditBox,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Sprite,
    UITransform,
    VerticalTextAlignment,
    Widget,
} from 'cc';
import { GameTheme } from '../theme/GameTheme';

export type GameButtonVariant = 'primary' | 'secondary' | 'jade' | 'danger';
export type GameInputIcon = 'user' | 'lock' | 'none';

const SURFACE_NAME = '__GameSurface';
const LABEL_NAME = '__GameLabel';

export function ensureTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
}

export function ensureChild(parent: Node, name: string): Node {
    const existing = parent.getChildByName(name);
    if (existing) {
        return existing;
    }
    const node = new Node(name);
    node.setParent(parent);
    return node;
}

export function disableLegacyVisuals(root: Node): void {
    for (const sprite of root.getComponentsInChildren(Sprite)) {
        sprite.enabled = false;
    }
    for (const widget of root.getComponentsInChildren(Widget)) {
        widget.enabled = false;
    }
}

function resetGraphics(node: Node, width: number, height: number): Graphics {
    ensureTransform(node, width, height);
    const graphics = node.getComponent(Graphics) || node.addComponent(Graphics);
    graphics.clear();
    return graphics;
}

function drawCornerMarks(graphics: Graphics, width: number, height: number): void {
    const halfW = width / 2;
    const halfH = height / 2;
    const size = 16;
    const inset = 8;

    graphics.strokeColor = new Color(239, 190, 91, 185);
    graphics.lineWidth = 2;

    const corners = [
        [-halfW + inset, halfH - inset, 1, -1],
        [halfW - inset, halfH - inset, -1, -1],
        [-halfW + inset, -halfH + inset, 1, 1],
        [halfW - inset, -halfH + inset, -1, 1],
    ];

    for (const [x, y, dx, dy] of corners) {
        graphics.moveTo(x, y + dy * size);
        graphics.lineTo(x, y);
        graphics.lineTo(x + dx * size, y);
    }
    graphics.stroke();
}

export function drawGamePanel(
    node: Node,
    width: number,
    height: number,
    radius: number = GameTheme.radius.large,
): void {
    const graphics = resetGraphics(node, width, height);
    const halfW = width / 2;
    const halfH = height / 2;

    graphics.fillColor = new Color(7, 7, 7, 170);
    graphics.roundRect(-halfW - 6, -halfH - 6, width + 12, height + 12, radius + 4);
    graphics.fill();

    graphics.fillColor = new Color(22, 18, 15, 248);
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.fill();

    graphics.fillColor = new Color(49, 35, 24, 105);
    graphics.roundRect(-halfW + 7, -halfH + 7, width - 14, height - 14, Math.max(4, radius - 5));
    graphics.fill();

    graphics.strokeColor = GameTheme.colors.bronze500;
    graphics.lineWidth = 3;
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.stroke();

    graphics.strokeColor = new Color(246, 211, 137, 120);
    graphics.lineWidth = 1;
    graphics.roundRect(-halfW + 7, -halfH + 7, width - 14, height - 14, Math.max(4, radius - 5));
    graphics.stroke();

    drawCornerMarks(graphics, width, height);
}

export function createGameText(
    parent: Node,
    name: string,
    text: string,
    fontSize: number,
    color: Color,
    width: number,
    height: number,
    title: boolean = false,
): Label {
    const node = ensureChild(parent, name);
    ensureTransform(node, width, height);

    const label = node.getComponent(Label) || node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = title ? GameTheme.typography.titleFont : GameTheme.typography.bodyFont;
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.ceil(fontSize * 1.25);
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = color;
    return label;
}

function buttonPalette(variant: GameButtonVariant): {
    outer: Color;
    inner: Color;
    highlight: Color;
    text: Color;
} {
    switch (variant) {
        case 'jade':
            return {
                outer: new Color(15, 50, 46, 255),
                inner: new Color(29, 91, 78, 255),
                highlight: new Color(94, 176, 145, 220),
                text: GameTheme.colors.ivory,
            };
        case 'danger':
            return {
                outer: new Color(75, 22, 20, 255),
                inner: new Color(130, 43, 38, 255),
                highlight: new Color(211, 111, 91, 220),
                text: GameTheme.colors.ivory,
            };
        case 'secondary':
            return {
                outer: new Color(34, 28, 23, 255),
                inner: new Color(48, 39, 31, 255),
                highlight: GameTheme.colors.bronze500,
                text: GameTheme.colors.gold300,
            };
        default:
            return {
                outer: new Color(101, 60, 19, 255),
                inner: new Color(190, 131, 48, 255),
                highlight: new Color(255, 222, 139, 240),
                text: new Color(45, 27, 14, 255),
            };
    }
}

export function styleGameButton(
    buttonNode: Node,
    text: string,
    variant: GameButtonVariant,
    width: number,
    height: number,
): Button {
    disableLegacyVisuals(buttonNode);
    ensureTransform(buttonNode, width, height);

    const surface = ensureChild(buttonNode, SURFACE_NAME);
    surface.setPosition(0, 0, 0);
    surface.setSiblingIndex(0);
    const graphics = resetGraphics(surface, width, height);
    const palette = buttonPalette(variant);
    const halfW = width / 2;
    const halfH = height / 2;
    const radius = Math.min(12, height * 0.22);

    graphics.fillColor = new Color(0, 0, 0, 125);
    graphics.roundRect(-halfW - 3, -halfH - 4, width + 6, height + 7, radius + 2);
    graphics.fill();

    graphics.fillColor = palette.outer;
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.fill();

    graphics.fillColor = palette.inner;
    graphics.roundRect(-halfW + 5, -halfH + 5, width - 10, height - 10, Math.max(4, radius - 4));
    graphics.fill();

    graphics.strokeColor = palette.highlight;
    graphics.lineWidth = 2;
    graphics.roundRect(-halfW, -halfH, width, height, radius);
    graphics.stroke();

    graphics.strokeColor = new Color(255, 238, 190, 105);
    graphics.lineWidth = 1;
    graphics.roundRect(-halfW + 6, -halfH + 6, width - 12, height - 12, Math.max(4, radius - 5));
    graphics.stroke();

    const label = createGameText(
        buttonNode,
        LABEL_NAME,
        text,
        Math.max(GameTheme.typography.buttonMinSize, Math.round(height * 0.38)),
        palette.text,
        width - 24,
        height - 8,
        variant === 'primary',
    );
    label.node.setPosition(0, 0, 0);
    label.node.setSiblingIndex(buttonNode.children.length - 1);

    const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.97;
    button.duration = GameTheme.motion.fast;
    return button;
}

function drawUserIcon(graphics: Graphics): void {
    graphics.circle(0, 10, 6);
    graphics.fill();
    graphics.roundRect(-10, -10, 20, 13, 6);
    graphics.fill();
}

function drawLockIcon(graphics: Graphics): void {
    graphics.roundRect(-10, -10, 20, 18, 4);
    graphics.fill();
    graphics.lineWidth = 3;
    graphics.arc(0, 8, 8, Math.PI, 0, false);
    graphics.stroke();
    graphics.circle(0, -1, 2);
    graphics.fill();
}

export function styleGameInput(
    editBox: EditBox,
    placeholder: string,
    icon: GameInputIcon,
    width: number,
    height: number,
): void {
    const root = editBox.node;
    ensureTransform(root, width, height);

    for (const child of root.children) {
        if (child !== editBox.textLabel?.node && child !== editBox.placeholderLabel?.node) {
            for (const sprite of child.getComponentsInChildren(Sprite)) {
                sprite.enabled = false;
            }
            for (const widget of child.getComponentsInChildren(Widget)) {
                widget.enabled = false;
            }
        }
    }

    const surface = ensureChild(root, SURFACE_NAME);
    surface.setPosition(0, 0, 0);
    surface.setSiblingIndex(0);
    const graphics = resetGraphics(surface, width, height);
    const halfW = width / 2;
    const halfH = height / 2;

    graphics.fillColor = new Color(8, 8, 8, 175);
    graphics.roundRect(-halfW - 2, -halfH - 2, width + 4, height + 4, 10);
    graphics.fill();

    graphics.fillColor = new Color(25, 23, 21, 248);
    graphics.roundRect(-halfW, -halfH, width, height, 9);
    graphics.fill();

    graphics.strokeColor = new Color(139, 110, 71, 235);
    graphics.lineWidth = 2;
    graphics.roundRect(-halfW, -halfH, width, height, 9);
    graphics.stroke();

    if (icon !== 'none') {
        const iconNode = ensureChild(root, '__GameInputIcon');
        iconNode.setPosition(-halfW + 32, 0, 0);
        iconNode.setSiblingIndex(root.children.length - 1);
        const iconGraphics = resetGraphics(iconNode, 32, 32);
        iconGraphics.fillColor = GameTheme.colors.muted;
        iconGraphics.strokeColor = GameTheme.colors.muted;
        if (icon === 'user') {
            drawUserIcon(iconGraphics);
        } else {
            drawLockIcon(iconGraphics);
        }
    }

    const leftPadding = icon === 'none' ? 22 : 64;
    const labelWidth = width - leftPadding - 20;
    for (const label of [editBox.textLabel, editBox.placeholderLabel]) {
        if (!label) {
            continue;
        }
        const transform = label.node.getComponent(UITransform) || label.node.addComponent(UITransform);
        transform.setContentSize(labelWidth, height - 12);
        label.node.setPosition(-halfW + leftPadding + labelWidth / 2, 0, 0);
        label.node.setSiblingIndex(root.children.length - 1);
        label.useSystemFont = true;
        label.fontFamily = GameTheme.typography.bodyFont;
        label.fontSize = Math.max(18, Math.round(height * 0.34));
        label.lineHeight = Math.round(height * 0.62);
        label.enableWrapText = false;
        label.overflow = Label.Overflow.CLAMP;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
    }

    editBox.placeholder = placeholder;
    if (editBox.placeholderLabel) {
        editBox.placeholderLabel.string = placeholder;
        editBox.placeholderLabel.color = GameTheme.colors.muted;
    }
    if (editBox.textLabel) {
        editBox.textLabel.color = GameTheme.colors.ivory;
    }
}

export function setNodeOpacity(node: Node, opacity: number): void {
    const component = node.getComponent('cc.UIOpacity') as any;
    if (component) {
        component.opacity = opacity;
    }
}
