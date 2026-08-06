import assert from "node:assert/strict";
import test from "node:test";
import { createDemoSnapshot, respondToDemoRequest } from "../src/demo/demo-data.ts";
import { ServerConfig } from "../src/legacy/config/server-config.ts";

test("Demo snapshot có thành chính, quân đội và đánh dấu để kiểm tra map", () => {
  const snapshot = createDemoSnapshot();
  const property = snapshot.roleProperty as Record<string, unknown>;
  assert.equal(Array.isArray(property.citys), true);
  assert.equal(Array.isArray(property.armys), true);
  assert.equal((property.citys as unknown[]).length, 1);
  assert.equal((property.armys as unknown[]).length, 2);
});

test("Demo responder giữ nguyên name và seq của protocol cũ", () => {
  const response = respondToDemoRequest({
    name: ServerConfig.general_myGenerals,
    msg: {},
    seq: 77,
  });
  assert.equal(response.name, ServerConfig.general_myGenerals);
  assert.equal(response.seq, 77);
  assert.equal(response.code, 0);
  assert.equal(Array.isArray((response.msg as { generals: unknown[] }).generals), true);
});

test("Demo scanBlock trả đúng envelope nhưng không cần backend", () => {
  const response = respondToDemoRequest({
    name: ServerConfig.nationMap_scanBlock,
    msg: { x: 90, y: 90, length: 20 },
    seq: 5,
  });
  assert.equal(response.name, ServerConfig.nationMap_scanBlock);
  assert.equal(Array.isArray((response.msg as { armys: unknown[] }).armys), true);
});
