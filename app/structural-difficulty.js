import { parseTile, classifyRow } from './rules.js';
import { createGameState, checkState } from './state.js';
import { ratePuzzle, rearrangedRows } from './difficulty.js';

/** Origin-sensitive features of a complete physical-tile partition. */
export function solutionStructure(state, board) {
  const changed = rearrangedRows(state, board); // Also validates conservation and row order.
  const targets = board.map((row) => new Set(row));
  const kinds = board.map((row) => classifyRow(row).kind);
  const nonEndpoint = changed.filter((index) => {
    const source = state.board[index];
    if (classifyRow(source).kind !== 'run') return true;
    return !targets.some((target, row) => {
      const positions = source.flatMap((id, i) => target.has(id) ? [i] : []);
      if (kinds[row] !== 'run' || positions.length < 3
          || positions.at(-1) - positions[0] + 1 !== positions.length) return false;
      const ends = [source.slice(0, positions[0]), source.slice(positions.at(-1) + 1)];
      // A surviving second run fragment is a split, not endpoint donation.
      return !ends.some((end) => targets.some((other, otherRow) => {
        if (otherRow === row || kinds[otherRow] !== 'run') return false;
        for (let start = 0; start + 2 < end.length; start += 1) {
          if (end.slice(start, start + 3).every((id) => other.has(id))) return true;
        }
        return false;
      }));
    });
  });
  const edges = new Map(changed.map((index) => [index, new Set()]));
  for (const target of targets) {
    const contributors = changed.filter((index) => state.board[index].some((id) => target.has(id)));
    for (const a of contributors) for (const b of contributors) if (a !== b) edges.get(a).add(b);
  }
  const unseen = new Set(changed);
  const components = [];
  for (const first of changed) {
    if (!unseen.has(first)) continue;
    const pending = [first];
    const rows = [];
    while (pending.length) {
      const index = pending.pop();
      if (!unseen.delete(index)) continue;
      rows.push(index);
      pending.push(...edges.get(index));
    }
    rows.sort((a, b) => a - b);
    components.push({ rows, nonEndpointRows: rows.filter((index) => nonEndpoint.includes(index)) });
  }
  return { changedRows: changed, nonEndpointRows: nonEndpoint, components };
}

const qualifies = (features, tier) => tier === 1
  ? features.changedRows.length === 1 && features.nonEndpointRows.length === 0
  : features.components.some(({ rows, nonEndpointRows }) => rows.length >= tier && nonEndpointRows.length >= tier - 1);

/**
 * Retain the exact minimum-R proof, then exhaust physical partitions looking
 * for an easier counterexample. No face-count or partial-structure memoization:
 * assignments with identical faces can differ in origin and connections.
 * Candidate expansion and recursion share the remaining fixed node budget.
 */
export function rateStructuralPuzzle(puzzle, { maxNodes = 100000 } = {}) {
  const base = ratePuzzle(puzzle, { maxNodes });
  if (base.status !== 'rated') return base;
  const state = createGameState(puzzle);
  const tier = base.tier;
  let nodes = base.nodes;
  let partitions = 0;
  const spend = () => {
    if (nodes >= maxNodes) return false;
    nodes += 1;
    return true;
  };
  const limited = () => ({ ...base, status: 'limit', tier: null, board: null, nodes });
  const inventory = [...state.inventory].sort(); // Canonical ASCII physical IDs.
  const copies = new Map();
  inventory.forEach((id, index) => {
    const tile = parseTile(id);
    const key = `${tile.colour}-${tile.value}`;
    if (!copies.has(key)) copies.set(key, []);
    copies.get(key).push(index);
  });
  const shapes = [];
  const colours = ['black', 'blue', 'red', 'orange'];
  for (const colour of colours) {
    for (let start = 1; start <= 11; start += 1) {
      const faces = [];
      for (let end = start; end <= 13 && copies.has(`${colour}-${end}`); end += 1) {
        faces.push(`${colour}-${end}`);
        if (faces.length >= 3) shapes.push([...faces]);
      }
    }
  }
  for (let value = 1; value <= 13; value += 1) {
    for (let mask = 1; mask < 16; mask += 1) {
      const faces = colours.flatMap((colour, i) => mask & (1 << i) ? [`${colour}-${value}`] : []);
      if (faces.length >= 3 && faces.every((f) => copies.has(f))) shapes.push(faces);
    }
  }
  const byTile = inventory.map(() => []);
  let expansionLimited = false;
  function expand(shape, at, indices, mask) {
    if (!spend()) { expansionLimited = true; return; }
    if (at === shape.length) {
      const candidate = { mask, row: indices.map((index) => inventory[index]) };
      for (const index of indices) byTile[index].push(candidate);
      return;
    }
    for (const index of copies.get(shape[at])) {
      expand(shape, at + 1, [...indices, index], mask | (1n << BigInt(index)));
      if (expansionLimited) return;
    }
  }
  for (const shape of shapes) {
    expand(shape, 0, [], 0n);
    if (expansionLimited) return limited();
  }
  const LIMIT = Symbol('limit');
  let endpointWitness = null;
  function search(remaining, board) {
    if (!spend()) return LIMIT;
    if (remaining === 0n) {
      partitions += 1;
      const structure = solutionStructure(state, board);
      if (tier === 1) {
        if (qualifies(structure, tier)) { endpointWitness = board; return board; }
      } else if (!qualifies(structure, tier)) return board;
      return null;
    }
    let choices = null;
    for (let index = 0; index < inventory.length; index += 1) {
      if (!(remaining & (1n << BigInt(index)))) continue;
      const available = byTile[index].filter(({ mask }) => (mask & remaining) === mask);
      if (available.length === 0) return null;
      if (choices === null || available.length < choices.length) choices = available;
    }
    for (const { mask, row } of choices) {
      const result = search(remaining ^ mask, [...board, row]);
      if (result !== null) return result;
    }
    return null;
  }
  const result = search((1n << BigInt(inventory.length)) - 1n, []);
  if (result === LIMIT) return limited();
  const rejected = tier === 1 ? !endpointWitness : result !== null;
  if (rejected) return { ...base, status: 'excluded', tier: null, board: null, nodes,
    features: { ...base.features, structuralRejection: true }, counterexample: tier === 1 ? null : result };
  if (partitions === 0) throw new Error('Structural search disagrees with the solvability proof.');
  const board = endpointWitness || base.board;
  if (!checkState({ ...state, rack: [], board }).won) throw new Error('Invalid structural witness.');
  board.forEach(Object.freeze); Object.freeze(board);
  return { ...base, board, nodes, features: { ...base.features, rowsTouched: rearrangedRows(state, board),
    structure: { version: 1, proof: tier === 1 ? 'endpoint-witness' : 'exhaustive-no-counterexample',
      partitions, witness: solutionStructure(state, board) } } };
}
