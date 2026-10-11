import { initialiseAppearance } from '../appearance.js';

export function runAppearanceChecks(styles) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const events = (properties = {}) => {
    const listeners = new Map();
    return Object.assign(properties, {
      addEventListener(type, handler) { listeners.set(type, handler); },
      removeEventListener(type, handler) {
        if (listeners.get(type) === handler) listeners.delete(type);
      },
      emit() { listeners.get('change')?.(); },
      get listenerCount() { return listeners.size; },
    });
  };
  for (const dark of [false, true]) {
    const root = { dataset: {} };
    const select = events({ value: '' });
    const status = { textContent: '' };
    const media = events({ matches: dark });
    const dispose = initialiseAppearance({ root, select, status, media });
    assert(select.value === 'system' && root.dataset.theme === (dark ? 'dark' : 'light'),
      `System defaults to device ${dark ? 'dark' : 'light'} preference`);
    media.matches = !dark;
    media.emit();
    assert(root.dataset.theme === (!dark ? 'dark' : 'light') && select.value === 'system',
      `System follows live preference changes from ${dark ? 'dark' : 'light'}`);
    for (const mode of ['light', 'dark', 'high-contrast']) {
      select.value = mode;
      select.emit();
      media.matches = !media.matches;
      media.emit();
      assert(root.dataset.theme === mode && select.value === mode && status.textContent.length > 0,
        `${mode} applies immediately and ignores device changes (${dark})`);
    }
    select.value = 'system';
    select.emit();
    assert(root.dataset.theme === (media.matches ? 'dark' : 'light'),
      `Returning to System uses current device preference (${dark})`);
    select.value = 'invalid';
    select.emit();
    assert(select.value === 'system', `Invalid appearance cannot replace active choice (${dark})`);
    dispose();
    assert(select.listenerCount === 0 && media.listenerCount === 0,
      `Appearance listeners can be cleaned up (${dark})`);
  }

  // Audit the actual CSS colour tokens used by text, controls, and focus rings.
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const [mode, selector] of [
    ['light', ':root'], ['dark', ':root[data-theme="dark"]'],
    ['high-contrast', ':root[data-theme="high-contrast"]'],
  ]) {
    const block = styles.slice(styles.indexOf(`${selector} {`)).split('}')[0];
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)]
      .map((match) => [match[1], match[2]]));
    const pairs = [
      ['text', 'page'], ['muted', 'page'], ['accent', 'page'],
      ['text', 'rack'], ['muted', 'rack'], ['board-text', 'board'],
      ['button-text', 'button'], ['button-text', 'button-hover'],
    ];
    for (const [foreground, background] of pairs) {
      assert(contrast(tokens[foreground], tokens[background]) >= 4.5,
        `${mode}: ${foreground} on ${background} meets 4.5:1 text contrast`);
    }
    for (const colour of ['black', 'blue', 'red', 'orange']) {
      const value = styles.match(new RegExp(`\\.tile-${colour} \\{ color: (#[0-9a-f]{6})`))[1];
      assert(contrast(value, tokens.tile) >= 4.5,
        `${mode}: ${colour} tile text meets 4.5:1 contrast`);
    }
    for (const [foreground, background] of [['focus', 'page'], ['line', 'page'], ['tile-border', 'tile']]) {
      assert(contrast(tokens[foreground], tokens[background]) >= 3,
        `${mode}: ${foreground} on ${background} meets 3:1 non-text contrast`);
    }
  }
  return passed;
}
