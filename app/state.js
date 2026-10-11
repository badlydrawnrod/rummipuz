import { classifyRow, parseTile } from './rules.js';

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
  Object.freeze(state.inventory);
  Object.freeze(state.rack);
  state.board.forEach(Object.freeze);
  Object.freeze(state.board);
  return Object.freeze(state);
}
