import { createPlaySession } from '../play-session.js';
import { createGameState, checkState } from '../state.js';

export function runPlayChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const initial = createGameState(sample);
  const session = createPlaySession(initial);
  assert(!session.place({ area: 'new-row' }) && session.snapshot().state === initial,
    'Placement requires a selection');
  session.select('blue-6-1');
  assert(session.snapshot().state === initial && initial.history.length === 0,
    'Selection creates no move or history entry');
  session.select('blue-6-1');
  assert(session.snapshot().selected === null, 'Clicking the selected tile clears selection');
  assert(!session.select('blue-13-1'), 'Missing tile cannot be selected');
  session.select('blue-3-2');
  assert(session.snapshot().selected === 'blue-3-2', 'Matching copies are independently selectable');
  session.cancel();
  assert(session.snapshot().state === initial && session.snapshot().selected === null,
    'Cancelling selection preserves the exact position');
  assert(!session.drop('blue-6-1', { area: 'new-row' }), 'External drop without an active drag is ignored');
  assert(!session.beginDrag('blue-13-1'), 'Missing tile cannot start a drag');
  session.beginDrag('blue-6-1');
  assert(!session.drop('blue-3-2', { area: 'new-row' }) && session.snapshot().state === initial,
    'Mismatched drop payload cannot move a different physical tile');
  session.cancel();
  assert(session.snapshot().state === initial && session.snapshot().dragging === null,
    'Cancelled drag preserves position and clears transient state');

  session.select('blue-6-1');
  session.place({ area: 'board', row: 0, index: 6 });
  assert(session.snapshot().state === initial, 'Dropping beside the same tile is a no-op without undo credit');
  session.select('blue-3-2');
  session.place({ area: 'board', row: 1, index: 3 });
  assert(session.snapshot().state.board[1].join() === 'blue-4-2,blue-5-2,blue-3-2',
    'Same-row targets use pre-removal insertion indices');
  assert(checkState(session.snapshot().state).invalidRows.length === 1,
    'Mouse placements allow temporary invalid rows');
  session.undo();
  assert(JSON.stringify(session.snapshot().state) === JSON.stringify(initial),
    'Undo restores exact physical order and history');
  session.select('blue-6-1');
  const beforeRejectedMove = session.snapshot().state;
  let rejected = false;
  try { session.place({ area: 'board', row: 99, index: 0 }); } catch { rejected = true; }
  assert(rejected && session.snapshot().state === beforeRejectedMove,
    'Rejected destination leaves the current state untouched');
  session.place({ area: 'rack', index: 0 });
  assert(session.snapshot().state.rack[0] === 'blue-6-1', 'Original board tile can return to the rack');
  session.reset();
  assert(JSON.stringify(session.snapshot().state) === JSON.stringify(initial),
    'Reset restores the starting puzzle and clears history');
  assert(!session.check().won && !session.snapshot().completed,
    'Check with remaining rack tiles does not complete');

  // Complete the sample through click placement and through drag/drop separately.
  const moves = [
    ['blue-6-1', { area: 'new-row' }],
    ['red-6-1', { area: 'board', row: 2, index: 1 }],
    ['black-6-1', { area: 'board', row: 2, index: 2 }],
  ];
  const positions = [];
  for (const method of ['click', 'drag']) {
    const play = createPlaySession(initial);
    for (const [id, destination] of moves) {
      if (method === 'click') { play.select(id); play.place(destination); }
      else { play.beginDrag(id); play.drop(id, destination); }
      assert(checkState(play.snapshot().state).conserved,
        `${method}: ${id} conserves every physical tile`);
    }
    positions.push(play.snapshot().state);
    assert(!play.snapshot().completed && checkState(play.snapshot().state).won,
      `${method}: solved arrangement still requires explicit Check`);
    assert(play.check().won && play.snapshot().completed,
      `${method}: Check completes the sample puzzle`);
    const finished = play.snapshot().state;
    assert(!play.select('blue-6-1') && !play.beginDrag('blue-6-1'),
      `${method}: completion locks tile editing`);
    play.undo();
    assert(play.snapshot().state === finished, `${method}: completion prevents Undo`);
    play.reset();
    assert(!play.snapshot().completed && JSON.stringify(play.snapshot().state) === JSON.stringify(initial),
      `${method}: replay restores the original sample`);
  }
  assert(JSON.stringify(positions[0]) === JSON.stringify(positions[1]),
    'Click and drag produce the same state and undo history');

  const empty = createPlaySession(initial);
  for (const id of initial.board[1]) {
    empty.select(id); empty.place({ area: 'rack', index: 0 });
  }
  assert(empty.snapshot().state.board[1].length === 0, 'Empty source rows remain placement destinations');
  empty.select('blue-3-2'); empty.place({ area: 'board', row: 1, index: 0 });
  assert(empty.snapshot().state.board[1][0] === 'blue-3-2', 'A tile can be placed into an empty row');
  return passed;
}
