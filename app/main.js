import { renderTileLegend } from './tiles.js';
import { initialisePlay } from './play.js';
import { createGameState } from './state.js';
import { initialiseAppearance, initialiseTilePalette } from './appearance.js';

initialiseAppearance({
  root: document.documentElement,
  select: document.querySelector('#appearance-mode'),
  status: document.querySelector('#appearance-status'),
  media: window.matchMedia('(prefers-color-scheme: dark)'),
});
initialiseTilePalette({
  root: document.documentElement,
  select: document.querySelector('#tile-palette'),
  status: document.querySelector('#palette-status'),
});

const openButton = document.querySelector('#open-sample');
const puzzleSection = document.querySelector('#puzzle');
const status = document.querySelector('#load-status');
const content = document.querySelector('#puzzle-content');
let sample = null;
renderTileLegend(document.querySelector('#tile-legend'));

openButton.addEventListener('click', async () => {
  puzzleSection.hidden = false;
  openButton.disabled = true;
  status.textContent = 'Loading sample puzzle…';
  try {
    if (!sample) {
      const response = await fetch(new URL('./puzzles/sample.json', import.meta.url));
      if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
      const state = createGameState(await response.json());
      sample = initialisePlay({ content, status, state });
    }
    content.hidden = false;
    status.textContent = sample.snapshot().completed
      ? 'Puzzle complete! Every tile is placed in a valid row.' : 'Sample ready. Select a tile to start.';
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
