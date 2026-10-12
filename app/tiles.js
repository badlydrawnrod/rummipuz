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
    symbol.className = 'tile-symbol';
    symbol.textContent = appearance.symbol;
    symbol.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.textContent = appearance.label;
    item.append(symbol, name);
    list.append(item);
  }
}

// Optional controls use physical IDs; the display mapping stays the same.
export function renderTileRow(tileIds, list, controls = null) {
  const document = list.ownerDocument;
  const tiles = tileIds.map((id) => {
    const tile = parseTile(id);
    if (!tile) throw new TypeError(`Invalid tile identity: ${id}`);
    return tile;
  });
  list.replaceChildren();
  function addGap(index) {
    const slot = document.createElement('li');
    slot.className = 'placement-slot';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'placement';
    button.dataset.destination = JSON.stringify({ ...controls.location, index });
    button.setAttribute('aria-label', `Place in ${controls.label}, position ${index + 1}`);
    button.textContent = '+';
    button.disabled = controls.locked || !controls.selected;
    slot.append(button);
    list.append(slot);
  }
  for (const [index, { id, colour, value }] of tiles.entries()) {
    if (controls && !controls.locked) addGap(index);
    const appearance = colours[colour];
    const tile = document.createElement(controls ? 'button' : 'li');
    tile.className = `tile tile-${colour}`;
    tile.dataset.tileId = id;
    tile.setAttribute('aria-label', `${appearance.label} ${value}`);
    if (controls) {
      tile.type = 'button';
      tile.draggable = !controls.locked;
      tile.disabled = controls.locked;
      tile.setAttribute('aria-pressed', String(id === controls.selected));
    }
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
    if (controls) {
      const slot = document.createElement('li');
      slot.className = 'tile-slot';
      slot.append(tile);
      list.append(slot);
    } else list.append(tile);
  }
  if (controls && !controls.locked) addGap(tiles.length);
}
