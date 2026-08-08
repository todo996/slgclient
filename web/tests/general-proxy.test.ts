import assert from "node:assert/strict";
import test from "node:test";
import {
  GeneralProxy,
  getGeneralArmLabel,
  getGeneralCampLabel,
} from "../src/legacy/general/general-proxy.ts";

const generalConfig = {
  list: [
    { cfgId: 100001, name: "Lưu Bị", star: 5, camp: 4, arms: [1], cost: 3 },
    { cfgId: 100002, name: "Quan Vũ", star: 5, camp: 4, arms: [3], cost: 3 },
    { cfgId: 100003, name: "Trương Phi", star: 4, camp: 4, arms: [2], cost: 2 },
  ],
};
const generalBasic = { levels: [{ level: 1, exp: 100, soldiers: 100 }] };
const basic = {
  general: {
    physical_power_limit: 100,
    cost_physical_power: 1,
    recovery_physical_power: 10,
    reclamation_time: 30,
    draw_general_cost: 30,
    limit: 500,
  },
};

const createProxy = (): GeneralProxy => {
  const proxy = new GeneralProxy();
  proxy.initGeneralConfig(generalConfig, generalBasic, basic);
  return proxy;
};

test("Cấu hình võ tướng giữ nguyên camp, arms và giới hạn", () => {
  const proxy = createProxy();
  assert.equal(proxy.getGeneralCfg(100001)?.name, "Lưu Bị");
  assert.equal(proxy.getGeneralLevelCfg(1)?.soldiers, 100);
  assert.equal(proxy.getCommonCfg().limit, 500);
  assert.equal(getGeneralCampLabel(4), "Thục");
  assert.equal(getGeneralArmLabel([1]), "Bộ");
  assert.equal(getGeneralArmLabel([2]), "Cung");
  assert.equal(getGeneralArmLabel([3]), "Kỵ");
});

test("Danh sách võ tướng giữ quy tắc dùng trước, sao cao trước và loại tướng con", () => {
  const proxy = createProxy();
  proxy.updateMyGenerals([
    { id: 1, cfgId: 100003, level: 1, order: 0, parentId: 0, state: 0 },
    { id: 2, cfgId: 100002, level: 1, order: 2, parentId: 0, state: 0 },
    { id: 3, cfgId: 100001, level: 1, order: 0, parentId: 9, state: 0 },
    { id: 4, cfgId: 100001, level: 1, order: 0, parentId: 0, state: 0 },
  ]);

  assert.deepEqual(proxy.getUseGenerals().map((item) => item.id), [2, 4, 1]);
  assert.equal(proxy.getMyActiveGeneralCount(), 4);
});

test("general.push state khác 0 xóa võ tướng như client Cocos", () => {
  const proxy = createProxy();
  proxy.updateMyGenerals([{ id: 1, cfgId: 100001, state: 0 }]);
  proxy.updateGeneral({ id: 1, cfgId: 100001, state: 1 });
  assert.equal(proxy.getMyGeneral(1), null);
});
