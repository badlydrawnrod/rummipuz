import { classifyRow, parseTile } from './rules.js';
import { checkState, moveTile } from './state.js';
import { solveState } from './solver.js';
import { solvePreservingRows } from './preservation.js';

const COLOURS = ['black', 'blue', 'red', 'orange'];

function groupLike(row) {
  const tiles = row.map(parseTile);
  return row.length > 0 && row.length < 4 && tiles.every(Boolean)
    && tiles.every((tile) => tile.value === tiles[0].value)
    && new Set(tiles.map((tile) => tile.colour)).size === tiles.length;
}

function validTarget(board, inventory) {
  return Array.isArray(board) && board.length > 0
    && board.every((row) => Array.isArray(row) && row.length > 0 && classifyRow(row).valid)
    && checkState({ inventory, rack: [], board }).won;
}

function targetScore(board, current) {
  // Count partial rows as well as finished rows. A target which keeps a pair
  // or a useful part of a damaged row together should beat an equally valid
  // target that scatters that work.
  let score = 0;
  for (const row of current.board) {
    if (!row.length) continue;
    const overlap = Math.max(0, ...board.map((target) => row.filter((id) => target.includes(id)).length));
    score += overlap * 3;
    if (classifyRow(row).valid && overlap === row.length) score += row.length * 2 + 1;
  }
  return score;
}

function preservingCandidate(state, baseline, budget) {
  const rows = state.board.map((row, index) => ({ row, index }))
    .filter(({ row }) => row.length && classifyRow(row).valid)
    .sort((a, b) => b.row.length - a.row.length || a.index - b.index)
    .slice(0, 9);
  if (!rows.length || budget <= 0) return { board: baseline, nodes: 0 };
  const reserved = new Set(rows.flatMap(({ row }) => row));
  const normalized = {
    inventory: state.inventory,
    rack: [...state.rack, ...state.board.flat().filter((id) => !reserved.has(id))],
    board: rows.map(({ row }) => [...row]),
  };
  let nodes = 0;
  let best = baseline;
  let bestScore = targetScore(baseline, state);
  let attempts = 0;
  const maxAttempts = 64;
  for (let count = rows.length; count > 0 && attempts < maxAttempts && nodes < budget; count -= 1) {
    const choose = (start, picked) => {
      if (attempts >= maxAttempts || nodes >= budget) return;
      if (picked.length === count) {
        attempts += 1;
        const result = solvePreservingRows(normalized, picked, { maxNodes: budget - nodes });
        nodes += result.nodes;
        if (result.status === 'solved') {
          const candidate = remapPhysicalCopies(result.board, state);
          const score = targetScore(candidate, state);
          if (score > bestScore) { best = candidate; bestScore = score; }
        }
        return;
      }
      for (let i = start; i <= rows.length - (count - picked.length); i += 1) {
        choose(i + 1, [...picked, i]);
        if (attempts >= maxAttempts || nodes >= budget) return;
      }
    };
    choose(0, []);
  }
  return { board: best, nodes };
}

