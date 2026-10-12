import { createGameState } from './state.js';
import { classifyRow } from './rules.js';
import { rateVarietyPuzzle, V6_MAX_NODES } from './difficulty-v6.js';
import { PATTERNS_V6 } from './patterns-v6.js';

const MAX_ATTEMPTS = 32;
const MAX_NODES = V6_MAX_NODES;
// Integer selection weights, fixed for revision 6. Cosmetic variants share a family bucket.
const MIX = [null,
  [['run-donation', 1], ['group-donation', 1], ['run-division', 1]],
  [['interior-extraction', 1], ['split-and-join', 1], ['groups-to-runs', 1], ['runs-to-groups', 1], ['mixed-exchange', 1]],
  [['interior-extraction', 16], ['split-and-join', 16], ['groups-to-runs', 26], ['runs-to-groups', 16], ['mixed-exchange', 26]],
  [['interior-extraction', 32], ['split-and-join', 20], ['groups-to-runs', 40], ['runs-to-groups', 16], ['mixed-exchange', 46], ['combined-repair', 46]],
];

function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export function generateVarietyPuzzle({ version = 1, generatorVersion = 6, difficultyTier = 1, seed } = {}) {
  if (version !== 1 || generatorVersion !== 6 || !Number.isInteger(difficultyTier)
      || difficultyTier < 1 || difficultyTier > 4 || typeof seed !== 'string'
      || seed.length < 1 || seed.length > 64 || /[^A-Za-z0-9_-]/.test(seed)) {
    throw new Error('Unsupported or malformed revision-6 generation identity.');
  }
  const metadata = { version, generatorVersion, difficultyTier, seed };
  let randomState = 2166136261;
  for (const char of `rummipuz:1:6:${difficultyTier}:${seed}`) {
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
  const diagnostics = { attemptsByFamily: {}, rejectionsByFamily: {}, proofNodesByFamily: {} };
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    const mix = MIX[difficultyTier];
    let ticket = integer(1, mix.reduce((sum, [, weight]) => sum + weight, 0));
    const family = mix.find(([, weight]) => { ticket -= weight; return ticket <= 0; })[0];
    const patterns = PATTERNS_V6.filter((p) => p.difficultyTier === difficultyTier && p.family === family);
    // Give group-only inventories margin above the composition floor while
    // retaining the audited mixed duplicate/support variants.
    const weights = patterns.map((p) => family === 'groups-to-runs' && difficultyTier >= 3
      && p.board.every((row) => classifyRow(row).kind === 'group') ? (difficultyTier === 3 ? 8 : 2) : 1);
    let patternTicket = integer(1, weights.reduce((sum, weight) => sum + weight, 0));
    const pattern = patterns.find((_, i) => { patternTicket -= weights[i]; return patternTicket <= 0; });
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
    const rating = rateVarietyPuzzle(puzzle, { maxNodes: MAX_NODES });
    diagnostics.attemptsByFamily[family] = (diagnostics.attemptsByFamily[family] || 0) + 1;
    diagnostics.proofNodesByFamily[family] = (diagnostics.proofNodesByFamily[family] || 0) + rating.nodes;
    const reject = (status) => {
      rejected[status] += 1;
      diagnostics.rejectionsByFamily[family] ||= {};
      diagnostics.rejectionsByFamily[family][status] = (diagnostics.rejectionsByFamily[family][status] || 0) + 1;
    };
    if (rating.status !== 'rated') { reject(rating.status); continue; }
    if (rating.tier !== difficultyTier || rating.features.family.primary !== pattern.family) { reject('mismatch'); continue; }
    puzzle.solution = { board: rating.board };
    puzzle.rating = { ...rating.features, pattern: pattern.name };
    createGameState(puzzle);
    return freeze({ status: 'ready', puzzle, attempts, rejected, diagnostics });
  }
  return freeze({ status: 'exhausted', puzzle: null, attempts: MAX_ATTEMPTS, rejected, diagnostics });
}
