import { renderTileRow } from './tiles.js';
import { classifyRow, parseTile } from './rules.js';
import { checkState } from './state.js';
import { createPlaySession } from './play-session.js';
import { initialiseTouch } from './touch.js';

const dragType = 'application/x-rummipuz-tile';

export function initialisePlay({ content, status, state }) {
  const session = createPlaySession(state);
  const document = content.ownerDocument;
  const find = (selector) => content.querySelector(selector);
  const resetPanel = find('#reset-confirmation');
  const undo = find('#undo-move');
  const reset = find('#reset-puzzle');
  const newRow = find('#new-row');
  const cancel = find('#cancel-selection');
  const check = find('#check-puzzle');
  let touch;

  function focusTile(id) {
    if (!id) return;
    // Canonical IDs contain no CSS metacharacters.
    find(`[data-tile-id="${id}"]`)?.focus({ preventScroll: true });
  }

  function paintSelection() {
    const { selected, completed } = session.snapshot();
    for (const tile of content.querySelectorAll('[data-tile-id]')) {
      tile.setAttribute('aria-pressed', String(tile.dataset.tileId === selected));
    }
    for (const target of content.querySelectorAll('[data-destination]')) {
      target.disabled = completed || !selected;
    }
    cancel.disabled = !selected;
    const tile = parseTile(selected);
    find('#selection-status').textContent = tile
      ? `Selected ${tile.colour} ${tile.value}. Choose a + position or New row.`
      : completed ? 'Select Replay to start again.'
        : 'Tap or click a tile, then choose a + position or New row. To touch-drag, hold a tile briefly, then move it. Swipe row whitespace to scroll.';
  }

  function render(focusId) {
    touch?.cancel();
    const { state, selected, completed } = session.snapshot();
    const board = find('#board-rows');
    board.replaceChildren();
    state.board.forEach((tiles, index) => {
      const container = document.createElement('div');
      container.className = 'board-row';
      container.tabIndex = 0;
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', `Board row ${index + 1}`);
      const label = document.createElement('p');
      label.className = 'board-row-label';
      const validity = classifyRow(tiles);
      label.textContent = `Row ${index + 1} · ${tiles.length === 0 ? 'Empty' : validity.valid ? 'Valid' : validity.reason}`;
      const list = document.createElement('ul');
      list.className = 'tile-row';
      list.setAttribute('aria-label', `Tiles in row ${index + 1}`);
      renderTileRow(tiles, list, { location: { area: 'board', row: index },
        label: `row ${index + 1}`, selected, locked: completed });
      container.append(label, list);
      board.append(container);
    });
    renderTileRow(state.rack, find('#rack-tiles'), {
      location: { area: 'rack' }, label: 'rack', selected, locked: completed,
    });
    document.querySelector('#rack-count').textContent = state.rack.length;
    find('#replay-code').textContent =
      `rummipuz:${state.version}:${state.generatorVersion}:${state.difficultyTier}:${state.seed}`;
    undo.disabled = completed || state.history.length === 0;
    reset.disabled = !completed && state.history.length === 0;
    reset.textContent = completed ? 'Replay' : 'Reset';
    newRow.hidden = completed;
    check.disabled = completed;
    paintSelection();
    focusTile(focusId);
  }

  function afterMove(id) {
    resetPanel.hidden = true;
    render(id);
    status.textContent = checkState(session.snapshot().state).won
      ? 'Ready to check. Select Check to finish.' : 'Tile placed. Temporary invalid rows are allowed.';
  }

  function onClick(event) {
    touch.cancel();
    const tile = event.target.closest('[data-tile-id]');
    if (tile && content.contains(tile)) {
      session.select(tile.dataset.tileId);
      paintSelection();
      return;
    }
    const target = event.target.closest('[data-destination]');
    if (target && content.contains(target) && !target.disabled) {
      const id = session.snapshot().selected;
      if (session.place(JSON.parse(target.dataset.destination))) afterMove(id);
    }
  }

  function onDragStart(event) {
    if (event.defaultPrevented) return;
    const tile = event.target.closest('[data-tile-id]');
    if (!tile || !event.dataTransfer || !session.beginDrag(tile.dataset.tileId)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(dragType, tile.dataset.tileId);
    event.dataTransfer.effectAllowed = 'move';
    paintSelection(); // Preserve the native drag source node.
  }

  function onDragOver(event) {
    const target = event.target.closest('[data-destination]');
    if (!session.snapshot().dragging || !target || target.disabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function onDrop(event) {
    const target = event.target.closest('[data-destination]');
    if (!target || target.disabled || !event.dataTransfer) return;
    event.preventDefault();
    const id = event.dataTransfer.getData(dragType);
    if (session.drop(id, JSON.parse(target.dataset.destination))) afterMove(id);
  }

  function onDragEnd() {
    if (session.snapshot().dragging) {
      session.cancel();
      paintSelection();
      status.textContent = 'Drag cancelled. No tiles moved.';
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      touch.cancel();
      session.cancel();
      paintSelection();
      if (!resetPanel.hidden) { resetPanel.hidden = true; reset.focus(); }
    }
  }

  content.addEventListener('click', onClick);
  content.addEventListener('dragstart', onDragStart);
  content.addEventListener('dragover', onDragOver);
  content.addEventListener('drop', onDrop);
  content.addEventListener('dragend', onDragEnd);
  content.addEventListener('keydown', onKeyDown);
  undo.addEventListener('click', () => {
    session.undo(); resetPanel.hidden = true; render();
    (undo.disabled ? check : undo).focus();
    status.textContent = 'Move undone.';
  });
  cancel.addEventListener('click', () => { session.cancel(); paintSelection(); });
  reset.addEventListener('click', () => {
    if (session.snapshot().completed) {
      session.reset(); render(); status.textContent = 'Sample restarted.'; check.focus();
    } else {
      resetPanel.hidden = false;
      find('#confirm-reset').focus();
    }
  });
  find('#keep-playing').addEventListener('click', () => { resetPanel.hidden = true; reset.focus(); });
  find('#confirm-reset').addEventListener('click', () => {
    session.reset(); resetPanel.hidden = true; render(); check.focus();
    status.textContent = 'Puzzle reset to its starting position.';
  });
  check.addEventListener('click', () => {
    const result = session.check();
    resetPanel.hidden = true;
    render();
    status.textContent = result.won ? 'Puzzle complete! Every tile is placed in a valid row.'
      : [...result.errors, `${result.remainingRack} tiles remain in the rack.`,
        ...result.invalidRows.map(({ row, reason }) => `Row ${row + 1}: ${reason}`)].join(' ');
    (result.won ? reset : check).focus();
  });
  touch = initialiseTouch({ content, status, session, paintSelection, afterMove });
  render();
  return session;
}
