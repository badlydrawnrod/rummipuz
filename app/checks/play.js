import { createPlaySession } from '../play-session.js';
import { createGameState, checkState } from '../state.js';
import { createProgressStore } from '../progress.js';

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
    const finishedRows = play.snapshot().rows;
    assert(!play.reorder(finishedRows[0].id, play.rowDestination(null)),
      `${method}: completed sessions reject row reorder`);
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

  const collapsed = createPlaySession(initial);
  const initialIds = collapsed.snapshot().rows.map(({ id }) => id);
  const reordered = createPlaySession(initial);
  const originalOrderIds = reordered.snapshot().rows.map(({ id }) => id);
  const destination = reordered.rowDestination(null);
  reordered.select('blue-6-1');
  reordered.beginDrag('blue-6-1');
  assert(reordered.reorder(originalOrderIds[0], destination)
    && reordered.snapshot().rows.map(({ id }) => id).join() === originalOrderIds.slice().reverse().join()
    && reordered.snapshot().state.board[1].join() === initial.board[0].join()
    && reordered.snapshot().selected === null && reordered.snapshot().dragging === null,
  'Row reorder carries its ID and exact tile order, then clears tile transients');
  assert(reordered.snapshot().state.history.length === 1
    && reordered.undo() === undefined
    && reordered.snapshot().rows.map(({ id }) => id).join() === originalOrderIds.join()
    && JSON.stringify(reordered.snapshot().state) === JSON.stringify(initial),
  'Undo restores the prior row order and row identities');
  reordered.select('blue-6-1');
  const keepSelection = reordered.snapshot().selected;
  assert(!reordered.reorder(originalOrderIds[0], destination)
    && reordered.snapshot().selected === keepSelection,
  'A stale row destination is rejected without clearing selection');
  const noOpToken = reordered.rowDestination(originalOrderIds[1]);
  assert(!reordered.reorder(originalOrderIds[0], noOpToken)
    && reordered.snapshot().selected === keepSelection,
  'Dropping before the next visible row is a no-op and keeps selection');
  reordered.reset();
  assert(reordered.snapshot().rows.map(({ id }) => id).join() === originalOrderIds.join(),
    'Reset restores original row identities after reorder');

  const hiddenGap = createPlaySession(initial);
  for (const id of initial.board[1]) {
    hiddenGap.select(id); hiddenGap.place({ area: 'rack', index: 0 });
  }
  hiddenGap.select('blue-6-1'); hiddenGap.place(hiddenGap.destination({ area: 'new-row' }));
  const gapRows = hiddenGap.snapshot().rows;
  hiddenGap.beginDrag('blue-6-1');
  assert(gapRows.length === 2 && gapRows[0].stateRow === 0 && gapRows[1].stateRow === 2
    && !hiddenGap.reorder(gapRows[0].id, hiddenGap.rowDestination(gapRows[1].id))
    && hiddenGap.snapshot().dragging === 'blue-6-1'
    && hiddenGap.snapshot().state.history.length === initial.history.length + 4,
  'Hidden placeholders do not create a visible reorder, and no-op keeps drag state');
  assert(!hiddenGap.reorder('missing-row-id', hiddenGap.rowDestination(null)),
    'Unknown row identities cannot be reordered');

  const reloadReorder = createPlaySession(initial);
  const reloadIds = reloadReorder.snapshot().rows.map(({ id }) => id);
  reloadReorder.reorder(reloadIds[0], reloadReorder.rowDestination(null));
  let reorderedSave;
  const reorderStorage = { getItem: () => reorderedSave ?? null, setItem: (_, value) => { reorderedSave = value; } };
  createProgressStore({ getStorage: () => reorderStorage }).saveSession(reloadReorder.snapshot());
  const reloadedState = createProgressStore({ getStorage: () => reorderStorage }).snapshot().active.state;
  const reloaded = createPlaySession(reloadedState);
  const reloadedOrderIds = reloaded.snapshot().rows.map(({ id }) => id);
  reloaded.undo();
  assert(reloaded.snapshot().rows.map(({ id }) => id).join() === reloadedOrderIds.slice().reverse().join()
    && JSON.stringify(reloaded.snapshot().state) === JSON.stringify(initial),
  'Reload reconstructs permuted row identities through saved history for exact Undo');

  const middle = createPlaySession(initial);
  middle.select(initial.rack[0]); middle.place({ area: 'new-row' });
  const threeIds = middle.snapshot().rows.map(({ id }) => id);
  const beforeMiddle = JSON.stringify(middle.snapshot().state);
  assert(middle.reorder(threeIds[2], middle.rowDestination(threeIds[1]))
    && middle.snapshot().rows.map(({ id }) => id).join() === [threeIds[0], threeIds[2], threeIds[1]].join(),
    'Last row can move upward into a middle visible insertion gap');
  const afterMiddle = JSON.stringify(middle.snapshot().state);
  middle.select(initial.rack[1]); middle.place({ area: 'board', row: 1, index: 1 });
  let mixedSave;
  const mixedStorage = { getItem: () => mixedSave ?? null, setItem: (_, value) => { mixedSave = value; } };
  createProgressStore({ getStorage: () => mixedStorage }).saveSession(middle.snapshot());
  const mixed = createPlaySession(createProgressStore({ getStorage: () => mixedStorage }).snapshot().active.state);
  const mixedIds = mixed.snapshot().rows.map(({ id }) => id);
  mixed.undo();
  assert(JSON.stringify(mixed.snapshot().state) === afterMiddle
    && mixed.snapshot().rows.map(({ id }) => id).join() === mixedIds.join(),
    'Reloaded tile-edit Undo preserves reordered row identities');
  mixed.undo();
  assert(JSON.stringify(mixed.snapshot().state) === beforeMiddle
    && mixed.snapshot().rows.map(({ id }) => id).join() === [mixedIds[0], mixedIds[2], mixedIds[1]].join(),
    'Mixed reload history restores exact state and identities before middle reorder');
  middle.undo(); middle.undo();
  assert(middle.reorder(threeIds[0], middle.rowDestination(threeIds[2]))
    && middle.snapshot().rows.map(({ id }) => id).join() === [threeIds[1], threeIds[0], threeIds[2]].join(),
    'First row can move downward into a middle visible insertion gap');
  const oldTileTarget = middle.destination({ area: 'board', row: 1, index: 0 });
  middle.reorder(threeIds[2], middle.rowDestination(threeIds[1]));
  middle.select('blue-6-1');
  assert(!middle.place(oldTileTarget), 'Row reorder invalidates previously rendered tile destinations');
  middle.reset();
  assert(JSON.stringify(middle.snapshot().state) === JSON.stringify(initial),
    'Reset after mixed tile moves and row reorders restores the exact initial layout');

  const stale = collapsed.destination({ area: 'board', row: 1, index: 0 });
  for (const id of initial.board[0]) {
    collapsed.select(id); collapsed.place({ area: 'rack', index: 0 });
  }
  const remaining = collapsed.snapshot().rows;
  assert(remaining.length === 1 && remaining[0].stateRow === 1 && remaining[0].number === 1
    && remaining[0].id === initialIds[1], 'Hidden placeholders preserve row identity with contiguous visible numbering');
  collapsed.select('blue-6-1');
  const beforeStale = collapsed.snapshot().state;
  assert(!collapsed.place(stale) && collapsed.snapshot().state === beforeStale,
    'A stale placement token cannot edit a shifted visible row');
  const wrongRow = { ...collapsed.destination({ area: 'board', row: 1, index: 0 }), rowId: initialIds[0] };
  assert(!collapsed.place(wrongRow), 'A mismatched view identity cannot target another state row');
  collapsed.place(collapsed.destination({ area: 'board', row: remaining[0].stateRow, index: 0 }));
  assert(collapsed.snapshot().state.board[1][0] === 'blue-6-1' && collapsed.snapshot().rows[0].id === initialIds[1],
    'Visible row one targets state row one after state row zero collapses');
  collapsed.undo();
  for (const id of initial.board[1]) {
    collapsed.select(id); collapsed.place({ area: 'rack', index: 0 });
  }
  assert(collapsed.snapshot().rows.length === 0 && checkState(collapsed.snapshot().state).conserved,
    'All-empty board hides every placeholder and conserves inventory');
  collapsed.beginDrag('blue-6-1');
  const cancelled = collapsed.destination({ area: 'new-row' });
  collapsed.cancel();
  assert(!collapsed.drop('blue-6-1', cancelled), 'Cancelled drag cannot create a new row after collapse');
  collapsed.select('blue-6-1'); collapsed.place(collapsed.destination({ area: 'new-row' }));
  const appendedId = collapsed.snapshot().rows[0].id;
  assert(collapsed.snapshot().rows.length === 1 && collapsed.snapshot().rows[0].stateRow === 2
    && collapsed.snapshot().rows[0].number === 1 && !initialIds.includes(appendedId),
    'New row appends one fresh visible row after hidden placeholders');
  collapsed.select('red-6-1'); collapsed.place(collapsed.destination({ area: 'board', row: 2, index: 1 }));
  assert(collapsed.snapshot().rows[0].tiles.length === 2 && collapsed.snapshot().rows[0].id === appendedId,
    'One- and two-tile temporary invalid rows remain visible with stable identity');

  let saved;
  const storage = { getItem: () => saved ?? null, setItem: (_, value) => { saved = value; } };
  const store = createProgressStore({ getStorage: () => storage });
  store.saveSession(collapsed.snapshot());
  const restoredState = createProgressStore({ getStorage: () => storage }).snapshot().active.state;
  const restored = createPlaySession(restoredState);
  assert(JSON.stringify(restoredState) === JSON.stringify(collapsed.snapshot().state)
    && restored.snapshot().rows[0].stateRow === 2, 'Old-format saves retain empty placeholders and exact undo snapshots on reload');
  restored.undo(); restored.undo();
  assert(restored.snapshot().rows.length === 0, 'Reloaded Undo removes an appended row without exposing blank stacks');
  restored.undo();
  assert(restored.snapshot().rows.length === 1 && restored.snapshot().rows[0].stateRow === 1,
    'Reloaded Undo makes an emptied slot visible again');
  collapsed.undo(); collapsed.undo();
  collapsed.select('blue-6-1'); collapsed.place(collapsed.destination({ area: 'new-row' }));
  assert(collapsed.snapshot().rows[0].id !== appendedId, 'A new branch after Undo gives its appended row a fresh identity');
  collapsed.reset();
  assert(collapsed.snapshot().rows.map(({ id }) => id).join() === initialIds.join()
    && JSON.stringify(collapsed.snapshot().state) === JSON.stringify(initial),
    'Reset restores original row identities and exact immutable starting puzzle');
  return passed;
}
