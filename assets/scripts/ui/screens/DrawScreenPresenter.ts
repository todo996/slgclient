import {
    Button,
    Color,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Sprite,
    VerticalTextAlignment,
} from 'cc';
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

function hideLegacyButtonLabels(node: Node): void {
    for (const label of node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
}

function styleActionButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number,
): void {
    styleGameButton(button.node, text, variant, width, height);
    hideLegacyButtonLabels(button.node);
    const modern = button.node.getChildByName('__GameLabel');
    if (modern) {
        modern.active = true;
        modern.setSiblingIndex(button.node.children.length - 1);
    }
}

function drawHeader(root: Node): void {
    const header = ensureChild(root, '__DrawHeader');
    ensureTransform(header, 1130, 76);
    header.setPosition(0, 318, 0);

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
        '__DrawTitle',
        'CHIÊU MỘ TƯỚNG',
        40,
        GameTheme.colors.gold300,
        520,
        58,
        true,
    );
    title.node.setPosition(0, 0, 0);
}

function drawOfferSurface(card: Node, width: number, height: number): void {
    ensureTransform(card, width, height);
    const graphics = card.getComponent(Graphics) || card.addComponent(Graphics);
    graphics.clear();

    const halfW = width / 2;
    const halfH = height / 2;
    graphics.fillColor = new Color(7, 7, 7, 205);
    graphics.roundRect(-halfW - 4, -halfH - 5, width + 8, height + 10, 18);
    graphics.fill();

    graphics.fillColor = new Color(34, 27, 21, 248);
    graphics.roundRect(-halfW, -halfH, width, height, 16);
    graphics.fill();

    graphics.fillColor = new Color(72, 47, 26, 92);
    graphics.roundRect(-halfW + 9, -halfH + 9, width - 18, height - 18, 11);
    graphics.fill();

    graphics.strokeColor = new Color(190, 139, 69, 238);
    graphics.lineWidth = 2.5;
    graphics.roundRect(-halfW, -halfH, width, height, 16);
    graphics.stroke();

    graphics.strokeColor = new Color(247, 216, 151, 95);
    graphics.lineWidth = 1;
    graphics.roundRect(-halfW + 9, -halfH + 9, width - 18, height - 18, 11);
    graphics.stroke();
}

function configureCostLabel(label: Label, parent: Node): void {
    label.node.setParent(parent);
    label.node.active = true;
    label.node.setPosition(0, -58, 0);
    ensureTransform(label.node, 350, 40);
    label.useSystemFont = true;
    label.fontFamily = GameTheme.typography.bodyFont;
    label.fontSize = 18;
    label.lineHeight = 24;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = GameTheme.colors.gold300;
    label.node.setSiblingIndex(parent.children.length - 1);
}

function configureOffer(
    root: Node,
    name: string,
    x: number,
    titleText: string,
    description: string,
    sealText: string,
    costLabel: Label,
    handler: string,
    buttonText: string,
    variant: 'primary' | 'jade',
): void {
    const card = ensureChild(root, name);
    card.setPosition(x, -12, 0);
    drawOfferSurface(card, 480, 430);

    const seal = ensureChild(card, '__Seal');
    ensureTransform(seal, 116, 116);
    seal.setPosition(0, 82, 0);
    const sealGraphics = seal.getComponent(Graphics) || seal.addComponent(Graphics);
    sealGraphics.clear();
    sealGraphics.fillColor = new Color(82, 27, 21, 230);
    sealGraphics.circle(0, 0, 54);
    sealGraphics.fill();
    sealGraphics.strokeColor = new Color(226, 172, 82, 245);
    sealGraphics.lineWidth = 3;
    sealGraphics.circle(0, 0, 54);
    sealGraphics.stroke();
    sealGraphics.strokeColor = new Color(245, 216, 151, 110);
    sealGraphics.lineWidth = 1;
    sealGraphics.circle(0, 0, 45);
    sealGraphics.stroke();

    const sealLabel = createGameText(
        seal,
        '__SealLabel',
        sealText,
        36,
        GameTheme.colors.gold300,
        90,
        72,
        true,
    );
    sealLabel.node.setPosition(0, 0, 0);

    const title = createGameText(
        card,
        '__OfferTitle',
        titleText,
        28,
        GameTheme.colors.ivory,
        360,
        44,
        true,
    );
    title.node.setPosition(0, 3, 0);

    const desc = createGameText(
        card,
        '__OfferDescription',
        description,
        16,
        GameTheme.colors.muted,
        390,
        34,
    );
    desc.node.setPosition(0, -31, 0);

    configureCostLabel(costLabel, card);

    const button = findButton(root, handler);
    if (button) {
        button.node.setParent(card);
        button.node.active = true;
        button.node.setPosition(0, -139, 0);
        styleActionButton(button, buttonText, variant, 290, 62);
    }
}

