import { ArmyCommand } from "../legacy/army/army-command";
import { LogicEvent } from "../legacy/common/logic-event";
import { EventMgr } from "../legacy/events/event-manager";
import { GeneralCommand } from "../legacy/general/general-command";
import { LoginCommand } from "../legacy/login/login-command";
import type { MapBootstrapSnapshot } from "../legacy/map/map-bootstrap-command";
import { SkillCommand } from "../legacy/skill/skill-command";
import { WarReportCommand } from "../legacy/war/war-report-command";
import {
  createDemoSnapshot,
  DEMO_ROLE_ID,
  demoGenerals,
  demoReport,
  demoSkills,
  respondToDemoRequest,
} from "./demo-data";

export { respondToDemoRequest };

export async function seedDemoClientData(): Promise<MapBootstrapSnapshot> {
  const snapshot = createDemoSnapshot();
  const login = LoginCommand.getInstance();
  login.proxy.saveLoginData({ uid: DEMO_ROLE_ID, session: "demo-session" });
  login.proxy.saveEnterData({
    role: {
      rid: DEMO_ROLE_ID,
      uid: DEMO_ROLE_ID,
      nickName: "Khách thử nghiệm",
      sex: 1,
      sid: 1,
      balance: 9_999,
      headId: 100003,
      profile: "Chế độ demo ngoại tuyến",
    },
    role_res: {
      decree: 20,
      grain: 120_000,
      wood: 98_000,
      iron: 86_000,
      stone: 75_000,
      gold: 8_888,
      depot_capacity: 200_000,
      wood_yield: 1_200,
      iron_yield: 1_000,
      stone_yield: 900,
      grain_yield: 1_400,
    },
    token: "demo-token",
  });

  const general = GeneralCommand.getInstance();
  const skill = SkillCommand.getInstance();
  await Promise.all([general.ensureConfig(), skill.ensureConfig()]);
  general.proxy.updateMyGenerals(demoGenerals);
  skill.proxy.updateSkills(demoSkills);
  ArmyCommand.getInstance().updateMyProperty(snapshot.roleProperty);
  const war = WarReportCommand.getInstance();
  war.proxy.setRoleId(DEMO_ROLE_ID);
  war.proxy.updateReports({ list: [demoReport] });

  EventMgr.emit(LogicEvent.updateGeneralList);
  EventMgr.emit(LogicEvent.skillListInfo);
  EventMgr.emit(LogicEvent.updateWarReport, war.proxy.getReports());
  return snapshot;
}
