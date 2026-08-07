import { Button, EditBox, Label, Node, RichText } from 'cc';
import { GameTheme } from './GameTheme';

const TITLE_HINTS = [
    'title', 'header', 'caption', 'nameTitle', 'txtTitle', 'labTitle',
    'tiêu đề', 'tieuDe',
];

function isTitle(label: Label): boolean {
    if (label.fontSize >= GameTheme.typography.titleMinSize) {
        return true;
    }
    const nodeName = label.node.name.toLowerCase();
    return TITLE_HINTS.some(hint => nodeName.includes(hint.toLowerCase()));
}

function applyLabelTheme(label: Label): void {
    label.useSystemFont = true;
    label.fontFamily = isTitle(label)
        ? GameTheme.typography.titleFont
        : GameTheme.typography.bodyFont;

    if (isTitle(label)) {
        label.color = GameTheme.colors.gold300;
    } else if (label.color.a > 0) {
        // Chỉ chuẩn hoá text sáng mặc định; giữ nguyên màu trạng thái đỏ/xanh hiện có.
        const isNeutral = Math.abs(label.color.r - label.color.g) < 32
            && Math.abs(label.color.g - label.color.b) < 32;
        if (isNeutral) {
            label.color = GameTheme.colors.ivory;
        }
    }
}

function applyRichTextTheme(richText: RichText): void {
    richText.fontFamily = GameTheme.typography.bodyFont;
}

function applyEditBoxTheme(editBox: EditBox): void {
    if (editBox.textLabel) {
        applyLabelTheme(editBox.textLabel);
        editBox.textLabel.color = GameTheme.colors.ivory;
    }
    if (editBox.placeholderLabel) {
        applyLabelTheme(editBox.placeholderLabel);
        editBox.placeholderLabel.color = GameTheme.colors.muted;
    }
}

function applyButtonTheme(button: Button): void {
    button.transition = Button.Transition.COLOR;
    button.normalColor = GameTheme.colors.ivory;
    button.hoverColor = GameTheme.colors.gold300;
    button.pressedColor = GameTheme.colors.gold500;
    button.disabledColor = GameTheme.colors.disabled;
    button.duration = GameTheme.motion.fast;

    const labels = button.node.getComponentsInChildren(Label);
    for (const label of labels) {
        applyLabelTheme(label);
        if (label.fontSize < GameTheme.typography.buttonMinSize) {
            label.fontSize = GameTheme.typography.buttonMinSize;
        }
    }
}

/**
 * Áp theme lên một cây node đã instantiate.
 * Hàm không đổi SpriteFrame, texture, bản đồ hoặc dữ liệu gameplay.
 */
export function applyGameTheme(root: Node): void {
    for (const label of root.getComponentsInChildren(Label)) {
        applyLabelTheme(label);
    }
    for (const richText of root.getComponentsInChildren(RichText)) {
        applyRichTextTheme(richText);
    }
    for (const editBox of root.getComponentsInChildren(EditBox)) {
        applyEditBoxTheme(editBox);
    }
    for (const button of root.getComponentsInChildren(Button)) {
        applyButtonTheme(button);
    }
}
