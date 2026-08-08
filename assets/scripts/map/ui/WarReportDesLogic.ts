import { _decorator, Component, Label, Node, ScrollView, instantiate, Button, Color, EditBox, Graphics, HorizontalTextAlignment, Sprite, UITransform, VerticalTextAlignment } from 'cc';
import { AudioManager } from '../../common/AudioManager';

const { ccclass, property } = _decorator;
import { WarReport } from './MapUIProxy';
import WarReportDesItemLogic from './WarReportDesItemLogic';

const ANCIENT_UI = {
    gold: new Color(231,190,109,255), goldSoft: new Color(196,168,115,235), text: new Color(239,225,198,255),
    muted: new Color(177,163,139,255), panel: new Color(17,14,12,242), panelSoft: new Color(31,25,20,236),
    border: new Color(152,107,54,235), jade: new Color(38,76,63,255), red: new Color(117,47,39,255), success: new Color(111,183,97,255),
};
const UI_TX: any = {'武将':'Tướng','将领':'Tướng','征兵':'Chiêu mộ','战报':'Chiến báo','联盟':'Liên minh','市场':'Chợ','税收':'Thu thuế','聊天':'Trò chuyện','技能':'Kỹ năng','设置':'Cài đặt','世界':'Thế giới','关闭':'Đóng','成员':'Thành viên','申请':'Đăng ký','日志':'Nhật ký','木材':'Gỗ','铁矿':'Sắt','石料':'Đá','粮食':'Lương thực'};
function localizeNode(root: Node): void { for (const l of root.getComponentsInChildren(Label)) { l.useSystemFont=true; l.fontFamily='Arial'; l.string=UI_TX[l.string] || l.string; } }
function ensureUiTransform(n: Node,w:number,h:number): UITransform { const t=n.getComponent(UITransform)||n.addComponent(UITransform); t.setContentSize(w,h); return t; }
function ensureUiChild(p:Node,name:string):Node { let n=p.getChildByName(name); if(!n){n=new Node(name);n.setParent(p);} return n; }
function hideDirectUiSprites(n:Node):void { for(const s of n.getComponents(Sprite)) s.enabled=false; }
function suppressLegacyChrome(root:Node,max:number=2):void { const walk=(n:Node,d:number)=>{if(d>max)return;const x=n.name.toLowerCase();if(/(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(x)&&!/(icon|pic|head|avatar|portrait|general|skill|map|army|star)/.test(x))hideDirectUiSprites(n);for(const c of n.children)walk(c,d+1);};walk(root,0); }
function drawAncientPanel(n:Node,w:number,h:number,r:number=10,fill:Color=ANCIENT_UI.panel):void { ensureUiTransform(n,w,h);const s=ensureUiChild(n,'__AncientSkin');s.setSiblingIndex(0);ensureUiTransform(s,w,h);const g=s.getComponent(Graphics)||s.addComponent(Graphics);g.clear();g.fillColor=fill;g.roundRect(-w/2,-h/2,w,h,r);g.fill();g.strokeColor=ANCIENT_UI.border;g.lineWidth=2;g.roundRect(-w/2+3,-h/2+3,w-6,h-6,Math.max(4,r-2));g.stroke(); }
function createUiText(p:Node,name:string,text:string,size:number,color:Color,w:number,h:number,title:boolean=false):Label { const n=ensureUiChild(p,name);ensureUiTransform(n,w,h);const l=n.getComponent(Label)||n.addComponent(Label);l.useSystemFont=true;l.fontFamily=title?'Times New Roman':'Arial';l.string=text;l.fontSize=size;l.lineHeight=Math.ceil(size*1.25);l.enableWrapText=false;l.overflow=Label.Overflow.SHRINK;l.horizontalAlign=HorizontalTextAlignment.CENTER;l.verticalAlign=VerticalTextAlignment.CENTER;l.color=color;return l; }
function getButtonHandler(b:Button):string { for(const e of (b.clickEvents as any[])||[]) if(e&&typeof e.handler==='string'&&e.handler)return e.handler; return ''; }
function findButtonByHandler(root:Node,h:string):Button|null { return root.getComponentsInChildren(Button).find(b=>getButtonHandler(b)===h)||null; }
function styleAncientButton(n:Node,text:string,v:'gold'|'dark'|'jade'|'red'='dark',w:number=180,h:number=50):Button { ensureUiTransform(n,w,h);hideDirectUiSprites(n);const s=ensureUiChild(n,'__AncientBtn');s.setSiblingIndex(0);ensureUiTransform(s,w,h);const g=s.getComponent(Graphics)||s.addComponent(Graphics);g.clear();g.fillColor=v==='gold'?new Color(120,78,28,255):v==='jade'?ANCIENT_UI.jade:v==='red'?ANCIENT_UI.red:ANCIENT_UI.panelSoft;g.roundRect(-w/2,-h/2,w,h,7);g.fill();g.strokeColor=v==='gold'?ANCIENT_UI.gold:ANCIENT_UI.border;g.lineWidth=2;g.roundRect(-w/2+2,-h/2+2,w-4,h-4,6);g.stroke();for(const l of n.getComponentsInChildren(Label))if(l.node.name!=='__AncientLabel')l.node.active=false;const l=createUiText(n,'__AncientLabel',text,v==='gold'?21:18,v==='gold'?new Color(255,239,194,255):ANCIENT_UI.text,w-18,h-8,true);l.node.active=true;l.node.setSiblingIndex(n.children.length-1);const b=n.getComponent(Button)||n.addComponent(Button);b.transition=Button.Transition.SCALE;b.zoomScale=.97;b.duration=.08;return b; }
function styleAncientEditBox(e:EditBox,p:string,w:number,h:number):void { const n=e.node;ensureUiTransform(n,w,h);hideDirectUiSprites(n);const s=ensureUiChild(n,'__AncientInput');s.setSiblingIndex(0);ensureUiTransform(s,w,h);const g=s.getComponent(Graphics)||s.addComponent(Graphics);g.clear();g.fillColor=new Color(18,16,14,238);g.roundRect(-w/2,-h/2,w,h,7);g.fill();g.strokeColor=ANCIENT_UI.border;g.lineWidth=1;g.roundRect(-w/2+1,-h/2+1,w-2,h-2,7);g.stroke();e.placeholder=p;if(e.placeholderLabel){e.placeholderLabel.useSystemFont=true;e.placeholderLabel.fontFamily='Arial';}if(e.textLabel){e.textLabel.useSystemFont=true;e.textLabel.fontFamily='Arial';} }
function addAncientScreenTitle(root:Node,title:string):void { const h=ensureUiChild(root,'__AncientHeader');h.setPosition(0,320,0);h.setSiblingIndex(root.children.length-1);const l=createUiText(h,'__AncientTitle',title,39,ANCIENT_UI.gold,360,58,true);l.node.setPosition(0,0,0); }
function applyAncientScreenChrome(root:Node,title:string):void { localizeNode(root);suppressLegacyChrome(root,2);const b=ensureUiChild(root,'__AncientBackdrop');b.setSiblingIndex(0);drawAncientPanel(b,1280,720,0,new Color(12,10,9,205));addAncientScreenTitle(root,title); }


@ccclass('WarReportDesLogic')
export default class WarReportDesLogic extends Component {
    private _curData: WarReport = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    item: Node = null;

    _lastY = 0;
    _curNum = 0;

    protected onLoad(): void {
        this.item.active = false;
        this.scrollView.node.on('scroll-to-bottom', this.scrollToBottom, this);
        this.applyModernDetail();
    }

    protected onEnable(): void {
        this.scrollView.scrollToTop();
        this.applyModernDetail();
    }

    private applyModernDetail(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 3);
        this.node.setPosition(350, -8, 0);
        drawAncientPanel(this.node, 500, 520, 10);

        const title = createUiText(
            this.node,
            '__WarDetailTitle',
            'CHI TIẾT CHIẾN ĐẤU',
            20,
            ANCIENT_UI.gold,
            360,
            44,
            true,
        );
        title.node.setPosition(0, 222, 0);
        title.node.setSiblingIndex(this.node.children.length - 1);

        this.scrollView.node.setPosition(0, -12, 0);
        ensureUiTransform(this.scrollView.node, 450, 410);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 450, 410);
        }
        if (this.scrollView.content) {
            ensureUiTransform(this.scrollView.content, 450, 410);
        }

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(214, 222, 0);
            styleAncientButton(close.node, '×', 'dark', 46, 42);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    public setData(data: any): void {
        this.scrollView.content.removeAllChildren();
        this._curData = data;
        this._curNum = 0;
        this.make();
        this.scrollView.scrollToTop();
    }

    private make(): void {
        const max = Math.min(6, this._curData.rounds.length - this._curNum);
        for (let index = this._curNum; index < this._curNum + max; index += 1) {
            const round = this._curData.rounds[index];
            const item = instantiate(this.item);
            item.active = true;
            item.parent = this.scrollView.content;
            item.getComponent(WarReportDesItemLogic)
                .setData(round, this._curData, index == this._curData.rounds.length - 1);
        }
        this._curNum += max;
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected scrollToBottom(): void {
        this.make();
    }
}
