import assert from "node:assert/strict";
import test from "node:test";
import { MapAreaGrid } from "../src/game/map/map-area-grid.ts";
import { ServerConfig } from "../src/legacy/config/server-config.ts";
import { EventMgr } from "../src/legacy/events/event-manager.ts";
import {
  MAP_SCAN_CACHE_MS,
  MapRuntimeEvent,
  MapScanController,
} from "../src/legacy/map/map-scan-controller.ts";
import type { OutgoingEnvelope } from "../src/legacy/network/socket/net-interface.ts";

type Call = Readonly<{ envelope: OutgoingEnvelope; area: any }>;

const grid = new MapAreaGrid({
  mapWidth: 200,
  mapHeight: 200,
  tileHeight: 100,
  viewportHeight: 844,
});

test.afterEach(() => EventMgr.clear());

test("MapScanController request vùng giữa trước rồi 8 vùng xung quanh", async () => {
  const calls: Call[] = [];
  const controller = new MapScanController(grid, async (envelope, area) => {
    calls.push({ envelope, area });
  });

  controller.updateForCenter({ x: 100, y: 100 }, 20_000);
  await Promise.resolve();

  assert.equal(calls.length, 9);
  assert.equal(calls[0].area.id, 144);
  assert.deepEqual(calls[0].envelope, {
    name: ServerConfig.nationMap_scanBlock,
    msg: { x: 96, y: 96, length: 12 },
  });
  assert.deepEqual(
    calls.map((call) => call.area.id).sort((a, b) => a - b),
    [126, 127, 128, 143, 144, 145, 160, 161, 162],
  );

  controller.destroy();
});

test("MapScanController giữ cache request 10 giây", async () => {
  const calls: Call[] = [];
  const controller = new MapScanController(grid, async (envelope, area) => {
    calls.push({ envelope, area });
  });

  controller.updateForCenter({ x: 100, y: 100 }, 20_000);
  controller.updateForCenter({ x: 101, y: 101 }, 20_000 + MAP_SCAN_CACHE_MS - 1);
  await Promise.resolve();
  assert.equal(calls.length, 9);

  controller.updateForCenter({ x: 101, y: 101 }, 20_000 + MAP_SCAN_CACHE_MS);
  await Promise.resolve();
  assert.equal(calls.length, 18);

  controller.destroy();
});

test("MapScanController phát lại dữ liệu scan kèm đúng area", () => {
  const controller = new MapScanController(grid, async () => undefined);
  const target = {};
  let received: unknown = null;

  EventMgr.on(
    MapRuntimeEvent.scanBlockUpdated,
    (message, area) => {
      received = { message, areaId: area.id };
    },
    target,
  );

  const area = grid.getArea(144);
  EventMgr.emit(
    ServerConfig.nationMap_scanBlock,
    { code: 0, msg: { mr_builds: [{ id: 1 }] } },
    area,
  );

  assert.deepEqual(received, {
    message: { mr_builds: [{ id: 1 }] },
    areaId: 144,
  });

  controller.destroy();
  EventMgr.targetOff(target);
});
