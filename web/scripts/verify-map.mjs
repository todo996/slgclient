import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const worldDirectory = resolve(
  scriptDirectory,
  "../public/game-assets/world",
);
const mapPath = resolve(worldDirectory, "map.json");
const map = JSON.parse(await readFile(mapPath, "utf8"));

assert.equal(map.type, "map");
assert.equal(map.orientation, "isometric");
assert.equal(map.renderorder, "right-down");
assert.equal(map.width, 200);
assert.equal(map.height, 200);
assert.equal(map.tilewidth, 200);
assert.equal(map.tileheight, 100);

const requiredLayers = new Map([
  ["base", true],
  ["hill1", true],
  ["hill2", true],
  ["hill3", true],
  ["obstruct", false],
  ["city_position", false],
]);

for (const [name, visible] of requiredLayers) {
  const layer = map.layers.find((item) => item.name === name);
  assert.ok(layer, `Thiếu layer ${name}`);
  assert.equal(layer.visible, visible, `Sai visible của layer ${name}`);
  assert.equal(layer.data.length, 40_000, `Sai số tile của layer ${name}`);
}

assert.deepEqual(
  map.tilesets.map((tileset) => [tileset.name, tileset.firstgid]),
  [
    ["land", 1],
    ["hill", 9],
    ["water_edge_3", 117],
    ["water_edge_1", 132],
  ],
);

for (const tileset of map.tilesets) {
  await access(resolve(worldDirectory, tileset.image));
}

const mapResource = JSON.parse(
  await readFile(resolve(worldDirectory, "mapRes_0.json"), "utf8"),
);
assert.equal(mapResource.w, 200);
assert.equal(mapResource.h, 200);
assert.equal(mapResource.list.length, 40_000);

console.log("Bản đồ web khớp map TMX và mapRes_0 hiện tại.");
