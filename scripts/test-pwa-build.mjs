import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const tempRoot = mkdtempSync(join(tmpdir(), 'tam-quoc-pwa-'));
const buildDir = join(tempRoot, 'web-desktop');
mkdirSync(buildDir, { recursive: true });
writeFileSync(
  join(buildDir, 'index.html'),
  '<!doctype html><html><head><meta name="viewport" content="old"></head><body><div id="GameDiv"><canvas id="GameCanvas"></canvas></div></body></html>',
  'utf8',
);

try {
  runPrepare();
  runPrepare();

  const expectedFiles = [
    'game-config.js',
    'manifest.webmanifest',
    'mobile-shell.css',
    'offline.html',
    'pwa-register.js',
    'service-worker.js',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable-512.png',
    'icons/apple-touch-icon.png',
  ];

  for (const path of expectedFiles) {
    assert.ok(readFileSync(join(buildDir, path)).length > 0, `${path} phải được tạo`);
  }

  const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
  assert.equal(count(html, 'TAM_QUOC_PWA_START'), 1, 'Khối PWA không được chèn lặp');
  assert.equal(count(html, 'manifest.webmanifest'), 1, 'Manifest không được chèn lặp');
  assert.equal(count(html, '/game-config.js'), 1, 'Runtime config không được chèn lặp');
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-mobile-web-app-capable/);

  const manifest = JSON.parse(readFileSync(join(buildDir, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.lang, 'vi-VN');
  assert.equal(manifest.display, 'fullscreen');
  assert.equal(manifest.orientation, 'landscape');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));

  const config = readFileSync(join(buildDir, 'game-config.js'), 'utf8');
  assert.match(config, /wss:\/\/gate\.example\.com/);
  assert.match(config, /https:\/\/api\.example\.com/);

  const worker = readFileSync(join(buildDir, 'service-worker.js'), 'utf8');
  assert.match(worker, /cache: 'no-store'/);
  const coreAssets = worker.match(/const CORE_ASSETS = \[([\s\S]*?)\];/)?.[1] || '';
  assert.doesNotMatch(coreAssets, /game-config\.js/);

  const png = readFileSync(join(buildDir, 'icons/icon-192.png'));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

  console.log('Kiểm thử PWA, mobile và iPhone đã thành công.');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function runPrepare() {
  const result = spawnSync(process.execPath, [resolve('scripts/prepare-vercel.mjs')], {
    cwd: resolve('.'),
    encoding: 'utf8',
    env: {
      ...process.env,
      COCOS_BUILD_DIR: buildDir,
      GAME_WS_URL: 'wss://gate.example.com',
      GAME_HTTP_URL: 'https://api.example.com',
      GAME_LOCALE: 'vi-VN',
      GAME_APP_NAME: 'Tam Quốc Việt Nam',
      GAME_SHORT_NAME: 'Tam Quốc',
      VERCEL_GIT_COMMIT_SHA: 'pwa-test-commit',
    },
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
  }
  assert.equal(result.status, 0, 'prepare-vercel.mjs phải chạy thành công');
}

function count(text, value) {
  return text.split(value).length - 1;
}
