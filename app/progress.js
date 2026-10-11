import { checkState, createGameState } from './state.js';

export const PROGRESS_KEY = 'rummipuz.progress.v1';
const tierValid = (tier) => Number.isInteger(tier) && tier >= 1 && tier <= 4;
export const puzzleIdentity = ({ version, generatorVersion, difficultyTier, seed }) =>
  `rummipuz:${version}:${generatorVersion}:${difficultyTier}:${seed}`;
const identityValid = (code) => typeof code === 'string'
  && /^rummipuz:1:[1-9][0-9]*:[1-4]:[A-Za-z0-9_-]{1,64}$/.test(code)
  && Number.isSafeInteger(Number(code.split(':')[2]));
const copy = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function startingPuzzle(state) {
  const { version, generatorVersion, difficultyTier, seed, initial } = state;
  return { version, generatorVersion, difficultyTier, seed, rack: initial.rack, board: initial.board };
}
function validatePosition(position, initial) {
  if (!position || !checkState({ ...initial, rack: position.rack, board: position.board }).conserved) {
    throw new Error('Invalid saved position.');
  }
  return { rack: [...position.rack], board: position.board.map((row) => [...row]) };
}
function restoreSession(saved, identities) {
  if (!saved || typeof saved.completed !== 'boolean' || !Array.isArray(saved.history)) {
    throw new Error('Invalid saved session.');
  }
  const initial = createGameState(saved.puzzle);
  const position = validatePosition(saved.position, initial);
  const history = saved.history.map((entry) => validatePosition(entry, initial));
  if (!history.length && JSON.stringify(position) !== JSON.stringify(initial.initial)) {
    throw new Error('Changed position requires undo history.');
  }
  if (history.length && JSON.stringify(history[0]) !== JSON.stringify(initial.initial)) {
    throw new Error('Undo history does not start at the original puzzle.');
  }
  const state = freeze({ ...initial, ...position, history });
  if (saved.completed && (!checkState(state).won || !identities.includes(puzzleIdentity(state)))) {
    throw new Error('Invalid saved completion.');
  }
  return { state, completed: saved.completed };
}

// One atomic record keeps the active session and completion credit consistent.
// Selection, dragging and transient panels never enter the saved data.
export function createProgressStore({ getStorage = () => globalThis.localStorage, onNotice = () => {} } = {}) {
  let chosenDifficultyTier = 1;
  let completedIdentities = [];
  let active = null;
  let storage;
  try {
    storage = getStorage();
    if (!storage) throw new Error('Storage unavailable.');
    const raw = storage.getItem(PROGRESS_KEY);
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);
        if (data.schemaVersion !== 1 || !tierValid(data.chosenDifficultyTier)
          || !Array.isArray(data.completedIdentities) || !data.completedIdentities.every(identityValid)
          || new Set(data.completedIdentities).size !== data.completedIdentities.length) {
          throw new Error('Invalid saved progress.');
        }
        const restored = data.active === null ? null : restoreSession(data.active, data.completedIdentities);
        chosenDifficultyTier = data.chosenDifficultyTier;
        completedIdentities = [...data.completedIdentities];
        active = restored;
      } catch {
        onNotice('Saved progress could not be resumed. Open the sample puzzle to start again.');
      }
    }
  } catch {
    storage = null;
    onNotice('Progress cannot be saved on this device.');
  }
  function persist() {
    const data = { schemaVersion: 1, chosenDifficultyTier, completedIdentities,
      active: active ? { puzzle: startingPuzzle(active.state),
        position: { rack: active.state.rack, board: active.state.board },
        history: active.state.history, completed: active.completed } : null };
    try {
      if (!storage) throw new Error('Storage unavailable.');
      storage.setItem(PROGRESS_KEY, JSON.stringify(data));
      onNotice('');
    } catch { onNotice('Progress cannot be saved on this device.'); }
  }
  return {
    snapshot() {
      return freeze({ chosenDifficultyTier, completedIdentities: [...completedIdentities],
        credits: [1, 2, 3, 4].map((tier) => Math.min(3,
          completedIdentities.filter((code) => Number(code.split(':')[3]) === tier).length)), active });
    },
    setChosenDifficulty(tier) {
      if (!tierValid(tier)) throw new Error('Unknown difficulty tier.');
      chosenDifficultyTier = tier;
      persist();
    },
    saveSession({ state, completed }) {
      if (!checkState(state).conserved) throw new Error('Cannot save a corrupt live position.');
      const identity = puzzleIdentity(state);
      const identities = completed && !completedIdentities.includes(identity)
        ? [...completedIdentities, identity] : completedIdentities;
      const validated = restoreSession(copy({ puzzle: startingPuzzle(state),
        position: { rack: state.rack, board: state.board }, history: state.history, completed }), identities);
      completedIdentities = identities;
      active = validated;
      persist();
    },
  };
}
