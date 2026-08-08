import assert from "node:assert/strict";
import test from "node:test";
import { MapCoordinate } from "../src/game/map/map-coordinate.ts";

const coordinate = new MapCoordinate({
  width: 200,
  height: 200,
  tileWidth: 200,
  tileHeight: 100,
});

test("MapCoordinate giữ nguyên quy tắc cell id của client Cocos", () => {
  assert.equal(coordinate.getCellId({ x: 0, y: 0 }), 0);
  assert.equal(coordinate.getCellId({ x: 199, y: 199 }), 39_999);
  assert.deepEqual(coordinate.getCellPoint(20_130), {
    x: 130,
    y: 100,
  });
});

test("MapCoordinate chuyển cell và world theo công thức client cũ", () => {
  const samples = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 50, y: 140 },
    { x: 199, y: 199 },
  ];

  for (const cell of samples) {
    const world = coordinate.cellToWorld(cell);
    assert.deepEqual(coordinate.worldToCell(world), cell);
  }
});

test("MapCoordinate kiểm tra biên bản đồ", () => {
  assert.equal(coordinate.isValidCell({ x: 0, y: 0 }), true);
  assert.equal(coordinate.isValidCell({ x: 199, y: 199 }), true);
  assert.equal(coordinate.isValidCell({ x: -1, y: 0 }), false);
  assert.equal(coordinate.isValidCell({ x: 200, y: 0 }), false);
});
