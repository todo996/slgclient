import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Label,
    Node,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import UnionCommand from "./UnionCommand";
import { Member, Union } from "./UnionProxy";
import { createGameText, ensureChild, ensureTransform, styleGameButton } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

function styleAction(button: Button, text: string, variant: 'primary' | 'secondary' | 'jade' | 'danger', x: number, y: number): void {
    button.node.setPosition(x, y, 0);
    styleGameButton(button.node, text, variant, 210, 48);
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

@ccclass('UnionMemberItemOpLogic')
export default class UnionMemberItemOpLogic extends Component {

    @property(Button)
    kickButton: Button = null;

    @property(Button)
    abdicateButton: Button = null;

    @property(Button)
    appointButton: Button = null;

    @property(Button)
    unAppointButton: Button = null;

    protected _menberData:Member = null;

    protected onLoad():void{
        this.applyLayout();
        this.node.on(Node.EventType.TOUCH_END, this.click, this);
    }

    private applyLayout(): void {
        const card = ensureChild(this.node, '__MemberOpCard');
        card.setSiblingIndex(0);
        card.setPosition(0, 0, 0);
        ensureTransform(card, 520, 340);
        const graphics = card.getComponent(Graphics) || card.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(18, 15, 12, 250);
        graphics.roundRect(-260, -170, 520, 340, 14);
        graphics.fill();
        graphics.fillColor = new Color(72, 48, 25, 70);
        graphics.roundRect(-250, -160, 500, 320, 10);
        graphics.fill();
        graphics.strokeColor = new Color(187, 133, 65, 235);
        graphics.lineWidth = 2;
        graphics.roundRect(-260, -170, 520, 340, 14);
        graphics.stroke();

        const title = createGameText(card, '__MemberOpTitle', 'QUẢN LÝ THÀNH VIÊN', 24, GameTheme.colors.gold300, 360, 44, true);
        title.node.setPosition(0, 125, 0);

        styleAction(this.kickButton, 'MỜI RỜI LIÊN MINH', 'danger', -115, 48);
        styleAction(this.appointButton, 'BỔ NHIỆM PHÓ MINH', 'jade', 115, 48);
        styleAction(this.unAppointButton, 'BÃI NHIỆM', 'secondary', -115, -28);
        styleAction(this.abdicateButton, 'NHƯỜNG MINH CHỦ', 'primary', 115, -28);
    }

    protected onDestroy():void{
        this.node.off(Node.EventType.TOUCH_END, this.click, this);
    }

    protected click():void{
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data):void{
        this._menberData = data;
        this.kickButton.node.active = false;
        this.abdicateButton.node.active = false;
        this.appointButton.node.active = false;
        this.unAppointButton.node.active = false;

        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        if (unionData){
            if(this._menberData.rid == city.rid){
                this.node.active = false;
            }else{
                if(unionData.getChairman().rid == city.rid){
                    this.unAppointButton.node.active = unionData.getViceChairman().rid == this._menberData.rid;
                    this.kickButton.node.active = unionData.isMajor(city.rid);
                    this.abdicateButton.node.active = unionData.getChairman().rid == city.rid;
                    this.appointButton.node.active = unionData.getChairman().rid == city.rid && unionData.getViceChairman().rid != this._menberData.rid;
                }else if(unionData.getViceChairman().rid == city.rid){
                    if(unionData.getChairman().rid == this._menberData.rid){
                        this.node.active = false;
                    }else{
                        this.unAppointButton.node.active = false;
                        this.kickButton.node.active = true;
                        this.abdicateButton.node.active = unionData.getViceChairman().rid != this._menberData.rid;
                        this.appointButton.node.active = false;
                        this.node.active = true;
                    }
                }else{
                    this.node.active = false;
                }
            }
        }else{
            this.node.active = false;
        }
    }

    protected kick():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionKick(this._menberData.rid);
        this.node.active = false;
    }

    protected appoint():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAppoint(this._menberData.rid, 1);
        this.node.active = false;
    }

    protected unAppoint():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAppoint(this._menberData.rid, 2);
        this.node.active = false;
    }

    protected abdicate():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionAbdicate(this._menberData.rid);
        this.node.active = false;
    }
}
