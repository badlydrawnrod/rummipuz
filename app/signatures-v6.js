import { classifyRow, parseTile } from './rules.js';
import { solutionStructure } from './structural-difficulty.js';
const encode = JSON.stringify;
const ascii = (a, b) => a < b ? -1 : a > b ? 1 : 0;
// Python/JSON tuple ordering, including numerical values, not locale ordering.
const tuple = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const order = typeof a[i] === 'number' ? a[i] - b[i] : ascii(a[i], b[i]);
    if (order) return order;
  }
  return a.length - b.length;
};
const permutations = (items) => items.length ? items.flatMap((item, i) =>
  permutations(items.filter((_, j) => i !== j)).map((rest) => [item, ...rest])) : [[]];
const colours = ['black', 'blue', 'red', 'orange'];

/** Prepare all 48 starting transforms once. The joint encoding compares the
 * starting geometry before any final row, so only geometry-minimal transforms
 * can win. Keep all tied transforms and all tied source-index assignments.
 */
export function createSemanticCanonicalizer(state) {
  const origins = new Map(state.board.flatMap((row, i) => row.map((id) => [id, i])));
  const tiles = state.inventory.map((id) => parseTile(id));
  const sourceKinds = state.board.map((row) => classifyRow(row).kind);
  let geometry = null, transforms = [];
  for (const perm of permutations(colours)) for (const reflected of [false, true]) {
    const values = tiles.map((tile) => reflected ? 14 - tile.value : tile.value);
    const min = Math.min(...values);
    const mapped = new Map(state.inventory.map((id, i) => [id,
      [perm[colours.indexOf(tiles[i].colour)], values[i] - min + 1]]));
    const sources = state.board.map((row, i) => encode([sourceKinds[i], row.map((id) => mapped.get(id))
      .sort(sourceKinds[i] === 'run' ? (a, b) => a[1] - b[1] : tuple)]));
    const sorted = [...sources].sort(ascii);
    const start = ['start-v1', sorted.map((row) => JSON.parse(row)), state.rack.map((id) => mapped.get(id)).sort(tuple)];
    const key = encode(start);
    if (geometry === null || key < geometry) { geometry = key; transforms = []; }
    if (key === geometry) transforms.push({ mapped, sources, sorted, start });
  }
  for (const transform of transforms) {
    const { sources, sorted } = transform;
    const tied = [...new Set(sorted)].map((key) => {
      const slots = sorted.flatMap((s, i) => s === key ? [i] : []);
      const indices = sources.flatMap((s, i) => s === key ? [i] : []);
      return permutations(slots).map((assignment) => indices.map((i, j) => [i, assignment[j]]));
    });
    transform.mappings = [];
    function assign(at, pairs) {
      if (at < tied.length) { for (const next of tied[at]) assign(at + 1, [...pairs, ...next]); return; }
      transform.mappings.push(new Map(pairs));
    }
    assign(0, []);
  }
  return (board = null) => {
    let origin = null, mapping = null, finalRows = null;
    if (board) {
      const kinds = board.map((row) => classifyRow(row).kind);
      for (const { mapped, start, mappings } of transforms) for (const indexMap of mappings) {
        const finals = board.map((row, i) => {
          const entries = row.map((id) => [...mapped.get(id), origins.has(id) ? `row:${indexMap.get(origins.get(id))}` : 'rack']);
          entries.sort(kinds[i] === 'run' ? (a, b) => a[1] - b[1] : tuple);
          return [kinds[i], entries];
        }).sort((a, b) => ascii(encode(a), encode(b)));
        const key = encode(['origin-v1', start, finals]);
        if (origin === null || key < origin) { origin = key; mapping = indexMap; finalRows = finals; }
      }
    }
    return { geometry, origin, mapping, finalRows };
  };
}

/** Same literal 48-transform semantics; reuse the prepared context in batch proofs. */
export function semanticKeys(state, board = null) {
  return createSemanticCanonicalizer(state)(board);
}

export function mechanismProfile(state, board, predicates, keys) {
  const structure = solutionStructure(state, board);
  const changed = new Set(structure.changedRows.map((i) => `row:${keys.mapping.get(i)}`));
  const counts = keys.finalRows.map(([, row]) => {
    const result = new Map();
    for (const tile of row) if (tile[2].startsWith('row:')) result.set(tile[2], (result.get(tile[2]) || 0) + 1);
    return result;
  });
  const changedKinds = {};
  for (const i of structure.changedRows) {
    const kind = classifyRow(state.board[i]).kind;
    changedKinds[kind] = (changedKinds[kind] || 0) + 1;
  }
  return {
    predicates: [...predicates].sort(ascii),
    changedKinds: Object.fromEntries(Object.entries(changedKinds).sort(([a], [b]) => ascii(a, b))),
    components: structure.components.map((c) => [c.rows.length, c.nonEndpointRows.length]).sort(tuple),
    contributions: counts.flatMap((row, j) => [...row].sort(([a], [b]) => ascii(a, b))
      .map(([source, count]) => [Number(source.slice(4)), j, count])),
    splittingSources: [...changed].filter((source) => counts.filter((row) => row.has(source)).length >= 2).length,
    joiningTargets: counts.filter((row) => [...changed].filter((source) => row.has(source)).length >= 2).length,
    directions: [...new Set(structure.changedRows.flatMap((i) => board.flatMap((row) =>
      state.board[i].some((id) => row.includes(id)) ? [`${classifyRow(state.board[i]).kind}-to-${classifyRow(row).kind}`] : [])))].sort(ascii),
  };
}
