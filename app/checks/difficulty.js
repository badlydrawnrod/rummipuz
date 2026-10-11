import { classifyRow, parseTile } from '../rules.js';
import { createGameState, checkState } from '../state.js';
import { ratePuzzle, rearrangedRows } from '../difficulty.js';
import { solvePreservingRows } from '../preservation.js';
import { generatePuzzle } from '../rated-generator.js';

export function runDifficultyChecks(sample, fixtures) {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const throws = (fn) => { try { fn(); return false; } catch { return true; } };
  const run = (c, a, b, copy = 1) => Array.from({ length: b - a + 1 }, (_, i) => `${c}-${a + i}-${copy}`);
  const puzzle = (board, rack, tier = 1) => ({ version: 1, generatorVersion: 3, seed: 'rating-test', difficultyTier: tier, board, rack });
  const cases = [
    [sample, 1],
    [puzzle([run('blue', 1, 6), run('red', 1, 6), run('orange', 9, 11)],
      ['black-6-1', 'black-12-1', 'blue-12-1', 'red-12-1'], 2), 2],
    [puzzle([run('blue', 1, 6), run('red', 1, 6), run('orange', 7, 12), run('orange', 1, 3)],
      ['black-6-1', 'blue-12-1', 'red-12-1', 'orange-4-1'], 3), 3],
    [puzzle([run('blue', 1, 6), run('red', 1, 6), run('orange', 8, 13), run('black', 8, 13)],
      ['black-6-1', 'blue-13-1', ...run('red', 10, 12)], 4), 4],
  ];
  for (const [input, tier] of cases) {
    const before = JSON.stringify(input);
    const rating = ratePuzzle(input);
    assert(rating.status === 'rated' && rating.tier === tier && rating.features.rearrangement === tier
      && checkState({ ...createGameState(input), rack: [], board: rating.board }).won
      && rearrangedRows(createGameState(input), rating.board).length === tier,
    `prove structural tier ${tier} minimum with valid witness`);
    assert(JSON.stringify(input) === before, `rating tier ${tier} leaves input unchanged`);
  }
  for (const input of [
    puzzle([run('blue', 1, 3), run('blue', 4, 6)], ['blue-7-1']),
    puzzle([['red-7-1', 'black-7-1', 'blue-7-1'], run('orange', 1, 3)], ['orange-7-1']),
    puzzle([run('blue', 1, 6), run('red', 1, 3)], ['blue-7-1']),
  ]) {
    const rating = ratePuzzle(input);
    assert(rating.status === 'excluded' && rating.tier === null && rating.features.rearrangement === 0,
      'exclude zero-rearrangement extensions and preserved row merges');
  }
  const copies = puzzle([run('blue', 1, 3), run('blue', 1, 3, 2)], ['blue-4-1', 'blue-4-2']);
  assert(ratePuzzle(copies).features.rearrangement === 0, 'preserve matching rows with distinct physical copies');
  const formerExpert = puzzle([run('blue', 1, 6), run('red', 1, 6), run('orange', 7, 12), run('black', 7, 12)],
    ['black-6-1', 'blue-12-1', ...run('red', 9, 11)], 4);
  assert(ratePuzzle(formerExpert).tier === 2, 'former Expert example has a two-row solution');
  const state = createGameState(sample);
  assert(solvePreservingRows(state, [0, 1]).status === 'unsolvable'
    && solvePreservingRows(state, [1]).status === 'solved', 'physical row preservation constrains the sample');
  const stranded = puzzle([run('blue', 1, 3)], ['orange-13-1']);
  assert(ratePuzzle(stranded).status === 'unsolvable', 'rating cannot confer tier on unsolvable puzzle');
  const limited = ratePuzzle(sample, { maxNodes: 0 });
  assert(limited.status === 'limit' && limited.tier === null && limited.board === null,
    'inconclusive minimum proof confers no tier');
  const exact = ratePuzzle(sample);
  assert(ratePuzzle(sample, { maxNodes: exact.nodes }).status === 'rated'
    && ratePuzzle(sample, { maxNodes: exact.nodes - 1 }).status === 'limit', 'shared proof budget accounts for every search');
  const undersized = puzzle([run('blue', 1, 6)], ['black-6-1', 'red-6-1']);
  assert(ratePuzzle(undersized).status === 'excluded' && ratePuzzle(undersized).features.rearrangement === 1,
    'exclude correct rearrangement count outside tier size bounds');
  for (const budget of [-1, 0.5, NaN, '1']) assert(throws(() => ratePuzzle(sample, { maxNodes: budget })), 'reject invalid rating budget');
  assert(throws(() => rearrangedRows(state, [])), 'rearrangement requires conserved complete solution');
  assert(ratePuzzle(puzzle([['black-7-1', 'red-7-1', 'blue-7-1']], ['orange-7-1']))
    .features.competingPlacements === 4, 'count distinct initially valid insertion gaps');

  // Independent physical-subset partition enumeration computes R by looking
  // at every final arrangement, rather than using preserved-block searches.
  const base = [run('blue', 1, 3), run('blue', 1, 3, 2)];
  const additions = ['blue-4-1', 'blue-4-2', 'red-3-1', 'black-3-1'];
  for (let extras = 1; extras < 16; extras += 1) {
    const input = puzzle(base, additions.filter((_, i) => extras & (1 << i)));
    const original = createGameState(input);
    const inventory = original.inventory;
    const valid = [];
    for (let mask = 1; mask < (1 << inventory.length); mask += 1) {
      const row = inventory.filter((_, i) => mask & (1 << i)).sort((a, b) => parseTile(a).value - parseTile(b).value);
      if (classifyRow(row).valid) valid.push({ mask, row });
    }
    let minimum = Infinity;
    const enumerate = (mask, board) => {
      if (mask === 0) {
        const changed = base.filter((row) => !board.some((final) => row.every((id) => final.includes(id)))).length;
        minimum = Math.min(minimum, changed); return;
      }
      const first = mask & -mask;
      for (const row of valid) if ((row.mask & first) && (row.mask & mask) === row.mask) {
        enumerate(mask ^ row.mask, [...board, row.row]);
      }
    };
    enumerate((1 << inventory.length) - 1, []);
    const rating = ratePuzzle(input);
    assert(minimum === Infinity ? rating.status === 'unsolvable' : rating.features.rearrangement === minimum,
      `minimum R matches independent physical partition oracle subset ${extras}`);
  }
  for (const { identity, result } of fixtures) {
    const generated = generatePuzzle(identity);
    assert(JSON.stringify(generated) === JSON.stringify(result), `revision-3 golden replay tier ${identity.difficultyTier}`);
    const rating = ratePuzzle(generated.puzzle);
    assert(generated.status === 'ready' && rating.status === 'rated' && rating.tier === identity.difficultyTier
      && JSON.stringify(rating.features) === JSON.stringify(generated.puzzle.rating),
    `generated tier ${identity.difficultyTier} independently passes rating`);
    assert(Object.isFrozen(generated.puzzle) && Object.isFrozen(generated.puzzle.rating), 'rated generated metadata is immutable');
  }
  for (let tier = 1; tier <= 4; tier += 1) {
    for (const seed of ['variety-a', 'variety-b']) {
      const generated = generatePuzzle({ seed, difficultyTier: tier });
      assert(generated.status === 'ready' && ratePuzzle(generated.puzzle).tier === tier,
        `additional generated seed ${seed} has proven tier ${tier}`);
    }
  }
  const replay = generatePuzzle({ seed: 'repeat', difficultyTier: 2 });
  generatePuzzle({ seed: 'other', difficultyTier: 4 });
  assert(JSON.stringify(generatePuzzle({ seed: 'repeat', difficultyTier: 2 })) === JSON.stringify(replay),
    'rated replay is independent of previous requests');
  for (const identity of [{ seed: 'x', generatorVersion: 2 }, { seed: 'x', difficultyTier: 5 },
    { seed: 'x\n' }, { seed: 'x', version: 2 }]) {
    assert(throws(() => generatePuzzle(identity)), 'reject unsupported rated generation identity');
  }
  return passed;
}
