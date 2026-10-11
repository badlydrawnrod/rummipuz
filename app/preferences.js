export const PREFERENCES_KEY = 'rummipuz.preferences.v1';
const modes = new Set(['system', 'light', 'dark', 'high-contrast']);
const palettes = new Set(['standard', 'alternative']);

// Separate from puzzle progress so presentation changes cannot replace a session.
export function createPreferencesStore({ getStorage = () => globalThis.localStorage, onNotice = () => {} } = {}) {
  let appearance = 'system';
  let palette = 'standard';
  let storage;
  const unavailable = () => onNotice('Choices cannot be saved on this device. They remain usable until you reload.');
  try {
    storage = getStorage();
    if (!storage) throw new Error('Storage unavailable.');
    const raw = storage.getItem(PREFERENCES_KEY);
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);
        if (data?.schemaVersion !== 1 || !modes.has(data.appearance) || !palettes.has(data.palette)) {
          throw new Error('Invalid preferences.');
        }
        appearance = data.appearance;
        palette = data.palette;
      } catch { onNotice('Saved appearance choices could not be loaded. Using System and Standard.'); }
    }
  } catch {
    storage = null;
    unavailable();
  }
  function persist() {
    try {
      // A failed startup read must not disable later user-initiated saves.
      if (!storage) storage = getStorage();
      if (!storage) throw new Error('Storage unavailable.');
      storage.setItem(PREFERENCES_KEY, JSON.stringify({ schemaVersion: 1, appearance, palette }));
      onNotice('');
    } catch { unavailable(); }
  }
  return {
    snapshot: () => Object.freeze({ appearance, palette }),
    setAppearance(value) {
      if (!modes.has(value)) throw new Error('Unknown appearance mode.');
      appearance = value;
      persist();
    },
    setPalette(value) {
      if (!palettes.has(value)) throw new Error('Unknown tile palette.');
      palette = value;
      persist();
    },
  };
}
