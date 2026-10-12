/** Run portable suites in native modules, without npm or changing app module setup.
 * node plans/checks/run_native.mjs (also importable through node_repl).
 */
import fs from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
const root = new URL('../../', import.meta.url);
const staging = await fs.mkdtemp('/tmp/rummipuz-native-');
await fs.writeFile(staging + '/package.json', '{"type":"module"}');
await fs.cp(new URL('app/', root), staging + '/app', { recursive: true });
const app = new URL('file://' + staging + '/app/');
const module = (name) => import(new URL(`checks/${name}.js`, app));
const json = async (name) => JSON.parse(await fs.readFile(new URL(name, app), 'utf8'));
const sample = await json('puzzles/sample.json');
const v2 = await json('checks/fixtures/generated-v2.json');
const v3 = await json('checks/fixtures/generated-v3.json');
const v4 = await json('checks/fixtures/generated-v4.json');
const v5 = await json('checks/fixtures/generated-v5.json');
const v6 = await json('checks/fixtures/generated-v6.json');
const awaitedV5 = await json('checks/fixtures/structural-v5.json');
const awaitedV6 = await json('checks/fixtures/structural-v6.json');
const styles = await fs.readFile(new URL('styles.css', app), 'utf8');
export const workerFactoryFor = (url) => () => {
  const worker = new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self={addEventListener(type,handler){parentPort.on(type,data=>handler({data}));},postMessage(value){parentPort.postMessage(value);}};import(${JSON.stringify(url)});`, { eval: true });
  const listeners = new Map();
  return {
    addEventListener(type, fn) { const wrap = type === 'message' ? data => fn({ data }) : error => fn({ message: error.message, preventDefault() {} }); listeners.set(fn, wrap); worker.on(type, wrap); },
    removeEventListener(type, fn) { const wrap = listeners.get(fn); if (wrap) worker.off(type, wrap); listeners.delete(fn); },
    postMessage(data) { worker.postMessage(data); }, terminate() { worker.terminate(); },
  };
};
const workerFactory = workerFactoryFor(new URL('puzzle-worker.js', app).href);
const passed = [], suites = {};
async function run(name, fn) {
  const checks = await fn(); suites[name] = checks.length; passed.push(...checks);
}
try {
  for (const [name, args] of [['core', [sample]], ['solver', [sample]], ['generator', [v2]],
    ['difficulty', [sample, v3]], ['review', [v4, await json('checks/fixtures/reviewed-v4.json')]],
    ['play', [sample]], ['progress', [sample]], ['preferences', []], ['appearance', [styles]],
    ['touch', [sample, styles]], ['overflow', []]]) {
    const mod = await module(name);
    await run(name, () => Object.values(mod)[0](...args));
  }
  const offline = await module('offline');
  await run('offline', () => offline.runOfflineChecks());
  await run('offline-package', () => offline.runOfflinePackageChecks(path => fs.readFile(new URL(path === './' ? 'index.html' : path, app))));
  const structural = await module('structural');
  await run('structural-v5', () => structural.runStructuralChecks(awaitedV5, v5));
  await run('benchmark', () => module('benchmark').then(m => m.runBenchmarkChecks(v5)));
  const flow = await module('puzzle-flow'), workers = await module('worker'), variety = await module('variety');
  await run('flow', () => flow.runPuzzleFlowChecks(sample));
  await run('worker-lifecycle', () => workers.runWorkerLifecycleChecks());
  await run('variety-v6', () => variety.runVarietyChecks(awaitedV6, v6));
  await run('worker', () => workers.runWorkerChecks(sample, [v2[0], v3[0], v4[0]], workerFactory));
  await run('flow-worker', () => flow.runPuzzleFlowWorkerChecks(sample, workerFactory));
  await run('structural-v5-worker', () => structural.runStructuralWorkerChecks(v5, workerFactory));
  await run('variety-v6-worker', () => variety.runVarietyWorkerChecks(v6, workerFactory));
  // Fresh workers load from a bundle containing only precached resources.
  const { OFFLINE_ASSETS, OFFLINE_RELEASE } = await import(new URL('offline-cache.js', app));
  const offlineDir = staging + '/offline'; await fs.mkdir(offlineDir);
  for (const path of OFFLINE_ASSETS.filter(path => path !== './')) {
    const target = offlineDir + '/' + path.slice(2);
    await fs.mkdir(new URL('.', 'file://' + target), { recursive: true });
    await fs.copyFile(new URL(path, app), target);
  }
  const offlineFactory = workerFactoryFor('file://' + offlineDir + '/puzzle-worker.js');
  await run('precache-flow-worker', () => flow.runPuzzleFlowWorkerChecks(sample, offlineFactory));
  await run('precache-v5-worker', () => structural.runStructuralWorkerChecks(v5, offlineFactory));
  await run('precache-v6-worker', () => variety.runVarietyWorkerChecks(v6, offlineFactory));
  console.log(JSON.stringify({ checks: passed.length, suites, offlineRelease: OFFLINE_RELEASE, assets: OFFLINE_ASSETS.length }));
} finally { await fs.rm(staging, { recursive: true, force: true }); }
export default { checks: passed.length, suites };
