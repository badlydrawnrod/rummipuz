import { parseTile } from './rules.js';
import { checkState } from './state.js';

const COLOURS = ['black', 'blue', 'red', 'orange'];
const faceIndex = (colour, value) => COLOURS.indexOf(colour) * 13 + value - 1;

/**
 * Find an exact partition of all puzzle tiles into legal rows. Accepts any
 * conserved live state, including temporary invalid rows; ignores stored
 * solutions and current placement. Input is never modified.
 *
 * Returns { status: 'solved' | 'unsolvable' | 'limit', board, nodes }.
 * board is null unless solved. maxNodes defaults to Infinity; exhausting a
 * finite budget is inconclusive, never proof of unsolvability.
 */
export function solveState(state, { maxNodes = Infinity } = {}) {
  if (maxNodes !== Infinity && (!Number.isSafeInteger(maxNodes) || maxNodes < 0)) {
    throw new Error('Solver maxNodes must be a nonnegative safe integer or Infinity.');
  }
  const checked = checkState(state);
  if (!checked.conserved) throw new Error(checked.errors.join(' '));

  // Copies share row-validity properties. Search face counts, then assign
  // actual physical IDs; this avoids exponential equivalent-copy choices.
  const copies = Array.from({ length: 52 }, () => []);
  for (const id of state.inventory) {
    const tile = parseTile(id);
    copies[faceIndex(tile.colour, tile.value)].push(id);
  }
  copies.forEach((ids) => ids.sort());
  const counts = copies.map((ids) => ids.length);
  const candidates = [];
  const byFace = Array.from({ length: 52 }, () => []);
  const add = (faces) => {
    const candidate = candidates.length;
    candidates.push(faces);
    faces.forEach((face) => byFace[face].push(candidate));
  };
  // Every possible consecutive interval, including runs longer than three.
  for (let colour = 0; colour < 4; colour += 1) {
    for (let start = 0; start < 11; start += 1) {
      const faces = [];
      for (let end = start; end < 13; end += 1) {
        const face = colour * 13 + end;
        if (counts[face] === 0) break;
        faces.push(face);
        if (faces.length >= 3) add([...faces]);
      }
    }
  }
  // All three-colour subsets and the four-colour group at each value.
  for (let value = 0; value < 13; value += 1) {
    for (let mask = 1; mask < 16; mask += 1) {
      const faces = COLOURS.flatMap((_, colour) => mask & (1 << colour) ? [colour * 13 + value] : []);
      if (faces.length >= 3 && faces.every((face) => counts[face] > 0)) add(faces);
    }
  }

  let nodes = 0;
  const failed = new Set();
  const LIMIT = Symbol('search limit');
  const search = (remaining) => {
    if (nodes >= maxNodes) return LIMIT;
    nodes += 1;
    if (remaining === 0) return [];
    if (remaining < 3) return null;
    const key = counts.join('');
    if (failed.has(key)) return null;

    // Every solution must cover this face. Branch on the most constrained
    // uncovered face, and try every still-available row containing it.
    let choices = null;
    for (let face = 0; face < 52; face += 1) {
      if (counts[face] === 0) continue;
      const available = byFace[face].filter((candidate) =>
        candidates[candidate].every((member) => counts[member] > 0));
      if (available.length === 0) {
        failed.add(key);
        return null;
      }
      if (choices === null || available.length < choices.length) choices = available;
    }
    for (const candidate of choices) {
      const faces = candidates[candidate];
      faces.forEach((face) => { counts[face] -= 1; });
      const suffix = search(remaining - faces.length);
      faces.forEach((face) => { counts[face] += 1; });
      if (suffix === LIMIT) return LIMIT;
      if (suffix !== null) return [faces, ...suffix];
    }
    failed.add(key);
    return null;
  };

  const solution = search(state.inventory.length);
  if (solution === LIMIT) return { status: 'limit', board: null, nodes };
  if (solution === null) return { status: 'unsolvable', board: null, nodes };
  const used = Array(52).fill(0);
  const board = solution.map((faces) => faces.map((face) => copies[face][used[face]++]));
  // Verify the witness through the same rules and conservation check as play.
  if (!checkState({ inventory: state.inventory, rack: [], board }).won) {
    throw new Error('Solver produced an invalid solution.');
  }
  board.forEach(Object.freeze);
  return { status: 'solved', board: Object.freeze(board), nodes };
}
