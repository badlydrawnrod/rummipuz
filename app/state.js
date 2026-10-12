import { classifyRow, parseTile } from './rules.js';

function freezePosition(position) {
  Object.freeze(position.rack);
  position.board.forEach(Object.freeze);
  Object.freeze(position.board);
  return Object.freeze(position);
}

function copyPosition(position) {
  return { rack: [...position.rack], board: position.board.map((row) => [...row]) };
}

function freezeState(state) {
  freezePosition(state);
  Object.freeze(state.inventory);
  Object.freeze(state.history);
  return state;
}

function assertSession(state) {
  if (!state || !state.initial || !Array.isArray(state.history)) {
    throw new Error('State requires an initial position and undo history.');
  }
}

function assertConserved(state) {
  const result = checkState(state);
  if (!result.conserved) throw new Error(result.errors.join(' '));
}

/**
 * Move one physical tile to a pre-move insertion gap. Destinations are
 * { area: 'rack', index }, { area: 'board', row, index }, or
 * { area: 'new-row' }. Indices run from zero through the target's length.
 * Same-location gaps immediately before/after the tile are no-ops. Empty
 * source rows remain as placeholders, keeping row indices stable.
 */
export function moveTile(state, id, destination) {
  assertSession(state);
  assertConserved(state);
  const source = getTileLocations(state).get(id)?.[0];
  if (!source) throw new Error('Move requires an existing physical tile.');
  if (!destination || !['rack', 'board', 'new-row'].includes(destination.area)) {
    throw new Error('Move requires a rack, board, or new-row destination.');
  }
  let target;
  if (destination.area === 'rack') target = state.rack;
  if (destination.area === 'board') {
    if (!Number.isInteger(destination.row) || destination.row < 0 || destination.row >= state.board.length) {
      throw new Error('Destination row is out of range.');
    }
    target = state.board[destination.row];
  }
  if (target && (!Number.isInteger(destination.index) || destination.index < 0 || destination.index > target.length)) {
    throw new Error('Destination insertion index is out of range.');
  }
  const sameLocation = source.area === destination.area
    && (source.area === 'rack' || source.row === destination.row);
  if (sameLocation && (destination.index === source.index || destination.index === source.index + 1)) return state;

  const position = copyPosition(state);
  const origin = source.area === 'rack' ? position.rack : position.board[source.row];
  origin.splice(source.index, 1);
  if (destination.area === 'new-row') {
    position.board.push([id]);
  } else {
    const row = destination.area === 'rack' ? position.rack : position.board[destination.row];
    const index = destination.index - (sameLocation && source.index < destination.index ? 1 : 0);
    row.splice(index, 0, id);
  }
  const next = { ...state, ...position,
    history: [...state.history, freezePosition(copyPosition(state))] };
  assertConserved(next);
  return freezeState(next);
}

/**
 * Move one complete nonempty board row to a pre-removal insertion gap. Gaps
 * run from zero through board.length. The rack, initial position, inventory,
 * and tile order within every row are preserved exactly.
 */
export function reorderRow(state, sourceRow, insertionIndex) {
  assertSession(state);
  assertConserved(state);
  if (!Number.isInteger(sourceRow) || sourceRow < 0 || sourceRow >= state.board.length
      || state.board[sourceRow].length === 0) {
    throw new Error('Row reorder requires an existing nonempty source row.');
  }
  if (!Number.isInteger(insertionIndex) || insertionIndex < 0 || insertionIndex > state.board.length) {
    throw new Error('Row insertion gap is out of range.');
  }
  if (insertionIndex === sourceRow || insertionIndex === sourceRow + 1) return state;

  const position = copyPosition(state);
  const [row] = position.board.splice(sourceRow, 1);
  const target = insertionIndex - (sourceRow < insertionIndex ? 1 : 0);
  position.board.splice(target, 0, row);
  const next = { ...state, ...position,
    history: [...state.history, freezePosition(copyPosition(state))] };
  assertConserved(next);
  return freezeState(next);
}

/** Restore the preceding position, including empty rows and exact ordering. */
export function undoMove(state) {
  assertSession(state);
  assertConserved(state);
  if (state.history.length === 0) return state;
  const next = { ...state, ...copyPosition(state.history.at(-1)), history: state.history.slice(0, -1) };
  assertConserved(next);
  return freezeState(next);
}

/** Restore the trusted starting layout and clear history, also for recovery. */
export function resetGame(state) {
  assertSession(state);
  const next = { ...state, ...copyPosition(state.initial), history: [] };
  assertConserved(next);
  return freezeState(next);
}

