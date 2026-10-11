import { renderTileLegend, renderTileRow } from './tiles.js';
import { createGameState } from './state.js';
import { initialiseAppearance } from './appearance.js';

initialiseAppearance({
  root: document.documentElement,
  select: document.querySelector('#appearance-mode'),
  status: document.querySelector('#appearance-status'),
  media: window.matchMedia('(prefers-color-scheme: dark)'),
});

const openButton = document.querySelector('#open-sample');
const puzzleSection = document.querySelector('#puzzle');
const status = document.querySelector('#load-status');
const content = document.querySelector('#puzzle-content');
let sample = null;
renderTileLegend(document.querySelector('#tile-legend'));

function renderPuzzle(puzzle) {
  const board = document.querySelector('#board-rows');
  board.replaceChildren();
  puzzle.board.forEach((tiles, index) => {
    const container = document.createElement('div');
    container.className = 'board-row';
    container.tabIndex = 0;
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', `Board row ${index + 1}`);
    const label = document.createElement('p');
    label.className = 'board-row-label';
    label.textContent = `Row ${index + 1}`;
    const list = document.createElement('ul');
    list.className = 'tile-row';
    list.setAttribute('aria-label', `Tiles in row ${index + 1}`);
    renderTileRow(tiles, list);
    container.append(label, list);
    board.append(container);
  });
  renderTileRow(puzzle.rack, document.querySelector('#rack-tiles'));
  document.querySelector('#rack-count').textContent = puzzle.rack.length;
  document.querySelector('#replay-code').textContent =
    `rummipuz:${puzzle.version}:${puzzle.generatorVersion}:${puzzle.difficultyTier}:${puzzle.seed}`;
}

openButton.addEventListener('click', async () => {
  puzzleSection.hidden = false;
  openButton.disabled = true;
  status.textContent = 'Loading sample puzzle…';
  try {
    if (!sample) {
      const response = await fetch(new URL('./puzzles/sample.json', import.meta.url));
      if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
      sample = createGameState(await response.json());
    }
    renderPuzzle(sample);
    content.hidden = false;
    status.textContent = 'Sample loaded. Tile movement is not yet available.';
    openButton.textContent = 'View sample puzzle';
    puzzleSection.scrollIntoView({ block: 'start' });
    const heading = document.querySelector('#puzzle-title');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  } catch (error) {
    sample = null;
    content.hidden = true;
    status.textContent = 'The sample could not be loaded. Try opening it again.';
    openButton.textContent = 'Retry sample puzzle';
    console.error(error);
  } finally {
    openButton.disabled = false;
  }
});
