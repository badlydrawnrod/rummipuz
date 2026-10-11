import { createPuzzleFlow, parseReplayCode, nextDifficulty } from '../puzzle-flow.js';
import { createProgressStore, puzzleIdentity } from '../progress.js';
import { createGameState, moveTile } from '../state.js';

export async function runPuzzleFlowChecks(sample) {
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  const initial = createGameState(sample);
  const store = () => createProgressStore({ getStorage: () => ({ getItem: () => null, setItem() {} }) });
  const solved = (state) => {
    state = moveTile(state, 'blue-6-1', { area: 'new-row' });
    state = moveTile(state, 'red-6-1', { area: 'board', row: 2, index: 1 });
    return moveTile(state, 'black-6-1', { area: 'board', row: 2, index: 2 });
  };
  assert(parseReplayCode(`  ${puzzleIdentity(sample)}  `).seed === sample.seed, 'Replay trims surrounding whitespace');
  assert(parseReplayCode('rummipuz:1:4:3:Ab_C-9').seed === 'Ab_C-9', 'Replay preserves seed case and contents');
  for (const code of ['seed', 'rummipuz:2:4:1:a', 'rummipuz:1:4:5:a', 'rummipuz:1:04:1:a',
    'rummipuz:1:4:1:bad seed', `rummipuz:1:4:1:${'a'.repeat(65)}`, 'rummipuz:1:9007199254740992:1:a']) {
    let rejected = false; try { parseReplayCode(code); } catch { rejected = true; }
    assert(rejected, `Invalid replay rejected: ${code.slice(0, 45)}`);
  }
  for (let tier = 1; tier <= 4; tier += 1) {
    assert(nextDifficulty({ chosenDifficultyTier: tier, credits: [2, 2, 2, 2] }) === tier, `Two credits stay at tier ${tier}`);
    assert(nextDifficulty({ chosenDifficultyTier: tier, credits: [3, 3, 3, 3] }) === Math.min(4, tier + 1), `Three credits propose one tier from ${tier}`);
  }
  const progress = store();
  for (let i = 0; i < 3; i += 1) {
    progress.saveSession({ state: solved(createGameState({ ...sample, seed: `credit-${i}` })), completed: true });
  }
  let calls = [];
  let mode = 'ready';
  let resolveLate;
  const service = { generate: async (identity, { signal }) => {
    calls.push({ identity, signal });
    if (mode === 'failed') throw new Error('Worker failed');
    if (mode === 'exhausted') return { status: 'exhausted', puzzle: null };
    if (mode === 'late') return new Promise((resolve) => { resolveLate = resolve; });
    return { status: identity.generatorVersion === 2 ? 'candidate' : 'ready', puzzle: { ...sample, ...identity } };
  } };
  let seed = 0;
  const flow = createPuzzleFlow({ service, progress, loadSample: async () => sample, newSeed: () => `fresh-${seed++}` });
  const before = JSON.stringify(progress.snapshot());
  let ready = await flow.prepare({ kind: 'next' });
  assert(ready.chosenTier === 2 && ready.state.difficultyTier === 2, 'Next uses chosen-tier credit to propose Medium');
  assert(JSON.stringify(progress.snapshot()) === before, 'Preparation alone never replaces progress or commits promotion');
  ready = await flow.prepare({ kind: 'start', tier: 1 });
  assert(ready.chosenTier === 1, 'Manual Easy overrides its earned promotion');
  ready = await flow.prepare({ kind: 'start', tier: 4 });
  assert(ready.state.difficultyTier === 4, 'Expert is immediately selectable');
  progress.setChosenDifficulty(4);
  ready = await flow.prepare({ kind: 'next' });
  assert(ready.chosenTier === 4, 'Expert Next continues indefinitely');
  for (const revision of [2, 3, 4, 5]) {
    ready = await flow.prepare({ kind: 'replay', code: `rummipuz:1:${revision}:1:Case_Sensitive` });
    assert(ready.chosenTier === null && ready.state.generatorVersion === revision && ready.state.seed === 'Case_Sensitive', `Replay preserves revision ${revision} without changing chosen tier`);
  }
  const count = calls.length;
  ready = await flow.prepare({ kind: 'replay', code: puzzleIdentity(progress.snapshot().active.state) });
  assert(calls.length === count && ready.state.history.length === 0 && ready.state.rack.length === sample.rack.length,
    'Matching stored puzzle replays its immutable starting layout');
  ready = await flow.prepare({ kind: 'replay', code: puzzleIdentity(sample) });
  assert(ready.state.seed === sample.seed && calls.length === count, 'Revision-1 sample loads directly');
  assert((await errorOf(flow.prepare({ kind: 'replay', code: 'rummipuz:1:1:1:missing' }))).message.includes('unavailable'), 'Unknown revision-1 identity is unavailable');
  assert((await errorOf(flow.prepare({ kind: 'replay', code: 'rummipuz:1:99:1:missing' }))).message.includes('unavailable'), 'Unsupported revision reports unavailable');
  const unchanged = JSON.stringify(progress.snapshot());
  for (const failure of ['failed', 'exhausted']) {
    mode = failure;
    assert(await errorOf(flow.prepare({ kind: 'next' })) instanceof Error, `${failure} preparation reports an error`);
    assert(JSON.stringify(progress.snapshot()) === unchanged, `${failure} preserves session, history, credits and chosen tier`);
  }
  mode = 'late';
  const late = errorOf(flow.prepare({ kind: 'next' }));
  const oldCall = calls.at(-1);
  flow.cancel();
  assert(oldCall.signal.aborted, 'Cancel aborts worker preparation');
  resolveLate({ status: 'ready', puzzle: { ...sample, ...oldCall.identity } });
  assert((await late).name === 'AbortError' && JSON.stringify(progress.snapshot()) === unchanged, 'Late result after cancel cannot replace the session');
  const superseded = errorOf(flow.prepare({ kind: 'next' }));
  const oldResolve = resolveLate;
  const supersededCall = calls.at(-1);
  mode = 'ready';
  ready = await flow.prepare({ kind: 'start', tier: 3 });
  oldResolve({ status: 'ready', puzzle: { ...sample, ...supersededCall.identity } });
  assert((await superseded).name === 'AbortError' && ready.chosenTier === 3, 'A newer request excludes a stale response');
  assert(new Set(calls.filter(({ identity }) => identity.seed.startsWith('fresh-')).map(({ identity }) => identity.seed)).size === calls.filter(({ identity }) => identity.seed.startsWith('fresh-')).length, 'Fresh starts and retries use distinct seeds');
  let releaseSample;
  const slow = createPuzzleFlow({ service, progress: store(), loadSample: () => new Promise((resolve) => { releaseSample = resolve; }) });
  const fixturePending = errorOf(slow.prepare({ kind: 'replay', code: puzzleIdentity(sample) }));
  slow.cancel(); releaseSample(sample);
  assert((await fixturePending).name === 'AbortError', 'Cancelled fixture fetch cannot open a puzzle');
  const repeating = createPuzzleFlow({ service, progress, loadSample: async () => sample, newSeed: () => 'repeat' });
  await repeating.prepare({ kind: 'next' });
  assert((await errorOf(repeating.prepare({ kind: 'next' }))).message.includes('fresh seed'), 'Repeated seed source fails explicitly rather than reusing a puzzle');
  return passed;
}

