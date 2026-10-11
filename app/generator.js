import { parseTile } from './rules.js';
import { createGameState } from './state.js';
import { solveState } from './solver.js';

export const GENERATOR_VERSION = 2;
const COLOURS = ['black', 'blue', 'red', 'orange'];
const BOUNDS = [null, [2, 5, 2, 5], [3, 6, 3, 6], [4, 8, 4, 7], [4, 10, 4, 9]];
const MAX_ATTEMPTS = 256;
const MAX_SOLVER_NODES = 20000;

// Revision 2: FNV-1a over the ASCII replay tuple, followed by Mulberry32.
// Integer arithmetic is explicitly 32-bit; no global random state or clock.
function randomFor(identity) {
  let state = 2166136261;
  for (const character of identity) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Produce an unpublished, solver-verified candidate for later difficulty
 * rating. difficultyTier is the REQUESTED tier; it is not proof of a rating.
 * Returns { status: 'candidate' | 'exhausted', puzzle, attempts, rejected }.
 * Fixed revision budgets make success/failure and ordering replayable.
 */
export function generateCandidate({ version = 1, generatorVersion = GENERATOR_VERSION,
  difficultyTier = 1, seed } = {}) {
  if (version !== 1 || generatorVersion !== GENERATOR_VERSION
      || !Number.isInteger(difficultyTier) || difficultyTier < 1 || difficultyTier > 4
      || typeof seed !== 'string' || seed.length < 1 || seed.length > 64
      || /[^A-Za-z0-9_-]/.test(seed)) {
    throw new Error('Unsupported or malformed generation identity.');
  }
  const metadata = { version, generatorVersion, difficultyTier, seed };
  const random = randomFor(`rummipuz:${version}:${generatorVersion}:${difficultyTier}:${seed}`);
  const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
  const choose = (array) => array[integer(0, array.length - 1)];
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = integer(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const [rackMin, rackMax, rowsMin, rowsMax] = BOUNDS[difficultyTier];
  const rejected = { construction: 0, unsolvable: 0, limit: 0 };

  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    // Inventory traversal is colour, value, then physical copy.
    const unused = new Set(COLOURS.flatMap((colour) => Array.from({ length: 13 }, (_, i) =>
      [ `${colour}-${i + 1}-1`, `${colour}-${i + 1}-2` ]).flat()));
    const board = [];
    const rowCount = integer(rowsMin, rowsMax);
    const rackCount = integer(rackMin, rackMax);
    const available = (colour, value) => [1, 2].map((copy) => `${colour}-${value}-${copy}`)
      .filter((id) => unused.has(id));
    for (let row = 0; row < rowCount; row += 1) {
      const runs = [];
      const groups = [];
      // Enumerate run faces in colour/start/end order, lengths 3 through 8.
      for (const colour of COLOURS) {
        for (let start = 1; start <= 11; start += 1) {
          const faces = [];
          for (let end = start; end <= Math.min(13, start + 7); end += 1) {
            const ids = available(colour, end);
            if (ids.length === 0) break;
            faces.push(ids);
            if (faces.length >= 3) runs.push([...faces]);
          }
        }
      }
      // Group faces in value/mask order, using all three/four-colour subsets.
      for (let value = 1; value <= 13; value += 1) {
        for (let mask = 1; mask < 16; mask += 1) {
          const faces = COLOURS.flatMap((colour, i) => mask & (1 << i) ? [available(colour, value)] : []);
          if (faces.length >= 3 && faces.every((ids) => ids.length)) groups.push(faces);
        }
      }
      const preferRuns = random() < 0.75;
      const preferred = preferRuns ? runs : groups;
      const candidates = preferred.length ? preferred : preferRuns ? groups : runs;
      if (candidates.length === 0) break;
      const faces = choose(candidates);
      const tiles = faces.map((ids) => choose(ids));
      // Runs stay ascending; group colour order is allowed to vary.
      if (groups === candidates) shuffle(tiles);
      tiles.forEach((id) => unused.delete(id));
      board.push(tiles);
    }
    if (board.length !== rowCount) {
      rejected.construction += 1;
      continue;
    }
    // Prefer rack faces near the board: matching value in any colour, or
    // the same colour within one value. This is only a candidate heuristic.
    const boardTiles = board.flat().map(parseTile);
    const pool = [...unused].filter((id) => {
      const tile = parseTile(id);
      return boardTiles.some((onBoard) => onBoard.value === tile.value
        || (onBoard.colour === tile.colour && Math.abs(onBoard.value - tile.value) <= 1));
    });
    if (pool.length < rackCount) {
      rejected.construction += 1;
      continue;
    }
    const rack = shuffle(pool).slice(0, rackCount);
    const puzzle = { ...metadata, rack, board };
    const result = solveState(createGameState(puzzle), { maxNodes: MAX_SOLVER_NODES });
    if (result.status !== 'solved') {
      rejected[result.status] += 1;
      continue;
    }
    puzzle.solution = Object.freeze({ board: result.board });
    // Validate the complete published-format object, including its witness.
    createGameState(puzzle);
    Object.freeze(rack);
    board.forEach(Object.freeze);
    Object.freeze(board);
    return { status: 'candidate', puzzle: Object.freeze(puzzle), attempts, rejected };
  }
  return { status: 'exhausted', puzzle: null, attempts: MAX_ATTEMPTS, rejected };
}
