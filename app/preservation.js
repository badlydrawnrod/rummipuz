import { parseTile } from './rules.js';
import { checkState } from './state.js';

// Constrained exact cover: each preserved original row is an indivisible
// block of physical IDs. Blocks may merge into the same extended valid row.
export function solvePreservingRows(state, rowIndices, { maxNodes = Infinity } = {}) {
  const checked = checkState(state);
  if (!checked.conserved || checked.invalidRows.length || state.board.some((row) => row.length === 0)
      || !Number.isSafeInteger(rowIndices.length)
      || rowIndices.length > 9 || new Set(rowIndices).size !== rowIndices.length
      || rowIndices.some((row) => !Number.isInteger(row) || row < 0 || row >= state.board.length)
      || (maxNodes !== Infinity && (!Number.isSafeInteger(maxNodes) || maxNodes < 0))) {
    throw new Error('Invalid preserved-row search input.');
  }
  const colours = ['black', 'blue', 'red', 'orange'];
  const face = (id) => { const tile = parseTile(id); return colours.indexOf(tile.colour) * 13 + tile.value - 1; };
  const blocks = rowIndices.map((row) => state.board[row]);
  const reserved = new Set(blocks.flat());
  const free = Array.from({ length: 52 }, () => []);
  state.inventory.filter((id) => !reserved.has(id)).forEach((id) => free[face(id)].push(id));
  free.forEach((ids) => ids.sort());
  const counts = free.map((ids) => ids.length);
  const blockFaces = blocks.map((row) => row.map(face));
  const present = new Set(state.inventory.map(face));
  const rows = [];
  for (let c = 0; c < 4; c += 1) {
    for (let start = 0; start < 11; start += 1) {
      const members = [];
      for (let end = start; end < 13 && present.has(c * 13 + end); end += 1) {
        members.push(c * 13 + end);
        if (members.length >= 3) rows.push([...members]);
      }
    }
  }
  for (let value = 0; value < 13; value += 1) {
    for (let mask = 1; mask < 16; mask += 1) {
      const members = colours.flatMap((_, c) => mask & (1 << c) ? [c * 13 + value] : []);
      if (members.length >= 3 && members.every((f) => present.has(f))) rows.push(members);
    }
  }
  const eligible = rows.map((members) => blockFaces.flatMap((faces, i) =>
    faces.every((f) => members.includes(f)) ? [i] : []));
  const failed = new Set();
  const LIMIT = Symbol('limit');
  let nodes = 0;
  const search = (mask, remaining) => {
    if (nodes >= maxNodes) return LIMIT;
    nodes += 1;
    if (remaining === 0) return [];
    const key = `${counts.join('')}:${mask}`;
    if (failed.has(key)) return null;
    const pivotBlock = blocks.findIndex((_, i) => mask & (1 << i));
    const pivotFace = pivotBlock < 0 ? counts.findIndex((count) => count > 0) : -1;
    for (let row = 0; row < rows.length; row += 1) {
      const members = rows[row];
      if (pivotBlock >= 0 ? !eligible[row].includes(pivotBlock) : !members.includes(pivotFace)) continue;
      const active = eligible[row].filter((i) => mask & (1 << i));
      // Enumerate every compatible subset of reserved blocks in this row.
      for (let subset = 0; subset < (1 << active.length); subset += 1) {
        const selected = active.filter((_, i) => subset & (1 << i));
        if (pivotBlock >= 0 && !selected.includes(pivotBlock)) continue;
        const ids = selected.flatMap((i) => blocks[i]);
        const occupied = ids.map(face);
        if (new Set(occupied).size !== occupied.length) continue;
        const extra = members.filter((f) => !occupied.includes(f));
        if (extra.some((f) => counts[f] === 0)) continue;
        const assigned = new Map(ids.map((id) => [face(id), id]));
        extra.forEach((f) => { assigned.set(f, free[f][free[f].length - counts[f]]); counts[f] -= 1; });
        const removedMask = selected.reduce((bits, i) => bits | (1 << i), 0);
        const suffix = search(mask ^ removedMask, remaining - members.length);
        extra.forEach((f) => { counts[f] += 1; });
        if (suffix === LIMIT) return LIMIT;
        if (suffix !== null) return [members.map((f) => assigned.get(f)), ...suffix];
      }
    }
    failed.add(key);
    return null;
  };
  const board = search((1 << blocks.length) - 1, state.inventory.length);
  if (board === LIMIT) return { status: 'limit', board: null, nodes };
  if (board === null) return { status: 'unsolvable', board: null, nodes };
  if (!checkState({ ...state, rack: [], board }).won) throw new Error('Invalid constrained solution.');
  return { status: 'solved', board, nodes };
}
