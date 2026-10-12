import { createGameState, checkState } from '../state.js';
import { classifyRow } from '../rules.js';
import { solutionStructure } from '../structural-difficulty.js';

export const PRIMARY = [null,
  ['run-donation', 'group-donation', 'run-division'],
  ['interior-extraction', 'split-and-join', 'groups-to-runs', 'runs-to-groups'],
  ['interior-extraction', 'split-and-join', 'groups-to-runs', 'runs-to-groups', 'mixed-exchange'],
  ['interior-extraction', 'split-and-join', 'groups-to-runs', 'runs-to-groups', 'mixed-exchange', 'combined-repair'],
];
const count = values => {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
};
const range = values => [...new Set(values)].sort((a, b) => a - b);
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : null;
};
export const distribution = values => ({ median: percentile(values, .5), p95: percentile(values, .95), max: values.length ? Math.max(...values) : null });
const composition = rows => {
  const kinds = new Set(rows.map(row => classifyRow(row).kind));
  return kinds.size === 2 ? 'mixed' : kinds.has('run') ? 'run-only' : 'group-only';
};
function profile(record) {
  const { result, identity, elapsedMs } = record;
  const puzzle = result.puzzle, rating = puzzle.rating, state = createGameState(puzzle);
  if (puzzle.version !== 1 || puzzle.generatorVersion !== 6 || puzzle.difficultyTier !== identity.difficultyTier
    || puzzle.seed !== identity.seed || !checkState({ ...state, rack: [], board: puzzle.solution?.board }).won
    || rating?.structure?.version !== 2 || !rating.family?.primary || !rating.signatures
    || rating.family.proof !== (identity.difficultyTier === 1 ? 'existential-priority' : 'all-minimum-solutions')) throw Error('Invalid revision-6 puzzle or certification.');
  const values = state.inventory.map(id => Number(id.split('-')[1]));
  const faces = state.inventory.map(id => id.slice(0, id.lastIndexOf('-')));
  const structure = solutionStructure(state, puzzle.solution.board);
  return { identity, status: 'ready', elapsedMs, attempts: result.attempts, rejected: result.rejected, diagnostics: result.diagnostics,
    family: rating.family.primary, pattern: rating.pattern, proofNodes: rating.proofNodes,
    composition: composition(puzzle.board), changedComposition: composition(structure.changedRows.map(i => puzzle.board[i])),
    componentComposition: structure.components.map(c => composition(c.rows.map(i => puzzle.board[i]))),
    rack: puzzle.rack.length, rows: puzzle.board.length, runLengths: puzzle.board.filter(row => classifyRow(row).kind === 'run').map(row => row.length),
    groupSizes: puzzle.board.filter(row => classifyRow(row).kind === 'group').map(row => row.length),
    duplicates: state.inventory.length - new Set(faces).size, competingPlacements: rating.competingPlacements,
    minimumR: rating.rearrangement, physicalPartitions: rating.structure.partitions, minimumPartitions: rating.structure.minimumPartitions,
    common: rating.family.common, optional: rating.family.optional, witnessKinds: rating.family.eligibleWitnessKinds,
    geometry: rating.signatures.geometry, boundary: rating.signatures.boundary, inventoryBounds: [Math.min(...values), Math.max(...values)],
    signatureStatus: rating.signatures.status, originKeys: rating.signatures.minimumSolutions.map(x => x.origin),
    mechanismProfiles: rating.signatures.minimumSolutions.map(x => JSON.stringify(x.profile)),
  };
}

