import { createProgressStore, PROGRESS_KEY, puzzleIdentity } from '../progress.js';
import { createPlaySession } from '../play-session.js';
import { createGameState } from '../state.js';

export function runProgressChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const rejects = (action) => { try { action(); return false; } catch { return true; } };
  function memoryStorage(raw = null) {
    return { raw, writes: 0, getItem(key) {
      if (key !== PROGRESS_KEY) throw new Error('Wrong key');
      return this.raw;
    }, setItem(key, value) {
      if (key !== PROGRESS_KEY) throw new Error('Wrong key');
      this.raw = value; this.writes++;
    } };
  }
  const storage = memoryStorage();
  const notices = [];
  const store = createProgressStore({ getStorage: () => storage, onNotice: (text) => notices.push(text) });
  const initial = createGameState(sample);
  assert(store.snapshot().chosenDifficultyTier === 1 && store.snapshot().active === null,
    'New device defaults to Easy without a saved session');
  store.setChosenDifficulty(3);
  assert(createProgressStore({ getStorage: () => storage }).snapshot().chosenDifficultyTier === 3,
    'Chosen difficulty survives a reload');
  assert(rejects(() => store.setChosenDifficulty(0)) && rejects(() => store.setChosenDifficulty('2')),
    'Invalid difficulty choices are rejected');
  const session = createPlaySession(initial, { onChange: (snapshot) => store.saveSession(snapshot) });
  store.saveSession(session.snapshot());
  const beforeTransient = storage.raw;
  session.select('blue-6-1'); session.beginDrag('blue-6-1'); session.cancel();
  assert(storage.raw === beforeTransient, 'Selection and unfinished dragging do not change the save');
  session.select('blue-6-1'); session.place({ area: 'board', row: 0, index: 6 });
  assert(storage.raw === beforeTransient, 'A no-op placement does not rewrite storage');
  session.select('blue-6-1'); session.place({ area: 'new-row' });
  let reloaded = createProgressStore({ getStorage: () => storage });
  let restored = reloaded.snapshot().active;
  assert(JSON.stringify(restored.state) === JSON.stringify(session.snapshot().state),
    'Move reload restores exact physical identities, row order and history');
  assert(Object.isFrozen(restored.state) && Object.isFrozen(restored.state.history[0].board[0]),
    'Restored position and undo snapshots are deeply immutable');
  const resumed = createPlaySession(restored.state, { completed: restored.completed,
    onChange: (snapshot) => reloaded.saveSession(snapshot) });
  assert(resumed.snapshot().selected === null && resumed.snapshot().dragging === null,
    'Resume clears transient selection and dragging');
  resumed.undo();
  assert(JSON.stringify(createProgressStore({ getStorage: () => storage }).snapshot().active.state)
    === JSON.stringify(initial), 'Undo after reload restores and saves the exact starting state');
  session.select('red-6-1'); session.place({ area: 'board', row: 2, index: 1 });
  session.select('black-6-1'); session.place({ area: 'board', row: 2, index: 2 });
  assert(store.snapshot().completedIdentities.length === 0 && !store.snapshot().active.completed,
    'An empty rack with valid rows earns no completion before explicit Check');
  session.check();
  assert(store.snapshot().completedIdentities.join() === puzzleIdentity(initial),
    'First Check records the full puzzle identity for duplicate protection');
  const completedSave = storage.raw;
  session.check();
  assert(storage.raw === completedSave, 'Repeated Check does not rewrite or recount completion');
  restored = createProgressStore({ getStorage: () => storage }).snapshot().active;
  const completed = createPlaySession(restored.state, { completed: restored.completed,
    onChange: (snapshot) => store.saveSession(snapshot) });
  assert(completed.snapshot().completed && !completed.select('blue-6-1'),
    'Reloading a completed puzzle restores locked editing');
  completed.reset();
  assert(store.snapshot().active.state.history.length === 0 && !store.snapshot().active.completed
    && store.snapshot().completedIdentities.length === 1,
  'Replay saves the initial layout and preserves its recorded identity');
  function solve(play) {
    play.select('blue-6-1'); play.place({ area: 'new-row' });
    play.select('red-6-1'); play.place({ area: 'board', row: 2, index: 1 });
    play.select('black-6-1'); play.place({ area: 'board', row: 2, index: 2 });
    play.check();
  }
  solve(completed);
  assert(store.snapshot().completedIdentities.length === 1,
    'Completing a replay does not duplicate its recorded identity');
  for (let index = 0; index < 4; index++) {
    const next = createPlaySession(createGameState({ ...sample, seed: `progress-${index}` }),
      { onChange: (snapshot) => store.saveSession(snapshot) });
    store.saveSession(next.snapshot()); solve(next);
  }
  assert(store.snapshot().completedIdentities.length === 5,
    'All distinct completion identities are retained without a credit cap');
  assert(store.snapshot().chosenDifficultyTier === 3,
    'Playing or replaying another tier preserves the chosen difficulty');
  const generationVariant = createPlaySession(createGameState({ ...sample, generatorVersion: 2 }),
    { onChange: (snapshot) => store.saveSession(snapshot) });
  solve(generationVariant);
  assert(store.snapshot().completedIdentities.includes('rummipuz:1:2:1:sample-rearrangement-001'),
    'Generator revision is part of completion identity');
  const tierVariant = createPlaySession(createGameState({ ...sample, difficultyTier: 2 }),
    { onChange: (snapshot) => store.saveSession(snapshot) });
  solve(tierVariant);
  assert(store.snapshot().completedIdentities.includes(puzzleIdentity(tierVariant.snapshot().state))
    && store.snapshot().chosenDifficultyTier === 3,
  'A replay identity retains its recorded tier independently of chosen difficulty');
  tierVariant.reset(); tierVariant.select('blue-6-1'); tierVariant.place({ area: 'rack', index: 0 });
  tierVariant.reset();
  assert(JSON.stringify(store.snapshot().active.state.rack) === JSON.stringify(initial.rack)
    && store.snapshot().active.state.history.length === 0, 'Reset saves restored tiles and cleared undo history');
  const valid = JSON.parse(storage.raw);
  const corruptions = [
    ['Unknown save version', (data) => { data.schemaVersion = 99; }],
    ['Invalid chosen difficulty', (data) => { data.chosenDifficultyTier = 5; }],
    ['Duplicate completion record', (data) => { data.completedIdentities.push(data.completedIdentities[0]); }],
    ['Bare seed completion record', (data) => { data.completedIdentities = ['seed']; }],
    ['Missing current tile', (data) => { data.active.position.rack.pop(); }],
    ['Duplicate current tile', (data) => { data.active.position.rack.push(data.active.position.rack[0]); }],
    ['Malformed starting puzzle', (data) => { data.active.puzzle.board[0][0] = 'wrong'; }],
    ['Invalid undo snapshot', (data) => { data.active.history = [{ rack: [], board: [] }]; }],
    ['Changed layout without history', (data) => { data.active.position.rack.reverse(); }],
    ['History with wrong starting order', (data) => {
      data.active.history = [JSON.parse(JSON.stringify(data.active.position))];
      data.active.history[0].rack.reverse();
    }],
    ['False completed flag', (data) => { data.active.completed = true; }],
  ];
  for (const [name, corrupt] of corruptions) {
    const data = JSON.parse(JSON.stringify(valid)); corrupt(data);
    const bad = memoryStorage(JSON.stringify(data)); let notice = '';
    const loaded = createProgressStore({ getStorage: () => bad, onNotice: (text) => { notice = text; } });
    assert(loaded.snapshot().active === null && loaded.snapshot().completedIdentities.length === 0
      && notice.includes('could not be resumed') && bad.writes === 0, `${name} cannot resume or award credit`);
  }
  for (const raw of ['{broken', 'null']) {
    let notice = '';
    const loaded = createProgressStore({ getStorage: () => memoryStorage(raw), onNotice: (text) => { notice = text; } });
    assert(loaded.snapshot().active === null && notice.includes('could not be resumed'),
      `Invalid JSON (${raw}) is handled without crashing`);
  }
  const solvedData = JSON.parse(completedSave);
  solvedData.completedIdentities = [];
  const unrecorded = createProgressStore({ getStorage: () => memoryStorage(JSON.stringify(solvedData)) });
  assert(unrecorded.snapshot().active === null, 'Completed save requires a matching recorded identity');
  const beforeRejectedSave = storage.raw;
  assert(rejects(() => store.saveSession({ state: { ...initial, rack: [] }, completed: true }))
    && storage.raw === beforeRejectedSave, 'Rejected corrupt live save leaves the existing record untouched');
  for (const failure of ['getter', 'read', 'write']) {
    let notice = '';
    const unavailable = createProgressStore({ getStorage: () => {
      if (failure === 'getter') throw new Error('Denied');
      return { getItem() { if (failure === 'read') throw new Error('Denied'); return null; },
        setItem() { throw new Error('Quota'); } };
    }, onNotice: (text) => { notice = text; } });
    const playable = createPlaySession(initial, { onChange: (snapshot) => unavailable.saveSession(snapshot) });
    solve(playable); playable.reset(); solve(playable);
    assert(playable.snapshot().completed && unavailable.snapshot().completedIdentities.includes(puzzleIdentity(initial))
      && notice === 'Progress cannot be saved on this device.',
      `${failure} storage failure keeps play and completion identity protection working in memory`);
  }
  const writesBeforeFailedCheck = storage.writes;
  tierVariant.check();
  assert(storage.writes === writesBeforeFailedCheck, 'Unfinished Check does not create a completion or save');
  assert(notices.at(-1) === '', 'Successful writes clear a previous storage notice');
  return passed;
}
