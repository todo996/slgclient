import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

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
const appName = (process.env.GAME_APP_NAME || 'Tam Quốc Việt Nam').trim();
const shortName = (process.env.GAME_SHORT_NAME || 'Tam Quốc').trim();
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 16);

if (!serverUrl.startsWith('wss://')) {
  console.error('GAME_WS_URL phải là địa chỉ wss:// của gate-service Railway.');
  process.exit(1);
}

if (!webUrl.startsWith('https://')) {
  console.error('GAME_HTTP_URL phải là địa chỉ https:// của http-service Railway.');
  process.exit(1);
}

mkdirSync(resolve(buildDir, 'icons'), { recursive: true });

const runtimeConfig = `window.__TAM_QUOC_CONFIG__ = ${JSON.stringify({
  serverUrl,
  webUrl,
  locale,
}, null, 2)};\n`;
writeFileSync(resolve(buildDir, 'game-config.js'), runtimeConfig, 'utf8');

const manifest = {
  id: '/',
  name: appName,
  short_name: shortName,
  description: 'Game chiến thuật Tam Quốc SLG bằng tiếng Việt.',
  lang: locale,
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'fullscreen',
  display_override: ['fullscreen', 'standalone', 'minimal-ui'],
  orientation: 'landscape',
  background_color: '#07111f',
  theme_color: '#8b1e24',
  categories: ['games', 'entertainment', 'strategy'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
writeFileSync(resolve(buildDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const mobileCss = `
:root {
  --app-height: 100dvh;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  color-scheme: dark;
}

html, body {
  width: 100%;
  height: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #07111f;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

body {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: var(--app-height, 100dvh);
  touch-action: none;
}

#GameDiv,
#Cocos3dGameContainer,
.game-shell {
  position: fixed !important;
  top: var(--safe-top) !important;
  right: var(--safe-right) !important;
  bottom: var(--safe-bottom) !important;
  left: var(--safe-left) !important;
  width: auto !important;
  height: auto !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #07111f;
}

canvas,
#GameCanvas {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  margin: 0 auto !important;
  object-fit: contain;
  touch-action: none;
  outline: none;
}

input,
textarea,
button,
select {
  font: inherit;
  touch-action: manipulation;
  -webkit-user-select: text;
  user-select: text;
}

.pwa-action,
.pwa-hint {
  position: fixed;
  z-index: 2147483647;
  font-family: Arial, sans-serif;
  color: #fff8df;
  background: rgba(7, 17, 31, 0.94);
  border: 1px solid rgba(241, 199, 94, 0.85);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.pwa-action {
  right: calc(12px + var(--safe-right));
  bottom: calc(12px + var(--safe-bottom));
  min-height: 44px;
  padding: 10px 16px;
  cursor: pointer;
}

.pwa-hint {
  left: 50%;
  bottom: calc(16px + var(--safe-bottom));
  max-width: min(88vw, 520px);
  padding: 12px 16px;
  line-height: 1.45;
  text-align: center;
  transform: translateX(-50%);
}

.pwa-hint button {
  margin-left: 10px;
  color: #f1c75e;
  background: transparent;
  border: 0;
  cursor: pointer;
}

@media (orientation: portrait) and (max-width: 900px) {
  .pwa-orientation-hint {
    display: block;
  }
}

@media (orientation: landscape), (min-width: 901px) {
  .pwa-orientation-hint {
    display: none !important;
  }
}

@media (display-mode: standalone), (display-mode: fullscreen) {
  .pwa-install-button {
    display: none !important;
  }
}
`;
writeFileSync(resolve(buildDir, 'mobile-shell.css'), mobileCss.trimStart(), 'utf8');

const pwaRegister = `
(() => {
  'use strict';

  const root = document.documentElement;
  const setViewportHeight = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--app-height', height + 'px');
  };

  setViewportHeight();
  window.addEventListener('resize', setViewportHeight, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(setViewportHeight, 160), { passive: true });
  window.visualViewport?.addEventListener('resize', setViewportHeight, { passive: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .catch((error) => console.warn('Không thể đăng ký PWA:', error));
    }, { once: true });
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let deferredInstall = null;

  const removeElement = (element) => {
    if (element?.parentNode) element.parentNode.removeChild(element);
  };

  const createHint = (text, className, storageKey) => {
    if (storageKey && localStorage.getItem(storageKey) === '1') return null;
    const box = document.createElement('div');
    box.className = 'pwa-hint ' + className;
    box.setAttribute('role', 'status');
    box.textContent = text;

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Đã hiểu';
    close.addEventListener('click', () => {
      if (storageKey) localStorage.setItem(storageKey, '1');
      removeElement(box);
    });
    box.appendChild(close);
    document.body.appendChild(box);
    return box;
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (!standalone && isIOS) {
      createHint('Để cài game trên iPhone: mở nút Chia sẻ trong Safari, sau đó chọn “Thêm vào Màn hình chính”.', 'pwa-ios-hint', 'tam-quoc-ios-install-hint');
    }

    if (window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches) {
      const hint = createHint('Xoay ngang điện thoại để chơi thuận tiện hơn.', 'pwa-orientation-hint', null);
      if (hint) window.setTimeout(() => removeElement(hint), 4500);
    }
  }, { once: true });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event;
    if (standalone || document.querySelector('.pwa-install-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pwa-action pwa-install-button';
    button.textContent = 'Cài game';
    button.addEventListener('click', async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      removeElement(button);
    });
    document.body.appendChild(button);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    document.querySelectorAll('.pwa-install-button, .pwa-ios-hint').forEach(removeElement);
  });
})();
`;
writeFileSync(resolve(buildDir, 'pwa-register.js'), pwaRegister.trimStart(), 'utf8');

const offlineHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#8b1e24">
  <title>Đang mất kết nối · ${escapeHtml(appName)}</title>
  <style>
    html,body{height:100%;margin:0;background:#07111f;color:#fff8df;font-family:Arial,sans-serif}
    body{display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center}
    main{max-width:520px;padding:28px;border:1px solid #b8872f;border-radius:18px;background:#101d2d}
    h1{margin-top:0;color:#f1c75e}button{min-height:44px;padding:10px 18px;border:0;border-radius:10px;background:#8b1e24;color:white;font-weight:700}
  </style>
</head>
<body>
  <main>
    <h1>Đang mất kết nối</h1>
    <p>Game cần Internet để đăng nhập và đồng bộ dữ liệu. Hãy kiểm tra mạng rồi thử lại.</p>
    <button type="button" onclick="location.reload()">Thử lại</button>
  </main>
</body>
</html>`;
writeFileSync(resolve(buildDir, 'offline.html'), offlineHtml, 'utf8');

const serviceWorker = `
const CACHE_NAME = 'tam-quoc-${commit}';
const CORE_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/mobile-shell.css',
  '/pwa-register.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('tam-quoc-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/game-config.js') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
`;
writeFileSync(resolve(buildDir, 'service-worker.js'), serviceWorker.trimStart(), 'utf8');

writeFileSync(resolve(buildDir, 'icons/icon-192.png'), createIconPng(192, false));
writeFileSync(resolve(buildDir, 'icons/icon-512.png'), createIconPng(512, false));
writeFileSync(resolve(buildDir, 'icons/icon-maskable-512.png'), createIconPng(512, true));
writeFileSync(resolve(buildDir, 'icons/apple-touch-icon.png'), createIconPng(180, false));

let html = readFileSync(indexPath, 'utf8');
html = html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, '');

const pwaHead = `<!-- TAM_QUOC_PWA_START -->
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <meta name="theme-color" content="#8b1e24">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="${escapeHtml(shortName)}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="/mobile-shell.css">
  <script src="/game-config.js"></script>
  <script defer src="/pwa-register.js"></script>
  <!-- TAM_QUOC_PWA_END -->`;

const blockPattern = /<!-- TAM_QUOC_PWA_START -->[\s\S]*?<!-- TAM_QUOC_PWA_END -->/;
if (blockPattern.test(html)) {
  html = html.replace(blockPattern, pwaHead);
} else if (html.includes('</head>')) {
  html = html.replace('</head>', `  ${pwaHead}\n</head>`);
} else {
  html = `${pwaHead}\n${html}`;
}
writeFileSync(indexPath, html, 'utf8');

console.log('Đã chuẩn bị bản build Cocos cho Vercel, mobile và PWA.');
console.log(`WebSocket: ${serverUrl}`);
console.log(`HTTP API: ${webUrl}`);
console.log(`PWA: ${appName} (${locale})`);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createIconPng(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const safeRadius = size * (maskable ? 0.48 : 0.46);
  const shieldWidth = size * 0.48;
  const shieldTop = size * 0.2;
  const shieldBottom = size * 0.79;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const distance = Math.hypot(x - center, y - center);
      const inside = maskable || distance <= safeRadius;

      let r = inside ? 7 : 0;
      let g = inside ? 17 : 0;
      let b = inside ? 31 : 0;
      let a = inside ? 255 : 0;

      const relativeY = (y - shieldTop) / (shieldBottom - shieldTop);
      const halfWidth = relativeY < 0.58
        ? shieldWidth / 2
        : (shieldWidth / 2) * Math.max(0, (1 - relativeY) / 0.42);
      const inShield = relativeY >= 0 && relativeY <= 1 && Math.abs(x - center) <= halfWidth;
      const border = inShield && (
        Math.abs(Math.abs(x - center) - halfWidth) <= Math.max(2, size * 0.018)
        || Math.abs(y - shieldTop) <= Math.max(2, size * 0.018)
      );

      if (inShield) {
        r = 139;
        g = 30;
        b = 36;
      }
      if (border) {
        r = 241;
        g = 199;
        b = 94;
      }

      const bar = size * 0.055;
      const emblem = (
        (Math.abs(x - center) <= bar && y >= size * 0.31 && y <= size * 0.62)
        || (Math.abs(y - size * 0.42) <= bar && x >= size * 0.35 && x <= size * 0.65)
        || (Math.abs(y - size * 0.58) <= bar && x >= size * 0.4 && x <= size * 0.6)
      );
      if (emblem && inShield) {
        r = 255;
        g = 224;
        b = 132;
      }

      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = a;
    }
  }

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    scanlines[rowOffset] = 0;
    pixels.copy(scanlines, rowOffset + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
