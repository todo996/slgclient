// /**Chiêu mộ相关**/
// /**Võ tướng相关**/

import { _decorator } from 'cc';
export class Conscript {
    cost_wood: number = 0;
    cost_iron: number = 0;
    cost_stone: number = 0;
    cost_grain: number = 0;
    cost_gold: number = 0;
}

export class General {
	physical_power_limit: number = 0;       //Thể lựcTrên限
	cost_physical_power: number = 0;        //Tiêu haoThể lực
	recovery_physical_power: number = 0;    //恢复Thể lực
	reclamation_time: number = 0;           //Đồn điềnTiêu haoThời gian，单位giây
	reclamation_cost: number = 0;           //Đồn điềnTiêu haoLệnh
	draw_general_cost: number = 0;          //Chiêu mộ tướngTiêu haoVàng
	pr_point: number = 0;                   //Dung hợpMột个Võ tướng或者的Kỹ năng点
	limit: number = 0;                      //Võ tướngSố lượngTrên限
}

export class Role {
	wood: number = 0;
	iron: number = 0;
	stone: number = 0;
	grain: number = 0;
	gold: number = 0;
	decree: number = 0;
	wood_yield: number = 0;
	iron_yield: number = 0;
	stone_yield: number = 0;
	grain_yield: number = 0;
	gold_yield: number = 0;
	depot_capacity: number = 0;		 //Kho初始容量
	build_limit: number = 0;		 //野外Công trìnhTrên限
	recovery_time: number = 0;
	decree_limit: number = 0;        //LệnhTrên限
	collect_times_limit: number = 0; //每日Lượt thu thuếTrên限
	collect_interval: number = 0;    //Thu thuế间隔
	pos_tag_limit: number = 0;       //位置Đánh dấuTrên限
}

export class City {
    cost: number = 0;
    durable: number = 0;
	recovery_time: number = 0;
	transform_rate: number = 0;
}

export class Build {
	war_free: number = 0;       //Miễn chiếnThời gian，单位giây
	giveUp_time: number = 0;    //Công trìnhTừ bỏThời gian
	fortress_limit: number = 0; //要塞Trên限
}

export class Union {
	member_limit: number = 0;
}

export class NpcLevel  {
	soilders: number
}

export class Npc {
	levels: NpcLevel[]
}

export class Basic {
    conscript: Conscript;
    general: General;
    role: Role;
    city: City;
    build: Build;
    union: Union;
    npc: Npc;
}
