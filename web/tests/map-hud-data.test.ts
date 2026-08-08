import assert from "node:assert/strict";
import test from "node:test";
import {
  HUD_MENU_ACTIONS,
  createHudResources,
  formatCompactNumber,
  isValidMapCoordinate,
  readHudArmies,
  readHudCities,
  readHudTags,
} from "../src/ui/map-hud-data.ts";

const snapshot = {
  nationMapConfig: {},
  roleProperty: {
    citys: [{ cityId: 1, name: "Lạc Dương", x: 10, y: 20, is_main: 1 }],
    armys: [{ id: 2, cityId: 1, order: 1, cmd: 0, state: 0, x: 10, y: 20, from_x: 10, from_y: 20, to_x: 10, to_y: 20, soldiers: [100, 200, 300], end_time: 0 }],
  },
  positionTags: { pos_tags: [{ name: "Mỏ sắt", x: 8, y: 9 }] },
} as const;

test("HUD giữ đúng thứ tự 8 menu từ MapUIScene.prefab", () => {
  assert.deepEqual(HUD_MENU_ACTIONS.map((item) => item.label), [
    "Võ tướng", "Chiến báo", "Chiêu mộ", "Liên minh",
    "Trưng thu", "Chợ", "Chat", "Kỹ năng",
  ]);
});

test("HUD giữ đúng thứ tự 10 ô tài nguyên của MapUILogic", () => {
  const values = createHudResources({ decree: 5, grain: 100, wood: 200, iron: 300, stone: 400, gold: 50, depot_capacity: 1000, wood_yield: 1, iron_yield: 2, stone_yield: 3, grain_yield: 4 });
  assert.deepEqual(values.map((item) => item.key), [
    "decree", "grain", "wood", "iron", "stone",
    "gold", "wood_yield", "iron_yield", "stone_yield", "grain_yield",
  ]);
  assert.equal(values[1].value, "100/1 nghìn");
});

test("HUD đọc thành, đội quân và đánh dấu từ snapshot server thật", () => {
  assert.equal(readHudCities(snapshot)[0]?.name, "Lạc Dương");
  assert.equal(readHudArmies(snapshot)[0]?.soldiers.reduce((a, b) => a + b, 0), 600);
  assert.deepEqual(readHudTags(snapshot)[0], { name: "Mỏ sắt", x: 8, y: 9 });
});

test("Kiểm tra tọa độ nhảy giữ biên map 200x200", () => {
  assert.equal(isValidMapCoordinate(0, 0), true);
  assert.equal(isValidMapCoordinate(199, 199), true);
  assert.equal(isValidMapCoordinate(200, 0), false);
  assert.equal(isValidMapCoordinate(1.5, 2), false);
});

test("Định dạng tài nguyên không làm thay đổi số nhỏ", () => {
  assert.equal(formatCompactNumber(999), "999");
  assert.equal(formatCompactNumber(1_000), "1 nghìn");
  assert.equal(formatCompactNumber(1_000_000), "1 triệu");
  assert.equal(formatCompactNumber(1_000_000_000), "1 tỷ");
});
