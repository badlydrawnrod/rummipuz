import { createPuzzleService } from '../puzzle-service.js';
import { createGameState, checkState, moveTile } from '../state.js';

export async function runWorkerLifecycleChecks() {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const workers = [];
  class FakeWorker {
    listeners = new Map();
    terminated = false;
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    removeEventListener(type) { this.listeners.delete(type); }
    postMessage(data) { this.sent = data; }
    terminate() { this.terminated = true; }
    emit(type, data) { this.listeners.get(type)?.({ data, message: 'load failed', preventDefault() {} }); }
  }
  const service = createPuzzleService({ workerFactory: () => {
    const worker = new FakeWorker(); workers.push(worker); return worker;
  } });
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  const controller = new AbortController();
  controller.abort();
  assert((await errorOf(service.generate({ seed: 'x' }, { signal: controller.signal }))).name === 'AbortError'
    && workers.length === 0, 'pre-aborted request creates no worker');
  let pending = service.generate({ seed: 'x' });
  workers.at(-1).emit('message', { ok: true, value: { puzzle: { board: [['blue-1-1']] } } });
  const result = await pending;
  assert(workers.at(-1).sent.operation === 'generate' && workers.at(-1).terminated
    && workers.at(-1).listeners.size === 0, 'successful request cleans up and terminates its worker');
  assert(Object.isFrozen(result) && Object.isFrozen(result.puzzle.board[0]), 'worker-cloned results regain deep immutability');
  const cancelled = new AbortController();
  pending = errorOf(service.solve({ inventory: [] }, { signal: cancelled.signal, maxNodes: 7 }));
  const old = workers.at(-1);
  const lateReply = old.listeners.get('message');
  cancelled.abort();
  lateReply({ data: { ok: true, value: 'late result' } });
  assert((await pending).name === 'AbortError' && old.terminated && old.listeners.size === 0,
    'abort terminates synchronous work and ignores late results');
  assert(old.sent.input.options.maxNodes === 7 && !Object.hasOwn(old.sent.input.options, 'signal'),
    'search options cross boundary without AbortSignal');
  const preferredBoard = [['blue-1-1', 'blue-2-1', 'blue-3-1']];
  const assistCancel = new AbortController();
  pending = errorOf(service.assist({ inventory: ['blue-1-1'], rack: ['blue-1-1'], board: [] }, {
    signal: assistCancel.signal, maxNodes: 17, preferredBoard,
  }));
  const assistWorker = workers.at(-1);
  assert(assistWorker.sent.operation === 'assist'
    && assistWorker.sent.input.options.maxNodes === 17
    && JSON.stringify(assistWorker.sent.input.options.preferredBoard) === JSON.stringify(preferredBoard)
    && !Object.hasOwn(assistWorker.sent.input.options, 'signal'),
  'assistance budget and preferred board cross the worker boundary');
  const staleAssistReply = assistWorker.listeners.get('message');
  assistCancel.abort();
  staleAssistReply({ data: { ok: true, value: { status: 'solved' } } });
  assert((await pending).name === 'AbortError' && assistWorker.terminated && assistWorker.listeners.size === 0,
    'cancelled assistance terminates its worker and ignores stale responses');
  pending = errorOf(service.rate({}));
  workers.at(-1).emit('message', { ok: false, error: { name: 'RangeError', message: 'invalid puzzle' } });
  const failed = await pending;
  assert(failed.name === 'RangeError' && failed.message === 'invalid puzzle' && workers.at(-1).terminated,
    'search errors propagate and clean up');
  for (const event of ['error', 'messageerror']) {
    pending = errorOf(service.generate({ seed: 'x' }));
    workers.at(-1).emit(event);
    assert((await pending) instanceof Error && workers.at(-1).terminated, `worker ${event} rejects without hanging`);
  }
  pending = errorOf(service.generate({ seed: 'x' }));
  workers.at(-1).emit('message', { ok: 'maybe' });
  assert((await pending).message.includes('Malformed'), 'malformed worker response is rejected');
  const a = errorOf(service.generate({ seed: 'a' }));
  const b = errorOf(service.generate({ seed: 'b' }));
  const pair = workers.slice(-2);
  service.dispose(); service.dispose();
  assert((await a).name === 'AbortError' && (await b).name === 'AbortError'
    && pair.every((worker) => worker.terminated), 'dispose cancels every pending request and is idempotent');
  const count = workers.length;
  assert((await errorOf(service.generate({ seed: 'x' }))).message.includes('disposed') && workers.length === count,
    'disposed service accepts no new requests');
  const broken = createPuzzleService({ workerFactory: () => { throw new Error('unsupported'); } });
  assert((await errorOf(broken.generate({ seed: 'x' }))).message === 'unsupported', 'worker construction failures reject');
  broken.dispose();
  const postFailure = createPuzzleService({ workerFactory: () => {
    const worker = new FakeWorker(); workers.push(worker);
    worker.postMessage = () => { throw new Error('clone failed'); }; return worker;
  } });
  assert((await errorOf(postFailure.generate({ seed: 'x' }))).message === 'clone failed'
    && workers.at(-1).terminated, 'postMessage failures terminate the worker');
  postFailure.dispose();
  const duringConstruction = new AbortController();
  const raced = createPuzzleService({ workerFactory: () => {
    const worker = new FakeWorker(); workers.push(worker); duringConstruction.abort(); return worker;
  } });
  assert((await errorOf(raced.generate({ seed: 'x' }, { signal: duringConstruction.signal }))).name === 'AbortError'
    && workers.at(-1).terminated && !workers.at(-1).sent, 'abort during worker creation never posts work');
  raced.dispose();
  const isolated = createPuzzleService({ workerFactory: () => { const worker = new FakeWorker(); workers.push(worker); return worker; } });
  const stop = new AbortController();
  const first = errorOf(isolated.generate({ seed: 'first' }, { signal: stop.signal }));
  const second = isolated.generate({ seed: 'second' });
  stop.abort(); workers.at(-1).emit('message', { ok: true, value: 'second' });
  assert((await first).name === 'AbortError' && await second === 'second', 'cancelling one request preserves concurrent work');
  isolated.dispose();
  return passed;
}

