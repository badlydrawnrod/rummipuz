import { initialiseOffline } from './offline.js';
import { renderTileLegend } from './tiles.js';
import { initialisePlay } from './play.js';
import { checkState } from './state.js';
import { createProgressStore } from './progress.js';
import { createPuzzleService } from './puzzle-service.js';
import { createPuzzleFlow, nextDifficulty, parseReplayCode, TIER_NAMES } from './puzzle-flow.js';
import { createPreferencesStore } from './preferences.js';
import { initialiseAppearance, initialiseTilePalette } from './appearance.js';

void initialiseOffline({ onStatus: (message) => {
  document.querySelector('#offline-status').textContent = message;
} });

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

const find = (selector) => document.querySelector(selector);
const openButton = find('#open-sample');
const puzzleSection = find('#puzzle');
const status = find('#load-status');
const content = find('#puzzle-content');
const difficulty = find('#difficulty-choice');
const preparationStatus = find('#preparation-status');
const confirmation = find('#replace-confirmation');
const progress = createProgressStore({
  onNotice: (message) => { find('#progress-status').textContent = message; },
});
const service = createPuzzleService();
const flow = createPuzzleFlow({ service, progress, loadSample: async ({ signal }) => {
  const response = await fetch(new URL('./puzzles/sample.json', import.meta.url), { signal });
  if (!response.ok) throw new Error('The sample could not be loaded. Try again.');
  return response.json();
} });
let play = null;
let busy = false;
let attempt = 0;
let proposed = null;
let retry = null;
let returnFocus = null;
difficulty.value = String(progress.snapshot().chosenDifficultyTier);
renderTileLegend(find('#tile-legend'));

function refreshNavigation() {
  const saved = progress.snapshot();
  const active = play?.snapshot() ?? saved.active;
  openButton.textContent = play ? 'View puzzle' : active ? 'Resume puzzle' : 'Open sample puzzle';
  find('.preview-note').textContent = active
    ? `${TIER_NAMES[active.state.difficultyTier - 1]} · ${active.state.rack.length} tiles in rack · ${active.completed ? 'Completed' : 'Saved puzzle'}`
    : 'Select and place, or drag tiles.';
  const tier = Number(difficulty.value);
  const credit = saved.credits[tier - 1];
  find('#difficulty-credit').textContent = `${TIER_NAMES[tier - 1]} · ${credit} of 3 completed${credit === 3 && tier < 4 ? ' · Ready to move up on Next' : ''}`;
  const next = nextDifficulty(saved);
  find('#next-description').textContent = `Next puzzle: ${TIER_NAMES[next - 1]}${next !== saved.chosenDifficultyTier ? ` — 3 ${TIER_NAMES[saved.chosenDifficultyTier - 1]} puzzles completed` : ''}.`;
  find('#next-puzzle').hidden = !active?.completed;
  find('#next-description').hidden = !active?.completed;
  for (const selector of ['#open-sample', '#start-puzzle', '#next-puzzle', '#play-replay', '#difficulty-choice', '#replay-input', '#change-difficulty', '#open-replay']) {
    find(selector).disabled = busy;
  }
  find('#cancel-preparation').hidden = !busy;
}

function showPuzzle() {
  puzzleSection.hidden = false;
  content.hidden = false;
  const snapshot = play.snapshot();
  status.textContent = snapshot.completed ? 'Puzzle complete! Every tile is placed in a valid row.'
    : checkState(snapshot.state).won ? 'Ready to check. Select Check to finish.' : 'Puzzle ready. Select a tile to continue.';
  puzzleSection.scrollIntoView({ block: 'start' });
  const heading = find('#puzzle-title');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}
