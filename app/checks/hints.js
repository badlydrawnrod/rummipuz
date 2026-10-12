import { initialiseHints } from '../hints.js';
import { createPlaySession } from '../play-session.js';
import { checkState, createGameState, moveTile } from '../state.js';

function makeDocument() {
  const document = { activeElement: null };
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.parent = null;
      this.dataset = {};
      this.attributes = {};
      this.listeners = new Map();
      this.hidden = false;
      this.disabled = false;
      this.textContent = '';
      this.className = '';
      this.classList = {
        add: (name) => { if (!this.classList.contains(name)) this.className = `${this.className} ${name}`.trim(); },
        remove: (name) => { this.className = this.className.split(/\s+/).filter((item) => item !== name).join(' '); },
        contains: (name) => this.className.split(/\s+/).includes(name),
      };
    }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    removeAttribute(name) { delete this.attributes[name]; }
    append(...elements) { for (const element of elements) { element.remove(); element.parent = this; this.children.push(element); } }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
    replaceChildren(...elements) { for (const child of [...this.children]) child.remove(); this.append(...elements); }
    matches(selector) {
      if (selector.startsWith('#')) return this.id === selector.slice(1);
      if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
      const attr = selector.match(/^\[data-([a-z-]+)\]$/);
      return attr ? this.dataset[attr[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] !== undefined : false;
    }
    querySelectorAll(selector) {
      return this.children.flatMap((child) => [
        ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
      ]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
    click() { for (const listener of this.listeners.get('click') ?? []) listener({ target: this }); }
    focus(options) { document.activeElement = this; this.focusOptions = options; }
  }
  document.createElement = (tag) => new Element(tag);
  return { document, Element };
}

function makeHarness(state, completed = false) {
  const { document, Element } = makeDocument();
  const content = new Element('main');
  content.ownerDocument = document;
  const byId = new Map();
  const make = (id, tag = 'button') => {
    const element = new Element(tag);
    element.id = id;
    byId.set(id, element);
    content.append(element);
    return element;
  };
  const trigger = make('hint-puzzle');
  const panel = make('hint-panel', 'section'); panel.hidden = true;
  const status = make('hint-status', 'p');
  const reason = make('hint-reason', 'p');
  const showTile = make('show-hint-tile'); showTile.hidden = true;
  const showDestination = make('show-hint-destination'); showDestination.hidden = true;
  const dismiss = make('dismiss-hint');
  const retry = make('retry-hint'); retry.hidden = true;
  const rack = new Element('div'); rack.className = 'rack-scroll'; content.append(rack);
  const board = make('board-rows', 'div');
  const session = createPlaySession(state, { completed });
  const snapshot = session.snapshot();
  for (const id of state.rack) {
    const tile = new Element('button'); tile.dataset.tileId = id; tile.setAttribute('aria-label', id);
    rack.append(tile);
  }
  for (let index = 0; index <= state.rack.length; index += 1) {
    const target = new Element('button'); target.dataset.destination = JSON.stringify({ area: 'rack', index }); rack.append(target);
  }
  snapshot.rows.forEach(({ stateRow, tiles }) => {
    const row = new Element('div'); row.dataset.row = stateRow; board.append(row);
    for (const id of tiles) {
      const tile = new Element('button'); tile.dataset.tileId = id; tile.setAttribute('aria-label', id); row.append(tile);
    }
    for (let index = 0; index <= tiles.length; index += 1) {
      const target = new Element('button');
      target.dataset.destination = JSON.stringify({ area: 'board', row: stateRow, index });
      row.append(target);
    }
  });
  const newRow = make('new-row');
  newRow.dataset.destination = JSON.stringify({ area: 'new-row' });
  content.querySelector = (selector) => byId.get(selector.startsWith('#') ? selector.slice(1) : '')
    ?? (selector === '.rack-scroll' ? rack : null);
  return { content, panel, status, reason, trigger, showTile, showDestination, dismiss, retry,
    rack, board, newRow, session, document };
}

const waitTurn = () => Promise.resolve().then(() => Promise.resolve());

export async function runHintChecks(sample) {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const targetBoard = sample.solution.board.map((row) => [...row]);
  const resultFor = (id = 'red-6-1', destination = { area: 'board', row: 1, index: 3 }) => ({
    status: 'solved', board: targetBoard, moves: [{ id, destination, reason: 'It extends the run.' }],
  });

  let state = createGameState(sample);
  for (const id of [...state.board[0]].reverse()) state = moveTile(state, id, { area: 'rack', index: 0 });
  const h = makeHarness(state);
  const source = h.rack.querySelectorAll('[data-tile-id]').find((node) => node.dataset.tileId === 'red-6-1');
  const destination = h.board.querySelectorAll('[data-destination]').find((node) => {
    const value = JSON.parse(node.dataset.destination);
    return value.row === 1 && value.index === 3;
  });
  source.setAttribute('aria-describedby', 'existing-source-description');
  destination.setAttribute('aria-describedby', 'existing-gap-description');
  destination.setAttribute('aria-label', 'Place in row 1, position 4');
  destination.disabled = true;
  const beforeState = h.session.snapshot().state;
  const beforeHistory = beforeState.history.length;
  let searches = 0;
  const revealed = [];
  const hints = initialiseHints({ content: h.content, session: h.session,
    requestAssistance: async () => { searches += 1; return resultFor(); },
    revealElement: (element) => revealed.push(element) });
  h.trigger.click(); await waitTurn();
  assert(h.panel.hidden === false && h.status.textContent.includes('from your rack, position 7')
    && h.status.textContent.includes('into row 1, after Blue 5'),
  'Hint maps the hidden state row to its visible row and describes the insertion gap');
  assert(source.classList.contains('hint-source') && destination.classList.contains('hint-destination')
    && destination.disabled && destination.getAttribute('aria-label') === 'Place in row 1, position 4',
  'Hint highlights exact live controls without enabling or relabeling placement');
  assert(source.getAttribute('aria-describedby') === 'existing-source-description hint-status'
    && destination.getAttribute('aria-describedby') === 'existing-gap-description hint-status',
  'Hint adds its status description while preserving existing descriptions');
  assert(h.session.snapshot().state === beforeState && beforeState.history.length === beforeHistory
    && h.session.snapshot().selected === null && h.session.snapshot().completed === false,
  'Showing a hint does not change selection, board state, completion, or history');
  assert(checkState({ inventory: state.inventory, rack: [], board: targetBoard }).won, 'Test target is a conserved completed board');
  h.trigger.click(); await waitTurn();
  assert(searches === 1, 'Repeated Hint reuses the cached result without parallel searches');
  h.showTile.click();
  assert(source.classList.contains('hint-emphasis') && !destination.classList.contains('hint-emphasis')
    && h.session.snapshot().state === beforeState && h.session.snapshot().selected === null,
  'Show tile emphasises only the source without selecting or moving it');
  h.showDestination.click();
  assert(destination.classList.contains('hint-emphasis') && !source.classList.contains('hint-emphasis'),
    'Show destination transfers emphasis from the source to the exact insertion gap');
  assert(revealed.length === 2 && revealed[0] === source && revealed[1] === destination,
    'Show tile and Show destination reveal independently only after explicit clicks');
  h.dismiss.click();
  assert(h.panel.hidden && h.document.activeElement === h.trigger
    && h.trigger.focusOptions?.preventScroll === true && !source.classList.contains('hint-source')
    && !destination.classList.contains('hint-emphasis'),
  'Dismiss clears highlights and returns focus without scrolling');
  hints.dispose();

  let resolvePending;
  let pendingSignal;
  const lateHarness = makeHarness(createGameState(sample));
  const lateController = initialiseHints({ content: lateHarness.content, session: lateHarness.session,
    requestAssistance: (_state, { signal }) => { pendingSignal = signal; return new Promise((resolve) => { resolvePending = resolve; }); } });
  lateHarness.trigger.click();
  lateHarness.dismiss.click();
  assert(pendingSignal.aborted && lateHarness.panel.hidden, 'Dismiss during search aborts the pending worker request');
  resolvePending(resultFor('blue-6-1', { area: 'new-row' })); await waitTurn();
  assert(lateHarness.panel.hidden && !lateHarness.content.querySelector('#board-rows')
    .querySelectorAll('[data-tile-id]').some((node) => node.classList.contains('hint-source')),
  'A late response after dismissal cannot show stale highlights');
  lateController.dispose();

  let resolveOld;
  let oldSignal;
  const changing = makeHarness(createGameState(sample));
  const staleController = initialiseHints({ content: changing.content, session: changing.session,
    requestAssistance: (_state, { signal }) => { oldSignal = signal; return new Promise((resolve) => { resolveOld = resolve; }); } });
  changing.trigger.click();
  changing.session.select('red-6-1'); changing.session.place(changing.session.destination({ area: 'new-row' }));
  staleController.invalidate();
  assert(oldSignal.aborted && changing.panel.hidden, 'Invalidation cancels work and quietly clears stale hint UI');
  resolveOld(resultFor('blue-6-1', { area: 'new-row' })); await waitTurn();
  assert(changing.panel.hidden, 'A response for a replaced state is ignored');
  staleController.dispose();

  const limited = makeHarness(createGameState(sample));
  let limitCalls = 0;
  const budgets = [];
  const limitController = initialiseHints({ content: limited.content, session: limited.session,
    requestAssistance: async (_state, { maxNodes }) => {
      budgets.push(maxNodes);
      limitCalls += 1;
      return limitCalls === 1 ? { status: 'limit' } : resultFor('blue-6-1', { area: 'new-row' });
    } });
  limited.trigger.click(); await waitTurn();
  assert(limited.retry.hidden === false && /work limit/.test(limited.status.textContent), 'Work limit is reported truthfully with Retry');
  limited.retry.click(); await waitTurn();
  assert(limitCalls === 2 && budgets[0] === 200_000 && budgets[1] === 1_000_000
    && !limited.panel.hidden && limited.status.textContent.includes('into New row'),
  'Retry raises the work budget and displays a verified move');
  limitController.dispose();

  const failed = makeHarness(createGameState(sample));
  const failureController = initialiseHints({ content: failed.content, session: failed.session,
    requestAssistance: async () => { throw new Error('worker unavailable'); } });
  failed.trigger.click(); await waitTurn();
  assert(failed.retry.hidden === false && /search failed/.test(failed.status.textContent), 'Worker errors offer an honest Retry state');
  failureController.dispose();

  const unverified = makeHarness(createGameState(sample));
  const unverifiedController = initialiseHints({ content: unverified.content, session: unverified.session,
    requestAssistance: async () => ({ ...resultFor(), board: [['blue-1-1']] }) });
  unverified.trigger.click(); await waitTurn();
  assert(unverified.retry.hidden === false && !unverified.content.querySelector('#board-rows')
    .querySelectorAll('[data-tile-id]').some((node) => node.classList.contains('hint-source')),
  'An unverified target is rejected before it can highlight a move');
  unverifiedController.dispose();

  const noop = makeHarness(createGameState(sample));
  const noOpController = initialiseHints({ content: noop.content, session: noop.session,
    requestAssistance: async () => resultFor('blue-1-1', { area: 'board', row: 0, index: 0 }) });
  noop.trigger.click(); await waitTurn();
  assert(noop.retry.hidden === false && /could not be verified/.test(noop.status.textContent),
    'A no-op first move is rejected instead of being shown');
  noOpController.dispose();

  const readyState = targetState(sample);
  const ready = makeHarness(readyState);
  let readyCalls = 0;
  const readyController = initialiseHints({ content: ready.content, session: ready.session,
    requestAssistance: async () => { readyCalls += 1; return resultFor(); } });
  ready.trigger.click();
  assert(readyCalls === 0 && /Select Check to finish/.test(ready.status.textContent),
    'A solved but unchecked board points to Check without starting a search');
  readyController.dispose();

  const solved = targetState(sample);
  const completed = makeHarness(solved, true);
  const completedController = initialiseHints({ content: completed.content, session: completed.session,
    requestAssistance: async () => resultFor() });
  assert(completed.trigger.disabled, 'Completed puzzles disable Hint');
  completedController.dispose();

  const unavailable = makeHarness(createGameState(sample));
  const unavailableController = initialiseHints({ content: unavailable.content, session: unavailable.session });
  unavailable.trigger.click();
  assert(unavailable.retry.hidden === false && /unavailable/.test(unavailable.status.textContent), 'Missing assistance service reports that hints are unavailable');
  unavailableController.dispose();
  return passed;
}

function targetState(sample) {
  let state = createGameState(sample);
  state = moveTile(state, 'blue-6-1', { area: 'new-row' });
  state = moveTile(state, 'red-6-1', { area: 'board', row: 2, index: 1 });
  return moveTile(state, 'black-6-1', { area: 'board', row: 2, index: 2 });
}
