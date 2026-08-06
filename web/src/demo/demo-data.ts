import { ServerConfig } from "../legacy/config/server-config.ts";
import type { MapBootstrapSnapshot } from "../legacy/map/map-bootstrap-command.ts";
import type { IncomingEnvelope, OutgoingEnvelope } from "../legacy/network/socket/net-interface.ts";

export const DEMO_ROLE_ID = 9001;
const DEMO_CITY_ID = 7001;
const NOW_SECONDS = Math.floor(Date.now() / 1000);

export const demoGenerals = [
  {
    id: 501,
    cfgId: 100003,
    exp: 12_000,
    level: 12,
    physical_power: 100,
    order: 1,
    star_lv: 1,
    parentId: 0,
    state: 0,
    hasPrPoint: 800,
    usePrPoint: 200,
    force_added: 100,
    strategy_added: 0,
    defense_added: 100,
    speed_added: 0,
    destroy_added: 0,
    skills: [{ id: 1, cfgId: 101, lv: 3 }],
  },
  {
    id: 502,
    cfgId: 100004,
    exp: 9_000,
    level: 10,
    physical_power: 96,
    order: 2,
    star_lv: 0,
    parentId: 0,
    state: 0,
    hasPrPoint: 600,
    usePrPoint: 100,
    force_added: 0,
    strategy_added: 100,
    defense_added: 0,
    speed_added: 100,
    destroy_added: 0,
    skills: [{ id: 2, cfgId: 201, lv: 2 }],
  },
  {
    id: 503,
    cfgId: 100005,
    exp: 6_000,
    level: 8,
    physical_power: 92,
    order: 3,
    star_lv: 0,
    parentId: 0,
    state: 0,
    hasPrPoint: 400,
    usePrPoint: 0,
    force_added: 0,
    strategy_added: 0,
    defense_added: 0,
    speed_added: 0,
    destroy_added: 0,
    skills: [{ id: 3, cfgId: 301, lv: 1 }],
  },
] as const;

export const demoSkills = [
  { id: 1, cfgId: 101, generals: [501] },
  { id: 2, cfgId: 201, generals: [502] },
  { id: 3, cfgId: 301, generals: [503] },
  { id: 4, cfgId: 401, generals: [] },
] as const;

export const demoArmies = [
  {
    id: 801,
    cityId: DEMO_CITY_ID,
    order: 1,
    generals: [501, 502, 503],
    soldiers: [900, 800, 700],
    con_times: [0, 0, 0],
    con_cnts: [0, 0, 0],
    cmd: 0,
    state: 0,
    from_x: 100,
    from_y: 100,
    to_x: 100,
    to_y: 100,
    start: 0,
    end: 0,
  },
  {
    id: 802,
    cityId: DEMO_CITY_ID,
    order: 2,
    generals: [501, 0, 0],
    soldiers: [500, 0, 0],
    con_times: [0, 0, 0],
    con_cnts: [0, 0, 0],
    cmd: 1,
    state: 1,
    from_x: 100,
    from_y: 100,
    to_x: 106,
    to_y: 96,
    start: NOW_SECONDS - 30,
    end: NOW_SECONDS + 90,
  },
] as const;

export const demoReport = {
  id: 9901,
  a_rid: DEMO_ROLE_ID,
  d_rid: 9002,
  b_a_general: JSON.stringify([
    [501, 100003, 100, 1, 12, 12000, DEMO_CITY_ID, 3, 800, 2, 100, 0, 100, 0, 0, 1, 5],
    [502, 100004, 96, 2, 10, 9000, DEMO_CITY_ID, 3, 600, 2, 0, 100, 0, 100, 0, 0, 5],
  ]),
  e_a_general: JSON.stringify([
    [501, 100003, 94, 1, 12, 12100, DEMO_CITY_ID, 3, 800, 2, 100, 0, 100, 0, 0, 1, 5],
  ]),
  b_d_general: JSON.stringify([
    [601, 100006, 100, 1, 10, 8000, 8001, 1, 0, 2, 0, 0, 0, 0, 0, 0, 5],
  ]),
  e_d_general: "[]",
  b_a_army: JSON.stringify({ soldiers: [900, 800, 0] }),
  e_a_army: JSON.stringify({ soldiers: [780, 690, 0] }),
  b_d_army: JSON.stringify({ soldiers: [1200, 0, 0] }),
  e_d_army: JSON.stringify({ soldiers: [0, 0, 0] }),
  rounds: JSON.stringify([{ b: [{
    a_id: 501,
    d_id: 601,
    d_loss: 320,
    a_bs: [{ f_id: 501, t_id: [601], c_id: 101, lv: 3, i_e: [1], e_v: [50], e_r: [0], kill: [320] }],
    a_as: [],
    d_as: [],
  }] }]),
  result: 2,
  a_is_read: 0,
  d_is_read: 1,
  destroy: 120,
  occupy: 1,
  x: 106,
  y: 96,
  ctime: NOW_SECONDS - 300,
} as const;

export function createDemoSnapshot(): MapBootstrapSnapshot {
  return {
    nationMapConfig: { demo: true },
    roleProperty: {
      citys: [{
        cityId: DEMO_CITY_ID,
        rid: DEMO_ROLE_ID,
        name: "Tân Dã",
        x: 100,
        y: 100,
        is_main: 1,
        level: 8,
        cur_durable: 10_000,
        max_durable: 10_000,
        union_id: 0,
        parent_id: 0,
        union_name: "",
        occupy_time: 0,
      }],
      mr_builds: [{
        rid: DEMO_ROLE_ID,
        RNick: "Khách thử nghiệm",
        name: "Pháo đài tiền tuyến",
        x: 104,
        y: 98,
        type: 1,
        level: 2,
        op_level: 0,
        cur_durable: 1_500,
        max_durable: 1_500,
        defender: 0,
        union_id: 0,
        parent_id: 0,
        union_name: "",
        occupy_time: 0,
        giveUp_time: 0,
        end_time: 0,
      }],
      armys: demoArmies,
    },
    positionTags: {
      pos_tags: [
        { name: "Thành chính", x: 100, y: 100 },
        { name: "Mục tiêu", x: 106, y: 96 },
      ],
    },
  };
}

export function respondToDemoRequest(
  request: OutgoingEnvelope,
): IncomingEnvelope {
  const message = request.msg && typeof request.msg === "object"
    ? request.msg as Record<string, unknown>
    : {};
  let responseMessage: unknown = {};

  switch (request.name) {
    case ServerConfig.general_myGenerals:
      responseMessage = { generals: demoGenerals };
      break;
    case ServerConfig.skill_list:
      responseMessage = { list: demoSkills };
      break;
    case ServerConfig.army_myList:
      responseMessage = {
        cityId: Number(message.cityId ?? DEMO_CITY_ID),
        armys: demoArmies,
      };
      break;
    case ServerConfig.army_myOne:
      responseMessage = { army: demoArmies[0] };
      break;
    case ServerConfig.war_report:
      responseMessage = { list: [demoReport] };
      break;
    case ServerConfig.war_read:
      responseMessage = { id: Number(message.id ?? 0) };
      break;
    case ServerConfig.nationMap_scanBlock:
      responseMessage = { mc_builds: [], mr_builds: [], armys: demoArmies };
      break;
    default:
      responseMessage = { demo: true };
  }

  return {
    name: request.name,
    msg: responseMessage,
    seq: Number(request.seq ?? 0),
    code: 0,
  };
}
