import { generatePuzzle, RATED_GENERATOR_VERSION } from '../rated-generator.js';
import { ratePuzzle } from '../difficulty.js';
import { rateStructuralPuzzle, solutionStructure } from '../structural-difficulty.js';
import { createGameState, checkState } from '../state.js';
import { createPuzzleService } from '../puzzle-service.js';

export function runStructuralChecks(designs, fixtures) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const throws = (fn) => { try { fn(); return false; } catch { return true; } };
  assert(RATED_GENERATOR_VERSION === 5, 'Approved revision 5 is the default');
  for (let tier = 1; tier <= 4; tier += 1) {
    const identity = { difficultyTier: tier, seed: 'default-v5' };
    assert(JSON.stringify(generatePuzzle(identity)) === JSON.stringify(generatePuzzle({ ...identity, generatorVersion: 5 })),
      `Omitted revision uses exact revision-5 output at tier ${tier}`);
  }
  for (const design of designs) {
    const puzzle = { version: 1, generatorVersion: 5, seed: design.name,
      difficultyTier: design.difficultyTier, board: design.board, rack: design.rack,
      solution: { board: design.solution } };
    const before = JSON.stringify(puzzle);
    const result = rateStructuralPuzzle(puzzle);
    const state = createGameState(puzzle);
    const accepted = design.expectedAccepted !== false;
    assert(JSON.stringify(puzzle) === before, `${design.name}: structural proofs never mutate input`);
    assert(result.status === (accepted ? 'rated' : 'excluded'), `${design.name}: agrees with independent physical oracle acceptance`);
    assert(ratePuzzle(puzzle).tier === design.difficultyTier, `${design.name}: retains exact minimum-R tier`);
    if (accepted) {
      assert(checkState({ ...state, rack: [], board: result.board }).won, `${design.name}: complete conserved witness`);
      const { structure } = result.features;
      if (result.tier === 1) {
        assert(structure.witness.changedRows.length === 1 && structure.witness.nonEndpointRows.length === 0,
          `${design.name}: Easy uses an endpoint-only witness`);
      } else {
        assert(structure.partitions === design.expectedPartitions,
          `${design.name}: exhaustive physical partition count agrees with Python oracle`);
        assert(structure.witness.components.some((c) => c.rows.length >= result.tier && c.nonEndpointRows.length >= result.tier - 1),
          `${design.name}: thresholds hold in the same component`);
      }
      assert(rateStructuralPuzzle(puzzle, { maxNodes: result.nodes - 1 }).status === 'limit',
        `${design.name}: incomplete proof never awards a tier`);
    } else {
      assert(result.tier === null && result.board === null && checkState({ ...state, rack: [], board: result.counterexample }).won,
        `${design.name}: reports a valid easier counterexample without publishing`);
      const features = solutionStructure(state, result.counterexample);
      assert(features.components.every((c) => c.rows.length < 2), `${design.name}: catches disconnected shortcut`);
    }
    const base = ratePuzzle(puzzle);
    assert(rateStructuralPuzzle(puzzle, { maxNodes: base.nodes }).status === 'limit',
      `${design.name}: row proof and structural expansion share one budget`);
  }
  const easy = designs.find((d) => d.difficultyTier === 1);
  const puzzle = { version: 1, generatorVersion: 5, seed: 'limits', difficultyTier: 1, board: easy.board, rack: easy.rack };
  for (const budget of [-1, 0.5, NaN, '10']) {
    assert(throws(() => rateStructuralPuzzle(puzzle, { maxNodes: budget })), `Reject malformed structural budget ${String(budget)}`);
  }
  assert(rateStructuralPuzzle(puzzle, { maxNodes: 0 }).status === 'limit', 'Zero structural budget is inconclusive');
  assert(rateStructuralPuzzle(puzzle, { maxNodes: Infinity }).status === 'rated', 'Unbounded proof still accepts the introductory witness');
  assert(throws(() => solutionStructure(createGameState(puzzle), [easy.solution[0]])), 'Partial or unconserved structures are rejected');
  const unique = designs.find((d) => d.name === 'medium-interior-splits');
  const state = createGameState({ ...puzzle, board: unique.board, rack: unique.rack, difficultyTier: 2 });
  const reversed = unique.solution.map((row) => row[0].split('-')[0] === row[1].split('-')[0] ? row : [...row].reverse()).reverse();
  assert(JSON.stringify(solutionStructure(state, unique.solution)) === JSON.stringify(solutionStructure(state, reversed)),
    'Final row order and group colour order cannot alter structural features');
  for (const fixture of fixtures) {
    const label = `${fixture.identity.difficultyTier}/${fixture.identity.seed}`;
    const actual = generatePuzzle(fixture.identity);
    assert(JSON.stringify(actual) === JSON.stringify(fixture.result), `Revision-5 golden replay ${label}`);
    assert(JSON.stringify(generatePuzzle(fixture.identity)) === JSON.stringify(actual), `Revision-5 repeat determinism ${label}`);
    assert(Object.isFrozen(actual) && Object.isFrozen(actual.puzzle.rating.structure.witness.components[0].rows)
      && Object.isFrozen(actual.puzzle.solution.board[0]), `Revision-5 proof metadata and tiles are deeply immutable ${label}`);
  }
  for (const identity of [{ seed: 'bad seed' }, { seed: 'x', version: 2 }, { seed: 'x', difficultyTier: 0 },
    { seed: 'x', difficultyTier: 5 }, { seed: '' }]) {
    assert(throws(() => generatePuzzle({ generatorVersion: 5, ...identity })), 'Revision 5 rejects malformed identities');
  }
  return passed;
}

export async function runStructuralWorkerChecks(fixtures, workerFactory) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const service = createPuzzleService(workerFactory ? { workerFactory } : {});
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  try {
    for (const fixture of fixtures.filter((f) => f.identity.seed === 'review-b')) {
      const result = await service.generate(fixture.identity);
      assert(JSON.stringify(result) === JSON.stringify(fixture.result), `Actual worker preserves revision-5 tier-${fixture.identity.difficultyTier} replay`);
      const rated = await service.rate(result.puzzle);
      assert(rated.status === 'rated' && rated.features.structure && rated.tier === fixture.identity.difficultyTier,
        `Worker rate dispatch applies revision-5 structural gate at tier ${fixture.identity.difficultyTier}`);
    }
    const fixture = fixtures.at(-1);
    assert((await service.rate(fixture.result.puzzle, { maxNodes: 0 })).status === 'limit', 'Worker never publishes an inconclusive structural proof');
    const controller = new AbortController();
    const cancelled = errorOf(service.generate(fixture.identity, { signal: controller.signal }));
    controller.abort();
    assert((await cancelled).name === 'AbortError', 'Revision-5 generation cancels through dedicated-worker termination');
    assert(JSON.stringify(await service.generate(fixture.identity)) === JSON.stringify(fixture.result), 'Revision-5 retry after cancellation preserves deterministic replay');
  } finally { service.dispose(); }
  return passed;
}
