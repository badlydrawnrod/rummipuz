import { planAssistance } from '../assistance.js';
import { createGameState, checkState, moveTile, reorderRow } from '../state.js';

export function runAssistanceChecks(sample, fixtures = []) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const throws = (action) => { try { action(); return false; } catch { return true; } };
  const locate = (state, id) => {
    const rack = state.rack.indexOf(id);
    if (rack >= 0) return { area: 'rack', index: rack };
    for (let row = 0; row < state.board.length; row += 1) {
      const index = state.board[row].indexOf(id);
      if (index >= 0) return { area: 'board', row, index };
    }
    return null;
  };
  const sameDestination = (left, right) => left?.area === right?.area
    && (left.area !== 'board' || left.row === right.row)
    && left.index === right.index;
  const replay = (state, plan) => {
    let current = state;
    for (const move of plan.moves) {
      if (move.destination.area === 'board' && !current.board[move.destination.row]?.length) {
        throw new Error('Assistance sequence targets a hidden empty row.');
      }
      current = moveTile(current, move.id, move.destination);
    }
    return current;
  };
  const verify = (state, result, name) => {
    assert(result.status === 'solved' && Array.isArray(result.board) && result.moves.length > 0,
      `${name}: produce a target and actionable move`);
    assert(result.board.every((row) => row.length > 0) && checkState({ ...state, rack: [], board: result.board }).won,
      `${name}: target contains conserved valid rows`);
    assert(Number.isSafeInteger(result.nodes) && result.nodes <= 200000, `${name}: respect cumulative node budget`);
    assert(['rack', 'board', 'new-row'].includes(result.moves[0].destination.area), `${name}: use an actionable first destination`);
    if (result.moves[0].destination.area === 'board') {
      const dest = result.moves[0].destination;
      assert(Boolean(state.board[dest.row]?.length), `${name}: first board destination is visible`);
    }
    assert(result.moves.every(({ id, destination, reason }) => typeof id === 'string' && destination && reason),
      `${name}: each move has a physical ID, destination and rationale`);
    const after = replay(state, result);
    assert(checkState(after).won && after.rack.length === 0, `${name}: replay moves through moveTile to a win`);
    return after;
  };
  const converge = (state, name) => {
    let current = state;
    let preferredBoard = null;
    let previous = null;
    const layouts = new Set([JSON.stringify([current.rack, current.board])]);
    const maximumMoves = current.inventory.length * 2 + 4;
    for (let step = 0; step < maximumMoves && !checkState(current).won; step += 1) {
      const plan = planAssistance(current, { preferredBoard });
      assert(plan.status === 'solved' && plan.moves.length > 0, `${name}: hint ${step + 1} remains available`);
      const move = plan.moves[0];
      if (previous && previous.id === move.id && sameDestination(previous.source, move.destination)) {
        throw new Error(`Failed: ${name}: hint ${step + 1} immediately reverses the prior move`);
      }
      const source = locate(current, move.id);
      if (!source) throw new Error(`Failed: ${name}: hint ${step + 1} has no physical source`);
      const next = moveTile(current, move.id, move.destination);
      if (next === current) throw new Error(`Failed: ${name}: hint ${step + 1} is a no-op`);
      const layout = JSON.stringify([next.rack, next.board]);
      if (layouts.has(layout)) throw new Error(`Failed: ${name}: repeated layout after hint ${step + 1}`);
      layouts.add(layout);
      previous = { id: move.id, source };
      preferredBoard = plan.board;
      current = next;
    }
    assert(checkState(current).won, `${name}: following one recomputed hint at a time reaches a win`);
  };

  const initial = createGameState(sample);
  const original = JSON.stringify(initial);
  const first = planAssistance(initial);
  const targetState = verify(initial, first, 'sample');
  assert(JSON.stringify(planAssistance(initial)) === JSON.stringify(first), 'repeat requests are deterministic');
  assert(JSON.stringify(initial) === original, 'planning leaves live state and history unchanged');
  const completed = planAssistance(targetState);
  assert(completed.status === 'solved' && completed.moves.length === 0 && completed.board.every((row) => row.length),
    'already won position returns its compact target without a move');

  // Current-position variants exercise invalid singletons, repeated faces,
  // empty placeholders, reordered rows, and a board whose tiles are all staged.
  const partial = moveTile(initial, initial.board[0][5], { area: 'new-row' });
  verify(partial, planAssistance(partial), 'partial invalid row');
  let allRack = initial;
  for (let r = 0; r < initial.board.length; r += 1) {
    for (const id of [...allRack.board[r]]) allRack = moveTile(allRack, id, { area: 'rack', index: allRack.rack.length });
  }
  verify(allRack, planAssistance(allRack), 'all tiles in rack');
  let hidden = initial;
  for (const id of [...hidden.board[1]]) hidden = moveTile(hidden, id, { area: 'rack', index: hidden.rack.length });
  const hiddenPlan = planAssistance(hidden);
  verify(hidden, hiddenPlan, 'hidden empty placeholders');
  assert(hiddenPlan.moves[0].destination.area !== 'board' || hidden.board[hiddenPlan.moves[0].destination.row].length > 0,
    'hidden rows never become first-move destinations');
  let adversarial = initial;
  const keep = initial.board[0][0];
  for (const row of [...adversarial.board]) {
    for (const id of [...row]) {
      if (id !== keep) adversarial = moveTile(adversarial, id, { area: 'rack', index: adversarial.rack.length });
    }
  }
  const adversarialPlan = planAssistance(adversarial);
  verify(adversarial, adversarialPlan, 'single visible tile with hidden empty rows');
  assert(adversarialPlan.moves[0].destination.area !== 'board'
    || Boolean(adversarial.board[adversarialPlan.moves[0].destination.row]?.length),
  'single-tile mapping starts at a visible board row or New row');
  const reordered = initial.board.length > 1 ? reorderRow(initial, 0, initial.board.length) : initial;
  verify(reordered, planAssistance(reordered), 'reordered rows');
  verify(initial, planAssistance(initial), 'repeated faces remain physical copies');

  const groupedPuzzle = {
    version: 1, generatorVersion: 1, difficultyTier: 1, seed: 'assistance-group-order',
    rack: ['orange-7-1'],
    board: [['red-7-1', 'black-7-1', 'blue-7-1'], ['orange-1-1', 'orange-2-1', 'orange-3-1']],
  };
  const grouped = createGameState(groupedPuzzle);
  const groupedPlan = planAssistance(grouped);
  verify(grouped, groupedPlan, 'preserve noncanonical group order with rack tile');
  assert(groupedPlan.board.some((row) => JSON.stringify(row.slice(0, 3)) === JSON.stringify(groupedPuzzle.board[0]))
    && groupedPlan.moves[0].destination.area === 'board',
  'rack tile directly repairs an existing noncanonical group without cosmetic reordering');
  const partialGroup = moveTile(grouped, 'blue-7-1', { area: 'rack', index: grouped.rack.length });
  const partialGroupPlan = planAssistance(partialGroup);
  verify(partialGroup, partialGroupPlan, 'preserve order in a two-tile partial group');
  assert(partialGroupPlan.board.some((row) => row[0] === 'red-7-1' && row[1] === 'black-7-1')
    && partialGroupPlan.moves[0].destination.area === 'board',
  'partial group keeps its noncanonical colour order for a direct rack repair');
  const foreign = moveTile(grouped, 'orange-1-1', { area: 'board', row: 0, index: 3 });
  const foreignPlan = planAssistance(foreign, { preferredBoard: [
    ['red-7-1', 'black-7-1', 'blue-7-1', 'orange-7-1'],
    ['orange-1-1', 'orange-2-1', 'orange-3-1'],
  ] });
  verify(foreign, foreignPlan, 'foreign tile in a mapped target row');
  assert(foreignPlan.moves.some((move) => move.reason === 'Prepare the group'),
    'reason stays truthful while a foreign tile keeps the target row invalid');
  const repeatedPartial = moveTile(initial, 'blue-3-2', { area: 'new-row' });
  const repeatedPlan = planAssistance(repeatedPartial);
  verify(repeatedPartial, repeatedPlan, 'preserve repeated-copy partial work');
  assert(repeatedPlan.board.some((row) => row.includes('blue-3-2') && row.includes('blue-4-2') && row.includes('blue-5-2')),
    'target keeps the physical copy with its useful partial run');

  const firstSource = locate(initial, first.moves[0].id);
  const afterFirst = replay(initial, { moves: [first.moves[0]] });
  const recomputed = planAssistance(afterFirst, { preferredBoard: first.board });
  assert(recomputed.status === 'solved' && recomputed.moves.length > 0, 'recompute after the player follows one move');
  const next = recomputed.moves[0];
  const justFollowed = first.moves[0];
  assert(!(next.id === justFollowed.id && JSON.stringify(next.destination) === JSON.stringify(justFollowed.destination)),
    'preferred target does not repeat the just-completed move');
  assert(!(next.id === justFollowed.id && sameDestination(next.destination, firstSource)),
    'preferred target suppresses an immediate reversal');
  verify(replay(initial, { moves: [first.moves[0]] }), recomputed, 'preferred target after progress');
  converge(initial, 'revision-1 sample');

  const limited = planAssistance(initial, { maxNodes: 0 });
  assert(limited.status === 'limit' && limited.board === null && limited.nodes === 0,
    'zero search budget is inconclusive');
  const preferredUnderLimit = planAssistance(initial, { maxNodes: 0, preferredBoard: first.board });
  verify(initial, preferredUnderLimit, 'verified preferred target under zero search budget');
  for (const budget of [-1, 0.5, NaN, '10', null]) {
    assert(throws(() => planAssistance(initial, { maxNodes: budget })), `reject invalid budget ${String(budget)}`);
  }
  assert(throws(() => planAssistance({ ...initial, rack: [] })), 'reject corrupt physical inventory');
  assert(throws(() => planAssistance(initial, { preferredBoard: [['blue-1-1']] })), 'reject invalid preferred target');

  let fixtureCount = 0;
  for (const fixture of fixtures) {
    const puzzle = fixture?.result?.puzzle || fixture?.puzzle || fixture;
    if (!puzzle?.rack || !puzzle?.board) continue;
    const state = createGameState(puzzle);
    if (checkState(state).won) continue;
    verify(state, planAssistance(state), `fixture ${puzzle.generatorVersion}.${puzzle.difficultyTier}.${puzzle.seed}`);
    converge(state, `fixture ${puzzle.generatorVersion}.${puzzle.difficultyTier}.${puzzle.seed}`);
    fixtureCount += 1;
  }
  assert(fixtureCount > 0 || fixtures.length === 0, 'accept flat puzzle fixtures across revisions 1–6');
  return passed;
}