function install(state, completed = false) {
  play?.dispose();
  play = initialisePlay({ content, status, state, completed,
    onChange: (snapshot) => { progress.saveSession(snapshot); refreshNavigation(); } });
  find('#puzzle-title').textContent = `${TIER_NAMES[state.difficultyTier - 1]} · ${['rework one row', 'connect changes across two rows', 'coordinate three rows', 'rebuild four or more rows'][state.difficultyTier - 1]}`;
  progress.saveSession(play.snapshot());
  showPuzzle();
}
async function prepare(request) {
  busy = true;
  const token = ++attempt;
  retry = request;
  confirmation.hidden = true;
  find('#retry-preparation').hidden = true;
  preparationStatus.textContent = 'Preparing puzzle… Your current puzzle stays available until the new one is ready.';
  refreshNavigation();
  try {
    const ready = await flow.prepare(request);
    if (token !== attempt) return;
    install(ready.state);
    if (ready.chosenTier !== null) {
      progress.setChosenDifficulty(ready.chosenTier);
      difficulty.value = String(ready.chosenTier);
    }
    retry = null;
    preparationStatus.textContent = 'Puzzle ready.';
  } catch (error) {
    if (token !== attempt) return;
    preparationStatus.textContent = error.name === 'AbortError' ? 'Preparation cancelled. Your puzzle is unchanged.' : error.message;
    find('#retry-preparation').hidden = error.name === 'AbortError';
  } finally {
    if (token === attempt) { busy = false; refreshNavigation(); if (retry) returnFocus?.focus(); }
  }
}
function requestPuzzle(request, source) {
  if (busy) return;
  returnFocus = source;
  proposed = null; confirmation.hidden = true;
  find('#retry-preparation').hidden = true;
  // Validate before offering to replace an unfinished puzzle.
  if (request.kind === 'replay') {
    try { parseReplayCode(request.code); }
    catch (error) { preparationStatus.textContent = error.message; find('#replay-input').focus(); return; }
  }
  const active = play?.snapshot() ?? progress.snapshot().active;
  if (active && !active.completed) {
    proposed = request;
    confirmation.hidden = false;
    find('#replace-puzzle').focus();
  } else void prepare(request);
}
openButton.addEventListener('click', () => {
  if (play) { showPuzzle(); return; }
  const active = progress.snapshot().active;
  if (active) { install(active.state, active.completed); refreshNavigation(); }
  else requestPuzzle({ kind: 'replay', code: 'rummipuz:1:1:1:sample-rearrangement-001' }, openButton);
});
difficulty.addEventListener('change', refreshNavigation);
find('#change-difficulty').addEventListener('click', () => difficulty.focus());
find('#open-replay').addEventListener('click', () => find('#replay-input').focus());
find('#start-puzzle').addEventListener('click', (event) => requestPuzzle({ kind: 'start', tier: Number(difficulty.value) }, event.currentTarget));
find('#next-puzzle').addEventListener('click', (event) => requestPuzzle({ kind: 'next' }, event.currentTarget));
find('#replay-form').addEventListener('submit', (event) => {
  event.preventDefault(); requestPuzzle({ kind: 'replay', code: find('#replay-input').value }, find('#play-replay'));
});
find('#replace-puzzle').addEventListener('click', () => { const request = proposed; proposed = null; void prepare(request); });
find('#cancel-replace').addEventListener('click', () => {
  proposed = null; confirmation.hidden = true; returnFocus?.focus();
});
find('#cancel-preparation').addEventListener('click', () => {
  ++attempt; flow.cancel(); busy = false; retry = null;
  preparationStatus.textContent = 'Preparation cancelled. Your puzzle is unchanged.';
  refreshNavigation(); returnFocus?.focus();
});
find('#retry-preparation').addEventListener('click', () => { if (retry) requestPuzzle(retry, find('#retry-preparation')); });
find('#copy-replay').addEventListener('click', async () => {
  const code = find('#replay-code');
  try {
    await navigator.clipboard.writeText(code.textContent);
    preparationStatus.textContent = 'Replay code copied.';
  } catch {
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    preparationStatus.textContent = 'Select and copy the highlighted replay code.';
  }
});
refreshNavigation();
