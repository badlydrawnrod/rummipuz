import { benchmarkRevision6, summarizeRevision6 } from './revision-6-benchmark.js';

export async function runVarietyBenchmarkChecks(fixtures) {
  const passed = [], assert = (ok, name) => { if (!ok) throw Error(`Failed: ${name}`); passed.push(name); };
  const good = identity => {
    const result = fixtures.find(f => f.identity.difficultyTier === identity.difficultyTier).result;
    return { ...result, puzzle: { ...result.puzzle, seed: identity.seed } };
  };
  let time = 0;
  const service = { async generate(identity) {
    if (identity.difficultyTier === 2 && identity.seed.endsWith('-0')) return { status: 'exhausted', diagnostics: { attemptsByFamily: { 'unready-family': 32 }, proofNodesByFamily: { 'unready-family': 100 }, rejectionsByFamily: { 'unready-family': { limit: 32 } } } };
    if (identity.difficultyTier === 3 && identity.seed.endsWith('-0')) throw Error('worker failed');
    return good(identity);
  } };
  const report = await benchmarkRevision6({ service, countPerTier: 2, now: () => time++ });
  assert(report.requested === 8 && report.ready === 6 && report.failures.length === 2, 'Every requested seed, error and exhaustion is accounted for');
  assert(report.records[0].identity.seed === 'variety-v6-dev-0', 'Development seeds use the predeclared full identity');
  assert(report.tiers[1].failureRate === .5 && report.tiers[1].byFamily['unready-family'].proposedAttempts === 32,
    'Failed-only family attempts remain in diagnostics');
  assert(report.tiers[1].byFamily['unready-family'].rejectionReasons.limit === 32, 'Failed-only proposal proof limits are retained');
  assert(report.tiers[0].timingMs.median === 1 && !report.quotaPass, 'Timings exclude failure and partial blocks cannot pass');
  assert(report.tiers[0].signatureStatuses.complete === 2 && report.tiers[0].sequences[0].length === 2,
    'Semantic completeness and fixed consecutive sequences remain visible');
  const controller = new AbortController();
  const cancelled = await benchmarkRevision6({ service: { generate: async () => { controller.abort(); const error = Error('stopped'); error.name = 'AbortError'; throw error; } }, signal: controller.signal });
  assert(cancelled.cancelled && cancelled.requested === 1 && cancelled.failures[0].status === 'cancelled', 'In-flight deliberate cancellation retains the requested identity');
  const preaborted = await benchmarkRevision6({ service, signal: controller.signal });
  assert(preaborted.requested === 0 && !preaborted.quotaPass && preaborted.tiers.every(t => t.timingMs.median === null), 'Unrequested tiers cannot imply readiness or zero timing');
  const holdout = await benchmarkRevision6({ service: { generate: async identity => good(identity) }, block: 'holdout', countPerTier: 1 });
  assert(holdout.records[0].identity.seed === 'variety-v6-holdout-0', 'Holdout seeds use the fixed second block');
  for (const options of [{ block: 'new-seeds' }, { countPerTier: 0 }, { countPerTier: 257 }]) {
    assert(await benchmarkRevision6({ service, ...options }).then(() => false, () => true), 'Invalid block and sample sizes are rejected');
  }
  const mismatched = await benchmarkRevision6({ service: { generate: async () => fixtures[0].result }, countPerTier: 1 });
  assert(mismatched.ready === 0 && mismatched.failures.length === 4, 'Incorrect replay identity cannot count as ready');
  // Synthetic integer gate boundary: every record still has meaningful diagnostics.
  const template = holdout.records[0];
  const easy = Array.from({ length: 256 }, (_, i) => ({ ...template,
    identity: { ...template.identity, seed: `variety-v6-dev-${i}` }, family: i < 128 ? 'run-donation' : i < 192 ? 'group-donation' : 'run-division',
    composition: i < 128 ? 'run-only' : 'mixed' }));
  const exact = summarizeRevision6(easy, { block: 'dev' }).tiers[0];
  assert(exact.quotaPass && exact.gates.find(g => g.name === 'maximum-family').bound === 128, 'Exact integer family cap passes');
  const above = easy.map((r, i) => i === 128 ? { ...r, family: 'run-donation' } : r);
  assert(!summarizeRevision6(above, { block: 'dev' }).tiers[0].quotaPass, 'One output above the integer cap fails');
  const scarce = easy.map((r, i) => ({ ...r, family: i < 12 ? 'run-division' : i < 134 ? 'run-donation' : 'group-donation' }));
  assert(!summarizeRevision6(scarce, { block: 'dev' }).tiers[0].gates.find(g => g.name === 'minimum:run-division').passes,
    'Five-percent lower bound rounds upward to thirteen outputs');
  const broken = easy.map((r, i) => i === 16 ? { identity: r.identity, status: 'error' } : { ...r, family: 'run-donation' });
  assert(summarizeRevision6(broken, { block: 'dev' }).tiers[0].longestFamilyStreak === 239, 'Failure breaks a family streak instead of being omitted');
  return passed;
}
