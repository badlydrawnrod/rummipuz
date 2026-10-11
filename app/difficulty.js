import { classifyRow } from './rules.js';
import { createGameState, checkState } from './state.js';
import { solvePreservingRows } from './preservation.js';

export const TIER_BOUNDS = Object.freeze([null, [2, 5, 2, 5], [3, 6, 3, 6], [4, 8, 4, 7], [4, 10, 4, 9]].map((x) => x && Object.freeze(x)));

export function rearrangedRows(state, board) {
  if (!checkState({ ...state, rack: [], board }).won) throw new Error('A complete conserved solution is required.');
  return state.board.flatMap((original, index) => {
    const kind = classifyRow(original).kind;
    const preserved = board.some((row) => classifyRow(row).kind === kind && original.every((id) => row.includes(id)));
    return preserved ? [] : [index];
  });
}

/** Prove minimum rearrangement; a limit can never confer a difficulty tier. */
export function ratePuzzle(puzzle, { maxNodes = 200000 } = {}) {
  const state = createGameState(puzzle);
  if (state.board.length > 9 || (maxNodes !== Infinity && (!Number.isSafeInteger(maxNodes) || maxNodes < 0))) {
    throw new Error('Rating supports at most nine starting rows and a nonnegative node budget.');
  }
  const competingPlacements = state.rack.reduce((total, id) => total + state.board.reduce((count, row) =>
    count + Array.from({ length: row.length + 1 }, (_, index) =>
      classifyRow([...row.slice(0, index), id, ...row.slice(index)]).valid ? 1 : 0).reduce((a, b) => a + b, 0), 0), 0);
  const features = { rackSize: state.rack.length, boardRows: state.board.length, competingPlacements };
  let nodes = 0;
  // Test all choices of rows allowed to change, from zero upward. Failure of
  // every smaller subset proves the minimum, rather than rating one witness.
  for (let changed = 0; changed <= state.board.length; changed += 1) {
    for (let mask = 0; mask < (1 << state.board.length); mask += 1) {
      const preserved = state.board.flatMap((_, i) => mask & (1 << i) ? [] : [i]);
      if (state.board.length - preserved.length !== changed) continue;
      const result = solvePreservingRows(state, preserved, { maxNodes: maxNodes - nodes });
      nodes += result.nodes;
      if (result.status === 'limit') return { status: 'limit', tier: null, board: null, nodes, features };
      if (result.status !== 'solved') continue;
      const touched = rearrangedRows(state, result.board);
      if (touched.length !== changed) throw new Error('Minimum rearrangement proof disagrees with witness.');
      const tier = changed === 0 ? null : Math.min(changed, 4);
      const bounds = tier && TIER_BOUNDS[tier];
      const fits = bounds && features.rackSize >= bounds[0] && features.rackSize <= bounds[1]
        && features.boardRows >= bounds[2] && features.boardRows <= bounds[3];
      result.board.forEach(Object.freeze);
      return { status: fits ? 'rated' : 'excluded', tier: fits ? tier : null,
        board: Object.freeze(result.board), nodes,
        features: { ...features, rearrangement: changed, rowsTouched: Object.freeze(touched) } };
    }
  }
  return { status: 'unsolvable', tier: null, board: null, nodes, features };
}
