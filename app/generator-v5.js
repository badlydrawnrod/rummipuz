import { createGameState } from './state.js';
import { classifyRow } from './rules.js';
import { rateStructuralPuzzle } from './structural-difficulty.js';

const MAX_ATTEMPTS = 32;
const MAX_NODES = 100000;
const run = (colour, start, end, copy = 1) => Array.from({ length: end - start + 1 }, (_, i) => `${colour}-${start + i}-${copy}`);
const group = (value) => ['blue', 'red', 'orange'].map((colour) => `${colour}-${value}-1`);
const ids = (...faces) => faces.map(([colour, value]) => `${colour}-${value}-1`);

// Hand-reviewed seeds. Every transformed candidate is still proved anew.
const PATTERNS = [null, [
  { name: 'easy-endpoint', board: [run('blue', 1, 6), run('blue', 3, 5, 2)], rack: ids(['red', 6], ['black', 6]) },
], [
  { name: 'medium-interior-splits', board: [run('blue', 1, 7), run('red', 1, 7), run('orange', 10, 12)],
    rack: ids(['black', 4], ['black', 9], ['red', 9], ['orange', 9]) },
  { name: 'medium-split-and-join', board: [run('blue', 1, 7), run('blue', 8, 10), run('orange', 11, 13)],
    rack: ids(['black', 4], ['red', 4], ['black', 10], ['red', 10]) },
], [
  { name: 'hard-groups-to-runs', board: [group(4), group(5), group(6), run('black', 10, 12)],
    rack: ids(['blue', 3], ['blue', 7], ['red', 3], ['red', 7]) },
  { name: 'hard-group-run-exchange', board: [group(4), group(5), run('blue', 6, 8), run('black', 10, 12)],
    rack: ids(['blue', 3], ['red', 3], ['orange', 3], ['red', 7], ['orange', 7], ['blue', 9], ['blue', 10]) },
], [
  { name: 'expert-four-group-chain', board: [group(4), group(5), group(6), group(7)],
    rack: ids(['blue', 3], ['blue', 8], ['red', 2], ['red', 3], ['red', 8], ['red', 9]) },
  { name: 'expert-duplicate-choice', board: [group(4), group(5), group(6), group(7), run('red', 4, 6, 2)],
    rack: ids(['blue', 3], ['blue', 8], ['red', 2], ['red', 3], ['red', 8], ['red', 9]) },
]];

function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export function generateStructuralPuzzle({ version = 1, generatorVersion = 5, difficultyTier = 1, seed } = {}) {
  if (version !== 1 || generatorVersion !== 5 || !Number.isInteger(difficultyTier)
      || difficultyTier < 1 || difficultyTier > 4 || typeof seed !== 'string'
      || seed.length < 1 || seed.length > 64 || /[^A-Za-z0-9_-]/.test(seed)) {
    throw new Error('Unsupported or malformed revision-5 generation identity.');
  }
  const metadata = { version, generatorVersion, difficultyTier, seed };
  let randomState = 2166136261;
  for (const char of `rummipuz:1:5:${difficultyTier}:${seed}`) {
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
  const rejected = { unsolvable: 0, limit: 0, excluded: 0, mismatch: 0 };
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    const pattern = PATTERNS[difficultyTier][integer(0, PATTERNS[difficultyTier].length - 1)];
    const sourceColours = ['black', 'blue', 'red', 'orange'];
    const colours = shuffle([...sourceColours]);
    const reflected = integer(0, 1) === 1;
    const values = [...pattern.board.flat(), ...pattern.rack].map((id) => {
      const value = Number(id.split('-')[1]); return reflected ? 14 - value : value;
    });
    const offset = integer(1 - Math.min(...values), 13 - Math.max(...values));
    const swap = new Map();
    const faces = [...new Set([...pattern.board.flat(), ...pattern.rack].map((id) => id.slice(0, id.lastIndexOf('-'))))].sort();
    for (const face of faces) swap.set(face, integer(0, 1));
    const transform = (id) => {
      const [colour, value, copy] = id.split('-');
      const nextValue = (reflected ? 14 - Number(value) : Number(value)) + offset;
      const nextCopy = swap.get(`${colour}-${value}`) ? 3 - Number(copy) : Number(copy);
      return `${colours[sourceColours.indexOf(colour)]}-${nextValue}-${nextCopy}`;
    };
    const board = pattern.board.map((row) => {
      const transformed = row.map(transform);
      if (classifyRow(row).kind === 'run') transformed.sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
      else shuffle(transformed);
      return transformed;
    });
    const puzzle = { ...metadata, board: shuffle(board), rack: shuffle(pattern.rack.map(transform)) };
    const rating = rateStructuralPuzzle(puzzle, { maxNodes: MAX_NODES });
    if (rating.status !== 'rated') { rejected[rating.status] += 1; continue; }
    if (rating.tier !== difficultyTier) { rejected.mismatch += 1; continue; }
    puzzle.solution = { board: rating.board };
    puzzle.rating = { ...rating.features, pattern: pattern.name };
    createGameState(puzzle);
    return freeze({ status: 'ready', puzzle, attempts, rejected });
  }
  return { status: 'exhausted', puzzle: null, attempts: MAX_ATTEMPTS, rejected };
}
