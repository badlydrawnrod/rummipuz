import { parseTile, classifyRow } from '../rules.js';
import { createGameState, getTileLocations, checkState, moveTile, undoMove, resetGame } from '../state.js';

// Dependency-free checks, runnable in a browser or any native-module JS runtime.
export function runCoreChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const rejects = (puzzle) => {
    try { createGameState(puzzle); return false; } catch { return true; }
  };
  const run = (colour, start, end, copy = 1) =>
    Array.from({ length: end - start + 1 }, (_, i) => `${colour}-${start + i}-${copy}`);
  const rowCases = [
    ['three-colour group', ['black-7-1', 'blue-7-1', 'red-7-1'], 'group'],
    ['four-colour unordered group', ['orange-7-1', 'red-7-1', 'black-7-1', 'blue-7-1'], 'group'],
    ['lower-bound run', run('blue', 1, 3), 'run'],
    ['upper-bound run', run('red', 11, 13), 'run'],
    ['thirteen-tile run', run('orange', 1, 13), 'run'],
    ['empty placeholder', [], 'empty'],
    ['short row', ['blue-1-1', 'blue-2-1'], 'invalid'],
    ['group repeats colour across copies', ['blue-7-1', 'blue-7-2', 'red-7-1'], 'invalid'],
    ['five-tile group', ['black-7-1', 'blue-7-1', 'red-7-1', 'orange-7-1', 'black-7-2'], 'invalid'],
    ['mixed values and colours', ['black-7-1', 'blue-7-1', 'red-8-1'], 'invalid'],
    ['gap', ['blue-3-1', 'blue-5-1', 'blue-6-1'], 'invalid'],
    ['mixed-colour run', ['blue-3-1', 'red-4-1', 'blue-5-1'], 'invalid'],
    ['repeated run value', ['blue-3-1', 'blue-4-1', 'blue-4-2', 'blue-5-1'], 'invalid'],
    ['descending run', run('blue', 3, 5).reverse(), 'invalid'],
    ['scrambled run', ['blue-3-1', 'blue-5-1', 'blue-4-1'], 'invalid'],
    ['wraparound', ['red-12-1', 'red-13-1', 'red-1-1'], 'invalid'],
    ['repeated physical tile', ['blue-3-1', 'blue-3-1', 'blue-3-1'], 'invalid'],
    ['malformed row', null, 'invalid'],
    ['sparse row', new Array(3), 'invalid'],
  ];
  for (const [name, row, kind] of rowCases) assert(classifyRow(row).kind === kind, name);
  for (const id of ['Blue-6-1', 'blue-06-1', 'blue-6-3', 'blue-14-1', 'joker-1', 'blue-6-1\n', null]) {
    assert(parseTile(id) === null, `reject malformed ID ${JSON.stringify(id)}`);
  }
  const first = parseTile('blue-6-1');
  const second = parseTile('blue-6-2');
  assert(first.value === 6 && first.colour === second.colour && first.copy !== second.copy,
    'decode distinct matching physical copies');

  const state = createGameState(sample);
  const initial = checkState(state);
  assert(initial.conserved && !initial.won && initial.remainingRack === 2 && initial.invalidRows.length === 0,
    'initial sample valid and unfinished');
  const locations = getTileLocations(state);
  assert(locations.size === 11 && locations.get('blue-3-1')[0].row === 0
    && locations.get('blue-3-2')[0].row === 1 && locations.get('red-6-1')[0].area === 'rack',
    'track both copies and rack locations');
  const solved = { ...state, rack: [], board: sample.solution.board };
  const before = JSON.stringify(solved);
  assert(checkState(solved).won && JSON.stringify(solved) === before, 'solution wins without mutation');
  assert(checkState({ ...solved, board: [...solved.board].reverse().concat([[]]) }).won,
    'alternate row ordering and empty placeholders win');
  const missing = { ...solved, board: solved.board.slice(1) };
  assert(!checkState(missing).conserved && !checkState(missing).won, 'missing original tiles block win');
  const duplicate = { ...solved, rack: ['blue-3-1'] };
  assert(!checkState(duplicate).conserved && getTileLocations(duplicate).get('blue-3-1').length === 2,
    'duplicate locations detected across rack and board');
  const extra = { ...solved, board: [...solved.board, run('orange', 1, 3)] };
  assert(!checkState(extra).won && checkState(extra).errors.some((e) => e.startsWith('Unexpected tile')),
    'additional valid row cannot introduce inventory');
  const temporary = { ...state, rack: [...state.rack, 'blue-6-1'],
    board: [state.board[0].slice(0, -1), state.board[1]] };
  assert(checkState(temporary).conserved && !checkState(temporary).won,
    'original board tile in rack blocks win');
  const invalid = { ...solved, board: [solved.board[0].slice(0, 2), solved.board[0].slice(2), ...solved.board.slice(1)] };
  assert(checkState(invalid).conserved && !checkState(invalid).won
    && checkState(invalid).invalidRows[0].row === 0, 'empty rack with invalid row is unfinished');
  assert(!checkState(null).won && !checkState({ ...state, board: [null] }).conserved,
    'malformed states return errors');
  assert(Object.isFrozen(state) && Object.isFrozen(state.inventory)
    && Object.isFrozen(state.rack) && Object.isFrozen(state.board) && state.board.every(Object.isFrozen),
    'initial state is immutable');
  const mutableSource = structuredClone(sample);
  const detached = createGameState(mutableSource);
  mutableSource.rack.length = 0;
  mutableSource.board[0].reverse();
  assert(detached.rack.length === 2 && detached.board[0][0] === 'blue-1-1', 'state detached from source');
  for (const [name, puzzle] of [
    ['duplicate starting identity', { ...sample, rack: [...sample.rack, sample.board[0][0]] }],
    ['invalid starting row', { ...sample, board: [sample.board[0].slice(0, 2), sample.board[1]] }],
    ['unsupported format', { ...sample, version: 2 }],
    ['unsupported tier', { ...sample, difficultyTier: 5 }],
    ['invalid seed', { ...sample, seed: 'seed\r' }],
    ['null solution', { ...sample, solution: null }],
    ['incomplete solution', { ...sample, solution: { board: sample.solution.board.slice(1) } }],
  ]) assert(rejects(puzzle), name);
  const withoutSolution = { ...sample };
  delete withoutSolution.solution;
  assert(checkState(createGameState(withoutSolution)).conserved, 'optional solution can be omitted');

  const layout = (position) => JSON.stringify({ rack: position.rack, board: position.board });
  const throws = (action) => { try { action(); return false; } catch { return true; } };
  const startLayout = layout(state);
  assert(state.history.length === 0 && Object.isFrozen(state.history)
    && Object.isFrozen(state.initial) && Object.isFrozen(state.initial.rack)
    && state.initial.board.every(Object.isFrozen), 'immutable starting layout and empty history');
  assert(undoMove(state) === state, 'undo without history is a no-op');
  assert(layout(resetGame(state)) === startLayout, 'reset unchanged puzzle');
  let moved = moveTile(state, 'blue-6-1', { area: 'new-row' });
  assert(moved.board.length === 3 && moved.board[2][0] === 'blue-6-1'
    && moved.board[0].length === 5 && moved.history.length === 1
    && checkState(moved).conserved && checkState(moved).invalidRows[0].row === 2,
  'board to new row allows temporary invalid rows');
  moved = moveTile(moved, 'red-6-1', { area: 'board', row: 2, index: 0 });
  moved = moveTile(moved, 'black-6-1', { area: 'board', row: 2, index: 2 });
  assert(checkState(moved).won && moved.history.length === 3, 'solve sample through three reversible moves');
  assert(layout(undoMove(undoMove(undoMove(moved)))) === startLayout,
    'undo full solution restores exact starting layout');
  const reset = resetGame(moved);
  assert(layout(reset) === startLayout && reset.history.length === 0
    && reset.inventory === state.inventory && reset.seed === state.seed
    && reset.initial === state.initial, 'reset restores original layout, identity, and clears history');
  assert(layout(state) === startLayout && moved.history.every((position) => Object.isFrozen(position)
    && Object.isFrozen(position.rack) && Object.isFrozen(position.board) && position.board.every(Object.isFrozen)),
  'moves leave input unchanged and freeze every history snapshot');
  assert(Object.isFrozen(moved) && Object.isFrozen(moved.history) && moved.board.every(Object.isFrozen),
    'moved states are immutable');

  const toRack = moveTile(state, 'blue-3-1', { area: 'rack', index: 1 });
  assert(toRack.rack[1] === 'blue-3-1' && toRack.board[0][2] === 'blue-4-1'
    && toRack.board[1][0] === 'blue-3-2' && checkState(toRack).conserved,
  'board to rack preserves matching physical copy');
  const rackReordered = moveTile(state, state.rack[0], { area: 'rack', index: 2 });
  assert(rackReordered.rack[1] === state.rack[0] && layout(undoMove(rackReordered)) === startLayout,
    'same-rack forward reorder and undo');
  const forward = moveTile(state, 'blue-1-1', { area: 'board', row: 0, index: 6 });
  const backward = moveTile(forward, 'blue-1-1', { area: 'board', row: 0, index: 0 });
  assert(forward.board[0][5] === 'blue-1-1' && layout(backward) === startLayout,
    'same-row forward and backward pre-move insertion gaps');
  assert(moveTile(state, 'blue-3-1', { area: 'board', row: 0, index: 2 }) === state
    && moveTile(state, 'blue-3-1', { area: 'board', row: 0, index: 3 }) === state,
  'adjacent insertion gaps do not add undo entries');
  let emptied = moveTile(state, 'blue-1-1', { area: 'new-row' });
  emptied = moveTile(emptied, 'blue-1-1', { area: 'board', row: 1, index: 1 });
  assert(emptied.board[2].length === 0 && emptied.board[1][1] === 'blue-1-1'
    && undoMove(emptied).board[2][0] === 'blue-1-1', 'empty source rows persist and undo restores them');
  const intoEmpty = moveTile(emptied, 'blue-3-2', { area: 'board', row: 2, index: 0 });
  assert(intoEmpty.board[2][0] === 'blue-3-2', 'place tile into existing empty row');

  for (const destination of [null, {}, { area: 'other' }, { area: 'rack', index: -1 },
    { area: 'rack', index: 3 }, { area: 'rack', index: 0.5 }, { area: 'rack' },
    { area: 'board', row: -1, index: 0 }, { area: 'board', row: 2, index: 0 },
    { area: 'board', row: 0.5, index: 0 }, { area: 'board', row: 0, index: 7 }]) {
    assert(throws(() => moveTile(state, 'red-6-1', destination)) && layout(state) === startLayout
      && state.history.length === 0, `reject destination ${JSON.stringify(destination)} without mutation`);
  }
  assert(throws(() => moveTile(state, 'orange-13-1', { area: 'rack', index: 0 })),
    'reject absent physical tile');
  assert(throws(() => moveTile(duplicate, 'blue-3-1', { area: 'new-row' }))
    && throws(() => undoMove(missing)), 'moves and undo reject corrupt tile inventories');
  assert(layout(resetGame(missing)) === startLayout, 'reset recovers corrupt live layout from original');
  assert(throws(() => undoMove({ ...state, history: [{ rack: [], board: [] }] })),
    'undo rejects history that loses inventory');
  const branch = moveTile(undoMove(moved), 'red-6-1', { area: 'rack', index: 0 });
  assert(branch.history.length === 3 && layout(undoMove(branch)) === layout(undoMove(moved)),
    'new move after undo branches from restored position');

  // Exercise mixed destinations, copies, empty rows, and repeated reordering.
  let sequence = state;
  const priorLayouts = [];
  for (let i = 0; i < 200; i += 1) {
    const id = state.inventory[(i * 7) % state.inventory.length];
    const destination = i % 3 === 0 ? { area: 'new-row' }
      : i % 3 === 1 ? { area: 'rack', index: i % (sequence.rack.length + 1) }
        : { area: 'board', row: i % sequence.board.length,
          index: i % (sequence.board[i % sequence.board.length].length + 1) };
    const previous = sequence;
    sequence = moveTile(sequence, id, destination);
    if (sequence !== previous) priorLayouts.push(layout(previous));
    if (!checkState(sequence).conserved) throw new Error(`Conservation failed at move ${i}`);
  }
  assert(sequence.history.length === priorLayouts.length, 'mixed move sequence conserves every tile');
  while (priorLayouts.length) {
    sequence = undoMove(sequence);
    if (layout(sequence) !== priorLayouts.pop() || !checkState(sequence).conserved) {
      throw new Error('Mixed sequence undo failed to restore an exact conserved position.');
    }
  }
  assert(layout(sequence) === startLayout && sequence.history.length === 0,
    'undo entire mixed sequence restores every intermediate position and starting order');
  return passed;
}
