import { checkState, getTileLocations, moveTile, resetGame, undoMove } from './state.js';

// Selection and drag are transient; only placements create undo history.
export function createPlaySession(initialState) {
  let state = initialState;
  let selected = null;
  let dragging = null;
  let completed = false;
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
      const next = moveTile(state, selected, destination);
      state = next;
      clear();
      return true;
    },
    drop(id, destination) {
      if (!dragging || dragging !== id) return false;
      return this.place(destination);
    },
    undo() {
      if (completed) return;
      state = undoMove(state);
      clear();
    },
    reset() {
      state = resetGame(state);
      completed = false;
      clear();
    },
    check() {
      const result = checkState(state);
      if (result.won) { completed = true; clear(); }
      return result;
    },
  };
}