// Verify the preparation controller with the actual worker module, including
// rated publication at every tier and exact supported replay revisions.
export async function runPuzzleFlowWorkerChecks(sample, workerFactory) {
  const { createPuzzleService } = await import('../puzzle-service.js');
  const { ratePuzzle } = await import('../difficulty.js');
  const passed = [];
  const assert = (ok, name) => { if (!ok) throw new Error(`Failed: ${name}`); passed.push(name); };
  const progress = createProgressStore({ getStorage: () => ({ getItem: () => null, setItem() {} }) });
  const service = createPuzzleService(workerFactory ? { workerFactory } : {});
  let seed = 0;
  const flow = createPuzzleFlow({ service, progress, loadSample: async () => sample, newSeed: () => `play-flow-${seed++}` });
  try {
    for (let tier = 1; tier <= 4; tier += 1) {
      const ready = await flow.prepare({ kind: 'start', tier });
      const puzzle = { ...ready.state.initial, version: ready.state.version, generatorVersion: ready.state.generatorVersion,
        seed: ready.state.seed, difficultyTier: ready.state.difficultyTier };
      assert(ready.chosenTier === tier && ratePuzzle(puzzle).tier === tier, `Worker publishes a proven tier-${tier} play session`);
      progress.saveSession({ state: ready.state, completed: false });
      progress.setChosenDifficulty(tier);
      const next = await flow.prepare({ kind: 'next' });
      assert(next.chosenTier === tier && puzzleIdentity(next.state) !== puzzleIdentity(ready.state), `Tier-${tier} Next produces a fresh puzzle`);
      const replay = await flow.prepare({ kind: 'replay', code: puzzleIdentity(next.state) });
      assert(JSON.stringify(replay.state) === JSON.stringify(next.state) && replay.chosenTier === null,
        `Tier-${tier} replay reproduces the exact generated puzzle`);
    }
    for (const revision of [2, 3, 5]) {
      const replay = await flow.prepare({ kind: 'replay', code: `rummipuz:1:${revision}:1:replay-flow` });
      assert(replay.state.generatorVersion === revision && replay.chosenTier === null,
        `Playable replay supports generator revision ${revision}`);
    }
    assert(progress.snapshot().chosenDifficultyTier === 4, 'Real-worker replay keeps the chosen future tier');
    const before = JSON.stringify(progress.snapshot());
    const pending = flow.prepare({ kind: 'next' }).then(() => null, (error) => error);
    flow.cancel();
    assert((await pending).name === 'AbortError' && JSON.stringify(progress.snapshot()) === before,
      'Real-worker cancellation preserves saved play and chosen tier');
  } finally { flow.cancel(); service.dispose(); }
  return passed;
}
