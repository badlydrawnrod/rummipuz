import { renderTileLegend } from './tiles.js';
import { initialisePlay } from './play.js';
import { checkState, createGameState } from './state.js';
import { createProgressStore } from './progress.js';
import { createPreferencesStore } from './preferences.js';
import { initialiseAppearance, initialiseTilePalette } from './appearance.js';

const preferences = createPreferencesStore({
  onNotice: (message) => {
    document.querySelector('#appearance-note').textContent = message || 'Applies immediately. Choices are saved on this device.';
  },
});
const savedPreferences = preferences.snapshot();
initialiseAppearance({
  root: document.documentElement,
  select: document.querySelector('#appearance-mode'),
  status: document.querySelector('#appearance-status'),
  media: window.matchMedia('(prefers-color-scheme: dark)'),
  initialMode: savedPreferences.appearance,
  onChange: (mode) => preferences.setAppearance(mode),
});
initialiseTilePalette({
  root: document.documentElement,
  select: document.querySelector('#tile-palette'),
  status: document.querySelector('#palette-status'),
  initialPalette: savedPreferences.palette,
  onChange: (palette) => preferences.setPalette(palette),
});

const openButton = document.querySelector('#open-sample');
const puzzleSection = document.querySelector('#puzzle');
const status = document.querySelector('#load-status');
const content = document.querySelector('#puzzle-content');
let sample = null;
const progress = createProgressStore({
  onNotice: (message) => { document.querySelector('#progress-status').textContent = message; },
});
const restored = progress.snapshot().active;
if (restored) {
  openButton.textContent = 'Resume puzzle';
  document.querySelector('.preview-note').textContent =
    `${['Easy', 'Medium', 'Hard', 'Expert'][restored.state.difficultyTier - 1]} · ${restored.state.rack.length} tiles in rack · ${restored.completed ? 'Completed' : 'Saved puzzle'}`;
}
renderTileLegend(document.querySelector('#tile-legend'));

openButton.addEventListener('click', async () => {
  puzzleSection.hidden = false;
  openButton.disabled = true;
  status.textContent = 'Loading sample puzzle…';
  try {
    if (!sample) {
      let state = restored?.state;
      if (!state) {
        const response = await fetch(new URL('./puzzles/sample.json', import.meta.url));
        if (!response.ok) throw new Error(`Sample request failed: ${response.status}`);
        state = createGameState(await response.json());
      }
      sample = initialisePlay({ content, status, state, completed: restored?.completed ?? false,
        onChange: (snapshot) => progress.saveSession(snapshot) });
      progress.saveSession(sample.snapshot());
      const tier = state.difficultyTier;
      document.querySelector('#puzzle-title').textContent =
        `${['Easy', 'Medium', 'Hard', 'Expert'][tier - 1]} · ${['rework one row', 'connect changes across two rows', 'coordinate three rows', 'rebuild four or more rows'][tier - 1]}`;
    }
    content.hidden = false;
    status.textContent = sample.snapshot().completed
      ? 'Puzzle complete! Every tile is placed in a valid row.'
      : checkState(sample.snapshot().state).won ? 'Ready to check. Select Check to finish.'
        : restored ? 'Puzzle resumed. Select a tile to continue.' : 'Sample ready. Select a tile to start.';
    openButton.textContent = 'View puzzle';
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
