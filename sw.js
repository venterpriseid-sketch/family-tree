/* ═══════════════════════════════════
   SERVICE WORKER — Versioned cache
   Cache name includes app version so
   iPad gets fresh assets on every deploy.
   ═══════════════════════════════════ */

// This version string is replaced by GitHub Actions on each deploy
const APP_VERSION  = '1.18';
const CACHE_NAME   = `family-tree-v${APP_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
  './css/variables.css',
  './css/layout.css',
  './css/components.css',
  './js/store.js',
  './js/utils.js',
  './js/popup.js',
  './js/layout.js',
  './js/renderer.js',
  './js/canvas.js',
  './js/whiteboard.js',
  './js/form.js',
  './js/export.js',
  './js/actions.js',
  './js/search.js',
  './js/version.js',
  './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for version.json (always check latest version)
  if (e.request.url.includes('version.json')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
