import { renderTileRow } from './tiles.js';
import { classifyRow, parseTile } from './rules.js';
import { checkState } from './state.js';
import { createPlaySession } from './play-session.js';
import { initialiseTouch } from './touch.js';
import { createOverflowControls } from './overflow.js';

const dragType = 'application/x-rummipuz-tile';
const SOLUTION_NODE_LIMIT = 1_000_000;

export function initialisePlay({ content, status, state, completed = false, onChange, solve }) {
  const session = createPlaySession(state, { completed, onChange });
  const document = content.ownerDocument;
  const find = (selector) => content.querySelector(selector);
  const resetPanel = find('#reset-confirmation');
  const undo = find('#undo-move');
  const reset = find('#reset-puzzle');
  const newRow = find('#new-row');
  const cancel = find('#cancel-selection');
  const check = find('#check-puzzle');
  const reveal = find('#reveal-solution');
  const solutionDialog = find('#solution-dialog');
  const solutionStatus = find('#solution-status');
  const solutionRows = find('#solution-rows');
  const cancelSolutionButton = find('#cancel-solution');
  const retrySolutionButton = find('#retry-solution');
  const listeners = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  let touch;
  let rowOverflow = [];
  const rowScroll = new Map();
  let solutionOverflow = [];
  let solutionController = null;
  let solutionRequest = 0;
  let solutionBoard = null;
  const rackOverflow = createOverflowControls(find('.rack-scroll'), 'rack');

  function clearSolutionRows() {
    solutionOverflow.forEach((controls) => controls.dispose());
    solutionOverflow = [];
    solutionRows.replaceChildren();
  }

  function renderSolution(board) {
    clearSolutionRows();
    board.forEach((tiles, index) => {
      const row = document.createElement('div');
      row.className = 'board-row solution-row';
      row.tabIndex = 0;
      row.setAttribute('role', 'region');
      row.setAttribute('aria-label', `Solution row ${index + 1}`);
      const label = document.createElement('p');
      label.className = 'solution-row-label';
      label.textContent = `Row ${index + 1}`;
      const list = document.createElement('ul');
      list.className = 'tile-row';
      list.setAttribute('aria-label', `Tiles in solution row ${index + 1}`);
      renderTileRow(tiles, list);
      row.append(label, list);
      solutionRows.append(row);
      solutionOverflow.push(createOverflowControls(row, `solution row ${index + 1}`));
    });
    solutionOverflow.forEach((controls) => controls.refresh());
  }

  function verifiedSolution(currentState, board) {
    if (!Array.isArray(board) || board.length === 0 || board.some((row) => !Array.isArray(row) || row.length === 0)) {
      return false;
    }
    const result = checkState({ inventory: currentState.inventory, rack: [], board });
    return result.conserved && result.won;
  }

  function cancelSolutionSearch({ announce = true } = {}) {
    if (!solutionController) return;
    const controller = solutionController;
    solutionController = null;
    solutionRequest += 1;
    controller.abort();
    cancelSolutionButton.hidden = true;
    if (announce && solutionDialog.open) {
      solutionStatus.textContent = 'Solution search cancelled. The puzzle is unchanged.';
      retrySolutionButton.hidden = false;
    }
  }

  async function requestSolution() {
    const currentState = session.snapshot().state;
    if (!checkState(currentState).conserved) {
      solutionStatus.textContent = 'The puzzle inventory is inconsistent. Restart the puzzle before requesting a solution.';
      cancelSolutionButton.hidden = true;
      retrySolutionButton.hidden = false;
      return;
    }
    if (typeof solve !== 'function') {
      solutionStatus.textContent = 'Solution search is unavailable in this browser. The puzzle is unchanged.';
      retrySolutionButton.hidden = false;
      return;
    }
    if (solutionController) cancelSolutionSearch({ announce: false });
    const controller = new AbortController();
    const token = ++solutionRequest;
    solutionController = controller;
    solutionBoard = null;
    clearSolutionRows();
    solutionStatus.textContent = 'Searching for a complete solution… The puzzle is unchanged.';
    cancelSolutionButton.hidden = false;
    retrySolutionButton.hidden = true;
    try {
      const result = await solve(currentState, { signal: controller.signal, maxNodes: SOLUTION_NODE_LIMIT });
      if (token !== solutionRequest || !solutionDialog.open || controller.signal.aborted
          || session.snapshot().state !== currentState) return;
      solutionController = null;
      cancelSolutionButton.hidden = true;
      if (result?.status === 'limit') {
        solutionStatus.textContent = 'The search reached its work limit before proving a result. You can try again; the puzzle is unchanged.';
        retrySolutionButton.hidden = false;
        return;
      }
      if (result?.status === 'unsolvable') {
        solutionStatus.textContent = 'No complete solution exists for this tile inventory. The puzzle is unchanged.';
        retrySolutionButton.hidden = false;
        return;
      }
      if (result?.status !== 'solved' || !verifiedSolution(currentState, result.board)) {
        solutionStatus.textContent = 'A complete solution could not be verified. You can try again; the puzzle is unchanged.';
        retrySolutionButton.hidden = false;
        return;
      }
      solutionBoard = result.board.map((row) => [...row]);
      renderSolution(solutionBoard);
      solutionStatus.textContent = `Verified solution: all ${currentState.inventory.length} tiles are placed in valid rows, and the rack is empty. This preview does not change the puzzle.`;
      retrySolutionButton.hidden = true;
    } catch (error) {
      if (token !== solutionRequest || !solutionDialog.open) return;
      solutionController = null;
      cancelSolutionButton.hidden = true;
      solutionStatus.textContent = error.name === 'AbortError'
        ? 'Solution search cancelled. The puzzle is unchanged.'
        : 'Solution search failed before a result could be verified. You can try again; the puzzle is unchanged.';
      retrySolutionButton.hidden = false;
    }
  }

  function openSolution() {
    if (solutionDialog.open) return;
    solutionDialog.showModal();
    find('#solution-title').focus({ preventScroll: true });
    if (solutionBoard) {
      renderSolution(solutionBoard);
      solutionStatus.textContent = `Verified solution: all ${session.snapshot().state.inventory.length} tiles are placed in valid rows, and the rack is empty. This preview does not change the puzzle.`;
      retrySolutionButton.hidden = true;
    } else void requestSolution();
  }

  function closeSolution() {
    if (solutionController) cancelSolutionSearch({ announce: false });
    if (solutionDialog.open) solutionDialog.close();
  }

  function onSolutionClose() {
    if (solutionController) cancelSolutionSearch({ announce: false });
    reveal.focus({ preventScroll: true });
  }

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
    const { state, selected, completed, rows } = session.snapshot();
    const board = find('#board-rows');
    for (const row of board.querySelectorAll('.board-row')) {
      rowScroll.set(row.dataset.rowId, captureScroll(row));
    }
    const rackScroll = captureScroll(find('.rack-scroll'));
    for (const controls of rowOverflow) controls.dispose();
    rowOverflow = [];
    board.replaceChildren();
    rows.forEach(({ tiles, stateRow, number, id }) => {
      const container = document.createElement('div');
      container.className = 'board-row';
      container.dataset.rowId = id;
      container.tabIndex = 0;
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', `Board row ${number}`);
      const label = document.createElement('p');
      label.className = 'board-row-label';
      const validity = classifyRow(tiles);
      label.textContent = `Row ${number} · ${validity.valid ? 'Valid' : validity.reason}`;
      const list = document.createElement('ul');
      list.className = 'tile-row';
      list.setAttribute('aria-label', `Tiles in row ${number}`);
      renderTileRow(tiles, list, { location: session.destination({ area: 'board', row: stateRow }),
        label: `row ${number}`, selected, locked: completed });
      container.append(label, list);
      board.append(container);
      const controls = createOverflowControls(container, `row ${number}`);
      rowOverflow.push(controls);
      restoreScroll(container, controls, rowScroll.get(id));
    });
    renderTileRow(state.rack, find('#rack-tiles'), {
      location: session.destination({ area: 'rack' }), label: 'rack', selected, locked: completed,
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
    newRow.dataset.destination = JSON.stringify(session.destination({ area: 'new-row' }));
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
    const rows = session.snapshot().rows;
    status.textContent = result.won ? 'Puzzle complete! Every tile is placed in a valid row.'
      : [...result.errors, `${result.remainingRack} tiles remain in the rack.`,
        ...result.invalidRows.map(({ row, reason }) =>
          `Row ${rows.find(({ stateRow }) => stateRow === row).number}: ${reason}`)].join(' ');
    (result.won ? reset : check).focus();
  });
  listen(reveal, 'click', openSolution);
  listen(find('#close-solution'), 'click', closeSolution);
  listen(cancelSolutionButton, 'click', () => cancelSolutionSearch());
  listen(retrySolutionButton, 'click', () => void requestSolution());
  listen(solutionDialog, 'close', onSolutionClose);
  touch = initialiseTouch({ content, status, session, paintSelection, afterMove });
  render();
  return { ...session, dispose() {
    cancelSolutionSearch({ announce: false });
    if (solutionDialog.open) solutionDialog.close();
    touch.dispose();
    listeners.forEach((remove) => remove());
    rowOverflow.forEach((controls) => controls.dispose());
    solutionOverflow.forEach((controls) => controls.dispose());
    rackOverflow.dispose();
    resetPanel.hidden = true;
  } };
}