function assertLocations(state) {
  if (!state || !Array.isArray(state.inventory) || !Array.isArray(state.rack)
      || !Array.isArray(state.board) || Array.from(state.board).some((row) => !Array.isArray(row))) {
    throw new Error('State requires inventory, rack, and board-row arrays.');
  }
}

/** Map each physical ID to all occurrences, retaining evidence of duplication. */
export function getTileLocations(state) {
  assertLocations(state);
  const locations = new Map();
  const add = (id, location) => {
    if (!locations.has(id)) locations.set(id, []);
    locations.get(id).push(location);
  };
  Array.from(state.rack).forEach((id, index) => add(id, { area: 'rack', index }));
  state.board.forEach((row, rowIndex) => {
    Array.from(row).forEach((id, index) => add(id, { area: 'board', row: rowIndex, index }));
  });
  return locations;
}

/** Check a live position against its trusted original inventory; never mutate it. */
export function checkState(state) {
  try {
    assertLocations(state);
  } catch (error) {
    return { won: false, conserved: false, remainingRack: null, invalidRows: [], errors: [error.message] };
  }
  const errors = [];
  const inventory = new Set(state.inventory);
  if (state.inventory.length === 0 || inventory.size !== state.inventory.length
      || Array.from(state.inventory).some((id) => !parseTile(id))) {
    errors.push('Original inventory must contain unique canonical tile IDs and be nonempty.');
  }
  const locations = getTileLocations(state);
  for (const [id, occurrences] of locations) {
    if (!parseTile(id)) errors.push(`Invalid tile identity: ${String(id)}.`);
    if (!inventory.has(id)) errors.push(`Unexpected tile: ${String(id)}.`);
    if (occurrences.length !== 1) errors.push(`Repeated physical tile: ${String(id)}.`);
  }
  for (const id of inventory) {
    if (!locations.has(id)) errors.push(`Missing tile: ${String(id)}.`);
  }
  const invalidRows = state.board.flatMap((row, index) => {
    const result = classifyRow(row);
    return result.valid ? [] : [{ row: index, reason: result.reason }];
  });
  const conserved = errors.length === 0;
  return {
    won: conserved && state.rack.length === 0 && invalidRows.length === 0,
    conserved,
    remainingRack: state.rack.length,
    invalidRows,
    errors,
  };
}

/**
 * Validate a starting puzzle and return a detached, immutable initial state.
 * No DOM, storage, randomness, or solver dependency. Without supplied solution
 * metadata, solvability is the generator/solver's responsibility.
 */
export function createGameState(puzzle) {
  if (!puzzle || puzzle.version !== 1
      || !Number.isSafeInteger(puzzle.generatorVersion) || puzzle.generatorVersion < 1
      || !Number.isInteger(puzzle.difficultyTier) || puzzle.difficultyTier < 1 || puzzle.difficultyTier > 4
      || typeof puzzle.seed !== 'string' || puzzle.seed.length < 1 || puzzle.seed.length > 64
      || /[^A-Za-z0-9_-]/.test(puzzle.seed)) {
    throw new Error('Unsupported or malformed puzzle metadata.');
  }
  if (!Array.isArray(puzzle.rack) || puzzle.rack.length === 0
      || !Array.isArray(puzzle.board) || puzzle.board.length === 0
      || Array.from(puzzle.board).some((row) => !Array.isArray(row) || row.length === 0)) {
    throw new Error('Starting puzzle requires a nonempty rack and nonempty board rows.');
  }
  const state = {
    version: puzzle.version,
    generatorVersion: puzzle.generatorVersion,
    difficultyTier: puzzle.difficultyTier,
    seed: puzzle.seed,
    inventory: [...puzzle.rack, ...puzzle.board.flat()],
    rack: [...puzzle.rack],
    board: puzzle.board.map((row) => [...row]),
  };
  const initial = checkState(state);
  if (!initial.conserved || initial.invalidRows.length) {
    throw new Error([...initial.errors, ...initial.invalidRows.map(({ row, reason }) => `Row ${row + 1}: ${reason}`)].join(' '));
  }
  if (Object.hasOwn(puzzle, 'solution')) {
    const solution = puzzle.solution;
    if (!solution || !Array.isArray(solution.board) || solution.board.length === 0
        || Array.from(solution.board).some((row) => !Array.isArray(row) || row.length === 0)
        || (Object.hasOwn(solution, 'note') && typeof solution.note !== 'string')
        || !checkState({ inventory: state.inventory, rack: [], board: solution.board }).won) {
      throw new Error('Supplied solution must contain every puzzle tile exactly once in valid rows.');
    }
  }
  state.initial = freezePosition(copyPosition(state));
  state.history = [];
  return freezeState(state);
}
