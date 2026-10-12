/** Native revision-6 fixed-block verification; no npm/build changes. */
import fs from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { cpus, platform, arch } from 'node:os';
const root = new URL('../../', import.meta.url);
const staging = await fs.mkdtemp('/tmp/rummipuz-v6-performance-');
await fs.writeFile(staging + '/package.json', '{"type":"module"}');
await fs.cp(new URL('app/', root), staging + '/app', { recursive: true });
const app = new URL('file://' + staging + '/app/');
const { benchmarkRevision6 } = await import(new URL('checks/revision-6-benchmark.js', app));
const { createPuzzleService } = await import(new URL('puzzle-service.js', app));
const { generatePuzzle } = await import(new URL('rated-generator.js', app));
const workerFactory = () => {
  const worker = new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self={addEventListener(type,handler){parentPort.on(type,data=>handler({data}));},postMessage(value){parentPort.postMessage(value);}};import(${JSON.stringify(new URL('puzzle-worker.js', app).href)});`, { eval: true });
  const listeners = new Map();
  return { addEventListener(type, fn) { const wrap = type === 'message' ? data => fn({ data }) : error => fn({ message: error.message, preventDefault() {} }); listeners.set(fn, wrap); worker.on(type, wrap); },
    removeEventListener(type, fn) { const wrap = listeners.get(fn); if (wrap) worker.off(type, wrap); listeners.delete(fn); },
    postMessage(data) { worker.postMessage(data); }, terminate() { worker.terminate(); } };
};
const service = createPuzzleService({ workerFactory });
const reports = [], samples = [], direct = []; let heartbeats = 0;
const timer = setInterval(() => { heartbeats += 1; }, 10);
console.log(JSON.stringify({ staging, status: 'running', total: 2048 }));
try {
  for (const block of ['dev', 'holdout']) {
    const report = await benchmarkRevision6({ service, block, onSample(record, result) {
      if (result?.status === 'ready') samples.push({ identity: record.identity, result });
      if (record.identity.seed.endsWith('-255')) console.log(JSON.stringify({ block, tier: record.identity.difficultyTier, finished: true }));
    } });
    reports.push(report);
    await fs.writeFile(staging + `/${block}.json`, JSON.stringify(report));
  }
  // Separate direct pass avoids contaminating the worker timing distribution.
  for (const sample of samples) {
    const start = performance.now(), again = generatePuzzle(sample.identity), elapsedMs = performance.now() - start;
    if (JSON.stringify(again) !== JSON.stringify(sample.result)) throw Error(`Worker/direct deterministic mismatch ${sample.identity.seed}`);
    direct.push({ identity: sample.identity, elapsedMs, family: again.puzzle.rating.family.primary });
  }
} finally { clearInterval(timer); service.dispose(); }
await fs.writeFile(staging + '/samples.json', JSON.stringify(samples));
await fs.writeFile(staging + '/direct.json', JSON.stringify(direct));
const summary = { environment: { runtime: 'native Node modules and worker threads; not browser/tablet', platform: platform(), arch: arch(), cpu: cpus()[0]?.model },
  timerHeartbeats: heartbeats, reports, direct };
await fs.writeFile(staging + '/verification.json', JSON.stringify(summary));
console.log(JSON.stringify({ staging, requested: reports.reduce((s, r) => s + r.requested, 0), ready: samples.length,
  blocks: reports.map(r => ({ block: r.block, quotaPass: r.quotaPass, tiers: r.tiers.map(t => ({ tier: t.tier, families: t.families, compositions: t.compositions, quotaPass: t.quotaPass, timingMs: t.timingMs, proofNodes: t.proofNodes })) })) }));
export default { staging, summary };
