import { _decorator, Color, Component, Label, Layout, Node, Sprite, Button, EditBox, Graphics, HorizontalTextAlignment, UITransform, VerticalTextAlignment } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralCampType, GeneralData } from '../../general/GeneralProxy';
import { EventMgr } from '../../utils/EventMgr';
import GeneralHeadLogic from './GeneralHeadLogic';

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


export class GeneralItemType {
    static GeneralInfo = 0;
    static GeneralDispose = 1;
    static GeneralConScript = 2;
    static GeneralNoThing = 3;
    static GeneralSelect = 4;
}

@ccclass('GeneralItemLogic')
export default class GeneralItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    lvLabel: Label = null;
    @property(Sprite)
    spritePic: Sprite = null;
    @property(Label)
    costLabel: Label = null;
    @property(Label)
    campLabel: Label = null;
    @property(Label)
    armLabel: Label = null;
    @property(Layout)
    starLayout: Layout = null;
    @property(Node)
    delNode: Node = null;
    @property(Node)
    useNode: Node = null;
    @property(Node)
    selectNode: Node = null;

    private _curData: any = null;
    private _type = -1;
    private _position = 0;
    private _cityData: any = null;
    private _orderId = 1;
    private _isSelect = false;

    protected onLoad(): void {
        this.delNode.active = false;
        this._isSelect = false;
        this.applyModernCard();
    }

    private applyModernCard(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 1);
        drawAncientPanel(this.node, 342, 466, 8, new Color(22, 18, 15, 246));

        if (this.spritePic) {
            this.spritePic.enabled = true;
            this.spritePic.node.setSiblingIndex(this.node.children.length - 2);
        }

        const labels = [this.nameLabel, this.lvLabel, this.costLabel, this.campLabel, this.armLabel];
        for (const label of labels) {
            if (!label) {
                continue;
            }
            label.node.active = true;
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.enableWrapText = false;
            label.overflow = Label.Overflow.SHRINK;
            label.color = ANCIENT_UI.text;
        }

        if (this.nameLabel) {
            this.nameLabel.fontFamily = 'Times New Roman';
            this.nameLabel.fontSize = 25;
            this.nameLabel.lineHeight = 30;
            this.nameLabel.color = ANCIENT_UI.gold;
        }
        if (this.lvLabel) {
            this.lvLabel.fontSize = 17;
            this.lvLabel.lineHeight = 22;
            this.lvLabel.color = ANCIENT_UI.text;
        }
        if (this.campLabel) {
            this.campLabel.fontSize = 16;
            this.campLabel.color = ANCIENT_UI.goldSoft;
        }
        if (this.armLabel) {
            this.armLabel.fontSize = 17;
            this.armLabel.color = ANCIENT_UI.text;
        }
        if (this.costLabel) {
            this.costLabel.fontSize = 16;
            this.costLabel.color = ANCIENT_UI.muted;
        }
    }

    public setData(curData: GeneralData, type: number = 0, position: number = 0): void {
        this.updateItem(curData);
    }

    public updateItem(curData: any): void {
        this.updateView(curData);
        this._type = this._curData.type == undefined ? -1 : this._curData.type;
        this._position = this._curData.position == undefined ? 0 : this._curData.position;
    }

    protected updateView(curData: any): void {
        this._curData = curData;
        const cfgData = GeneralCommand.getInstance().proxy.getGeneralCfg(this._curData.cfgId);
        this.nameLabel.string = cfgData.name;
        this.lvLabel.string = `Lv.${this._curData.level}`;
        this.spritePic.getComponent(GeneralHeadLogic).setHeadId(this._curData.cfgId);
        this.showStar(cfgData.star, this._curData.star_lv);
        this.delNode.active = false;

        if (cfgData.camp == GeneralCampType.Han) {
            this.campLabel.string = 'Hán';
        } else if (cfgData.camp == GeneralCampType.Qun) {
            this.campLabel.string = 'Quần Hùng';
        } else if (cfgData.camp == GeneralCampType.Wei) {
            this.campLabel.string = 'Ngụy';
        } else if (cfgData.camp == GeneralCampType.Shu) {
            this.campLabel.string = 'Thục';
        } else if (cfgData.camp == GeneralCampType.Wu) {
            this.campLabel.string = 'Ngô';
        }

        this.armLabel.string = this.armstr(cfgData.arms);
        if (this.useNode) {
            this.useNode.active = this._type == GeneralItemType.GeneralInfo && this._curData.order > 0;
        }
        if (this.costLabel) {
            this.costLabel.string = `${cfgData.cost}`;
        }
        this.select(false);
    }

    protected armstr(arms: number[]): string {
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            return 'Bộ';
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            return 'Cung';
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            return 'Kỵ';
        }
        return '';
    }

    public select(flag: boolean): void {
        if (this.selectNode) {
            this.selectNode.active = flag;
        }
        this._isSelect = flag;
    }

    protected showStar(star: number = 3, star_lv: number = 0): void {
        const children = this.starLayout.node.children;
        for (let i = 0; i < children.length; i += 1) {
            if (i < star) {
                children[i].active = true;
                const sprite = children[i].getComponent(Sprite);
                if (sprite) {
                    sprite.color = i < star_lv
                        ? new Color(203, 74, 55, 255)
                        : ANCIENT_UI.gold;
                }
            } else {
                children[i].active = false;
            }
        }
    }

    protected setOtherData(cityData: any, orderId: number = 1): void {
        this._cityData = cityData;
        this._orderId = orderId;
        this.delNode.active = true;
    }

    protected onClickGeneral(event: any): void {
        AudioManager.instance.playClick();
        if (!this._curData) {
            return;
        }
        const cfgData = this._curData.config;
        if (this._type == GeneralItemType.GeneralInfo) {
            EventMgr.emit(LogicEvent.openGeneralDes, cfgData, this._curData);
        } else if (this._type == GeneralItemType.GeneralDispose) {
            EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, this._position);
        } else if (this._type == GeneralItemType.GeneralConScript) {
            EventMgr.emit(LogicEvent.openArmyConscript, this._orderId, this._cityData);
        } else if (this._type == GeneralItemType.GeneralSelect) {
            this._isSelect = !this._isSelect;
            this.select(this._isSelect);
            EventMgr.emit(LogicEvent.openGeneralSelect, cfgData, this._curData, this.node);
        }
    }

    protected onDelete(): void {
        const cfgData = this._curData.config;
        EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, -1);
    }

    public setWarReportData(curData: any): void {
        this.updateView(curData);
    }
}
