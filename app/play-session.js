import { checkState, getTileLocations, moveTile, resetGame, undoMove } from './state.js';

// Selection and drag are transient; only placements create undo history.
export function createPlaySession(initialState, { completed: restoredCompleted = false, onChange = () => {} } = {}) {
  let state = initialState;
  let selected = null;
  let dragging = null;
  let completed = restoredCompleted;
  if (typeof completed !== 'boolean' || (completed && !checkState(state).won)) {
    throw new Error('Cannot restore an invalid completed session.');
  }
  const changed = () => onChange({ state, completed });
  const clear = () => { selected = null; dragging = null; };
  const canSelect = (id) => !completed && getTileLocations(state).has(id);
  return {
    snapshot: () => ({ state, selected, dragging, completed }),
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
      const before = state;
      const next = moveTile(state, selected, destination);
      state = next;
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
      state = undoMove(state);
      clear();
      if (state !== before) changed();
    },
    reset() {
      state = resetGame(state);
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
