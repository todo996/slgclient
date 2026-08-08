import assert from "node:assert/strict";
import test from "node:test";
import {
  getOwnBattleResult,
  parseWarGenerals,
  parseWarRounds,
  WarReportProxy,
} from "../src/legacy/war/war-report-proxy.ts";

const generalRows = JSON.stringify([
  [11, 1001, 100, 1, 20, 0, 1, 1, 0, 2, 0, 0, 0, 0, 0, 1, 4],
  [22, 1002, 100, 1, 19, 0, 2, 1, 0, 2, 0, 0, 0, 0, 0, 0, 4],
]);

const report = {
  id: 7,
  a_rid: 101,
  d_rid: 202,
  b_a_general: generalRows,
  e_a_general: generalRows,
  b_d_general: JSON.stringify([[33, 1003, 90, 1, 18, 0, 3, 2, 0, 1, 0, 0, 0, 0, 0, 0, 3]]),
  e_d_general: "[]",
  b_a_army: "{}",
  e_a_army: "{}",
  b_d_army: "{}",
  e_d_army: "{}",
  rounds: JSON.stringify([{ b: [{
    a_id: 11,
    d_id: 33,
    d_loss: 120,
    a_bs: [{ f_id: 11, t_id: [33], c_id: 5001, lv: 2, i_e: [2], e_v: [15], e_r: [2], kill: [30] }],
  }] }]),
  result: 2,
  a_is_read: 0,
  d_is_read: 1,
  destroy: 250,
  occupy: 1,
  x: 18,
  y: 27,
  ctime: 1_700_000_000,
};

test("parseWarGenerals giữ nguyên 17 trường snapshot Cocos", () => {
  const values = parseWarGenerals(generalRows);
  assert.equal(values.length, 2);
  assert.deepEqual(values[0], {
    id: 11, cfgId: 1001, physicalPower: 100, order: 1, level: 20,
    exp: 0, cityId: 1, curArms: 1, hasPrPoint: 0, attackDistance: 2,
    forceAdded: 0, strategyAdded: 0, defenseAdded: 0, speedAdded: 0,
    destroyAdded: 0, starLv: 1, star: 4,
  });
});

test("parseWarRounds giữ hiệp, lượt, phe tấn công và kỹ năng", () => {
  const attack = parseWarGenerals(generalRows);
  const defense = parseWarGenerals(report.b_d_general);
  const rounds = parseWarRounds(report.rounds, attack, defense);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0]?.round, 1);
  assert.equal(rounds[0]?.turn, 1);
  assert.equal(rounds[0]?.isAttack, true);
  assert.equal(rounds[0]?.defenseLoss, 120);
  assert.deepEqual(rounds[0]?.attackBefore[0], {
    fromId: 11, toId: [33], cfgId: 5001, level: 2,
    includeEffect: [2], effectValue: [15], effectRound: [2], kill: [30],
  });
});

test("WarReportProxy sắp ID mới trước và đọc theo đúng phe người chơi", () => {
  const proxy = new WarReportProxy();
  proxy.setRoleId(101);
  proxy.updateReports({ list: [{ ...report, id: 6 }, report] });
  assert.deepEqual(proxy.getReports().map((item) => item.id), [7, 6]);
  assert.equal(proxy.isRead(7), false);
  assert.equal(proxy.unreadCount(), 2);
  proxy.markRead(7);
  assert.equal(proxy.isRead(7), true);
  assert.equal(proxy.unreadCount(), 1);
  proxy.markRead(0);
  assert.equal(proxy.unreadCount(), 0);
});

test("Kết quả chiến báo đổi đúng theo vai trò công hoặc thủ", () => {
  const proxy = new WarReportProxy();
  proxy.setRoleId(101);
  const parsed = proxy.updateReport(report);
  assert.ok(parsed);
  assert.equal(getOwnBattleResult(parsed, 101), "win");
  assert.equal(getOwnBattleResult(parsed, 202), "lose");
  assert.equal(getOwnBattleResult({ ...parsed, result: 0 }, 202), "win");
  assert.equal(getOwnBattleResult({ ...parsed, result: 1 }, 101), "draw");
});
