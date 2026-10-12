import { parseTile } from './rules.js';

// Canonical physical exact cover. Expansion and recursive calls spend the caller's shared budget.
export function enumeratePhysicalPartitions(state, spend, visit) {
  const inventory = [...state.inventory].sort(); // Canonical ASCII physical IDs.
  const copies = new Map();
  inventory.forEach((id, index) => {
    const tile = parseTile(id);
    const key = `${tile.colour}-${tile.value}`;
    if (!copies.has(key)) copies.set(key, []);
    copies.get(key).push(index);
  });
  const shapes = [];
  const colours = ['black', 'blue', 'red', 'orange'];
  for (const colour of colours) {
    for (let start = 1; start <= 11; start += 1) {
      const faces = [];
      for (let end = start; end <= 13 && copies.has(`${colour}-${end}`); end += 1) {
        faces.push(`${colour}-${end}`);
        if (faces.length >= 3) shapes.push([...faces]);
      }
    }
  }
  for (let value = 1; value <= 13; value += 1) {
    for (let mask = 1; mask < 16; mask += 1) {
      const faces = colours.flatMap((colour, i) => mask & (1 << i) ? [`${colour}-${value}`] : []);
      if (faces.length >= 3 && faces.every((f) => copies.has(f))) shapes.push(faces);
    }
  }
  const byTile = inventory.map(() => []);
  let expansionLimited = false;
  function expand(shape, at, indices, mask) {
    if (!spend()) { expansionLimited = true; return; }
    if (at === shape.length) {
      const candidate = { mask, row: indices.map((index) => inventory[index]) };
      for (const index of indices) byTile[index].push(candidate);
      return;
    }
    for (const index of copies.get(shape[at])) {
      expand(shape, at + 1, [...indices, index], mask | (1n << BigInt(index)));
      if (expansionLimited) return;
    }
  }
  for (const shape of shapes) {
    expand(shape, 0, [], 0n);
    if (expansionLimited) return { complete: false, partitions: 0 };
  }
  let partitions = 0;
  function search(remaining, board) {
    if (!spend()) return false;
    if (remaining === 0n) { partitions += 1; return visit(board) !== false; }
    let choices = null;
    for (let index = 0; index < inventory.length; index += 1) {
      if (!(remaining & (1n << BigInt(index)))) continue;
      const available = byTile[index].filter(({ mask }) => (mask & remaining) === mask);
      if (!available.length) return true;
      if (choices === null || available.length < choices.length) choices = available;
    }
    for (const { mask, row } of choices) {
      if (!search(remaining ^ mask, [...board, row])) return false;
    }
    return true;
  }
  return { complete: search((1n << BigInt(inventory.length)) - 1n, []), partitions };
}
