/** Optional native measurement: node plans/checks/benchmark_v5_native.mjs */
import fs from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { platform, arch, cpus } from 'node:os';
// Stage native modules without adding a package manager or package.json to the app.
const staging = await fs.mkdtemp('/tmp/rummipuz-v5-performance-');
await fs.writeFile(staging + '/package.json', JSON.stringify({ type: 'module' }));
await fs.cp(new URL('../../app/', import.meta.url), staging + '/app', { recursive: true });
const app = new URL('file://' + staging + '/app/');
const { generatePuzzle } = await import(new URL('rated-generator.js', app));
const { benchmarkRevision5 } = await import(new URL('checks/revision-5-benchmark.js', app));
const { createPuzzleService } = await import(new URL('puzzle-service.js', app));
const workerFactory = () => {
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self={addEventListener(type,handler){parentPort.on(type,data=>handler({data}));},postMessage(value){parentPort.postMessage(value);}};import(${JSON.stringify(new URL('puzzle-worker.js',app).href)});`, {eval:true});
 const listeners=new Map();
 return {
  addEventListener(type,fn){const wrap=type==='message'?data=>fn({data}):error=>fn({message:error.message,preventDefault(){}});listeners.set(fn,wrap);worker.on(type,wrap);},
  removeEventListener(type,fn){const wrap=listeners.get(fn);if(wrap)worker.off(type,wrap);listeners.delete(fn);},
  postMessage(data){worker.postMessage(data);},terminate(){worker.terminate();}
 };
};
const samples=[];
const direct=[];
const service=createPuzzleService({workerFactory});
let heartbeats=0;
const timer=setInterval(()=>{heartbeats+=1;},10);
let report;
try {
 report=await benchmarkRevision5({service,onSample(record,result){
   if(record.status!=='ready')return;
   samples.push({identity:record.identity,result});
   const start=performance.now();const again=generatePuzzle(record.identity);const elapsedMs=performance.now()-start;
   if(JSON.stringify(again)!==JSON.stringify(result)||JSON.stringify(generatePuzzle(record.identity))!==JSON.stringify(again))throw new Error('Determinism or worker mismatch');
   direct.push({tier:record.identity.difficultyTier,elapsedMs});
 }});
}finally{clearInterval(timer);service.dispose();}
const summary = values => {const sorted=[...values].sort((a,b)=>a-b);return {medianMs:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1],maxMs:Math.max(...sorted)};};
const faceLayout = puzzle => JSON.stringify({board:puzzle.board.map(row=>row.map(id=>id.slice(0,id.lastIndexOf('-'))).sort().join(',')).sort(),rack:puzzle.rack.map(id=>id.slice(0,id.lastIndexOf('-'))).sort()});
report.environment={kind:'native Node worker threads; not desktop/tablet browser',runtime:'node_repl native modules',platform:platform(),arch:arch(),cpu:cpus()[0]?.model};
report.timerHeartbeats=heartbeats;
report.direct=report.tiers.map(t=>({tier:t.tier,...summary(direct.filter(d=>d.tier===t.tier).map(d=>d.elapsedMs))}));
report.variety=report.tiers.map(t=>{const entries=samples.filter(s=>s.identity.difficultyTier===t.tier);return {tier:t.tier,uniqueFaceLayouts:new Set(entries.map(s=>faceLayout(s.result.puzzle))).size,rackSizes:[...new Set(entries.map(s=>s.result.puzzle.rack.length))].sort(),boardRows:[...new Set(entries.map(s=>s.result.puzzle.board.length))].sort(),attempts:[...new Set(entries.map(s=>s.result.attempts))].sort()};});
await fs.writeFile(staging + '/verification.json',JSON.stringify(report,null,2)+'\n');
await fs.writeFile(staging + '/samples.json',JSON.stringify(samples)+'\n');
console.log(JSON.stringify({ directory: staging, ...report, records: undefined }, null, 2));
export default { directory: staging, ...report, records: undefined };
