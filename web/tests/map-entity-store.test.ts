import assert from "node:assert/strict";
import test from "node:test";
import { EventMgr } from "../src/legacy/events/event-manager.ts";
import {
  MapEntityStore,
  type MapEntityChanges,
} from "../src/legacy/map/map-entity-store.ts";
import { MapRuntimeEvent } from "../src/legacy/map/map-scan-controller.ts";

const area = {
  id: 7,
  x: 1,
  y: 2,
  startCellX: 12,
  startCellY: 24,
  endCellX: 24,
  endCellY: 36,
  length: 12,
} as const;

test.afterEach(() => EventMgr.clear());

test("MapEntityStore thêm, cập nhật và xóa city/build theo từng vùng", () => {
  const store = new MapEntityStore(200);
  const first = store.applyScan(
    {
      mc_builds: [
        {
          cityId: 101,
          rid: 9,
          name: "Lạc Dương",
          x: 13,
          y: 25,
          is_main: 1,
          level: 3,
          cur_durable: 400,
          max_durable: 500,
        },
      ],
      mr_builds: [
        {
          rid: 9,
          RNick: "Chúa công",
          name: "Đồn gỗ",
          x: 14,
          y: 25,
          type: 52,
          level: 2,
          cur_durable: 100,
          max_durable: 120,
        },
      ],
      armys: [],
    },
    area,
  );

  assert.equal(first.cities.added.length, 1);
  assert.equal(first.builds.added.length, 1);
  assert.equal(store.getCity(13 + 25 * 200)?.cityId, 101);
  assert.equal(store.getBuild(14 + 25 * 200)?.nickName, "Chúa công");

  const updated = store.applyScan(
    {
      mc_builds: [
        {
          cityId: 101,
          rid: 9,
          name: "Lạc Dương",
          x: 13,
          y: 25,
          is_main: 1,
          level: 4,
          cur_durable: 450,
          max_durable: 500,
        },
      ],
      mr_builds: [],
      armys: [],
    },
    area,
  );

  assert.equal(updated.cities.updated.length, 1);
  assert.equal(updated.cities.updated[0]?.level, 4);
  assert.equal(updated.builds.removed.length, 1);
  assert.equal(store.getBuild(14 + 25 * 200), null);

  const cleared = store.applyScan(
    { mc_builds: [], mr_builds: [], armys: [] },
    area,
  );
  assert.equal(cleared.cities.removed.length, 1);
  assert.equal(store.getAllCities().length, 0);

  store.destroy();
});

test("MapEntityStore bỏ dữ liệu scan nằm ngoài vùng được yêu cầu", () => {
  const store = new MapEntityStore(200);
  const changes = store.applyScan(
    {
      mc_builds: [{ cityId: 1, x: 40, y: 40 }],
      mr_builds: [{ rid: 1, x: 11, y: 24 }],
      armys: [],
    },
    area,
  );

  assert.equal(changes.cities.added.length, 0);
  assert.equal(changes.builds.added.length, 0);
  store.destroy();
});

test("MapEntityStore giữ quy tắc đảo điểm đi/đến khi quân quay về", () => {
  const store = new MapEntityStore(200);
  const changes = store.applyScan(
    {
      mc_builds: [],
      mr_builds: [],
      armys: [
        {
          id: 88,
          cityId: 5,
          order: 1,
          generals: [1001],
          soldiers: [3200],
          con_times: [0],
          con_cnts: [0],
          cmd: 4,
          state: 1,
          from_x: 10,
          from_y: 11,
          to_x: 20,
          to_y: 21,
          start: 100,
          end: 200,
        },
      ],
    },
    area,
  );

  const army = changes.armies.added[0];
  assert.deepEqual(
    {
      fromX: army?.fromX,
      fromY: army?.fromY,
      toX: army?.toX,
      toY: army?.toY,
      x: army?.x,
      y: army?.y,
      startTime: army?.startTime,
      endTime: army?.endTime,
    },
    {
      fromX: 20,
      fromY: 21,
      toX: 10,
      toY: 11,
      x: 10,
      y: 11,
      startTime: 100_000,
      endTime: 200_000,
    },
  );

  store.destroy();
});

test("MapEntityStore seed dữ liệu sở hữu và phát một diff thống nhất", () => {
  const store = new MapEntityStore(200);
  const target = {};
  const emitted: MapEntityChanges[] = [];
  EventMgr.on(
    MapRuntimeEvent.entitiesChanged,
    (changes: MapEntityChanges) => emitted.push(changes),
    target,
  );

  const changes = store.seedRoleProperty({
    citys: [{ cityId: 3, x: 7, y: 8, name: "Thành chính" }],
    mr_builds: [{ rid: 2, x: 9, y: 10, type: 56, level: 1 }],
    armys: [{ id: 12, cityId: 3, order: 1, cmd: 0, from_x: 7, from_y: 8 }],
  });

  assert.equal(changes.areaId, null);
  assert.equal(changes.cities.added.length, 1);
  assert.equal(changes.builds.added.length, 1);
  assert.equal(changes.armies.added.length, 1);
  assert.equal(emitted.length, 1);

  store.destroy();
  EventMgr.targetOff(target);
});
