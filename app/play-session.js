import { checkState, getTileLocations, moveTile, reorderRow, resetGame, undoMove } from './state.js';

let nextSessionId = 0;

// Selection and drag are transient; tile placements and row reorders add history.
export function createPlaySession(initialState, { completed: restoredCompleted = false, onChange = () => {} } = {}) {
  let state = initialState;
  let selected = null;
  let dragging = null;
  let completed = restoredCompleted;
  let positionToken = 0;
  let nextRowId = 0;
  const prefix = `session-${++nextSessionId}-row-`;
  const rowIds = new WeakMap();
  const sameRow = (left, right) => left.length === right.length
    && left.every((id, index) => id === right[index]);
  const reconstructIds = (previous, previousIds, position) => {
    // Infer whole-row permutations without adding fields to existing saves.
    // A singleton tile moved into an empty slot can have the same saved layout;
    // both cases reconstruct deterministically with fresh viewport state.
    // Repeated empty rows are matched to the first unused equal row.
    if (previous && previous.rack.length === position.rack.length
        && previous.rack.every((id, index) => id === position.rack[index])
        && previous.board.length === position.board.length) {
      const unmatched = new Set(previous.board.map((_, index) => index));
      const reordered = [];
      for (const row of position.board) {
        const match = [...unmatched].find((index) => sameRow(previous.board[index], row));
        if (match === undefined) { reordered.length = 0; break; }
        unmatched.delete(match);
        reordered.push(previousIds[match]);
      }
      if (reordered.length === position.board.length) return reordered;
    }
    return position.board.map((_, row) => previousIds?.[row] ?? `${prefix}${++nextRowId}`);
  };
  // Row identity stays outside saved puzzle data and includes hidden slots.
  // On reload, exact whole-row permutations recover IDs deterministically;
  // other edits preserve their historical slot mapping.
  let previousIds = [];
  let previousPosition = null;
  for (const position of [state.initial, ...state.history, state]) {
    const ids = reconstructIds(previousPosition, previousIds, position);
    rowIds.set(position.board, ids);
    previousIds = ids;
    previousPosition = position;
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
    rowDestination(beforeRowId = null) {
      return { beforeRowId, positionToken };
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
    reorder(rowId, destination) {
      if (completed || !destination || typeof destination !== 'object'
          || destination.positionToken !== positionToken
          || !Object.hasOwn(destination, 'beforeRowId')) return false;
      const ids = rowIds.get(state.board);
      const sourceRow = ids.indexOf(rowId);
      if (sourceRow < 0 || !state.board[sourceRow]?.length) return false;
      const visible = visibleRows();
      const visibleSource = visible.findIndex((row) => row.id === rowId);
      if (visibleSource < 0) return false;
      let insertionIndex;
      if (destination.beforeRowId === null) {
        if (visibleSource === visible.length - 1) return false;
        insertionIndex = visible.at(-1).stateRow + 1;
      } else {
        const targetVisible = visible.findIndex((row) => row.id === destination.beforeRowId);
        if (targetVisible < 0) return false;
        // These gaps leave the visible order unchanged, even when hidden
        // empty placeholders sit between the source and its next row.
        if (destination.beforeRowId === rowId || targetVisible === visibleSource + 1) return false;
        insertionIndex = visible[targetVisible].stateRow;
      }
      const before = state;
      const next = reorderRow(state, sourceRow, insertionIndex);
      if (next === before) return false;
      const reorderedIds = [...ids];
      const [movedId] = reorderedIds.splice(sourceRow, 1);
      reorderedIds.splice(insertionIndex - (sourceRow < insertionIndex ? 1 : 0), 0, movedId);
      rowIds.set(next.history.at(-1).board, [...ids]);
      adopt(next, reorderedIds);
      clear();
      changed();
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