function configureBottom(root: Node, countLabel: Label): void {
    const footer = ensureChild(root, '__DrawFooter');
    ensureTransform(footer, 1130, 62);
    footer.setPosition(0, -321, 0);
    const graphics = footer.getComponent(Graphics) || footer.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(12, 10, 9, 236);
    graphics.rect(-565, -31, 1130, 62);
    graphics.fill();
    graphics.strokeColor = new Color(164, 112, 54, 190);
    graphics.lineWidth = 1.5;
    graphics.moveTo(-565, 30);
    graphics.lineTo(565, 30);
    graphics.stroke();

    const caption = createGameText(
        footer,
        '__DrawOwnedCaption',
        'Tướng sở hữu',
        17,
        GameTheme.colors.muted,
        150,
        34,
    );
    caption.horizontalAlign = HorizontalTextAlignment.RIGHT;
    caption.node.setPosition(-82, 0, 0);

    countLabel.node.setParent(footer);
    countLabel.node.active = true;
    countLabel.node.setPosition(78, 0, 0);
    ensureTransform(countLabel.node, 150, 34);
    countLabel.useSystemFont = true;
    countLabel.fontFamily = GameTheme.typography.bodyFont;
    countLabel.fontSize = 18;
    countLabel.lineHeight = 24;
    countLabel.enableWrapText = false;
    countLabel.overflow = Label.Overflow.SHRINK;
    countLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
    countLabel.verticalAlign = VerticalTextAlignment.CENTER;
    countLabel.color = GameTheme.colors.gold300;
    countLabel.node.setSiblingIndex(footer.children.length - 1);
}

function configureBack(root: Node): void {
    const close = findButton(root, 'onClickClose');
    if (!close) {
        return;
    }
    close.node.setParent(root);
    close.node.active = true;
    close.node.setPosition(-574, 318, 0);
    styleActionButton(close, '←', 'secondary', 72, 52);
}

/**
 * Presenter màn Chiêu mộ: chỉ thay presentation của node/nút đang tồn tại.
 * drawGeneralOnce/drawGeneralTen vẫn là handler thật của DrawLogic.
 */
export function applyDrawScreenLayout(
    root: Node,
    onceCost: Label,
    tenCost: Label,
    countLabel: Label,
): void {
    const panel = root.getChildByName('New Node');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 1180, 650, 10);
    }

    drawHeader(root);
    configureOffer(
        root,
        '__DrawOnceCard',
        -260,
        'Chiêu mộ 1 lần',
        'Thử vận may và nhận 1 tướng.',
        'NHẤT',
        onceCost,
        'drawGeneralOnce',
        'CHIÊU MỘ 1 LẦN',
        'jade',
    );
    configureOffer(
        root,
        '__DrawTenCard',
        260,
        'Chiêu mộ 10 lần',
        'Chiêu mộ liên tiếp 10 tướng.',
        'THẬP',
        tenCost,
        'drawGeneralTen',
        'CHIÊU MỘ 10 LẦN',
        'primary',
    );
    configureBottom(root, countLabel);
    configureBack(root);
}
