import { generatePuzzle, RATED_GENERATOR_VERSION } from '../rated-generator.js';
import { rateVarietyPuzzle } from '../difficulty-v6.js';
import { createGameState, checkState, moveTile, undoMove } from '../state.js';
import { createPuzzleService } from '../puzzle-service.js';
import { createPuzzleFlow } from '../puzzle-flow.js';
import { createProgressStore, puzzleIdentity } from '../progress.js';
import { semanticKeys } from '../signatures-v6.js';

export function runVarietyChecks(designs, fixtures) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  assert(RATED_GENERATOR_VERSION === 5, 'Revision 6 leaves the approved default at revision 5');
  for (const { design: p, expected: e } of designs) {
    const puzzle = { version: 1, generatorVersion: 6, seed: p.name, difficultyTier: p.difficultyTier, board: p.board, rack: p.rack };
    const before = JSON.stringify(puzzle), result = rateVarietyPuzzle(puzzle);
    const accepted = e.status === 'accepted';
    assert(JSON.stringify(puzzle) === before, `${p.name}: proofs do not mutate input`);
    if (accepted) {
      assert(result.status === 'rated' && result.tier === p.difficultyTier && result.features.family.primary === e.family,
        `${p.name}: independently proved tier and primary family`);
      assert(result.features.rearrangement === e.minimumR && result.features.structure.partitions === e.physicalPartitions
        && result.features.structure.minimumPartitions === e.minimumPhysicalPartitions,
        `${p.name}: exhaustive minimum-R and physical counts agree with oracle`);
      assert(same([...result.features.family.common].sort(), e.commonPredicates)
        && same([...result.features.family.optional].sort(), e.optionalPredicates)
        && same([...result.features.family.eligibleWitnessKinds].sort(), e.easyWitnessKinds),
        `${p.name}: universal common, optional and existential Easy mechanisms agree`);
      assert(result.features.signatures.geometry === e.geometryKey, `${p.name}: literal 48-transform geometry agrees`);
      assert(checkState({ ...createGameState(puzzle), rack: [], board: result.board }).won, `${p.name}: conserved valid witness`);
      if (e.minimumOriginKeys) {
        assert(result.features.signatures.status === 'complete'
          && same(result.features.signatures.minimumSolutions.map((x) => x.origin), e.minimumOriginKeys)
          && same(result.features.signatures.minimumSolutions.map((x) => x.profile), e.minimumMechanismProfiles),
          `${p.name}: origin-aware keys and graph profiles agree with independent oracle`);
      }
      assert(rateVarietyPuzzle(puzzle, { maxNodes: result.nodes - 1 }).status === 'limit',
        `${p.name}: incomplete shared proof budget cannot publish`);
    } else {
      assert(result.status !== 'rated' || result.tier !== p.difficultyTier, `${p.name}: rejected design cannot publish at its claimed tier`);
      if (result.counterexample) assert(checkState({ ...createGameState(puzzle), rack: [], board: result.counterexample }).won,
        `${p.name}: structural rejection provides a conserved counterexample`);
    }
  }
  const tied = createGameState({ version: 1, generatorVersion: 6, difficultyTier: 1, seed: 'tied',
    board: [1, 2].map((copy) => [1, 2, 3].map((v) => `blue-${v}-${copy}`)), rack: ['blue-4-1', 'blue-5-1'] });
  const preserved = [tied.board[0].concat(tied.rack), tied.board[1]];
  const reversed = { ...tied, board: [...tied.board].reverse() };
  assert(semanticKeys(tied, preserved).origin === semanticKeys(reversed, preserved).origin,
    'Tied identical sources enumerate canonical origin assignments');
  const mixed = [['blue-1-1', 'blue-2-2', 'blue-3-1', ...tied.rack], ['blue-1-2', 'blue-2-1', 'blue-3-2']];
  assert(semanticKeys(tied, preserved).origin !== semanticKeys(tied, mixed).origin, 'Equal faces retain distinct source provenance');
  for (const fixture of fixtures) {
    const result = generatePuzzle(fixture.identity);
    const label = `${fixture.identity.difficultyTier}/${fixture.identity.seed}`;
    assert(same(result, fixture.result) && same(generatePuzzle(fixture.identity), result), `Revision-6 golden deterministic replay ${label}`);
    assert(Object.isFrozen(result.puzzle.rating.family.common) && Object.isFrozen(result.puzzle.solution.board[0]),
      `Revision-6 results are deeply immutable ${label}`);
    assert(result.puzzle.rating.family.primary && result.attempts <= 32, `Revision-6 published candidate has certification ${label}`);
  }
  const p = fixtures[0].result.puzzle;
  for (const maxNodes of [-1, 0.5, NaN, null, '10']) {
    let threw = false; try { rateVarietyPuzzle(p, { maxNodes }); } catch { threw = true; }
    assert(threw, `Revision-6 rejects malformed budget ${String(maxNodes)}`);
  }
  assert(rateVarietyPuzzle(p, { maxNodes: 0 }).status === 'limit', 'Revision-6 zero budget never publishes');
  for (const changes of [{ seed: '' }, { seed: 'bad seed' }, { seed: 'x'.repeat(65) }, { difficultyTier: 0 }, { difficultyTier: 5 }, { version: 2 }]) {
    let threw = false; try { generatePuzzle({ ...fixtures[0].identity, ...changes }); } catch { threw = true; }
    assert(threw, 'Revision-6 rejects malformed generation identity');
  }
  return passed;
}

