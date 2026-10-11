import { createGameState, checkState } from '../state.js';
import { generateCandidate, GENERATOR_VERSION } from '../generator.js';

export function runGeneratorChecks(fixtures) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const throws = (action) => { try { action(); return false; } catch { return true; } };
  const bounds = [null, [2, 5, 2, 5], [3, 6, 3, 6], [4, 8, 4, 7], [4, 10, 4, 9]];
  assert(GENERATOR_VERSION === 2 && fixtures.length >= 4, 'revision-2 replay fixtures available');
  for (const { identity, result: expected } of fixtures) {
    const before = JSON.stringify(identity);
    const actual = generateCandidate(identity);
    assert(JSON.stringify(actual) === JSON.stringify(expected),
      `revision-2 golden replay tier ${identity.difficultyTier} seed ${identity.seed}`);
    assert(JSON.stringify(identity) === before, 'generation leaves caller identity unchanged');
    const rejected = Object.values(actual.rejected).reduce((sum, count) => sum + count, 0);
    assert(rejected === actual.attempts - (actual.status === 'candidate' ? 1 : 0),
      'every skipped candidate is accounted for');
    if (actual.status === 'exhausted') {
      assert(actual.puzzle === null && actual.attempts === 256, 'exhaustion returns no replacement puzzle');
      continue;
    }
    const puzzle = actual.puzzle;
    const state = createGameState(puzzle);
    const [rackMin, rackMax, rowsMin, rowsMax] = bounds[identity.difficultyTier];
    assert(checkState(state).conserved && checkState(state).invalidRows.length === 0
      && checkState({ ...state, rack: [], board: puzzle.solution.board }).won,
    `generated tier ${identity.difficultyTier} has valid start and complete conserved solution`);
    assert(puzzle.rack.length >= rackMin && puzzle.rack.length <= rackMax
      && puzzle.board.length >= rowsMin && puzzle.board.length <= rowsMax,
    `generated tier ${identity.difficultyTier} respects requested size bounds`);
    assert(Object.isFrozen(puzzle) && Object.isFrozen(puzzle.rack) && Object.isFrozen(puzzle.board)
      && puzzle.board.every(Object.isFrozen) && Object.isFrozen(puzzle.solution)
      && puzzle.solution.board.every(Object.isFrozen), 'generated puzzle and witness are immutable');
    assert(Object.keys(identity).every((field) => identity[field] === puzzle[field]),
      'generated puzzle preserves full replay identity');
  }
  // A fresh call has its own random state, regardless of preceding requests.
  const identity = { difficultyTier: 2, seed: 'order-check' };
  const first = generateCandidate(identity);
  generateCandidate({ difficultyTier: 4, seed: 'intervening' });
  assert(JSON.stringify(generateCandidate(identity)) === JSON.stringify(first),
    'replay ordering is independent of previous generation');
  assert(JSON.stringify(generateCandidate({ ...identity, version: 1, generatorVersion: 2 })) === JSON.stringify(first),
    'default version fields match explicit replay identity');
  assert(JSON.stringify(generateCandidate({ ...identity, seed: 'Order-check' })) !== JSON.stringify(first),
    'seed case is preserved');
  assert(JSON.stringify(generateCandidate({ seed: '0001' })) !== JSON.stringify(generateCandidate({ seed: '1' })),
    'numeric-looking seeds remain distinct strings');
  assert(generateCandidate({ seed: 'A'.repeat(64) }).status === 'candidate', 'accept maximum seed length');
  for (const invalid of [undefined, {}, { seed: '' }, { seed: 'A'.repeat(65) }, { seed: ' space ' },
    { seed: 'x\n' }, { seed: 'é' }, { seed: 123 }, { seed: 'x', version: 2 },
    { seed: 'x', generatorVersion: 1 }, { seed: 'x', generatorVersion: 3 },
    { seed: 'x', difficultyTier: 0 }, { seed: 'x', difficultyTier: 5 },
    { seed: 'x', difficultyTier: 1.5 }, { seed: 'x', difficultyTier: '1' }]) {
    assert(throws(() => generateCandidate(invalid)), `reject unsupported generation identity ${JSON.stringify(invalid)}`);
  }
  assert(fixtures.some(({ result }) => result.rejected.unsolvable > 0),
    'fixtures exercise rejection of solver-proven unsolvable candidates');
  const starts = fixtures.filter(({ result }) => result.puzzle).map(({ result }) =>
    JSON.stringify({ rack: result.puzzle.rack, board: result.puzzle.board }));
  assert(new Set(starts).size === starts.length, 'requested tiers influence generated starting positions');
  return passed;
}
