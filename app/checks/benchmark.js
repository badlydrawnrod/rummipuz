import { benchmarkRevision5 } from './revision-5-benchmark.js';

export async function runBenchmarkChecks(fixtures) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const good = (identity) => {
    const result = fixtures.find((f) => f.identity.difficultyTier === identity.difficultyTier).result;
    return { ...result, puzzle: { ...result.puzzle, seed: identity.seed } };
  };
  let time = 0;
  const service = { async generate(identity) {
    if (identity.difficultyTier === 2 && identity.seed === 'verify-v5-0') return { status: 'exhausted' };
    if (identity.difficultyTier === 3 && identity.seed === 'verify-v5-0') throw new Error('Worker load failed');
    return good(identity);
  } };
  const report = await benchmarkRevision5({ service, countPerTier: 2, now: () => time++ });
  assert(report.requested === 8 && report.ready === 6 && !report.cancelled, 'Benchmark records failures without dropping requested seeds');
  assert(report.tiers[1].failureRate === 0.5 && report.tiers[1].failures === 1, 'Exhausted preparation contributes to failure rate');
  assert(report.errors.length === 2 && report.errors.every((e) => e.count === 1)
    && report.errors.some((e) => e.status === 'error' && e.error === 'Worker load failed'),
    'Summary exposes distinct failures and their first replay identities');
  assert(report.records.some((r) => r.status === 'error' && r.error === 'Worker load failed'), 'Worker errors retain a diagnostic record');
  assert(report.tiers[0].medianMs === 1 && report.tiers[0].p95Ms === 1 && report.tiers[0].maxMs === 1,
    'Timing summary uses only successful worker preparations');
  assert(Object.values(report.tiers[0].patterns).reduce((a, b) => a + b, 0) === 2, 'Family counts include each successful sample');
  const controller = new AbortController();
  const cancelled = await benchmarkRevision5({ service: { generate: async (identity) => good(identity) },
    signal: controller.signal, onSample: () => controller.abort() });
  assert(cancelled.cancelled && cancelled.requested === 1, 'Stopping keeps partial results and starts no extra requests');
  const beforeStart = await benchmarkRevision5({ service, signal: controller.signal });
  assert(beforeStart.cancelled && beforeStart.requested === 0, 'Pre-cancelled benchmark performs no work');
  assert(beforeStart.errors.length === 0, 'A cancelled run without requests does not invent errors');
  assert(beforeStart.tiers.every((t) => t.failureRate === null && t.medianMs === null), 'Unrequested tiers never report zero-time success');
  const invalid = await benchmarkRevision5({ service, countPerTier: 0 }).then(() => null, (e) => e);
  assert(invalid instanceof Error, 'Malformed benchmark sizes are rejected');
  const mismatched = await benchmarkRevision5({ service: { generate: async () => fixtures[0].result }, countPerTier: 1 });
  assert(mismatched.ready === 0 && mismatched.records.every((r) => r.status === 'error'), 'A mismatched replay identity cannot count as a benchmark success');
  assert(mismatched.errors.length === 1 && mismatched.errors[0].count === 4
    && mismatched.errors[0].firstIdentity.seed === 'verify-v5-0', 'Repeated failures are grouped without hiding their count');
  return passed;
}
