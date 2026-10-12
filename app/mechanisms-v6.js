import { classifyRow } from './rules.js';
import { solutionStructure } from './structural-difficulty.js';

export const EASY_PRIORITY = ['run-donation', 'group-donation', 'run-division'];
export const CORE_PRIORITY = ['combined-repair', 'mixed-exchange', 'linked-group-donation',
  'groups-to-runs', 'runs-to-groups', 'interior-extraction', 'split-and-join', 'boundary-repair'];
const kind = (row) => classifyRow([...row]).kind;
const intersection = (row, target) => row.filter((id) => target.has(id));
const consecutive = (source, part) => {
  const positions = source.flatMap((id, i) => part.includes(id) ? [i] : []);
  return positions.length > 0 && positions.at(-1) - positions[0] + 1 === positions.length;
};
function interiorExport(source, targets, kinds) {
  const cores = targets.flatMap((target, j) => {
    const part = intersection(source, target);
    return kinds[j] === 'run' && part.length >= 3 && consecutive(source, part)
      ? [part.map((id) => source.indexOf(id))] : [];
  }).sort((a, b) => a[0] - b[0]);
  return cores.some((first, i) => cores.slice(i + 1).some((second) =>
    source.slice(first.at(-1) + 1, second[0]).some((id) =>
      targets.some((target, j) => kinds[j] === 'group' && target.has(id)))));
}

/** Exact physical-origin Easy predicates, independent of the first solver answer. */
export function easyMechanisms(state, board, structure = solutionStructure(state, board)) {
  if (structure.changedRows.length !== 1) return [];
  const sourceIndex = structure.changedRows[0];
  const source = state.board[sourceIndex];
  const sourceSet = new Set(source), rack = new Set(state.rack);
  const targets = board.map((row) => new Set(row));
  for (let i = 0; i < state.board.length; i += 1) {
    if (i === sourceIndex) continue;
    const other = state.board[i];
    if (!targets.some((target) => kind(target) === kind(other) && other.every((id) => target.has(id))
      && [...target].every((id) => other.includes(id) || rack.has(id)))) return [];
  }
  const active = targets.filter((target) => source.some((id) => target.has(id)));
  if (active.some((target) => [...target].some((id) => !sourceSet.has(id) && !rack.has(id)))) return [];
  const found = new Set();
  if (kind(source) === 'run') {
    for (const target of active) {
      const core = intersection(source, target), exported = source.filter((id) => !target.has(id));
      if (kind(target) !== 'run' || core.length < 3 || !consecutive(source, core)
        || ![ [source[0]], [source.at(-1)], [source[0], source.at(-1)] ].some((ends) =>
          ends.length === exported.length && ends.every((id) => exported.includes(id)))) continue;
      const exports = active.filter((row) => row !== target);
      if (exports.length === exported.length && exports.every((row) => {
        const part = intersection(source, row), rackCount = [...row].filter((id) => rack.has(id)).length;
        return kind(row) === 'group' && part.length === 1 && exported.includes(part[0]) && rackCount >= 2 && rackCount <= 3;
      })) found.add('run-donation');
    }
    if (active.length === 2 && active.every((row) => kind(row) === 'run')) {
      for (let cut = 2; cut <= source.length - 2; cut += 1) {
        const prefix = source.slice(0, cut), suffix = source.slice(cut);
        if ([prefix, suffix].every((part) => active.some((target) => {
          const contribution = intersection(source, target);
          return contribution.length === part.length && part.every((id) => target.has(id));
        })) && active.some((row) => [...row].some((id) => rack.has(id)))) found.add('run-division');
      }
    }
  } else if (source.length === 4 && active.length === 2) {
    for (const retained of active) {
      const other = active.find((row) => row !== retained);
      if (kind(retained) === 'group' && retained.size === 3 && [...retained].every((id) => sourceSet.has(id))
        && kind(other) === 'run' && intersection(source, other).length === 1
        && [...other].filter((id) => rack.has(id)).length >= 2) found.add('group-donation');
    }
  }
  return EASY_PRIORITY.filter((name) => found.has(name));
}

/** Predicates in qualifying components; family certification intersects these over every minimum-R solution. */
export function coreMechanisms(state, board, tier, structure = solutionStructure(state, board)) {
  const targets = board.map((row) => new Set(row)), kinds = board.map(kind);
  const found = new Set();
  for (const component of structure.components) {
    if (component.rows.length < tier || component.nonEndpointRows.length < tier - 1) continue;
    const sources = component.rows, sourceKinds = new Set(sources.map((i) => kind(state.board[i])));
    const parts = sources.map((i) => targets.map((target) => intersection(state.board[i], target)));
    const shared = (j) => parts.filter((row) => row[j].length).length >= 2;
    const joined = targets.some((_, j) => kinds[j] === 'run' && shared(j));
    const split = parts.some((row) => row.filter((part) => part.length).length >= 2);
    const shortJoin = targets.some((_, j) => kinds[j] === 'run' && shared(j) && parts.some((row, at) =>
      row[j].length >= 1 && row[j].length <= 2 && consecutive(state.board[sources[at]], row[j])));
    const allIn = (targetKind) => parts.every((row) => row.every((part, j) => !part.length || kinds[j] === targetKind));
    if (sourceKinds.size === 1 && sourceKinds.has('group') && allIn('run')) found.add('groups-to-runs');
    if (sourceKinds.size === 1 && sourceKinds.has('run')) {
      if (allIn('group')) found.add('runs-to-groups');
      if (split && joined && shortJoin) found.add('split-and-join');
      if (split && joined && allIn('run')) found.add('boundary-repair');
      if (!joined && sources.some((i) => interiorExport(state.board[i], targets, kinds))) found.add('interior-extraction');
    }
    if (sourceKinds.has('group') && sourceKinds.has('run') && ['group', 'run'].every((sourceKind) =>
      sources.some((i) => kind(state.board[i]) === sourceKind && targets.some((target, j) =>
        kinds[j] !== sourceKind && intersection(state.board[i], target).length)))) found.add('mixed-exchange');
    for (const i of sources) {
      const source = state.board[i];
      if (kind(source) !== 'group' || source.length !== 4) continue;
      targets.forEach((retained, coreIndex) => {
        if (kinds[coreIndex] !== 'group' || intersection(source, retained).length !== 3) return;
        const donor = source.find((id) => !retained.has(id));
        const receivers = targets.flatMap((target, j) => kinds[j] === 'run' && target.has(donor)
          && sources.some((other) => other !== i && intersection(state.board[other], target).length) ? [j] : []);
        if (receivers.length) found.add('linked-group-donation');
        if (retained.size === 3 && receivers.some((j) => sources.some((other) =>
          kind(state.board[other]) === 'run' && intersection(state.board[other], targets[j]).length
          && interiorExport(state.board[other], targets, kinds)))) found.add('combined-repair');
      });
    }
  }
  return CORE_PRIORITY.filter((name) => found.has(name));
}
