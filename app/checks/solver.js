import { classifyRow, parseTile } from '../rules.js';
import { createGameState, checkState, moveTile } from '../state.js';
import { solveState } from '../solver.js';

export function runSolverChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const throws = (action) => { try { action(); return false; } catch { return true; } };
  const run = (colour, start, end, copy = 1) =>
    Array.from({ length: end - start + 1 }, (_, i) => `${colour}-${start + i}-${copy}`);
  const position = (inventory) => ({ inventory, rack: [...inventory], board: [] });
  const solved = (state, name) => {
    const before = JSON.stringify(state);
    const result = solveState(state);
    assert(result.status === 'solved' && checkState({ ...state, rack: [], board: result.board }).won
      && JSON.stringify(state) === before, name);
    return result;
  };
  const state = createGameState(sample);
  const result = solved(state, 'solve sample with physical duplicates without mutation');
  assert(Object.isFrozen(result.board) && result.board.every(Object.isFrozen), 'solution rows are immutable');
  const noMetadata = { ...sample };
  delete noMetadata.solution;
  assert(JSON.stringify(solveState(createGameState(noMetadata))) === JSON.stringify(result),
    'solver does not depend on supplied solution metadata');
  const temporary = moveTile(state, 'blue-3-1', { area: 'new-row' });
  assert(JSON.stringify(solveState(temporary)) === JSON.stringify(result),
    'solve temporary invalid rows independently of current placement');
  assert(JSON.stringify(solveState(position([...state.inventory].reverse()))) === JSON.stringify(result),
    'deterministic solution independent of inventory ordering');
  solved({ ...state, rack: [], board: result.board }, 'solve already completed position');
  const backtracked = solveState(position(run('orange', 1, 4)));
  assert(backtracked.status === 'solved' && backtracked.board[0].length === 4
    && backtracked.nodes > backtracked.board.length + 1,
    'backtrack from a dead-end short run to the required longer run');
  const impossiblePuzzle = { ...noMetadata, rack: ['orange-13-1'] };
  const impossible = solveState(createGameState(impossiblePuzzle));
  assert(impossible.status === 'unsolvable' && impossible.board === null,
    'report no solution for valid starting board with stranded rack tile');
  for (const [name, inventory] of [
    ['full thirteen-tile run', run('orange', 1, 13)],
    ['two identical thirteen-tile runs', [...run('blue', 1, 13), ...run('blue', 1, 13, 2)]],
    ['four-colour group', ['orange-7-2', 'red-7-1', 'blue-7-2', 'black-7-1']],
    ['two groups using both physical copies', ['black', 'blue', 'red'].flatMap((c) => [`${c}-7-1`, `${c}-7-2`])],
    ['Medium structural example', [...run('blue', 1, 6), ...run('red', 1, 6), ...run('orange', 9, 11),
      'black-6-1', 'black-12-1', 'blue-12-1', 'red-12-1']],
    ['Hard structural example', [...run('blue', 1, 6), ...run('red', 1, 6), ...run('orange', 7, 12),
      ...run('orange', 1, 3), 'black-6-1', 'blue-12-1', 'red-12-1', 'orange-4-1']],
    ['Expert structural example', [...run('blue', 1, 6), ...run('red', 1, 6), ...run('orange', 7, 12),
      ...run('black', 7, 12), 'black-6-1', 'blue-12-1', ...run('red', 9, 11)]],
    ['entire 104-tile inventory', ['black', 'blue', 'red', 'orange'].flatMap((c) =>
      [...run(c, 1, 13), ...run(c, 1, 13, 2)])],
  ]) solved(position(inventory), `solve ${name}`);
  for (const [name, inventory] of [
    ['two tiles', ['blue-1-1', 'blue-2-1']],
    ['run with gap', ['blue-1-1', 'blue-2-1', 'blue-4-1']],
    ['run with wraparound', ['red-12-1', 'red-13-1', 'red-1-1']],
    ['group repeating colour', ['blue-7-1', 'blue-7-2', 'red-7-1']],
    ['stranded matching copy', ['blue-1-1', 'blue-2-1', 'blue-3-1', 'blue-2-2']],
  ]) assert(solveState(position(inventory)).status === 'unsolvable', `no solution for ${name}`);
  for (const budget of [0, 1]) {
    const limited = solveState(state, { maxNodes: budget });
    assert(limited.status === 'limit' && limited.board === null && limited.nodes === budget,
      `budget ${budget} is inconclusive`);
  }
  assert(solveState(state, { maxNodes: result.nodes }).status === 'solved', 'exact sufficient node budget solves');
  assert(solveState(createGameState(impossiblePuzzle), { maxNodes: impossible.nodes }).status === 'unsolvable',
    'bounded exhaustive search can prove no solution');
  for (const budget of [-1, 0.5, NaN, '10', null]) {
    assert(throws(() => solveState(state, { maxNodes: budget })), `reject invalid node budget ${String(budget)}`);
  }
  for (const bad of [null, position(['blue-1-1', 'blue-1-1']), position(['joker-1']),
    { ...state, rack: [] }, { ...state, rack: [...state.rack, 'orange-13-1'] }]) {
    assert(throws(() => solveState(bad)), 'reject malformed or nonconserved solver input');
  }

  // Independent small-inventory oracle: enumerate physical-tile subsets,
  // classify rows using the public rules, and exhaust all exact partitions.
  // This checks both positive and negative answers without face-count search.
  const universe = ['black-1-1', 'black-2-1', 'black-3-1', 'black-3-2',
    'blue-1-1', 'blue-2-1', 'blue-3-1', 'red-3-1', 'orange-3-1'];
  const rows = [];
  for (let mask = 1; mask < (1 << universe.length); mask += 1) {
    const row = universe.filter((_, i) => mask & (1 << i))
      .sort((a, b) => parseTile(a).value - parseTile(b).value);
    if (classifyRow(row).valid) rows.push(mask);
  }
  const memo = new Map([[0, true]]);
  const oracle = (mask) => {
    if (memo.has(mask)) return memo.get(mask);
    const first = mask & -mask;
    const possible = rows.some((row) => (row & first) !== 0 && (row & mask) === row && oracle(mask ^ row));
    memo.set(mask, possible);
    return possible;
  };
  let positive = 0;
  let negative = 0;
  for (let mask = 1; mask < (1 << universe.length); mask += 1) {
    const input = position(universe.filter((_, i) => mask & (1 << i)));
    const answer = solveState(input);
    const expected = oracle(mask);
    if ((answer.status === 'solved') !== expected || (expected
      && !checkState({ ...input, rack: [], board: answer.board }).won)) {
      throw new Error(`Solver disagrees with exhaustive physical-tile oracle for subset ${mask}`);
    }
    if (expected) positive += 1; else negative += 1;
  }
  assert(positive > 0 && negative > 0, 'match independent oracle for all 511 nonempty inventory subsets');
  return passed;
}
