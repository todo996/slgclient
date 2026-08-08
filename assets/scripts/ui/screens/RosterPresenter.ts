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
import ListLogic from '../../utils/ListLogic';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../components/GameSurface';
import { GameTheme } from '../theme/GameTheme';

function buttonHandler(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => buttonHandler(button) === handler) || null;
}

function findTitle(root: Node): Label | null {
    return root.getComponentsInChildren(Label).find((label) => {
        const text = label.string.trim();
        return text === 'Tướng' || text === '武将' || text === '将领';
    }) || null;
}

function configureList(scrollView: ScrollView): void {
    const list = scrollView.node.getComponent(ListLogic) as any;
    if (!list) {
        return;
    }

    const scale = 0.55;
    list.scale = scale;
    list.columnCount = 5;
    list.autoColumnCount = false;
    list.isHorizontal = false;
    list.spaceColumn = 12;
    list.spaceRow = 14;

    const prefab = list.itemPrefab;
    if (prefab?.data) {
        const transform = prefab.data.getComponent(UITransform);
        if (transform) {
            list._itemWidth = transform.width * scale;
            list._itemHeight = transform.height * scale;
        }
    }

    scrollView.horizontal = false;
    scrollView.vertical = true;
    scrollView.node.setPosition(0, -18, 0);
    ensureTransform(scrollView.node, 1110, 514);

    const view = scrollView.node.getChildByName('view') || scrollView.node.getChildByName('View');
    if (view) {
        ensureTransform(view, 1110, 514);
    }
    if (scrollView.content) {
        ensureTransform(scrollView.content, 1110, 514);
    }
}

function drawHeader(root: Node): void {
    const header = ensureChild(root, '__RosterHeader');
    header.setPosition(0, 316, 0);
    ensureTransform(header, 1130, 72);
    const graphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(12, 10, 9, 238);
    graphics.rect(-565, -36, 1130, 72);
    graphics.fill();
    graphics.strokeColor = new Color(176, 124, 59, 225);
    graphics.lineWidth = 2;
    graphics.moveTo(-565, -34);
    graphics.lineTo(565, -34);
    graphics.stroke();

    const title = findTitle(root) || createGameText(
        header,
        '__RosterTitle',
        'Tướng',
        40,
        GameTheme.colors.gold300,
        300,
        60,
        true,
    );
    if (title.node.parent !== header) {
        title.node.setParent(header);
    }
    title.node.setPosition(0, 0, 0);
    ensureTransform(title.node, 300, 60);
    title.string = 'Tướng';
    title.useSystemFont = true;
    title.fontFamily = GameTheme.typography.titleFont;
    title.fontSize = 40;
    title.lineHeight = 48;
    title.enableWrapText = false;
    title.overflow = Label.Overflow.SHRINK;
    title.horizontalAlign = HorizontalTextAlignment.CENTER;
    title.verticalAlign = VerticalTextAlignment.CENTER;
    title.color = GameTheme.colors.gold300;
    title.node.setSiblingIndex(header.children.length - 1);
}

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number,
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

function drawBottomBar(root: Node, countLabel: Label): void {
    const bar = ensureChild(root, '__RosterBottomBar');
    bar.setPosition(0, -321, 0);
    ensureTransform(bar, 1130, 66);
    const graphics = bar.getComponent(Graphics) || bar.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(12, 10, 9, 238);
    graphics.rect(-565, -33, 1130, 66);
    graphics.fill();
    graphics.strokeColor = new Color(164, 112, 54, 190);
    graphics.lineWidth = 1.5;
    graphics.moveTo(-565, 32);
    graphics.lineTo(565, 32);
    graphics.stroke();

    const owned = createGameText(bar, '__OwnedCaption', 'Tướng sở hữu', 17, GameTheme.colors.muted, 145, 34);
    owned.horizontalAlign = HorizontalTextAlignment.LEFT;
    owned.node.setPosition(-460, 0, 0);

    countLabel.node.setParent(bar);
    countLabel.node.setPosition(-330, 0, 0);
    ensureTransform(countLabel.node, 150, 36);
    countLabel.useSystemFont = true;
    countLabel.fontFamily = GameTheme.typography.bodyFont;
    countLabel.fontSize = 19;
    countLabel.lineHeight = 24;
    countLabel.enableWrapText = false;
    countLabel.overflow = Label.Overflow.SHRINK;
    countLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
    countLabel.verticalAlign = VerticalTextAlignment.CENTER;
    countLabel.color = GameTheme.colors.gold300;
    countLabel.node.setSiblingIndex(bar.children.length - 1);

    const convert = findButton(root, 'onClickConvert');
    if (convert) {
        convert.node.setParent(bar);
        convert.node.setPosition(300, 0, 0);
        styleRealButton(convert, 'Sắp xếp', 'jade', 170, 48);
    }

    const roster = findButton(root, 'onTuJianConvert');
    if (roster) {
        roster.node.setParent(bar);
        roster.node.setPosition(470, 0, 0);
        styleRealButton(roster, 'Xem chi tiết', 'primary', 190, 48);
    }
}

function styleBack(root: Node): void {
    const close = findButton(root, 'onClickClose');
    if (!close) {
        return;
    }
    close.node.setParent(root);
    close.node.setPosition(-574, 318, 0);
    styleRealButton(close, '←', 'secondary', 72, 52);
}

/** Chỉ thay presentation màn Tướng; ảnh tướng, dữ liệu và handler thật được giữ nguyên. */
export function applyRosterLayout(root: Node, scrollView: ScrollView, countLabel: Label): void {
    const panel = root.getChildByName('New Node');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 1180, 650, 10);
    }
    configureList(scrollView);
    drawHeader(root);
    drawBottomBar(root, countLabel);
    styleBack(root);
}
