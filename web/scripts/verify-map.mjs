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

const requiredAtlases = new Map([
  ["map_tiles", { size: { w: 400, h: 700 }, frames: ["land_ground_1_1", "land_ground_2_1"] }],
  ["map_res", { size: { w: 1000, h: 550 }, frames: ["land_1_1", "land_2_1", "land_4_1", "sys_fortress"] }],
  ["map_frame_color", { size: { w: 1000, h: 500 }, frames: ["blue_1_3", "blue_2_3", "green_1_3", "purple_2_3", "yellow_1_3", "red_2_3"] }],
  ["component_outside", { size: { w: 1019, h: 2044 }, frames: ["component_119", "component_998"] }],
  ["map_qibing", { size: { w: 256, h: 1744 }, frames: ["map_qibing_0_0", "map_qibing_90_0", "map_qibing_180_0", "qibing_270_0"] }],
]);

const loadedAtlases = new Map();
for (const [name, expected] of requiredAtlases) {
  const atlasDirectory = resolve(worldDirectory, "atlases");
  const atlas = JSON.parse(
    await readFile(resolve(atlasDirectory, `${name}.json`), "utf8"),
  );
  loadedAtlases.set(name, atlas);
  await access(resolve(atlasDirectory, `${name}.png`));
  assert.deepEqual(atlas.meta.size, expected.size, `Sai kích thước atlas ${name}`);
  for (const frame of expected.frames) {
    assert.ok(atlas.frames[frame], `Thiếu frame ${name}:${frame}`);
  }
}

const rotatedCityFrame = loadedAtlases.get("component_outside").frames.component_998;
assert.equal(rotatedCityFrame.rotated, true);
assert.deepEqual(rotatedCityFrame.frame, { x: 2, y: 1450, w: 176, h: 400 });
assert.deepEqual(rotatedCityFrame.spriteSourceSize, { x: 0, y: 44, w: 400, h: 176 });

const armyAtlas = loadedAtlases.get("map_qibing");
const animationManifest = JSON.parse(
  await readFile(resolve(worldDirectory, "army_animations.json"), "utf8"),
);
assert.equal(animationManifest.animations.length, 8);
for (const animation of animationManifest.animations) {
  assert.match(animation.key, /^qb_run_(r|l|u|d|ru|rd|lu|ld)$/);
  assert.equal(animation.frames.length, 10, `Sai số frame ${animation.key}`);
  assert.ok(animation.frameRate > 0, `Sai frameRate ${animation.key}`);
  for (const frame of animation.frames) {
    assert.ok(armyAtlas.frames[frame], `Thiếu frame animation ${animation.key}:${frame}`);
  }
}

await access(resolve(worldDirectory, "sys_city.png"));
await access(resolve(worldDirectory, "army_arrow.png"));

console.log("Bản đồ web khớp TMX, mapRes_0, atlas, sprite và animation Cocos hiện tại.");
