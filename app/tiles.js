import { parseTile } from './rules.js';

const colours = {
  black: { symbol: '●', label: 'Black' },
  blue: { symbol: '◆', label: 'Blue' },
  red: { symbol: '♥︎', label: 'Red' },
  orange: { symbol: '▲', label: 'Orange' },
};

// One display mapping for both the legend and tiles; logical colours stay in IDs.
export function renderTileLegend(list) {
  const document = list.ownerDocument;
  list.replaceChildren();
  for (const [colour, appearance] of Object.entries(colours)) {
    const item = document.createElement('li');
    item.className = `legend-item tile-${colour}`;
    const symbol = document.createElement('span');
    symbol.textContent = appearance.symbol;
    symbol.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.textContent = appearance.label;
    item.append(symbol, name);
    list.append(item);
  }
}

// Rendering only: these list items become selectable in the controls step.
export function renderTileRow(tileIds, list) {
  const document = list.ownerDocument;
  const tiles = tileIds.map((id) => {
    const tile = parseTile(id);
    if (!tile) throw new TypeError(`Invalid tile identity: ${id}`);
    return tile;
  });
  list.replaceChildren();
  for (const { id, colour, value } of tiles) {
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
