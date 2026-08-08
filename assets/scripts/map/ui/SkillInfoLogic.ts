import { _decorator, Button, Component, Label, Node, Color, EditBox, Graphics, HorizontalTextAlignment, Sprite, UITransform, VerticalTextAlignment } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { SkillConf, SkillOutline } from '../../config/skill/Skill';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralData } from '../../general/GeneralProxy';
import SkillCommand from '../../skill/SkillCommand';
import { Skill } from '../../skill/SkillProxy';
import { EventMgr } from '../../utils/EventMgr';
import SkillIconLogic from './SkillIconLogic';

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


@ccclass('SkillInfoLogic')
export default class SkillInfoLogic extends Component {
    @property(Label)
    nameLab: Label = null;
    @property(Node)
    icon: Node = null;
    @property(Label)
    lvLab: Label = null;
    @property(Label)
    triggerLab: Label = null;
    @property(Label)
    targetLab: Label = null;
    @property(Label)
    armLab: Label = null;
    @property(Label)
    rateLab: Label = null;
    @property(Label)
    curDesLab: Label = null;
    @property(Label)
    nextDesLab: Label = null;
    @property(Button)
    learnBtn: Button = null;
    @property(Button)
    lvBtn: Button = null;
    @property(Button)
    giveUpBtn: Button = null;

    _data: Skill = null;
    _cfg: SkillConf = null;
    _general: GeneralData = null;
    _type = 0;
    _skillPos = -1;

    protected onEnable(): void {
        this.learnBtn.node.active = false;
        this.applyModernSkillInfo();
    }

    private applyModernSkillInfo(): void {
        applyAncientScreenChrome(this.node, 'Kỹ năng');
        const body = ensureUiChild(this.node, '__SkillInfoBody');
        body.setPosition(0, -8, 0);
        body.setSiblingIndex(0);
        drawAncientPanel(body, 1160, 560, 10);

        const labels = [
            this.nameLab,
            this.lvLab,
            this.triggerLab,
            this.targetLab,
            this.armLab,
            this.rateLab,
            this.curDesLab,
            this.nextDesLab,
        ];
        for (const label of labels) {
            if (!label) {
                continue;
            }
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.color = ANCIENT_UI.text;
        }
        if (this.nameLab) {
            this.nameLab.fontFamily = 'Times New Roman';
            this.nameLab.color = ANCIENT_UI.gold;
            this.nameLab.fontSize = 28;
        }
        if (this.lvLab) {
            this.lvLab.color = ANCIENT_UI.goldSoft;
        }
        if (this.curDesLab) {
            this.curDesLab.color = ANCIENT_UI.text;
        }
        if (this.nextDesLab) {
            this.nextDesLab.color = ANCIENT_UI.success;
        }

        if (this.learnBtn) {
            styleAncientButton(this.learnBtn.node, 'Học kỹ năng', 'jade', 190, 52);
        }
        if (this.lvBtn) {
            styleAncientButton(this.lvBtn.node, 'Nâng cấp', 'gold', 180, 52);
        }
        if (this.giveUpBtn) {
            styleAncientButton(this.giveUpBtn.node, 'Đổi kỹ năng', 'red', 190, 52);
        }
        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data: Skill, type: number, general: GeneralData, skillPos: number): void {
        const conf = SkillCommand.getInstance().proxy.getSkillCfg(data.cfgId);
        this.icon.getComponent(SkillIconLogic).setData(data, null);
        const outLine: SkillOutline = SkillCommand.getInstance().proxy.outLine;

        this._cfg = conf;
        this._data = data;
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;

        this.learnBtn.node.active = type == 1;
        this.giveUpBtn.node.active = type == 2;
        this.nameLab.string = conf.name;

        let isShowLv = false;
        let lv = 0;
        if (type == 2) {
            for (let index = 0; index < general.skills.length; index += 1) {
                const gskill = general.skills[index];
                if (gskill && gskill.cfgId == data.cfgId && gskill.lv <= conf.levels.length) {
                    isShowLv = true;
                    lv = gskill.lv;
                    break;
                }
            }
        }

        this.lvBtn.node.active = isShowLv;
        this.lvLab.string = isShowLv ? `Cấp ${lv}` : '';
        this.triggerLab.string = outLine.trigger_type.list[conf.trigger - 1].des;
        this.rateLab.string = `${conf.levels[0].probability}%`;
        this.targetLab.string = outLine.target_type.list[conf.target - 1].des;
        this.armLab.string = this.armstr(conf.arms);

        let des1 = conf.des;
        for (let index = 0; index < conf.levels[0].effect_value.length; index += 1) {
            des1 = des1.replace('%n%', `${conf.levels[0].effect_value[index]}`);
        }
        this.curDesLab.string = des1;

        let des2 = conf.des;
        if (conf.levels.length > 1) {
            for (let index = 0; index < conf.levels[1].effect_value.length; index += 1) {
                des2 = des2.replace('%n%', `${conf.levels[1].effect_value[index]}`);
            }
        }
        this.nextDesLab.string = des2;
    }

    protected armstr(arms: number[]): string {
        const parts: string[] = [];
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            parts.push('Bộ');
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            parts.push('Cung');
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            parts.push('Kỵ');
        }
        return parts.join(' · ');
    }

    protected onClickLearn(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().upSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickLv(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().lvSkill(this._general.id, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickForget(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().downSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }
}
