import assert from "node:assert/strict";
import test from "node:test";
import { EventMgr } from "../src/legacy/events/event-manager.ts";

test.afterEach(() => {
  EventMgr.clear();
});

test("EventMgr không đăng ký trùng cùng handler và target", () => {
  const target = {};
  let calls = 0;
  const handler = (): void => {
    calls += 1;
  };

  EventMgr.on("sample", handler, target);
  EventMgr.on("sample", handler, target);
  EventMgr.emit("sample");

  assert.equal(calls, 1);
});

test("EventMgr off chỉ gỡ đúng subscription", () => {
  const firstTarget = {};
  const secondTarget = {};
  const calls: string[] = [];
  const handler = function (this: object): void {
    calls.push(this === firstTarget ? "first" : "second");
  };

  EventMgr.on("sample", handler, firstTarget);
  EventMgr.on("sample", handler, secondTarget);
  EventMgr.off("sample", handler, firstTarget);
  EventMgr.emit("sample");

  assert.deepEqual(calls, ["second"]);
});

test("EventMgr targetOff gỡ toàn bộ event của một target", () => {
  const target = {};
  let calls = 0;
  const handler = (): void => {
    calls += 1;
  };

  EventMgr.on("first", handler, target);
  EventMgr.on("second", handler, target);
  EventMgr.targetOff(target);
  EventMgr.emit("first");
  EventMgr.emit("second");

  assert.equal(calls, 0);
});
