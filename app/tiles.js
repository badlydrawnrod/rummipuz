const colours = {
  black: { symbol: '●', label: 'Black' },
  blue: { symbol: '◆', label: 'Blue' },
  red: { symbol: '♥', label: 'Red' },
  orange: { symbol: '▲', label: 'Orange' },
};

// Rendering only: rule classification and state changes belong to later modules.
export function renderTileRow(tileIds, list) {
  list.replaceChildren();
  for (const id of tileIds) {
    const [colour, value] = id.split('-');
    const appearance = colours[colour];
    const tile = document.createElement('li');
    tile.className = `tile tile-${colour}`;
    tile.dataset.tileId = id;
    tile.setAttribute('aria-label', `${appearance.label} ${value}`);
    for (const [className, text] of [
      ['tile-value', value],
      ['tile-symbol', appearance.symbol],
      ['tile-name', appearance.label],
    ]) {
      const part = document.createElement('span');
      part.className = className;
      part.textContent = text;
      part.setAttribute('aria-hidden', 'true');
      tile.append(part);
    }
    list.append(tile);
  }
}
