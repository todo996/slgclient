import assert from "node:assert/strict";
import test from "node:test";
import type {
  MapArmyEntity,
  MapBuildEntity,
  MapCityEntity,
} from "../src/legacy/map/map-entity-store.ts";
import {
  getArmyAnimationKey,
  getArmyWorldPosition,
  getBuildVisualKind,
  getFortressStatus,
  getRelationFrames,
  getSystemCityScale,
  isArmyVisible,
  readOwnerContext,
  shouldRenderArmy,
} from "../src/game/map/map-entity-visual.ts";

const context = { myId: 10, myUnionId: 20, myParentId: 30 } as const;

const owner = (
  rid: number,
  unionId = 0,
  parentId = 0,
): MapCityEntity => ({
  kind: "city",
  cellId: 0,
  cityId: rid,
  rid,
  name: "",
  x: 0,
  y: 0,
  isMain: 0,
  level: 1,
  curDurable: 0,
  maxDurable: 0,
  unionId,
  parentId,
  unionName: "",
  occupyTime: 0,
});

const build = (overrides: Partial<MapBuildEntity> = {}): MapBuildEntity => ({
  kind: "build",
  cellId: 0,
  rid: 10,
  nickName: "",
  name: "",
  x: 0,
  y: 0,
  type: 56,
  level: 1,
  opLevel: 1,
  curDurable: 0,
  maxDurable: 0,
  defender: 0,
  unionId: 20,
  parentId: 0,
  unionName: "",
  occupyTime: 0,
  giveUpTime: 0,
  endTime: 0,
  ...overrides,
});

const army = (overrides: Partial<MapArmyEntity> = {}): MapArmyEntity => ({
  kind: "army",
  id: 1,
  cityId: 1,
  order: 1,
  generals: [],
  soldiers: [],
  conTimes: [],
  conCnts: [],
  cmd: 1,
  state: 1,
  fromX: 0,
  fromY: 0,
  toX: 10,
  toY: 10,
  startTime: 1_000,
  endTime: 3_000,
  x: 10,
  y: 10,
  ...overrides,
});

test("Quan hệ phe giữ đúng thứ tự màu của client Cocos", () => {
  assert.deepEqual(getRelationFrames(owner(10), context), {
    down: "blue_1_3",
    up: "blue_2_3",
  });
  assert.equal(getRelationFrames(owner(11, 20), context)?.up, "green_2_3");
  assert.equal(getRelationFrames(owner(11, 30), context)?.up, "purple_2_3");
  assert.equal(getRelationFrames(owner(11, 0, 20), context)?.up, "yellow_2_3");
  assert.equal(getRelationFrames(owner(11), context)?.up, "red_2_3");
  assert.equal(getRelationFrames(owner(0), context), null);
});

test("Owner context lấy từ thành chính giống MapCommand cũ", () => {
  assert.deepEqual(
    readOwnerContext({
      citys: [
        { rid: 1, union_id: 2, parent_id: 3 },
        { rid: 10, union_id: 20, parent_id: 30, is_main: 1 },
      ],
    }),
    context,
  );
});

test("System city và loại build dùng đúng quy tắc Cocos", () => {
  assert.equal(getSystemCityScale(3), 0.5);
  assert.equal(getSystemCityScale(5), 1);
  assert.equal(getSystemCityScale(8), 1.5);
  assert.equal(getBuildVisualKind(build({ type: 51 })), "system-city");
  assert.equal(getBuildVisualKind(build({ type: 52 })), "resource-border");
  assert.equal(getBuildVisualKind(build({ type: 56 })), "fortress");
  assert.equal(getBuildVisualKind(build({ type: 50 })), "none");
});

test("Trạng thái pháo đài giữ thứ tự xây, nâng cấp, phá dỡ", () => {
  const now = 1_000;
  assert.equal(
    getFortressStatus(build({ level: 0, opLevel: 0, endTime: 62_000 }), now),
    "Đang xây dựng...00:01:01",
  );
  assert.equal(
    getFortressStatus(build({ level: 2, opLevel: 3, endTime: 2_000 }), now),
    "Đang nâng cấp...00:00:01",
  );
  assert.equal(
    getFortressStatus(build({ level: 2, opLevel: 0, endTime: 2_000 }), now),
    "Đang phá dỡ...00:00:01",
  );
});

test("Tên animation quân đội giữ đúng 8 hướng từ ArmyLogic", () => {
  assert.equal(getArmyAnimationKey({ x: 0, y: 0 }, { x: 1, y: 0 }), "qb_run_r");
  assert.equal(getArmyAnimationKey({ x: 1, y: 0 }, { x: 0, y: 0 }), "qb_run_l");
  assert.equal(getArmyAnimationKey({ x: 0, y: 0 }, { x: 1, y: 1 }), "qb_run_ru");
  assert.equal(getArmyAnimationKey({ x: 0, y: 0 }, { x: 0, y: 1 }), "qb_run_u");
  assert.equal(getArmyAnimationKey({ x: 1, y: 0 }, { x: 0, y: 1 }), "qb_run_lu");
  assert.equal(getArmyAnimationKey({ x: 0, y: 1 }, { x: 1, y: 0 }), "qb_run_rd");
  assert.equal(getArmyAnimationKey({ x: 0, y: 1 }, { x: 0, y: 0 }), "qb_run_d");
  assert.equal(getArmyAnimationKey({ x: 1, y: 1 }, { x: 0, y: 0 }), "qb_run_ld");
});

test("Nội suy hành quân và ẩn quân nhàn rỗi/chiêu mộ", () => {
  assert.deepEqual(
    getArmyWorldPosition(army(), { x: 0, y: 10 }, { x: 20, y: 30 }, 2_000),
    { x: 10, y: 20 },
  );
  assert.deepEqual(
    getArmyWorldPosition(army(), { x: 0, y: 10 }, { x: 20, y: 30 }, 5_000),
    { x: 20, y: 30 },
  );
  assert.equal(shouldRenderArmy(army({ cmd: 0 })), false);
  assert.equal(shouldRenderArmy(army({ cmd: 5 })), false);
  assert.equal(shouldRenderArmy(army({ cmd: 4 })), true);
});

test("Tầm nhìn quân đội giữ bán kính 5 ô quanh thành/công trình thân thiện", () => {
  const ownCity = { ...owner(10), cityId: 99, x: 100, y: 100 };
  assert.equal(isArmyVisible(army({ cityId: 99 }), [ownCity], [], context), true);

  const allyBuild = build({ rid: 11, unionId: 20, x: 14, y: 15 });
  assert.equal(
    isArmyVisible(army({ cityId: 77, x: 10, y: 10 }), [], [allyBuild], context),
    true,
  );
  assert.equal(
    isArmyVisible(army({ cityId: 77, x: 1, y: 1, fromX: 1, fromY: 1, toX: 2, toY: 2 }), [], [allyBuild], context),
    false,
  );
});