export async function runVarietyWorkerChecks(fixtures, workerFactory) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const service = createPuzzleService(workerFactory ? { workerFactory } : {});
  const storage = { raw: null, getItem() { return this.raw; }, setItem(key, value) { this.raw = value; } };
  const progress = createProgressStore({ getStorage: () => storage });
  const flow = createPuzzleFlow({ service, progress });
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  try {
    for (const fixture of fixtures.filter((f) => f.identity.seed === 'runtime-v6-0')) {
      const result = await service.generate(fixture.identity);
      assert(same(result, fixture.result), `Worker revision-6 golden tier ${fixture.identity.difficultyTier}`);
      const rating = await service.rate(result.puzzle);
      assert(rating.status === 'rated' && rating.features.family.primary === result.puzzle.rating.family.primary,
        `Worker revision-6 rating dispatch tier ${fixture.identity.difficultyTier}`);
      const prepared = await flow.prepare({ kind: 'replay', code: puzzleIdentity(result.puzzle) });
      assert(prepared.chosenTier === null && same(prepared.state.initial, createGameState(result.puzzle).initial),
        `Revision-6 replay flow retains explicit revision at tier ${fixture.identity.difficultyTier}`);
      const moved = moveTile(prepared.state, prepared.state.rack[0], { area: 'new-row' });
      progress.saveSession({ state: moved, completed: false });
      const restored = createProgressStore({ getStorage: () => storage }).snapshot().active.state;
      assert(same(restored, moved) && same(undoMove(restored).initial, prepared.state.initial),
        `Revision-6 exact save/reload with undo tier ${fixture.identity.difficultyTier}`);
    }
    const fixture = fixtures.at(-1), before = JSON.stringify(progress.snapshot());
    const pending = errorOf(flow.prepare({ kind: 'replay', code: puzzleIdentity(fixture.result.puzzle) }));
    flow.cancel();
    assert((await pending).name === 'AbortError' && JSON.stringify(progress.snapshot()) === before,
      'Cancelled revision-6 replay retains active play and chosen difficulty');
    assert((await service.rate(fixture.result.puzzle, { maxNodes: 0 })).status === 'limit', 'Worker revision-6 limit does not publish');
    const prepared = await flow.prepare({ kind: 'replay', code: puzzleIdentity(fixture.result.puzzle) });
    assert(prepared.state.generatorVersion === 6 && JSON.stringify(progress.snapshot()) === before,
      'Revision-6 retry is deterministic and preparation does not commit replacement');
    const failed = createPuzzleFlow({ progress, service: { generate: async () => { throw Error('worker failed'); } } });
    assert(await errorOf(failed.prepare({ kind: 'replay', code: puzzleIdentity(fixture.result.puzzle) })) instanceof Error
      && JSON.stringify(progress.snapshot()) === before, 'Revision-6 worker failure preserves active play');
    const exhausted = createPuzzleFlow({ progress, service: { generate: async () => ({ status: 'exhausted', puzzle: null }) } });
    assert(await errorOf(exhausted.prepare({ kind: 'replay', code: puzzleIdentity(fixture.result.puzzle) })) instanceof Error
      && JSON.stringify(progress.snapshot()) === before, 'Revision-6 exhausted proof preserves active play');
  } finally { flow.cancel(); service.dispose(); }
  return passed;
}
