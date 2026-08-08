import assert from "node:assert/strict";
import test from "node:test";
import {
  MapResourceCatalog,
  MapResourceType,
} from "../src/game/map/map-resource-catalog.ts";

const catalog = MapResourceCatalog.fromUnknown({
  w: 4,
  h: 2,
  list: [
    [MapResourceType.Wood, 1],
    [MapResourceType.Iron, 2],
    [MapResourceType.Grain, 3],
    [MapResourceType.Wood, 4],
    [MapResourceType.Stone, 5],
    [MapResourceType.Iron, 6],
    [MapResourceType.SystemFortress, 1],
    [MapResourceType.SystemCity, 8],
  ],
});

test("MapResourceCatalog giữ đúng atlas/frame của ResLogic Cocos", () => {
  const expected = [
    { atlas: "map-tiles", frame: "land_ground_1_1" },
    { atlas: "map-tiles", frame: "land_ground_2_1" },
    { atlas: "map-res", frame: "land_1_1" },
    { atlas: "map-res", frame: "land_2_2" },
    { atlas: "map-res", frame: "land_2_3" },
    { atlas: "map-res", frame: "land_4_4" },
    { atlas: "map-res", frame: "sys_fortress" },
    null,
  ];

  for (let x = 0; x < 4; x += 1) {
    assert.deepEqual(catalog.getFrame(catalog.getCell(x, 0)!), expected[x]);
    assert.deepEqual(catalog.getFrame(catalog.getCell(x, 1)!), expected[x + 4]);
  }
});

test("MapResourceCatalog chỉ trả resource tĩnh có sprite", () => {
  const cells = catalog.getAreaCells({
    id: 0,
    x: 0,
    y: 0,
    startCellX: 0,
    startCellY: 0,
    endCellX: 4,
    endCellY: 2,
    length: 4,
  });

  assert.equal(cells.length, 7);
  assert.equal(cells.some((cell) => cell.type === MapResourceType.SystemCity), false);
});

test("MapResourceCatalog từ chối dữ liệu sai kích thước", () => {
  assert.throws(
    () => MapResourceCatalog.fromUnknown({ w: 2, h: 2, list: [[1, 1]] }),
    /sai kích thước/,
  );
});
