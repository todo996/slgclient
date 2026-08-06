import test from "node:test";
import assert from "node:assert/strict";
import {
  ARMY_ARROW_PREFAB,
  MAP_TILE_CULL_PADDING,
  ROLE_CITY_PREFAB,
  getMapZoom,
} from "../src/game/map/map-responsive.ts";

test("camera dùng zoom riêng cho portrait và landscape", () => {
  assert.equal(getMapZoom({ width: 710, height: 1300 }), 710 / 1900);
  assert.equal(getMapZoom({ width: 390, height: 844 }), 0.34);
  assert.equal(getMapZoom({ width: 844, height: 390 }), 390 / 720);
  assert.equal(getMapZoom({ width: 1280, height: 720 }), 0.68);
});

test("kích thước entity giữ đúng prefab Cocos", () => {
  assert.deepEqual(ROLE_CITY_PREFAB, {
    relationWidth: 580,
    relationHeight: 308,
    spriteWidth: 400,
    spriteHeight: 250,
    spriteScale: 1.5,
    spriteX: -5,
    spriteY: -25,
    labelY: -43.628,
  });
  assert.deepEqual(ARMY_ARROW_PREFAB, {
    width: 20,
    minimumHeight: 36,
    alpha: 0.58,
  });
  assert.equal(MAP_TILE_CULL_PADDING, 12);
});