/** Real module-worker checks; also usable with a native-runtime worker adapter. */
export async function runWorkerChecks(sample, fixtures, workerFactory) {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const service = createPuzzleService(workerFactory ? { workerFactory } : {});
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  try {
    for (const fixture of fixtures) {
      const before = JSON.stringify(fixture);
      const result = await service.generate(fixture.identity);
      assert(JSON.stringify(result) === JSON.stringify(fixture.result) && JSON.stringify(fixture) === before,
        `worker preserves revision ${fixture.identity.generatorVersion} replay`);
    }
    const state = createGameState(sample);
    const result = await service.solve(state);
    assert(result.status === 'solved' && checkState({ ...state, rack: [], board: result.board }).won,
      'real worker returns a complete conserved solution');
    const rating = await service.rate(sample);
    assert(rating.status === 'rated' && rating.tier === 1 && rating.features.rearrangement === 1,
      'real worker proves minimum difficulty');
    assert((await service.solve(state, { maxNodes: 0 })).status === 'limit', 'worker preserves inconclusive search limit');
    assert((await errorOf(service.generate({ seed: 'bad seed' }))) instanceof Error, 'worker rejects invalid generation identity');
    assert((await errorOf(service.solve(null))) instanceof Error, 'worker rejects invalid state');
    // A main-thread timer must run while a costly revision-3 search is pending.
    let ticks = 0;
    const heartbeat = setInterval(() => { ticks += 1; }, 1);
    try {
      const long = await service.generate({ generatorVersion: 3, difficultyTier: 4, seed: 'tier-probe-0' });
      assert(long.status === 'ready' && ticks > 0, 'main-thread heartbeat continues during real search');
    } finally { clearInterval(heartbeat); }
    const controller = new AbortController();
    const pending = errorOf(service.generate({ generatorVersion: 3, difficultyTier: 4, seed: 'tier-probe-0' }, { signal: controller.signal }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    assert((await pending).name === 'AbortError', 'real search can be cancelled from the main thread');
    const after = await service.generate(fixtures.at(-1).identity);
    assert(JSON.stringify(after) === JSON.stringify(fixtures.at(-1).result), 'new preparation after cancellation succeeds');
  } finally { service.dispose(); }
  return passed;
}

/** Real module-worker regression checks for solution-free assistance requests. */
export async function runAssistanceWorkerChecks(sample, fixtures, workerFactory) {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const errorOf = (promise) => promise.then(() => null, (error) => error);
  const service = createPuzzleService(workerFactory ? { workerFactory } : {});
  // Exercise a compact representative set while retaining every available
  // revision/tier pair in the supplied replay fixture collection.
  const cases = new Map();
  const add = (puzzle) => {
    if (!puzzle || !Number.isInteger(puzzle.generatorVersion) || !Number.isInteger(puzzle.difficultyTier)) return;
    const key = `${puzzle.generatorVersion}:${puzzle.difficultyTier}`;
    if (!cases.has(key)) cases.set(key, puzzle);
  };
  add(sample);
  for (const fixture of fixtures) add(fixture.result?.puzzle);
  try {
    const completed = [];
    for (const [key, puzzle] of cases) {
      const beforePuzzle = JSON.stringify(puzzle);
      const state = createGameState(puzzle);
      const beforeState = JSON.stringify(state);
      assert(!Object.hasOwn(state, 'solution') && !Object.hasOwn(state, 'solutionBoard'),
        `revision/tier ${key} state omits stored solution metadata`);
      const result = await service.assist(state);
      assert(result.status === 'solved' && Array.isArray(result.moves) && Array.isArray(result.board),
        `revision/tier ${key} assistance returns a complete plan`);
      assert(Object.isFrozen(result) && Object.isFrozen(result.moves)
        && result.moves.every((move) => Object.isFrozen(move) && Object.isFrozen(move.destination)),
      `revision/tier ${key} worker response is deeply frozen`);
      let replay = state;
      for (const move of result.moves) replay = moveTile(replay, move.id, move.destination);
      const replayBoard = replay.board.filter((row) => row.length);
      assert(checkState(replay).won && JSON.stringify(replayBoard) === JSON.stringify(result.board),
        `revision/tier ${key} proposed moves win through the real tile mover`);
      assert(JSON.stringify(state) === beforeState && JSON.stringify(puzzle) === beforePuzzle,
        `revision/tier ${key} assistance leaves inputs unchanged`);
      completed.push({ puzzle, state, result });
    }
    assert(completed.length > 0, 'assistance receives revision/tier fixture coverage');

    const { state } = completed[0];
    const preferredBoard = completed[0].puzzle.solution?.board;
    if (preferredBoard) {
      const preferredResult = await service.assist(state, { preferredBoard });
      let preferredReplay = state;
      for (const move of preferredResult.moves) preferredReplay = moveTile(preferredReplay, move.id, move.destination);
      assert(preferredResult.status === 'solved' && checkState(preferredReplay).won
        && JSON.stringify(preferredReplay.board.filter((row) => row.length)) === JSON.stringify(preferredResult.board),
      'preferred-board assistance also returns a replayable target');
    }
    assert((await service.assist(state, { maxNodes: 0 })).status === 'limit',
      'zero assistance budget reports limit instead of unsolvable');
    const corrupted = { ...state, inventory: state.inventory.slice(1) };
    assert(await errorOf(service.assist(corrupted)) instanceof Error,
      'assistance rejects corrupted physical-tile inventory');

    let ticks = 0;
    const heartbeat = setInterval(() => { ticks += 1; }, 1);
    try {
      const pending = service.assist(completed.at(-1).state);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert(ticks > 0, 'main-thread heartbeat runs while assistance is pending in a worker');
      assert((await pending).status === 'solved', 'pending worker assistance completes successfully');
    } finally { clearInterval(heartbeat); }

    const controller = new AbortController();
    const cancellation = errorOf(service.assist(completed.at(-1).state, {
      signal: controller.signal, maxNodes: 200000,
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    assert((await cancellation).name === 'AbortError', 'real worker assistance can be cancelled');
    assert((await service.assist(state)).status === 'solved',
      'assistance succeeds after cancellation without a stale response');
  } finally { service.dispose(); }
  return passed;
}
