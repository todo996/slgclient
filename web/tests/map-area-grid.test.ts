import assert from "node:assert/strict";
import test from "node:test";
import { MapAreaGrid } from "../src/game/map/map-area-grid.ts";

const grid = new MapAreaGrid({
  mapWidth: 200,
  mapHeight: 200,
  tileHeight: 100,
  viewportHeight: 844,
});

test("MapAreaGrid giữ công thức chia vùng của client Cocos", () => {
  assert.equal(grid.areaCellSize, 12);
  assert.equal(grid.width, 17);
  assert.equal(grid.height, 17);
  assert.equal(grid.count, 289);
});

test("MapAreaGrid trả đúng vùng trung tâm và 9 vùng lân cận", () => {
  assert.equal(grid.getAreaIdForCell({ x: 100, y: 100 }), 144);
  assert.deepEqual(grid.getNeighborAreaIds({ x: 100, y: 100 }), [
    126, 127, 128,
    143, 144, 145,
    160, 161, 162,
  ]);
});

test("MapAreaGrid cắt vùng biên nhưng giữ length request cũ", () => {
  assert.deepEqual(grid.getNeighborAreaIds({ x: 0, y: 0 }), [0, 1, 17, 18]);
  assert.deepEqual(grid.getArea(288), {
    id: 288,
    x: 16,
    y: 16,
    startCellX: 192,
    startCellY: 192,
    endCellX: 200,
    endCellY: 200,
    length: 12,
  });
});
