const modes = new Set(['system', 'light', 'dark', 'high-contrast']);
const labels = { light: 'Classic / Light', dark: 'Dark', 'high-contrast': 'High Contrast' };

// Presentation only: no puzzle, history, or storage access.
export function initialiseAppearance({ root, select, status, media, initialMode = 'system', onChange = () => {} }) {
  let mode = modes.has(initialMode) ? initialMode : 'system';

  function apply() {
    const theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = theme;
    select.value = mode;
    status.textContent = mode === 'system'
      ? `System appearance: ${labels[theme]}. Follows your device.`
      : `${labels[theme]} appearance.`;
  }

  function onSelection() {
    if (!modes.has(select.value)) {
      select.value = mode;
      return;
    }
    mode = select.value;
    apply();
    onChange(mode);
  }

  function onDeviceChange() {
    if (mode === 'system') apply();
  }

  select.addEventListener('change', onSelection);
  media.addEventListener('change', onDeviceChange);
  apply();
  return () => {
    select.removeEventListener('change', onSelection);
    media.removeEventListener('change', onDeviceChange);
  };
}

export function initialiseTilePalette({ root, select, status, initialPalette = 'standard', onChange = () => {} }) {
  let palette = ['standard', 'alternative'].includes(initialPalette) ? initialPalette : 'standard';

  function apply() {
    root.dataset.palette = palette;
    select.value = palette;
    status.textContent = palette === 'alternative'
      ? 'Alternative inks. Tile colour names and symbols stay the same.'
      : 'Standard tile colours.';
  }

  function onSelection() {
    if (!['standard', 'alternative'].includes(select.value)) {
      select.value = palette;
      return;
    }
    palette = select.value;
    apply();
    onChange(palette);
  }

  select.addEventListener('change', onSelection);
  apply();
  return () => select.removeEventListener('change', onSelection);
}
