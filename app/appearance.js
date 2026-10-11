const modes = new Set(['system', 'light', 'dark', 'high-contrast']);
const labels = { light: 'Classic / Light', dark: 'Dark', 'high-contrast': 'High Contrast' };

// Presentation only: no puzzle, history, or storage access.
export function initialiseAppearance({ root, select, status, media }) {
  let mode = 'system';

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
