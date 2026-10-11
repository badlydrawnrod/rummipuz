import { installOfflineWorker, OFFLINE_ASSETS } from '../offline-cache.js';
import { initialiseOffline } from '../offline.js';

export async function runOfflineChecks() {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const events = (properties = {}) => {
    const listeners = new Map();
    return Object.assign(properties, {
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      emit(type, value = {}) { for (const fn of listeners.get(type) ?? []) fn(value); },
    });
  };
  function harness(scope) {
    let online = true;
    let missing = null;
    let networkCalls = 0;
    let claimCount = 0;
    const stored = new Map();
    const requested = [];
    const fetch = async (request) => {
      networkCalls += 1;
      const url = typeof request === 'string' ? request : request.url;
      if (!online) throw new Error('Offline');
      if (url === missing) return new Response('Missing', { status: 404 });
      return new Response(`Packaged asset: ${url}`);
    };
    const caches = {
      async open(name) {
        if (!stored.has(name)) stored.set(name, new Map());
        const entries = stored.get(name);
        return {
          async addAll(requests) {
            requested.push(...requests);
            const responses = await Promise.all(requests.map(fetch));
            if (responses.some((response) => !response.ok)) throw new Error('Cache installation failed');
            requests.forEach((request, index) => entries.set(request.url, responses[index]));
          },
          async match(url) { return entries.get(typeof url === 'string' ? url : url.url)?.clone(); },
        };
      },
      keys: async () => [...stored.keys()],
      delete: async (name) => stored.delete(name),
    };
    const worker = events({ registration: { scope }, caches, fetch,
      clients: { async claim() { claimCount += 1; } } });
    const setup = installOfflineWorker(worker);
    const lifecycle = async (type) => {
      let completion;
      worker.emit(type, { waitUntil(promise) { completion = promise; } });
      if (!completion) throw new Error('Lifecycle work was not retained');
      await completion;
    };
    const get = (path, { method = 'GET', mode } = {}) => {
      let response;
      const request = { url: new URL(path, scope).href, method, mode };
      worker.emit('fetch', { request, respondWith(promise) { response = promise; } });
      return response;
    };
    return { ...setup, stored, requested, lifecycle, get,
      offline() { online = false; }, missing(path) { missing = new URL(path, scope).href; },
      get networkCalls() { return networkCalls; }, get claimCount() { return claimCount; } };
  }
  for (const scope of ['https://example.test/', 'https://example.test/games/rummipuz/']) {
    const h = harness(scope);
    await h.lifecycle('install');
    assert(h.requested.length === OFFLINE_ASSETS.length && h.requested.every((request) => request.cache === 'reload'),
      `${scope}: installation stages the entire release without HTTP-cache reuse`);
    assert(h.requested.every((request) => request.url.startsWith(scope)), `${scope}: assets stay inside deployment scope`);
    h.stored.set(`${h.prefix}old`, new Map());
    h.stored.set('another-app', new Map());
    h.stored.set('rummipuz-shell:%2Fother%2F:v0', new Map());
    await h.lifecycle('activate');
    assert(!h.stored.has(`${h.prefix}old`) && h.stored.has(h.cacheName), `${scope}: activation removes only the previous bundle`);
    assert(h.stored.has('another-app') && h.stored.has('rummipuz-shell:%2Fother%2F:v0'), `${scope}: other apps and scopes keep their caches`);
    assert(h.claimCount === 1, `${scope}: first activation controls the open app`);
    h.offline();
    const calls = h.networkCalls;
    const responses = await Promise.all(OFFLINE_ASSETS.map((path) => h.get(path)));
    assert(responses.every((response) => response?.ok) && h.networkCalls === calls,
      `${scope}: every packaged resource loads with the network disabled`);
    assert((await (await h.get('./?launch=home', { mode: 'navigate' })).text()).includes(scope),
      `${scope}: offline navigation with a launch query uses the cached index`);
    assert((await h.get('./main.js?cache-bust=1')).ok, `${scope}: known-asset queries do not break offline loading`);
    assert(h.get('./checks/') === undefined && h.get('./missing') === undefined,
      `${scope}: unknown routes and check pages are not replaced by HTML`);
    assert(h.get('./main.js', { method: 'POST' }) === undefined, `${scope}: writes never use cached responses`);
    assert(h.get('https://external.test/main.js') === undefined, `${scope}: cross-origin requests are untouched`);
    assert(h.get('/outside.js') === undefined, `${scope}: unrelated same-origin resources are untouched`);
    assert((await h.get('./puzzle-worker.js')).ok && (await h.get('./puzzles/sample.json')).ok,
      `${scope}: new worker creation and direct sample replay are available offline`);
  }
  const failed = harness('https://example.test/games/rummipuz/');
  const previous = `${failed.prefix}previous`;
  failed.stored.set(previous, new Map([['saved', new Response('previous bundle')]]));
  failed.missing('./solver.js');
  let rejected = false;
  try { await failed.lifecycle('install'); } catch { rejected = true; }
  assert(rejected && failed.stored.has(previous) && failed.claimCount === 0,
    'Missing worker dependency rejects installation and preserves the previous release');
  assert(failed.stored.get(failed.cacheName).size === 0, 'A failed precache cannot publish a partial bundle');

  const messages = [];
  let registrations = 0;
  const active = events({ state: 'activated' });
  const registration = events({ active, installing: null, waiting: null });
  let registerArgs;
  const serviceWorker = events({ async register(...args) { registrations += 1; registerArgs = args; return registration; } });
  const options = { serviceWorker, onStatus: (message) => messages.push(message) };
  assert(await initialiseOffline({ ...options, secure: false }) === null && registrations === 0
    && messages.at(-1).includes('HTTPS'), 'Insecure tablet HTTP skips registration and explains offline requirements');
  assert(await initialiseOffline({ secure: true, serviceWorker: null, onStatus: options.onStatus }) === null
    && messages.at(-1).includes('not supported'), 'Unsupported browsers retain ordinary play with an offline notice');
  assert(await initialiseOffline({ ...options, secure: true }) === registration
    && messages.at(-1).startsWith('Ready for offline use'), 'An active cached release reports offline readiness');
  assert(registerArgs[0].pathname.endsWith('/service-worker.js') && registerArgs[1].type === 'module'
    && registerArgs[1].updateViaCache === 'none'
    && new URL(registerArgs[1].scope).pathname === registerArgs[0].pathname.replace('service-worker.js', ''),
    'Registration uses the app directory and checks worker-module updates without HTTP-cache reuse');
  const installing = events({ state: 'installing' });
  registration.installing = installing;
  registration.emit('updatefound');
  installing.state = 'installed'; registration.waiting = installing; registration.installing = null;
  installing.emit('statechange');
  assert(messages.at(-1).includes('Close all Rummipuz windows'), 'Waiting updates preserve open play and explain how to apply them');
  registration.waiting = null;
  serviceWorker.emit('controllerchange');
  assert(messages.at(-1) === 'Ready for offline use on this device.', 'A controller change refreshes offline readiness');
  const first = events({ state: 'installing' });
  const firstRegistration = events({ active: null, installing: first });
  const firstService = events({ async register() { return firstRegistration; } });
  await initialiseOffline({ secure: true, serviceWorker: firstService, onStatus: options.onStatus });
  assert(messages.at(-1) === 'Preparing offline use…', 'Initial precaching does not promise offline readiness early');
  firstRegistration.active = first; firstRegistration.installing = null; first.state = 'activated'; first.emit('statechange');
  assert(messages.at(-1) === 'Ready for offline use on this device.', 'Successful first activation reports offline readiness');
  const activating = events({ state: 'activating' });
  await initialiseOffline({ secure: true, serviceWorker: events({ async register() {
    return events({ active: activating, installing: null });
  } }), onStatus: options.onStatus });
  activating.state = 'activated'; activating.emit('statechange');
  assert(messages.at(-1) === 'Ready for offline use on this device.', 'Registration during activation still observes readiness');
  const broken = events({ state: 'installing' });
  const brokenRegistration = events({ active: null, installing: broken });
  await initialiseOffline({ secure: true, serviceWorker: events({ async register() { return brokenRegistration; } }), onStatus: options.onStatus });
  brokenRegistration.installing = null; broken.state = 'redundant'; broken.emit('statechange');
  assert(messages.at(-1).includes('could not finish'), 'Failed first installation reports a retry notice');
  assert(await initialiseOffline({ secure: true, serviceWorker: { async register() { throw new Error('Storage blocked'); } },
    onStatus: options.onStatus }) === null && messages.at(-1).includes('unavailable'),
    'Registration or storage failures stay separate from gameplay');
  return passed;
}