function remapPhysicalCopies(board, state) {
  const index = (id) => {
    const tile = parseTile(id);
    return COLOURS.indexOf(tile.colour) * 13 + tile.value - 1;
  };
  const copy = board.map((row) => [...row]);
  const locations = new Map();
  state.rack.forEach((id) => locations.set(id, null));
  state.board.forEach((row, rowIndex) => row.forEach((id) => locations.set(id, rowIndex)));
  const inventoryByFace = Array.from({ length: 52 }, () => []);
  state.inventory.forEach((id) => inventoryByFace[index(id)].push(id));
  const facesByTarget = copy.map((row) => row.map(index));
  for (let face = 0; face < inventoryByFace.length; face += 1) {
    const ids = inventoryByFace[face].sort();
    const targetRows = facesByTarget.flatMap((row, rowIndex) => row.includes(face) ? [rowIndex] : []);
    if (ids.length !== targetRows.length) throw new Error('Assistance target lost a physical copy.');
    const permutations = (remaining, prefix = []) => remaining.length
      ? remaining.flatMap((item, i) => permutations([...remaining.slice(0, i), ...remaining.slice(i + 1)], [...prefix, item]))
      : [prefix];
    const options = permutations(ids);
    const rowScore = (id, targetRow) => {
      const sourceRow = locations.get(id);
      if (sourceRow === null || sourceRow === undefined) return 0;
      const sourceFaces = state.board[sourceRow].map(index);
      const targetFaces = facesByTarget[targetRow];
      const overlap = sourceFaces.filter((member) => targetFaces.includes(member)).length;
      const valid = classifyRow(state.board[sourceRow]).valid;
      return overlap * 3 + (valid && overlap === sourceFaces.length ? sourceFaces.length * 2 + 1 : 0);
    };
    let best = options[0] || [];
    let bestScore = -Infinity;
    for (const option of options) {
      const score = option.reduce((sum, id, i) => sum + rowScore(id, targetRows[i]), 0);
      if (score > bestScore) { best = option; bestScore = score; }
    }
    best.forEach((id, i) => {
      const rowIndex = targetRows[i];
      const position = facesByTarget[rowIndex].indexOf(face);
      copy[rowIndex][position] = id;
    });
  }
  // Group order carries no rule meaning. Retain the player's existing order
  // for every mapped group and append new members in the solver's stable order.
  for (const row of copy) {
    if (classifyRow(row).kind !== 'group') continue;
    const faceSet = new Set(row.map(index));
    const source = state.board.map((live, i) => ({ live, i }))
      .filter(({ live }) => groupLike(live))
      .map(({ live, i }) => ({ i, ids: live.filter((id) => faceSet.has(index(id))) }))
      .sort((a, b) => b.ids.length - a.ids.length || a.i - b.i)[0];
    if (!source?.ids.length) continue;
    const ordered = source.ids.filter((id) => row.includes(id));
    row.forEach((id) => { if (!ordered.includes(id)) ordered.push(id); });
    row.splice(0, row.length, ...ordered);
  }
  return copy;
}

function mapTargetRows(state, target) {
  const live = state.board.map((row, index) => ({ row, index })).filter(({ row }) => row.length);
  const assignments = Array(target.length).fill(null);
  const claimed = new Set();
  const pairs = [];
  target.forEach((wanted, targetIndex) => live.forEach(({ row, index }) => {
    const overlap = row.filter((id) => wanted.includes(id)).length;
    if (overlap) pairs.push({ targetIndex, rowIndex: index, overlap, exact: overlap === row.length && overlap === wanted.length });
  }));
  pairs.sort((a, b) => Number(b.exact) - Number(a.exact) || b.overlap - a.overlap
    || a.rowIndex - b.rowIndex || a.targetIndex - b.targetIndex);
  for (const pair of pairs) {
    if (assignments[pair.targetIndex] === null && !claimed.has(pair.rowIndex)) {
      assignments[pair.targetIndex] = pair.rowIndex;
      claimed.add(pair.rowIndex);
    }
  }
  return assignments;
}

function reasonFor(before, after, destination, targetRow) {
  const kind = classifyRow(targetRow).kind;
  const noun = kind === 'group' ? 'group' : 'run';
  if (destination.area === 'new-row') return `Start the ${noun}`;
  const beforeRow = before.board[destination.row] ?? [];
  const afterRow = after.board[destination.row] ?? [];
  if (!classifyRow(afterRow).valid) return `Prepare the ${noun}`;
  if (!classifyRow(beforeRow).valid) return `Complete the ${noun}`;
  return afterRow.length > beforeRow.length ? `Extend the ${noun}` : `Arrange the ${noun}`;
}

