import { createGameState, checkState } from '../state.js';

const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};

/** Fixed sequential sample using the same dedicated-worker boundary as play.
 * Does not read/write progress, settings, or the active game. Caller owns service.
 */
export async function benchmarkRevision5({ service, countPerTier = 64, signal,
  now = () => performance.now(), onSample = () => {} } = {}) {
  if (!service || !Number.isInteger(countPerTier) || countPerTier < 1 || countPerTier > 256) {
    throw new Error('Supply a puzzle service and 1–256 seeds per tier.');
  }
  const records = [];
  let cancelled = false;
  for (let tier = 1; tier <= 4 && !cancelled; tier += 1) {
    for (let index = 0; index < countPerTier; index += 1) {
      if (signal?.aborted) { cancelled = true; break; }
      const identity = { version: 1, generatorVersion: 5, difficultyTier: tier, seed: `verify-v5-${index}` };
      const start = now();
      let result;
      let record;
      try {
        result = await service.generate(identity, { signal });
        const elapsedMs = now() - start;
        if (result.status === 'ready') {
          const puzzle = result.puzzle;
          const state = createGameState(puzzle);
          const proof = puzzle.rating?.structure;
          if (puzzle.version !== 1 || puzzle.generatorVersion !== 5 || puzzle.difficultyTier !== tier
              || puzzle.seed !== identity.seed || !checkState({ ...state, rack: [], board: puzzle.solution?.board }).won
              || !proof || (tier === 1 ? proof.proof !== 'endpoint-witness'
                : proof.proof !== 'exhaustive-no-counterexample')) throw new Error('Invalid prepared puzzle or structural proof.');
          record = { identity, status: 'ready', elapsedMs, attempts: result.attempts,
            pattern: puzzle.rating.pattern, rack: puzzle.rack.length, rows: puzzle.board.length,
            minimumR: puzzle.rating.rearrangement, partitionsVisited: proof.partitions };
        } else record = { identity, status: result.status, elapsedMs };
      } catch (error) {
        if (error.name === 'AbortError' && signal?.aborted) { cancelled = true; break; }
        record = { identity, status: 'error', elapsedMs: now() - start, error: error.message };
      }
      records.push(record);
      onSample(record, result);
    }
  }
  const failures = new Map();
  for (const record of records.filter((r) => r.status !== 'ready')) {
    const error = record.error || null;
    const key = JSON.stringify([record.status, error]);
    if (!failures.has(key)) failures.set(key, { status: record.status, error, count: 0, firstIdentity: record.identity });
    failures.get(key).count += 1;
  }
  const tiers = [1, 2, 3, 4].map((tier) => {
    const rows = records.filter((r) => r.identity.difficultyTier === tier);
    const ready = rows.filter((r) => r.status === 'ready');
    const times = ready.map((r) => r.elapsedMs);
    const patterns = {};
    for (const row of ready) patterns[row.pattern] = (patterns[row.pattern] || 0) + 1;
    return { tier, requested: rows.length, ready: ready.length, failures: rows.length - ready.length,
      failureRate: rows.length ? (rows.length - ready.length) / rows.length : null,
      medianMs: percentile(times, 0.5), p95Ms: percentile(times, 0.95), maxMs: times.length ? Math.max(...times) : null,
      patterns };
  });
  return { revision: 5, seedPrefix: 'verify-v5-', countPerTier, cancelled,
    requested: records.length, ready: records.filter((r) => r.status === 'ready').length, tiers, errors: [...failures.values()], records };
}
