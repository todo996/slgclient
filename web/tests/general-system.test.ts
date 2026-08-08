import assert from "node:assert/strict";
import test from "node:test";
import type { GeneralConfig, GeneralData } from "../src/legacy/general/general-proxy.ts";
import {
  adjustAttributeAllocation,
  createAttributeAllocation,
  getAvailableAttributePoints,
  sortGeneralRoster,
  toggleLimitedSelection,
} from "../src/ui/general/general-system-data.ts";
import { renderSkillDescription, type SkillConfig } from "../src/legacy/skill/skill-proxy.ts";

const config = (cfgId: number, star: number): GeneralConfig => ({
  name: String(cfgId), cfgId, force: 1000, strategy: 1000, defense: 1000,
  speed: 1000, destroy: 1000, cost: 3, forceGrow: 10, strategyGrow: 10,
  defenseGrow: 10, speedGrow: 10, destroyGrow: 10, physicalPowerLimit: 100,
  costPhysicalPower: 1, probability: 1, star, arms: [1], camp: 1,
});
const general: GeneralData = {
  id: 1, cfgId: 1, exp: 0, level: 1, physicalPower: 100, order: 0,
  starLv: 0, parentId: 0, state: 0, hasPrPoint: 500, usePrPoint: 0,
  forceAdded: 100, strategyAdded: 0, defenseAdded: 0, speedAdded: 0,
  destroyAdded: 0, skills: [], config: config(1, 5),
};

test("Cộng điểm giữ bước 100 và không vượt điểm còn lại", () => {
  let allocation = createAttributeAllocation(general);
  allocation = adjustAttributeAllocation(general, allocation, "force", 1);
  assert.equal(allocation.force, 200);
  assert.equal(getAvailableAttributePoints(general, allocation), 300);
  for (let index = 0; index < 10; index += 1) {
    allocation = adjustAttributeAllocation(general, allocation, "strategy", 1);
  }
  assert.equal(allocation.strategy, 300);
  assert.equal(getAvailableAttributePoints(general, allocation), 0);
});

test("Chuyển đổi giới hạn đúng 9 võ tướng và cho phép bỏ chọn", () => {
  let selected: ReadonlySet<number> = new Set();
  for (let id = 1; id <= 10; id += 1) selected = toggleLimitedSelection(selected, id, 9);
  assert.equal(selected.size, 9);
  selected = toggleLimitedSelection(selected, 3, 9);
  assert.equal(selected.has(3), false);
});

test("Đồ giám giữ quy tắc sao giảm dần rồi cfgId tăng dần", () => {
  assert.deepEqual(
    sortGeneralRoster([config(3, 4), config(2, 5), config(1, 5)]).map((item) => item.cfgId),
    [1, 2, 3],
  );
});

test("Mô tả kỹ năng thay đúng %n% và phần trăm Cocos", () => {
  const skill: SkillConfig = {
    cfgId: 101, name: "Đột kích", trigger: 1, target: 5,
    description: "Gây `%n%%` sát thương", limit: 3, arms: [1], includeEffect: [1],
    levels: [{ probability: 30, effectValue: [50], effectRound: [0] }],
  };
  assert.equal(renderSkillDescription(skill, 0), "Gây 50% sát thương");
});
