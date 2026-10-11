const TILE_ID = /^(black|blue|red|orange)-(1[0-3]|[1-9])-([12])$/;

/** Decode a canonical physical tile ID; malformed IDs return null. */
export function parseTile(id) {
  if (typeof id !== 'string') return null;
  const match = TILE_ID.exec(id);
  if (!match || match[0] !== id) return null;
  return { id, colour: match[1], value: Number(match[2]), copy: Number(match[3]) };
}

/** Empty rows are valid layout placeholders, with kind "empty". */
export function classifyRow(row) {
  const invalid = (reason) => ({ valid: false, kind: 'invalid', reason });
  if (!Array.isArray(row)) return invalid('Row must be an array.');
  const tiles = Array.from(row, parseTile);
  if (tiles.some((tile) => tile === null)) return invalid('Invalid tile identity.');
  if (new Set(row).size !== row.length) return invalid('Repeated physical tile.');
  if (row.length === 0) return { valid: true, kind: 'empty', reason: null };
  if (row.length < 3) return invalid('Needs at least 3 tiles.');

  if (tiles.every((tile) => tile.value === tiles[0].value)) {
    if (row.length > 4) return invalid('A group can contain at most 4 tiles.');
    if (new Set(tiles.map((tile) => tile.colour)).size !== row.length) {
      return invalid('Repeated colour in group.');
    }
    return { valid: true, kind: 'group', reason: null };
  }
  if (!tiles.every((tile) => tile.colour === tiles[0].colour)) {
    return invalid('Use equal numbers in distinct colours, or a run of one colour.');
  }
  if (new Set(tiles.map((tile) => tile.value)).size !== row.length) {
    return invalid('Repeated number in run.');
  }
  if (tiles.some((tile, index) => index > 0 && tile.value <= tiles[index - 1].value)) {
    return invalid('Run must be in ascending order without wrapping.');
  }
  if (tiles.some((tile, index) => tile.value !== tiles[0].value + index)) {
    return invalid('Run has a gap.');
  }
  return { valid: true, kind: 'run', reason: null };
}