export function summarizeRevision6(records, { block, plannedPerTier = 256, cancelled = false } = {}) {
  const tiers = [1, 2, 3, 4].map(tier => {
    const requested = records.filter(r => r.identity.difficultyTier === tier), ready = requested.filter(r => r.status === 'ready');
    const n = ready.length, families = count(ready.map(r => r.family)), compositions = count(ready.map(r => r.composition));
    const gates = [];
    const gate = (name, passes, actual, bound) => gates.push({ name, passes, actual, bound });
    gate('complete-block', requested.length === 256 && n === 256, [requested.length, n], [256, 256]);
    const cap = Math.floor(n * (tier === 1 ? .5 : tier === 2 ? .4 : .35));
    for (const family of PRIMARY[tier]) gate(`minimum:${family}`, (families[family] || 0) >= Math.ceil(n * .05), families[family] || 0, Math.ceil(n * .05));
    gate('family-count', Object.keys(families).length >= PRIMARY[tier].length, Object.keys(families).length, PRIMARY[tier].length);
    gate('maximum-family', Object.values(families).every(value => value <= cap), Math.max(0, ...Object.values(families)), cap);
    const minComposition = tier < 3 ? { 'run-only': .2, mixed: .2 } : tier === 3
      ? { 'run-only': .1, mixed: .1, 'group-only': .1 } : { 'run-only': .2, mixed: .4, 'group-only': .1 };
    for (const [name, fraction] of Object.entries(minComposition)) gate(`minimum:${name}`, (compositions[name] || 0) >= Math.ceil(n * fraction), compositions[name] || 0, Math.ceil(n * fraction));
    if (tier === 1) gate('group-present', n - (compositions['run-only'] || 0) >= Math.ceil(n * .2), n - (compositions['run-only'] || 0), Math.ceil(n * .2));
    if (tier === 3) gate('composition-cap', Object.values(compositions).every(value => value <= Math.floor(n * .6)), Math.max(0, ...Object.values(compositions)), Math.floor(n * .6));
    if (tier === 4) gate('group-only-cap', (compositions['group-only'] || 0) <= Math.floor(n * .3), compositions['group-only'] || 0, Math.floor(n * .3));
    let longestStreak = 0, current = 0, previous = null;
    for (const r of requested) {
      const family = r.status === 'ready' ? r.family : null;
      current = family && family === previous ? current + 1 : family ? 1 : 0;
      longestStreak = Math.max(longestStreak, current); previous = family;
    }
    const byFamily = Object.fromEntries([...new Set([...Object.keys(families), ...requested.flatMap(r => Object.keys(r.diagnostics?.attemptsByFamily || {}))])].sort().map(family => {
      const rows = ready.filter(r => r.family === family);
      const proposals = requested.filter(r => r.diagnostics?.attemptsByFamily?.[family]);
      return [family, { ready: rows.length, timingMs: distribution(rows.map(r => r.elapsedMs)), proofNodes: distribution(rows.map(r => r.proofNodes)),
        proposedAttempts: proposals.reduce((s, r) => s + r.diagnostics.attemptsByFamily[family], 0),
        proposedProofNodes: proposals.reduce((s, r) => s + r.diagnostics.proofNodesByFamily[family], 0),
        rejectionReasons: count(proposals.flatMap(r => Object.entries(r.diagnostics.rejectionsByFamily?.[family] || {}).flatMap(([status, amount]) => Array(amount).fill(status)))) }];
    }));
    return { tier, requested: requested.length, ready: n, failures: requested.length - n, unrequested: plannedPerTier - requested.length,
      failureRate: requested.length ? (requested.length - n) / requested.length : null, quotaPass: gates.every(g => g.passes), gates,
      families, compositions, changedCompositions: count(ready.map(r => r.changedComposition)),
      componentCompositions: count(ready.flatMap(r => r.componentComposition)), byFamily,
      timingMs: distribution(ready.map(r => r.elapsedMs)), proofNodes: distribution(ready.map(r => r.proofNodes)),
      geometries: count(ready.map(r => r.geometry)), originKeyFrequencies: count(ready.flatMap(r => r.originKeys)),
      mechanismProfileFrequencies: count(ready.flatMap(r => r.mechanismProfiles)), signatureStatuses: count(ready.map(r => r.signatureStatus)),
      boundaryProfiles: count(ready.map(r => JSON.stringify(r.boundary))), inventoryBounds: count(ready.map(r => JSON.stringify(r.inventoryBounds))),
      rackSizes: range(ready.map(r => r.rack)), rowCounts: range(ready.map(r => r.rows)), runLengths: range(ready.flatMap(r => r.runLengths)),
      groupSizes: range(ready.flatMap(r => r.groupSizes)), duplicates: range(ready.map(r => r.duplicates)),
      competingPlacements: range(ready.map(r => r.competingPlacements)), minimumR: range(ready.map(r => r.minimumR)),
      physicalPartitions: distribution(ready.map(r => r.physicalPartitions)), optionalMechanisms: count(ready.flatMap(r => r.optional)),
      longestFamilyStreak: longestStreak, slowest: [...ready].sort((a, b) => b.elapsedMs - a.elapsedMs).slice(0, 5).map(r => ({ identity: r.identity, family: r.family, elapsedMs: r.elapsedMs, proofNodes: r.proofNodes })),
      sequences: Array.from({ length: 16 }, (_, group) => requested.slice(group * 16, group * 16 + 16).map(r => ({ seed: r.identity.seed, family: r.family || r.status, pattern: r.pattern }))),
    };
  });
  return { revision: 6, block, plannedPerTier, cancelled, requested: records.length, ready: records.filter(r => r.status === 'ready').length,
    quotaPass: !cancelled && tiers.every(t => t.quotaPass), tiers, failures: records.filter(r => r.status !== 'ready'), records };
}

/** Fixed blocks, sequential dedicated workers. Never touches gameplay or preferences. */
export async function benchmarkRevision6({ service, block = 'dev', countPerTier = 256, signal,
  now = () => performance.now(), onSample = () => {} } = {}) {
  if (!service || !['dev', 'holdout'].includes(block) || !Number.isInteger(countPerTier) || countPerTier < 1 || countPerTier > 256) throw Error('Supply a service, dev/holdout block and 1–256 seeds per tier.');
  const records = []; let cancelled = false;
  for (let tier = 1; tier <= 4 && !cancelled; tier += 1) for (let index = 0; index < countPerTier; index += 1) {
    if (signal?.aborted) { cancelled = true; break; }
    const identity = { version: 1, generatorVersion: 6, difficultyTier: tier, seed: `variety-v6-${block}-${index}` }, start = now();
    let result, record;
    try {
      result = await service.generate(identity, { signal });
      record = result.status === 'ready' ? profile({ result, identity, elapsedMs: now() - start })
        : { identity, status: result.status, elapsedMs: now() - start, attempts: result.attempts, rejected: result.rejected, diagnostics: result.diagnostics };
    } catch (error) {
      record = { identity, status: error.name === 'AbortError' && signal?.aborted ? 'cancelled' : 'error', elapsedMs: now() - start, error: error.message };
      if (record.status === 'cancelled') cancelled = true;
    }
    records.push(record); await onSample(record, result);
    if (cancelled) break;
  }
  return summarizeRevision6(records, { block, plannedPerTier: countPerTier, cancelled });
}
