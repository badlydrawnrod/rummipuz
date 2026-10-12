import { parseTile } from './rules.js';
import { checkState, getTileLocations, moveTile } from './state.js';

const INITIAL_HINT_NODE_LIMIT = 200_000;
const RETRY_HINT_NODE_LIMIT = 1_000_000;

function addDescription(element, id) {
  const values = new Set((element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
  values.add(id);
  element.setAttribute('aria-describedby', [...values].join(' '));
}

function removeDescription(element, id) {
  const values = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((value) => value && value !== id);
  if (values.length) element.setAttribute('aria-describedby', values.join(' '));
  else element.removeAttribute('aria-describedby');
}

function sameDestination(left, right) {
  return left?.area === right?.area
    && (left.area !== 'board' || left.row === right.row)
    && left.index === right.index;
}

function destinationFor(move) {
  const destination = move?.destination;
  if (!destination || !['rack', 'board', 'new-row'].includes(destination.area)) return null;
  if (destination.area === 'new-row') return { area: 'new-row' };
  if (!Number.isInteger(destination.index) || destination.index < 0) return null;
  if (destination.area === 'board' && (!Number.isInteger(destination.row) || destination.row < 0)) return null;
  return { area: destination.area, ...(destination.area === 'board' ? { row: destination.row } : {}), index: destination.index };
}

function getDestinationElement(content, destination) {
  if (destination.area === 'new-row') {
    const element = content.querySelector('#new-row');
    return element && !element.hidden ? element : null;
  }
  const root = destination.area === 'rack' ? content.querySelector('.rack-scroll') : content.querySelector('#board-rows');
  if (!root) return null;
  for (const element of root.querySelectorAll('[data-destination]')) {
    try {
      if (sameDestination(JSON.parse(element.dataset.destination), destination)) return element;
    } catch { /* Ignore malformed rendered destinations. */ }
  }
  return null;
}

function getSourceElement(content, id, location) {
  const root = location.area === 'rack' ? content.querySelector('.rack-scroll') : content.querySelector('#board-rows');
  if (!root) return null;
  return [...root.querySelectorAll('[data-tile-id]')].find((element) => element.dataset.tileId === id) ?? null;
}

function rowNumber(snapshot, stateRow) {
  return snapshot.rows.find((row) => row.stateRow === stateRow)?.number ?? null;
}

function tileName(id) {
  const tile = parseTile(id);
  return tile ? `${tile.colour[0].toUpperCase()}${tile.colour.slice(1)} ${tile.value}` : 'tile';
}

function sourcePhrase(location, snapshot) {
  if (location.area === 'rack') return `from your rack, position ${location.index + 1}`;
  const visible = rowNumber(snapshot, location.row);
  return visible === null ? null : `from row ${visible}, position ${location.index + 1}`;
}

function destinationPhrase(destination, state, snapshot) {
  if (destination.area === 'new-row') return 'into New row';
  const tiles = destination.area === 'rack' ? state.rack : state.board[destination.row];
  if (!tiles) return null;
  if (destination.area === 'rack') return `back to your rack, position ${destination.index + 1}`;
  const visible = rowNumber(snapshot, destination.row);
  if (visible === null) return null;
  const before = tiles[destination.index - 1];
  const after = tiles[destination.index];
  const gap = before && after ? `between ${tileName(before)} and ${tileName(after)}`
    : after ? `before ${tileName(after)}`
      : before ? `after ${tileName(before)}` : 'at the start';
  return `into row ${visible}, ${gap}`;
}

/**
 * Add a non-mutating, inline hint flow to the live play controls.
 * requestAssistance(state, { signal, maxNodes }) returns a verified target and
 * one or more physical-tile moves. Highlight scrolling is always user-driven.
 */
export function initialiseHints({ content, session, requestAssistance, revealElement }) {
  const find = (selector) => content.querySelector(selector);
  const trigger = find('#hint-puzzle');
  const panel = find('#hint-panel');
  const status = find('#hint-status');
  const reason = find('#hint-reason');
  const showTile = find('#show-hint-tile');
  const showDestination = find('#show-hint-destination');
  const dismiss = find('#dismiss-hint');
  const retry = find('#retry-hint');
  if (![trigger, panel, status, reason, showTile, showDestination, dismiss, retry].every(Boolean)) {
    throw new Error('Hint controls are missing from the play view.');
  }

  let requestToken = 0;
  let controller = null;
  let inFlightState = null;
  let retryNodeLimit = INITIAL_HINT_NODE_LIMIT;
  let cachedState = null;
  let cachedHint = null;
  let sourceElement = null;
  let destinationElement = null;
  let disposed = false;
  const listeners = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };

  function clearHighlights() {
    for (const [element, className] of [[sourceElement, 'hint-source'], [destinationElement, 'hint-destination']]) {
      if (!element) continue;
      element.classList.remove(className);
      element.classList.remove('hint-emphasis');
      removeDescription(element, 'hint-status');
    }
    sourceElement = null;
    destinationElement = null;
  }

  function hideActions() {
    showTile.hidden = true;
    showDestination.hidden = true;
  }

  function stopSearch({ announce = false } = {}) {
    if (!controller) return;
    const active = controller;
    controller = null;
    inFlightState = null;
    requestToken += 1;
    active.abort();
    if (announce) {
      panel.hidden = false;
      status.textContent = 'Hint search cancelled. The puzzle is unchanged.';
      reason.textContent = '';
      retry.hidden = false;
      hideActions();
    }
  }

  function hidePanel({ returnFocus = false } = {}) {
    stopSearch();
    clearHighlights();
    panel.hidden = true;
    reason.textContent = '';
    hideActions();
    retry.hidden = true;
    if (returnFocus) trigger.focus({ preventScroll: true });
  }

  function updateReadiness() {
    const snapshot = session.snapshot();
    trigger.disabled = Boolean(snapshot.completed);
  }

  function showHint(hint) {
    const snapshot = session.snapshot();
    if (snapshot.state !== hint.state || snapshot.completed) return false;
    const move = hint.move;
    const locations = getTileLocations(snapshot.state);
    const location = locations.get(move.id)?.[0];
    if (!location) return false;
    const source = getSourceElement(content, move.id, location);
    const destination = getDestinationElement(content, move.destination);
    const from = sourcePhrase(location, snapshot);
    const to = destinationPhrase(move.destination, snapshot.state, snapshot);
    if (!source || !destination || !from || !to) return false;

    clearHighlights();
    sourceElement = source;
    destinationElement = destination;
    source.classList.add('hint-source');
    destination.classList.add('hint-destination');
    addDescription(source, 'hint-status');
    addDescription(destination, 'hint-status');
    status.textContent = `Move ${tileName(move.id)} ${from} ${to}.`;
    reason.textContent = move.reason || 'This move makes progress toward a complete solution.';
    panel.hidden = false;
    retry.hidden = true;
    showTile.hidden = false;
    showDestination.hidden = false;
    return true;
  }

  function prepareResult(state, result) {
    if (result?.status !== 'solved' || !Array.isArray(result.moves) || result.moves.length === 0
        || !Array.isArray(result.board) || result.board.length === 0
        || result.board.some((row) => !Array.isArray(row) || row.length === 0)
        || !checkState({ inventory: state.inventory, rack: [], board: result.board }).won) return null;
    const move = result.moves[0];
    const destination = destinationFor(move);
    if (typeof move?.id !== 'string' || !parseTile(move.id) || !destination
        || (move.reason !== undefined && typeof move.reason !== 'string')) return null;
    const location = getTileLocations(state).get(move.id);
    if (!location || location.length !== 1) return null;
    let preview;
    try { preview = moveTile(state, move.id, destination); } catch { return null; }
    if (preview === state || !checkState(preview).conserved) return null;
    return { state, move: { id: move.id, destination, reason: move.reason ?? '' }, board: result.board };
  }

  async function requestHint() {
    if (disposed) return;
    const snapshot = session.snapshot();
    trigger.disabled = Boolean(snapshot.completed);
    if (snapshot.completed) return;
    panel.hidden = false;
    clearHighlights();
    hideActions();
    retry.hidden = true;

    if (checkState(snapshot.state).won) {
      status.textContent = 'Select Check to finish.';
      reason.textContent = '';
      return;
    }
    if (!checkState(snapshot.state).conserved) {
      status.textContent = 'The puzzle inventory is inconsistent. Restart before asking for a hint.';
      reason.textContent = '';
      retry.hidden = false;
      return;
    }
    if (cachedState === snapshot.state && cachedHint) {
      status.textContent = '';
      if (!showHint(cachedHint)) {
        cachedState = null;
        cachedHint = null;
        status.textContent = 'The suggested move is no longer available. Try searching again.';
        retry.hidden = false;
      }
      return;
    }
    if (controller && inFlightState === snapshot.state) {
      status.textContent = 'Finding a helpful move…';
      reason.textContent = '';
      return;
    }
    stopSearch();
    if (typeof requestAssistance !== 'function') {
      status.textContent = 'Hint search is unavailable in this browser. The puzzle is unchanged.';
      reason.textContent = '';
      retry.hidden = false;
      return;
    }

    const active = new AbortController();
    const token = ++requestToken;
    controller = active;
    inFlightState = snapshot.state;
    status.textContent = 'Finding a helpful move…';
    reason.textContent = '';
    try {
      const result = await requestAssistance(snapshot.state, { signal: active.signal, maxNodes: retryNodeLimit });
      if (disposed || token !== requestToken || active.signal.aborted || session.snapshot().state !== snapshot.state) return;
      controller = null;
      inFlightState = null;
      if (result?.status === 'limit') {
        retryNodeLimit = RETRY_HINT_NODE_LIMIT;
        status.textContent = 'The search reached its work limit before finding a verified move. You can try again; the puzzle is unchanged.';
        retry.hidden = false;
        return;
      }
      if (result?.status === 'unsolvable') {
        status.textContent = 'No complete solution exists for this tile inventory. The puzzle is unchanged.';
        return;
      }
      const hint = prepareResult(snapshot.state, result);
      if (!hint) {
        status.textContent = 'A helpful move could not be verified. You can try again; the puzzle is unchanged.';
        retry.hidden = false;
        return;
      }
      cachedState = snapshot.state;
      cachedHint = hint;
      retryNodeLimit = INITIAL_HINT_NODE_LIMIT;
      if (!showHint(hint)) {
        cachedState = null;
        cachedHint = null;
        status.textContent = 'The suggested move is not available in the current view. You can try again.';
        retry.hidden = false;
      }
    } catch (error) {
      if (disposed || token !== requestToken || active.signal.aborted
          || session.snapshot().state !== snapshot.state) return;
      controller = null;
      inFlightState = null;
      status.textContent = error?.name === 'AbortError'
        ? 'Hint search cancelled. The puzzle is unchanged.'
        : 'Hint search failed before a move could be verified. You can try again; the puzzle is unchanged.';
      retry.hidden = false;
    }
  }

  listen(trigger, 'click', () => void requestHint());
  listen(retry, 'click', () => void requestHint());
  listen(dismiss, 'click', () => hidePanel({ returnFocus: true }));
  function revealAndEmphasise(element) {
    if (!element) return;
    sourceElement?.classList.remove('hint-emphasis');
    destinationElement?.classList.remove('hint-emphasis');
    revealElement?.(element);
    // Flush the removed class so repeated clicks restart the short cue.
    void element.offsetWidth;
    element.classList.add('hint-emphasis');
  }
  listen(showTile, 'click', () => revealAndEmphasise(sourceElement));
  listen(showDestination, 'click', () => revealAndEmphasise(destinationElement));
  updateReadiness();

  return {
    refresh() {
      updateReadiness();
      if (!panel.hidden && cachedState === session.snapshot().state && cachedHint) showHint(cachedHint);
    },
    cancelPending() {
      if (controller) stopSearch({ announce: true });
    },
    invalidate() {
      stopSearch();
      cachedState = null;
      cachedHint = null;
      retryNodeLimit = INITIAL_HINT_NODE_LIMIT;
      clearHighlights();
      panel.hidden = true;
      reason.textContent = '';
      hideActions();
      retry.hidden = true;
      updateReadiness();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopSearch();
      clearHighlights();
      listeners.forEach((remove) => remove());
      panel.hidden = true;
      updateReadiness();
    },
  };
}