// readAsset returns bytes from the real package, in the browser or native checks.
export async function runOfflinePackageChecks(readAsset) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const base = 'https://example.test/games/rummipuz/';
  const files = new Map();
  for (const asset of OFFLINE_ASSETS) files.set(new URL(asset, base).href, new Uint8Array(await readAsset(asset)));
  const text = (path) => new TextDecoder().decode(files.get(new URL(path, base).href));
  assert(files.size === OFFLINE_ASSETS.length && [...files.values()].every((bytes) => bytes.length > 0),
    'Every precached resource exists and the list has no duplicate URLs');
  const missing = [];
  for (const [address, bytes] of files) {
    if (!address.endsWith('.js')) continue;
    const source = new TextDecoder().decode(bytes);
    for (const match of source.matchAll(/(?:from\s*|import\s*|new URL\(\s*)['"](\.\.?\/[^'"]+)['"]/g)) {
      const target = new URL(match[1], address).href;
      if (!files.has(target)) missing.push(target);
    }
  }
  assert(missing.length === 0, `The complete app and worker import graph is precached (${missing.join(', ')})`);
  const manifest = JSON.parse(text('./manifest.webmanifest'));
  assert(manifest.name === 'Rummipuz' && manifest.display === 'standalone', 'Manifest supplies an app name and standalone launch');
  assert(new URL(manifest.start_url, base).href === base && new URL(manifest.scope, base).href === base
    && new URL(manifest.id, base).href === base, 'Manifest launch, identity and scope work under a subdirectory');
  assert(manifest.icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any')
    && manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any')
    && manifest.icons.some((icon) => icon.purpose === 'maskable'), 'Manifest includes standard install sizes and a maskable icon');
  for (const icon of [...manifest.icons, { src: './icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const bytes = files.get(new URL(icon.src, base).href);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    assert(view.getUint32(0) === 0x89504e47 && `${view.getUint32(16)}x${view.getUint32(20)}` === icon.sizes,
      `Install icon is a real PNG of the declared size: ${icon.src} (${icon.purpose ?? 'Apple'})`);
  }
  const index = text('./index.html');
  assert(index.includes('rel="manifest" href="./manifest.webmanifest"') && index.includes('rel="apple-touch-icon"')
    && index.includes('id="offline-status"'), 'App links installation metadata and exposes offline setup status');
  assert(!text('./service-worker.js').includes('skipWaiting') && !text('./offline-cache.js').includes('skipWaiting'),
    'Updates wait for old windows to close rather than switching live game code');
  return passed;
}
