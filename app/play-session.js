import { checkState, getTileLocations, moveTile, resetGame, undoMove } from './state.js';

let nextSessionId = 0;

// Selection and drag are transient; only placements create undo history.
export function createPlaySession(initialState, { completed: restoredCompleted = false, onChange = () => {} } = {}) {
  let state = initialState;
  let selected = null;
  let dragging = null;
  let completed = restoredCompleted;
  let positionToken = 0;
  let nextRowId = 0;
  const prefix = `session-${++nextSessionId}-row-`;
  const rowIds = new WeakMap();
  // Existing saves contain slot-preserving tile edits and appended new rows.
  // Keep identity outside puzzle state, including mappings for old Undo entries.
  let previousIds = [];
  for (const position of [state.initial, ...state.history, state]) {
    const ids = position.board.map((_, row) => previousIds[row] ?? `${prefix}${++nextRowId}`);
    rowIds.set(position.board, ids);
    previousIds = ids;
  }
  const visibleRows = () => state.board.flatMap((tiles, stateRow) =>
    tiles.length ? [{ id: rowIds.get(state.board)[stateRow], stateRow, tiles }] : [])
    .map((row, index) => ({ ...row, number: index + 1 }));
  const adopt = (next, ids) => {
    rowIds.set(next.board, ids);
    state = next;
    positionToken += 1;
  };
  if (typeof completed !== 'boolean' || (completed && !checkState(state).won)) {
    throw new Error('Cannot restore an invalid completed session.');
  }
  const changed = () => onChange({ state, completed });
  const clear = () => { selected = null; dragging = null; };
  const canSelect = (id) => !completed && getTileLocations(state).has(id);
  return {
    snapshot: () => ({ state, selected, dragging, completed, rows: visibleRows() }),
    destination(destination) {
      return { ...destination, positionToken,
        ...(destination.area === 'board' ? { rowId: rowIds.get(state.board)[destination.row] } : {}) };
    },
    select(id) {
      if (!canSelect(id)) return false;
      selected = selected === id ? null : id;
      dragging = null;
      return true;
    },
    cancel() { clear(); },
    beginDrag(id) {
      if (!canSelect(id)) return false;
      selected = id;
      dragging = id;
      return true;
    },
    place(destination) {
      if (completed || !selected) return false;
      if (destination && ((Object.hasOwn(destination, 'positionToken') && destination.positionToken !== positionToken)
          || (Object.hasOwn(destination, 'rowId') && destination.rowId !== rowIds.get(state.board)[destination.row]))) {
        return false;
      }
      const before = state;
      const next = moveTile(state, selected, destination);
      if (next !== before) {
        const ids = [...rowIds.get(before.board)];
        rowIds.set(next.history.at(-1).board, [...ids]);
        if (next.board.length > ids.length) ids.push(`${prefix}${++nextRowId}`);
        adopt(next, ids);
      }
      clear();
      if (next !== before) changed();
      return true;
    },
    drop(id, destination) {
      if (!dragging || dragging !== id) return false;
      return this.place(destination);
    },
    undo() {
      if (completed) return;
      const before = state;
      const next = undoMove(state);
      if (next !== before) adopt(next, rowIds.get(before.history.at(-1).board));
      clear();
      if (state !== before) changed();
    },
    reset() {
      adopt(resetGame(state), rowIds.get(state.initial.board));
      completed = false;
      clear();
      changed();
    },
    check() {
      const result = checkState(state);
      if (result.won && !completed) { completed = true; clear(); changed(); }
      return result;
    },
  };
}
