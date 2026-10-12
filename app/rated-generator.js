import { generateVarietyPuzzle } from './generator-v6.js';
import { generateStructuralPuzzle } from './generator-v5.js';
import { classifyRow } from './rules.js';
import { createGameState } from './state.js';
import { ratePuzzle, TIER_BOUNDS } from './difficulty.js';

export const RATED_GENERATOR_VERSION = 6;

// Sampling envelopes stay inside the tier policy's full size bounds. Smaller
// boards reduce incidental copy choices and the cost of minimum-R proofs.
const REVIEWED_BOUNDS = [null, [2, 3, 2, 3], [4, 5, 3, 4], [4, 6, 4, 5], [5, 7, 4, 5]];

/** Generate approved revision-6 tiers by default; preserve explicit old replay. */
export function generatePuzzle({ version = 1, generatorVersion = RATED_GENERATOR_VERSION, difficultyTier = 1, seed } = {}) {
  if (generatorVersion === 6) return generateVarietyPuzzle({ version, generatorVersion, difficultyTier, seed });
  if (generatorVersion === 5) return generateStructuralPuzzle({ version, generatorVersion, difficultyTier, seed });
  if (version !== 1 || ![3, 4].includes(generatorVersion) || !Number.isInteger(difficultyTier)
      || difficultyTier < 1 || difficultyTier > 4 || typeof seed !== 'string'
      || seed.length < 1 || seed.length > 64 || /[^A-Za-z0-9_-]/.test(seed)) {
    throw new Error('Unsupported or malformed rated generation identity.');
  }
  const metadata = { version, generatorVersion, difficultyTier, seed };
  let randomState = 2166136261;
  for (const char of `rummipuz:1:${generatorVersion}:${difficultyTier}:${seed}`) {
    randomState = Math.imul(randomState ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  const random = () => {
    randomState = (randomState + 0x6D2B79F5) >>> 0;
    let value = Math.imul(randomState ^ (randomState >>> 15), randomState | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = integer(0, i); [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const rejected = { construction: 0, unsolvable: 0, limit: 0, excluded: 0, mismatch: 0 };
  const bounds = generatorVersion === 3 ? TIER_BOUNDS[difficultyTier] : REVIEWED_BOUNDS[difficultyTier];
  const maxAttempts = generatorVersion === 3 ? 128 : 64;
  const maxNodes = generatorVersion === 3 ? 100000 : 20000;
  const [rackMin, rackMax, rowsMin, rowsMax] = bounds;
  for (let attempts = 1; attempts <= maxAttempts; attempts += 1) {
    const colours = shuffle(['black', 'blue', 'red', 'orange']);
    const a = integer(4, 6);
    const b = integer(a + 5, 13);
    const lowStart = integer(Math.max(1, a - 5), a - 3);
    const highStart = integer(Math.max(a + 2, b - 5), b - 3);
    const used = new Set();
    const take = (colour, value) => {
      const choices = [1, 2].map((copy) => `${colour}-${value}-${copy}`).filter((id) => !used.has(id));
      if (!choices.length) throw new Error('Construction exhausted a face.');
      const id = choices[integer(0, choices.length - 1)]; used.add(id); return id;
    };
    const run = (c, start, end) => Array.from({ length: end - start + 1 }, (_, i) => take(colours[c], start + i));
    const board = [run(0, lowStart, a)];
    const rack = [];
    if (difficultyTier === 1) {
      rack.push(take(colours[1], a), take(colours[2], a));
      board.push(run(3, highStart, b));
    } else {
      board.push(run(1, lowStart, a));
      rack.push(take(colours[2], a));
      if (difficultyTier === 2) {
        rack.push(take(colours[0], b), take(colours[1], b), take(colours[2], b));
        board.push(run(3, b - 3, b - 1));
      } else {
        board.push(run(2, highStart, b));
        rack.push(take(colours[0], b));
        if (difficultyTier === 3) {
          rack.push(take(colours[1], b));
          const start = integer(1, 10);
          board.push(run(3, start, start + 2));
          // Hard's minimum rack size is four; an extension is added below.
        } else {
          board.push(run(3, highStart, b));
          rack.push(...run(1, b - 3, b - 1));
        }
      }
    }
    const targetRows = integer(Math.max(board.length, rowsMin), rowsMax);
    while (board.length < targetRows) {
      const choices = [];
      for (const colour of colours) {
        for (let start = 1; start <= 11; start += 1) {
          for (let length = 3; length <= 6 && start + length - 1 <= 13; length += 1) {
            const values = Array.from({ length }, (_, i) => start + i);
            if (values.every((v) => [1, 2].some((copy) => !used.has(`${colour}-${v}-${copy}`)))) {
              choices.push({ colour, values });
            }
          }
        }
      }
      if (!choices.length) break;
      const choice = choices[integer(0, choices.length - 1)];
      board.push(choice.values.map((v) => take(choice.colour, v)));
    }
    const targetRack = integer(Math.max(rack.length, rackMin), rackMax);
    const extended = board.map((row) => [...row]);
    while (rack.length < targetRack) {
      const choices = [];
      for (let row = 0; row < extended.length; row += 1) {
        for (const colour of colours) {
          for (let value = 1; value <= 13; value += 1) {
            const ids = [1, 2].map((copy) => `${colour}-${value}-${copy}`).filter((id) => !used.has(id));
            if (!ids.length) continue;
            for (const index of [0, extended[row].length]) {
              const next = [...extended[row].slice(0, index), ids[0], ...extended[row].slice(index)];
              if (classifyRow(next).valid) choices.push({ row, index, colour, value });
            }
          }
        }
      }
      if (!choices.length) break;
      const choice = choices[integer(0, choices.length - 1)];
      const id = take(choice.colour, choice.value);
      extended[choice.row].splice(choice.index, 0, id); rack.push(id);
    }
    if (board.length !== targetRows || rack.length !== targetRack) { rejected.construction += 1; continue; }
    shuffle(board); shuffle(rack);
    const puzzle = { ...metadata, rack, board };
    const rating = ratePuzzle(puzzle, { maxNodes });
    if (rating.status !== 'rated') { rejected[rating.status] += 1; continue; }
    if (rating.tier !== difficultyTier) { rejected.mismatch += 1; continue; }
    puzzle.solution = Object.freeze({ board: rating.board });
    puzzle.rating = Object.freeze({ ...rating.features });
    createGameState(puzzle);
    Object.freeze(rack); board.forEach(Object.freeze); Object.freeze(board);
    return { status: 'ready', puzzle: Object.freeze(puzzle), attempts, rejected };
  }
  return { status: 'exhausted', puzzle: null, attempts: maxAttempts, rejected };
}
