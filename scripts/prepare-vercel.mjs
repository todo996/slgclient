import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const buildDir = resolve(process.env.COCOS_BUILD_DIR || 'build/web-desktop');
const indexPath = resolve(buildDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`Không tìm thấy ${indexPath}.`);
  console.error('Hãy build Cocos Creator 3.4.0 với nền tảng Web Desktop vào build/web-desktop trước khi deploy.');
  process.exit(1);
}

const serverUrl = (process.env.GAME_WS_URL || '').trim().replace(/\/+$/, '');
const webUrl = (process.env.GAME_HTTP_URL || '').trim().replace(/\/+$/, '');
const locale = (process.env.GAME_LOCALE || 'vi-VN').trim();

if (!serverUrl.startsWith('wss://')) {
  console.error('GAME_WS_URL phải là địa chỉ wss:// của gate-service Railway.');
  process.exit(1);
}

if (!webUrl.startsWith('https://')) {
  console.error('GAME_HTTP_URL phải là địa chỉ https:// của http-service Railway.');
  process.exit(1);
}

const runtimeConfig = `window.__TAM_QUOC_CONFIG__ = ${JSON.stringify({
  serverUrl,
  webUrl,
  locale,
}, null, 2)};\n`;

writeFileSync(resolve(buildDir, 'game-config.js'), runtimeConfig, 'utf8');

let html = readFileSync(indexPath, 'utf8');
const scriptTag = '<script src="/game-config.js"></script>';

if (!html.includes(scriptTag)) {
  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${scriptTag}\n</head>`);
  } else {
    html = `${scriptTag}\n${html}`;
  }
  writeFileSync(indexPath, html, 'utf8');
}

console.log('Đã chuẩn bị bản build Cocos cho Vercel.');
console.log(`WebSocket: ${serverUrl}`);
console.log(`HTTP API: ${webUrl}`);
