import { createPreferencesStore, PREFERENCES_KEY } from '../preferences.js';
import { initialiseAppearance, initialiseTilePalette } from '../appearance.js';
import { PROGRESS_KEY } from '../progress.js';

export function runPreferenceChecks() {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  function memory(raw = null) {
    const values = new Map([[PROGRESS_KEY, 'existing puzzle and undo history']]);
    if (raw !== null) values.set(PREFERENCES_KEY, raw);
    return { values, writes: 0, getItem: (key) => values.get(key) ?? null,
      setItem(key, value) { values.set(key, value); this.writes++; } };
  }
  function events(properties) {
    const listeners = new Map();
    return Object.assign(properties, {
      addEventListener: (type, handler) => listeners.set(type, handler),
      removeEventListener: (type) => listeners.delete(type),
      emit: () => listeners.get('change')?.(),
    });
  }
  function controls(store, dark) {
    const saved = store.snapshot();
    const root = { dataset: {} };
    const appearance = events({ value: '' });
    const palette = events({ value: '' });
    const media = events({ matches: dark });
    initialiseAppearance({ root, select: appearance, status: {}, media,
      initialMode: saved.appearance, onChange: (value) => store.setAppearance(value) });
    initialiseTilePalette({ root, select: palette, status: {},
      initialPalette: saved.palette, onChange: (value) => store.setPalette(value) });
    return { root, appearance, palette, media };
  }
  const storage = memory();
  const store = createPreferencesStore({ getStorage: () => storage });
  const ui = controls(store, false);
  assert(ui.appearance.value === 'system' && ui.palette.value === 'standard' && storage.writes === 0,
    'Absent preferences default to System and Standard without rewriting storage');
  for (const mode of ['system', 'light', 'dark', 'high-contrast']) {
    for (const palette of ['standard', 'alternative']) {
      ui.appearance.value = mode; ui.appearance.emit();
      ui.palette.value = palette; ui.palette.emit();
      const reload = controls(createPreferencesStore({ getStorage: () => storage }), true);
      assert(reload.appearance.value === mode && reload.palette.value === palette
        && reload.root.dataset.theme === (mode === 'system' ? 'dark' : mode)
        && reload.root.dataset.palette === palette, `${mode}/${palette}: reload restores both independent choices`);
      const writes = storage.writes;
      reload.media.matches = false; reload.media.emit();
      assert(reload.root.dataset.theme === (mode === 'system' ? 'light' : mode)
        && reload.palette.value === palette && storage.writes === writes,
        `${mode}/${palette}: device changes preserve choices without saving a resolved theme`);
    }
  }
  assert(storage.values.get(PROGRESS_KEY) === 'existing puzzle and undo history',
    'Appearance and palette changes leave puzzle progress untouched');
  const writesBeforeInvalid = storage.writes;
  ui.appearance.value = 'invalid'; ui.appearance.emit();
  ui.palette.value = 'invalid'; ui.palette.emit();
  assert(storage.writes === writesBeforeInvalid && ui.appearance.value === 'high-contrast'
    && ui.palette.value === 'alternative', 'Invalid control values neither replace choices nor write storage');
  for (const raw of ['null', '{broken', JSON.stringify({ schemaVersion: 2, appearance: 'dark', palette: 'alternative' }),
    JSON.stringify({ schemaVersion: 1, appearance: 'unknown', palette: 'alternative' }),
    JSON.stringify({ schemaVersion: 1, appearance: 'dark', palette: 'unknown' })]) {
    const corrupt = memory(raw); let notice = '';
    const prefs = createPreferencesStore({ getStorage: () => corrupt, onNotice: (value) => { notice = value; } });
    assert(prefs.snapshot().appearance === 'system' && prefs.snapshot().palette === 'standard'
      && notice.includes('could not be loaded') && corrupt.writes === 0,
      `Invalid saved preferences fall back safely (${raw})`);
    prefs.setPalette('alternative');
    assert(notice === '' && JSON.parse(corrupt.values.get(PREFERENCES_KEY)).palette === 'alternative',
      `A new choice replaces invalid preferences and clears their notice (${raw})`);
  }
  for (const failure of ['getter', 'read', 'write', 'missing']) {
    let notice = '';
    const prefs = createPreferencesStore({ getStorage: () => {
      if (failure === 'getter') throw new Error('Denied');
      if (failure === 'missing') return null;
      return { getItem() { if (failure === 'read') throw new Error('Denied'); return null; },
        setItem() { throw new Error('Full'); } };
    }, onNotice: (value) => { notice = value; } });
    const current = controls(prefs, false);
    current.appearance.value = 'dark'; current.appearance.emit();
    current.palette.value = 'alternative'; current.palette.emit();
    assert(current.root.dataset.theme === 'dark' && current.root.dataset.palette === 'alternative'
      && prefs.snapshot().appearance === 'dark' && prefs.snapshot().palette === 'alternative'
      && notice.includes('cannot be saved'), `${failure}: unavailable storage keeps both settings usable in the session`);
    current.appearance.value = 'system'; current.appearance.emit();
    current.media.matches = true; current.media.emit();
    assert(current.root.dataset.theme === 'dark' && prefs.snapshot().appearance === 'system',
      `${failure}: System still follows the device without persistent storage`);
  }
  const recovering = memory(); let blocked = true; let notice = '';
  const write = recovering.setItem.bind(recovering);
  recovering.setItem = (key, value) => { if (blocked) throw new Error('Full'); write(key, value); };
  const prefs = createPreferencesStore({ getStorage: () => recovering, onNotice: (value) => { notice = value; } });
  prefs.setAppearance('dark'); blocked = false; prefs.setPalette('alternative');
  const saved = JSON.parse(recovering.values.get(PREFERENCES_KEY));
  assert(notice === '' && saved.appearance === 'dark' && saved.palette === 'alternative',
    'A recovered write saves both current choices and clears the unsaved notice');
  for (const failure of ['getter', 'read', 'missing']) {
    const recovered = memory(); let starting = true; let notice = '';
    const read = recovered.getItem.bind(recovered);
    recovered.getItem = (key) => {
      if (starting && failure === 'read') throw new Error('Temporarily unavailable');
      return read(key);
    };
    const prefs = createPreferencesStore({ getStorage: () => {
      if (starting && failure === 'getter') throw new Error('Temporarily unavailable');
      return starting && failure === 'missing' ? null : recovered;
    }, onNotice: (value) => { notice = value; } });
    starting = false;
    const current = controls(prefs, false);
    current.appearance.value = 'dark'; current.appearance.emit();
    current.palette.value = 'alternative'; current.palette.emit();
    const reload = controls(createPreferencesStore({ getStorage: () => recovered }), false);
    assert(notice === '' && reload.appearance.value === 'dark' && reload.palette.value === 'alternative',
      `${failure}: a startup storage failure can recover on the next user choice and survive reload`);
  }
  return passed;
}