function deriveMoves(state, target) {
  let working = state;
  const moves = [];
  const assignments = mapTargetRows(working, target);
  // Repair existing rows first, especially by placing rack tiles into useful
  // partial work. A missing target row is created only when reached, through
  // the visible New row control rather than a hidden empty placeholder.
  const targetOrder = target.map((_, index) => index).sort((a, b) =>
    Number(assignments[a] === null) - Number(assignments[b] === null) || a - b);
  for (const t of targetOrder) {
    const createVisibleRow = () => {
      const id = target[t][0];
      const destination = { area: 'new-row' };
      const before = working;
      working = moveTile(working, id, destination);
      assignments[t] = before.board.length;
      moves.push({ id, destination, reason: reasonFor(before, working, destination, target[t]) });
    };
    if (assignments[t] === null || !working.board[assignments[t]]?.length) createVisibleRow();
    for (let wantedIndex = 0; wantedIndex < target[t].length; wantedIndex += 1) {
      const id = target[t][wantedIndex];
      if (!working.board[assignments[t]]?.length) createVisibleRow();
      const rowIndex = assignments[t];
      const currentRow = working.board[rowIndex];
      if (currentRow[wantedIndex] === id) continue;
      let source;
      const rackIndex = working.rack.indexOf(id);
      if (rackIndex >= 0) source = { area: 'rack', index: rackIndex };
      else {
        for (let r = 0; r < working.board.length; r += 1) {
          const i = working.board[r].indexOf(id);
          if (i >= 0) { source = { area: 'board', row: r, index: i }; break; }
        }
      }
      if (!source) throw new Error('Assistance could not locate a target tile.');
      const destinationIndex = source.area === 'board' && source.row === rowIndex && source.index < wantedIndex
        ? wantedIndex + 1 : wantedIndex;
      const destination = { area: 'board', row: rowIndex, index: destinationIndex };
      const before = working;
      working = moveTile(working, id, destination);
      if (working !== before) moves.push({ id, destination, reason: reasonFor(before, working, destination, target[t]) });
    }
  }
  const checked = checkState(working);
  if (!checked.won || working.rack.length || working.board.some((row) => row.length && !classifyRow(row).valid)) {
    throw new Error('Assistance move sequence did not reach a complete solution.');
  }
  // Return a detached, compact witness without empty layout placeholders.
  const board = working.board.filter((row) => row.length).map((row) => [...row]);
  if (!validTarget(board, state.inventory)) throw new Error('Assistance produced an invalid target.');
  return { board, moves };
}

/** Plan a deterministic, replayable next-move sequence for the live position. */
export function planAssistance(state, { maxNodes = 200000, preferredBoard = null } = {}) {
  if (!Number.isSafeInteger(maxNodes) || maxNodes < 0) throw new Error('Assistance maxNodes must be a nonnegative safe integer.');
  const checked = checkState(state);
  if (!checked.conserved) throw new Error(checked.errors.join(' '));
  if (checked.won) return { status: 'solved', board: state.board.filter((row) => row.length).map((row) => [...row]), moves: [], nodes: 0 };

  let preferred = null;
  if (preferredBoard !== null) {
    if (!validTarget(preferredBoard, state.inventory)) throw new Error('Preferred assistance board must be a complete solution for this inventory.');
    preferred = remapPhysicalCopies(preferredBoard, state);
  }
  const search = solveState(state, { maxNodes });
  if (search.status !== 'solved') {
    if (preferred) {
      const result = deriveMoves(state, remapPhysicalCopies(preferred, state));
      return { status: 'solved', board: result.board, moves: result.moves, nodes: search.nodes };
    }
    return { status: search.status, board: null, moves: null, nodes: search.nodes };
  }
  let board = remapPhysicalCopies(search.board, state);
  let nodes = search.nodes;
  const preserved = preservingCandidate(state, board, maxNodes - nodes);
  nodes += preserved.nodes;
  board = preserved.board;
  if (preferred && targetScore(preferred, state) >= targetScore(board, state)) board = preferred;
  board = remapPhysicalCopies(board, state);
  const result = deriveMoves(state, board);
  return { status: 'solved', board: result.board, moves: result.moves, nodes };
}
