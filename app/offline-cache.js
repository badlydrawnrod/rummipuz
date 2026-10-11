// Increment this release whenever a cached file changes. Keep each installed
// bundle intact until its replacement activates after all old windows close.
export const OFFLINE_RELEASE = 'v2';
export const OFFLINE_ASSETS = [
  './', './index.html', './styles.css', './main.js',
  './tiles.js', './rules.js', './state.js', './play-session.js', './play.js',
  './touch.js', './overflow.js', './appearance.js', './preferences.js',
  './progress.js', './puzzle-flow.js', './puzzle-service.js', './puzzle-worker.js',
  './generator.js', './rated-generator.js', './solver.js', './difficulty.js',
  './preservation.js', './generator-v5.js', './structural-difficulty.js', './offline.js', './offline-cache.js', './service-worker.js',
  './puzzles/sample.json', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

export function installOfflineWorker(worker) {
  const scope = new URL(worker.registration.scope);
  const prefix = `rummipuz-shell:${encodeURIComponent(scope.pathname)}:`;
  const cacheName = `${prefix}${OFFLINE_RELEASE}`;
  const urls = OFFLINE_ASSETS.map((path) => new URL(path, scope).href);
  const allowed = new Set(urls);
  worker.addEventListener('install', (event) => {
    // addAll is atomic: a missing asset rejects installation, leaving the
    // previous worker in charge. Bypass HTTP caches when staging a release.
    event.waitUntil(worker.caches.open(cacheName).then((cache) =>
      cache.addAll(urls.map((url) => new Request(url, { cache: 'reload' })))));
  });
  worker.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      const names = await worker.caches.keys();
      await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName)
        .map((name) => worker.caches.delete(name)));
      await worker.clients.claim();
    })());
  });
  worker.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== scope.origin) return;
    // Queries on the shell do not create extra cache entries. Unknown paths,
    // check pages, and external requests keep their ordinary network behavior.
    url.search = ''; url.hash = '';
    if (!allowed.has(url.href)) return;
    event.respondWith((async () => {
      const cache = await worker.caches.open(cacheName);
      const cached = await cache.match(url.href);
      return cached || worker.fetch(request);
    })());
  });
  return { cacheName, prefix, urls };
}
