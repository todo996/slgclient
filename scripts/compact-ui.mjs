import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const baseline = '3052ecbe5026a9bcf443cf51ab1186dddf60961d';
const redesign = 'a4b69bb7bd15211a1f4f3b2dfd5f257042b4a0bc';
const files = [
  'assets/scripts/map/ui/MapUILogic.ts','assets/scripts/map/ui/GeneralListLogic.ts','assets/scripts/map/ui/GeneralItemLogic.ts',
  'assets/scripts/map/ui/DrawLogic.ts','assets/scripts/map/ui/WarReportLogic.ts','assets/scripts/map/ui/WarReportItemLogic.ts',
  'assets/scripts/map/ui/WarReportDesLogic.ts','assets/scripts/map/ui/DrawRLogic.ts','assets/scripts/map/ui/GeneralInfoLogic.ts',
  'assets/scripts/map/ui/SkillLogic.ts','assets/scripts/map/ui/SkillItemLogic.ts','assets/scripts/map/ui/SkillInfoLogic.ts',
  'assets/scripts/map/ui/TransformLogic.ts','assets/scripts/chat/ChatLogic.ts','assets/scripts/chat/ChatItemLogic.ts',
  'assets/scripts/union/UnionLogic.ts','assets/scripts/union/UnionLobbyLogic.ts','assets/scripts/union/UnionItemLogic.ts',
];
const ccNeed = ['Button','Color','EditBox','Graphics','HorizontalTextAlignment','Label','Node','Sprite','UITransform','VerticalTextAlignment'];
const compact = `
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
`;

function show(commit,path){return execFileSync('git',['show',`${commit}:${path}`],{encoding:'utf8',maxBuffer:20*1024*1024});}
function mergeCc(src){return src.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]cc['"];/,(m,b)=>{const names=b.split(',').map(x=>x.trim()).filter(Boolean);return `import { ${[...new Set([...names,...ccNeed])].join(', ')} } from 'cc';`;});}
function removeI18n(src){const lines=src.split('\n');for(let i=lines.length-1;i>=0;i--){if(!lines[i].includes('i18n/I18n'))continue;let s=i;while(s>=0&&!/^\s*import\b/.test(lines[s]))s--;if(s<0)throw new Error('import start not found');lines.splice(s,i-s+1);i=s;}return lines.join('\n');}
function addCompact(src){const imports=[...src.matchAll(/import[\s\S]*?from\s*['"][^'"]+['"];/g)];const last=imports[imports.length-1];if(!last)throw new Error('imports missing');const at=last.index+last[0].length;return src.slice(0,at)+'\n'+compact+src.slice(at);}

fs.writeFileSync('assets/scripts/Main.ts',show(baseline,'assets/scripts/Main.ts'));
for(const file of files){let src=show(redesign,file);src=removeI18n(src);src=mergeCc(src);src=addCompact(src);fs.writeFileSync(file,src);console.log(`Compacted ${file}`);}
console.log('Restored build-proven Main.ts and compacted 18 redesigned controllers. CollectLogic keeps its already verified minimal implementation.');
