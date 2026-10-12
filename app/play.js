import { renderTileRow } from './tiles.js';
import { classifyRow, parseTile } from './rules.js';
import { checkState } from './state.js';
import { createPlaySession } from './play-session.js';
import { initialiseTouch } from './touch.js';
import { createOverflowControls } from './overflow.js';

const dragType = 'application/x-rummipuz-tile';

export function initialisePlay({ content, status, state, completed = false, onChange }) {
  const session = createPlaySession(state, { completed, onChange });
  const document = content.ownerDocument;
  const find = (selector) => content.querySelector(selector);
  const resetPanel = find('#reset-confirmation');
  const undo = find('#undo-move');
  const reset = find('#reset-puzzle');
  const newRow = find('#new-row');
  const cancel = find('#cancel-selection');
  const check = find('#check-puzzle');
  const listeners = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  let touch;
  let rowOverflow = [];
  const rackOverflow = createOverflowControls(find('.rack-scroll'), 'rack');

  function captureScroll(scroller) {
    const bounds = scroller.getBoundingClientRect();
    const tiles = [...scroller.querySelectorAll('[data-tile-id]')].map((tile) => ({
      id: tile.dataset.tileId,
      offset: tile.getBoundingClientRect().left - bounds.left,
    }));
    if (!tiles.length) return null;
    const visible = tiles
      .map((tile, index) => ({ ...tile, index }))
      .filter(({ offset }) => offset < scroller.clientWidth && offset + 64 > 0);
    const anchor = visible.reduce((best, tile) =>
      !best || Math.abs(tile.offset) < Math.abs(best.offset) ? tile : best, null)
      ?? { ...tiles[0], index: 0 };
    return {
      tiles,
      anchorIndex: anchor.index,
      atEnd: scroller.scrollWidth > scroller.clientWidth &&
        scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1,
    };
  }

  function restoreScroll(scroller, controls, snapshot) {
    if (!snapshot) return;
    if (snapshot.atEnd) {
      controls.restoreScrollLeft(scroller.scrollWidth - scroller.clientWidth);
      return;
    }
    const currentIds = new Set([...scroller.querySelectorAll('[data-tile-id]')]
      .map((tile) => tile.dataset.tileId));
    const nearby = snapshot.tiles
      .map((tile, index) => ({ ...tile, distance: Math.abs(index - snapshot.anchorIndex),
        side: index < snapshot.anchorIndex ? 0 : 1 }))
      .filter(({ id }) => currentIds.has(id))
      .sort((a, b) => a.distance - b.distance || a.side - b.side);
    const retained = nearby[0];
    if (!retained) return;
    const tile = [...scroller.querySelectorAll('[data-tile-id]')]
      .find((candidate) => candidate.dataset.tileId === retained.id);
    const bounds = scroller.getBoundingClientRect();
    const offset = tile.getBoundingClientRect().left - bounds.left;
    controls.restoreScrollLeft(scroller.scrollLeft + offset - retained.offset);
  }

  function matchRowScroll(oldRows, newRows) {
    const matches = [];
    oldRows.forEach((snapshot, oldIndex) => {
      if (!snapshot) return;
      const oldIds = new Set(snapshot.tiles.map(({ id }) => id));
      newRows.forEach((row, newIndex) => {
        const overlap = [...row.scroller.querySelectorAll('[data-tile-id]')]
          .reduce((count, tile) => count + Number(oldIds.has(tile.dataset.tileId)), 0);
        if (overlap) matches.push({ oldIndex, newIndex, overlap });
      });
    });
    matches.sort((a, b) => b.overlap - a.overlap);
    const usedOld = new Set();
    const usedNew = new Set();
    for (const match of matches) {
      if (usedOld.has(match.oldIndex) || usedNew.has(match.newIndex)) continue;
      usedOld.add(match.oldIndex);
      usedNew.add(match.newIndex);
      restoreScroll(newRows[match.newIndex].scroller, newRows[match.newIndex].controls,
        oldRows[match.oldIndex]);
    }
  }

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
    const oldRows = [...board.querySelectorAll('.board-row')].map(captureScroll);
    const rackScroll = captureScroll(find('.rack-scroll'));
    for (const controls of rowOverflow) controls.dispose();
    rowOverflow = [];
    board.replaceChildren();
    const newRows = [];
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
      const controls = createOverflowControls(container, `row ${index + 1}`);
      rowOverflow.push(controls);
      newRows.push({ scroller: container, controls });
    });
    matchRowScroll(oldRows, newRows);
    renderTileRow(state.rack, find('#rack-tiles'), {
      location: { area: 'rack' }, label: 'rack', selected, locked: completed,
    });
    rackOverflow.refresh();
    restoreScroll(find('.rack-scroll'), rackOverflow, rackScroll);
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

  listen(content, 'click', onClick);
  listen(content, 'dragstart', onDragStart);
  listen(content, 'dragover', onDragOver);
  listen(content, 'drop', onDrop);
  listen(content, 'dragend', onDragEnd);
  listen(content, 'keydown', onKeyDown);
  listen(undo, 'click', () => {
    session.undo(); resetPanel.hidden = true; render();
    (undo.disabled ? check : undo).focus();
    status.textContent = 'Move undone.';
  });
  listen(cancel, 'click', () => { session.cancel(); paintSelection(); });
  listen(reset, 'click', () => {
    if (session.snapshot().completed) {
      session.reset(); render(); status.textContent = 'Puzzle restarted.'; check.focus();
    } else {
      resetPanel.hidden = false;
      find('#confirm-reset').focus();
    }
  });
  listen(find('#keep-playing'), 'click', () => { resetPanel.hidden = true; reset.focus(); });
  listen(find('#confirm-reset'), 'click', () => {
    session.reset(); resetPanel.hidden = true; render(); check.focus();
    status.textContent = 'Puzzle reset to its starting position.';
  });
  listen(check, 'click', () => {
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
  return { ...session, dispose() {
    touch.dispose();
    listeners.forEach((remove) => remove());
    rowOverflow.forEach((controls) => controls.dispose());
    rackOverflow.dispose();
    resetPanel.hidden = true;
  } };
}
