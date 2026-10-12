import { initialisePlay } from '../play.js';
import { createGameState, checkState } from '../state.js';
import { planAssistance } from '../assistance.js';

// Exercise the real renderer/event handlers in a small DOM harness. Geometry
// models fixed tile widths; actual browser layout and touch still need review.
export async function runPlayRenderChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  function harness(state, options = {}) {
    const events = (object) => Object.assign(object, {
      listeners: new Map(),
      addEventListener(type, fn) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
      },
      removeEventListener(type, fn) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== fn));
      },
      emit(type, target = this, values = {}) {
        const event = { target, detail: 0, stopImmediatePropagation() {}, stopPropagation() {}, preventDefault() {}, ...values };
        for (const fn of this.listeners.get(type) ?? []) fn(event);
      },
    });
    let sequence = 0;
    const frames = new Map();
    const view = events({
      requestAnimationFrame(fn) { frames.set(++sequence, fn); return sequence; },
      cancelAnimationFrame(id) { frames.delete(id); },
      setTimeout() { return ++sequence; }, clearTimeout() {},
      getComputedStyle: (element) => ({ columnGap: element?.className === 'tile-scroll-controls' ? '8px' : '4px' }),
    });
    const document = events({ defaultView: view, activeElement: null });
    class Element {
      constructor(tag) {
        events(this);
        this.tagName = tag;
        this.ownerDocument = document;
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.style = {};
        this.className = '';
        this.hidden = false;
        this.disabled = false;
        this.offset = 0;
        this.classList = {
          add: (name) => { if (!this.matches(`.${name}`)) this.className += ` ${name}`; },
          remove: (name) => { this.className = this.className.split(' ').filter((item) => item !== name).join(' '); },
          contains: (name) => this.matches(`.${name}`),
        };
      }
      setAttribute(key, value) { this.attributes[key] = value; }
      getAttribute(key) { return this.attributes[key] ?? null; }
      removeAttribute(key) { delete this.attributes[key]; }
      matches(selector) {
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
        const attr = selector.match(/^\[data-([a-z-]+)\]$/);
        if (attr) return this.dataset[attr[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] !== undefined;
        const tile = selector.match(/^\[data-tile-id="([^"]+)"\]$/);
        return tile ? this.dataset.tileId === tile[1] : false;
      }
      querySelectorAll(selector) {
        return this.children.flatMap((child) => [
          ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
        ]);
      }
      querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
      closest(selector) {
        return selector.split(',').some((part) => this.matches(part.trim())) ? this : this.parent?.closest(selector);
      }
      contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
      remove() {
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = null;
      }
      append(...nodes) { for (const node of nodes) { node.remove(); node.parent = this; this.children.push(node); } }
      replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this.append(...nodes); }
      before(node) {
        const parent = this.parent;
        node.remove(); node.parent = parent;
        parent.children.splice(parent.children.indexOf(this), 0, node);
      }
      replaceWith(node) {
        node.remove(); this.before(node); this.remove();
      }
      focus() { document.activeElement = this; }
      scrollIntoView(options) { this.revealed = options; }
      showModal() { this.open = true; }
      close() { this.open = false; this.emit('close'); }
      get clientWidth() { return 300; }
      get scrollWidth() {
        return Math.max(this.clientWidth, (this.querySelector('.tile-row')?.children ?? [])
          .reduce((sum, child) => sum + child.width + 4, 0));
      }
      get scrollLeft() { return this.offset; }
      set scrollLeft(value) { this.offset = Math.max(0, Math.min(value, this.scrollWidth - this.clientWidth)); }
      get width() { return this.matches('.placement-slot') ? 40 : 64; }
      getBoundingClientRect() {
        const slot = this.closest('.tile-slot, .placement-slot');
        const scroller = this.closest('.board-row, .rack-scroll');
        const left = slot ? slot.parent.children.slice(0, slot.parent.children.indexOf(slot))
          .reduce((sum, sibling) => sum + sibling.width + 4, 0) - scroller.scrollLeft : 0;
        return { left, right: left + this.width, width: this.width, top: 0, bottom: 100 };
      }
    }
    document.createElement = (tag) => new Element(tag);
    document.body = new Element('body');
    document.querySelector = (selector) => document.body.querySelector(selector);
    const content = new Element('main'); document.body.append(content);
    for (const id of ['reset-confirmation', 'undo-move', 'reset-puzzle', 'new-row', 'cancel-selection',
      'check-puzzle', 'reveal-solution', 'solution-dialog', 'solution-status', 'solution-rows',
      'cancel-solution', 'retry-solution', 'selection-status', 'board-rows', 'rack-count',
      'replay-code', 'confirm-reset', 'keep-playing', 'close-solution', 'hint-puzzle', 'hint-panel',
      'hint-status', 'hint-reason', 'show-hint-tile', 'show-hint-destination', 'dismiss-hint', 'retry-hint', 'solution-title']) {
      const node = new Element('button'); node.id = id; content.append(node);
    }
    const rack = new Element('div'); rack.className = 'rack-scroll';
    const tiles = new Element('ul'); tiles.className = 'tile-row'; tiles.id = 'rack-tiles';
    content.append(rack); rack.append(tiles);
    const status = new Element('p');
    const play = initialisePlay({ content, status, state, ...options });
    const find = (selector) => content.querySelector(selector);
    const click = (node) => {
      if (node.disabled) throw new Error('Attempted to click disabled control');
      if (node.dataset.tileId || node.dataset.destination) content.emit('click', node);
      else node.emit('click');
      const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn());
    };
    const moveToRack = (id) => {
      click(find(`[data-tile-id="${id}"]`)); click(rack.querySelector('[data-destination]'));
    };
    return { play, find, click, moveToRack, content, status, rack };
  }
  const initial = createGameState(sample);
  const h = harness(initial);
  const rows = () => h.find('#board-rows').querySelectorAll('.board-row');
  rows()[1].scrollLeft = rows()[1].scrollWidth - rows()[1].clientWidth;
  const retainedId = rows()[1].dataset.rowId;
  for (const id of initial.board[0]) h.moveToRack(id);
  assert(rows().length === 1 && rows()[0].dataset.rowId === retainedId
    && rows()[0].attributes['aria-label'] === 'Board row 1', 'Renderer collapses an emptied row and renumbers the surviving region');
  assert(rows()[0].scrollLeft === rows()[0].scrollWidth - rows()[0].clientWidth,
    'Surviving row retains its end viewport when the preceding row disappears');
  const gap = rows()[0].querySelector('[data-destination]');
  assert(JSON.parse(gap.dataset.destination).row === 1 && /row 1, position 1/.test(gap.attributes['aria-label']),
    'Visible placement label and hidden-placeholder state index agree');
  h.moveToRack(initial.board[1][0]);
  h.click(h.find('#check-puzzle'));
  assert(/Row 1:/.test(h.status.textContent) && !/Row 2:/.test(h.status.textContent),
    'Check reports the displayed invalid row number after collapse');
  for (const id of initial.board[1].slice(1)) h.moveToRack(id);
  assert(rows().length === 0 && h.content.querySelectorAll('#new-row').length === 1 && !h.find('#new-row').hidden,
    'An all-empty board shows exactly one New row destination without blank stacks');
  h.click(h.find('[data-tile-id="blue-6-1"]')); h.click(h.find('#new-row'));
  assert(rows().length === 1 && /Row 1/.test(rows()[0].closest('.row-shell').querySelector('.board-row-label').textContent)
    && rows()[0].querySelector('[data-tile-id]').dataset.tileId === 'blue-6-1',
    'Single New row creates a visible one-tile row from an all-empty board');
  h.click(h.find('#undo-move'));
  assert(rows().length === 0, 'Renderer hides the new row again after Undo');
  h.click(h.find('#undo-move'));
  assert(rows().length === 1, 'Renderer exposes a restored one-tile row after Undo');
  h.click(h.find('#reset-puzzle')); h.click(h.find('#confirm-reset'));
  assert(rows().length === initial.board.length && checkState(h.play.snapshot().state).conserved,
    'Confirmed Reset restores rendered initial rows and conserves all tiles');
  h.play.dispose();

  const long = harness(initial);
  const firstRow = () => long.find('#board-rows').querySelector('.board-row');
  firstRow().scrollLeft = firstRow().scrollWidth - firstRow().clientWidth;
  long.moveToRack(initial.board[0].at(-1));
  assert(firstRow().scrollLeft === firstRow().scrollWidth - firstRow().clientWidth,
    'Editing the end of a long row retains the new end after rendering');
  firstRow().scrollLeft = 160;
  const visibleTile = firstRow().querySelectorAll('[data-tile-id]')[1].dataset.tileId;
  const offset = long.find(`[data-tile-id="${visibleTile}"]`).getBoundingClientRect().left;
  long.moveToRack(initial.board[0].at(-2));
  assert(long.find(`[data-tile-id="${visibleTile}"]`).getBoundingClientRect().left === offset,
    'Editing a later tile retains a surviving physical tile and its viewport offset');
  long.play.dispose();

  const reordered = harness(initial);
  const boardRows = () => reordered.find('#board-rows').querySelectorAll('.board-row');
  const originalIds = boardRows().map((row) => row.dataset.rowId);
  boardRows()[0].scrollLeft = 160;
  boardRows()[1].scrollLeft = boardRows()[1].scrollWidth - boardRows()[1].clientWidth;
  const offsets = boardRows().map((row) => row.scrollLeft);
  const handle = reordered.content.querySelectorAll('[data-row-handle]')[0];
  assert(!handle.closest('.board-row') && !handle.dataset.tileId,
    'Dedicated row handles stay outside horizontal tile scrollers');
  const headings = reordered.content.querySelectorAll('.board-row-heading');
  assert(headings.every((heading) => heading.children[0].dataset.rowHandle
    && heading.querySelectorAll('[data-row-handle]').length === 1)
    && reordered.content.querySelectorAll('[data-row-move]').length === 0,
    'Each row header has one drag handle on the left and no up/down controls');
  assert(handle.querySelector('.row-grip').children.length === 6
    && handle.querySelector('.row-grip').attributes['aria-hidden'] === 'true'
    && /Drag row 1/.test(handle.attributes['aria-label']),
    'Six-dot grip is decorative and the handle retains its accessible drag label');
  const document = reordered.content.ownerDocument;
  const pointer = { pointerType: 'mouse', isPrimary: true, button: 0, pointerId: 1, clientX: 24 };
  document.emit('pointerdown', handle, { ...pointer, clientY: 10 });
  document.emit('pointermove', handle, { ...pointer, clientY: 90 });
  document.emit('pointerup', handle, { ...pointer, clientY: 90 });
  assert(boardRows().map((row) => row.dataset.rowId).join() === [...originalIds].reverse().join()
    && boardRows()[0].scrollLeft === offsets[1] && boardRows()[1].scrollLeft === offsets[0],
    'Handle drag reorders entire rows and retains both horizontal viewports');
  assert(JSON.stringify(reordered.play.snapshot().state.board) === JSON.stringify([...initial.board].reverse())
    && reordered.play.snapshot().state.history.length === 1,
    'Handle drag creates exactly one move without changing tile order');
  assert(reordered.content.ownerDocument.activeElement.dataset.rowHandle === originalIds[0],
    'Reordering returns focus to the moved row handle without scrolling');
  reordered.click(reordered.find('#undo-move'));
  assert(boardRows().map((row) => row.dataset.rowId).join() === originalIds.join()
    && boardRows().every((row, index) => row.scrollLeft === offsets[index]),
    'Undo restores row ordering and horizontal positions');
  for (const id of initial.board[0]) reordered.moveToRack(id);
  assert(boardRows().length === 1 && reordered.content.querySelectorAll('[data-row-handle]')[0].disabled,
    'Only visible rows control move availability after hidden-row collapse');
  reordered.play.dispose();

  let searches = 0;
  const preferredTargets = [];
  const hinted = harness(initial, { assist: async (state, options) => {
    searches += 1;
    preferredTargets.push(options.preferredBoard);
    return planAssistance(state, options);
  } });
  const settle = async () => { for (let tick = 0; tick < 8; tick += 1) await Promise.resolve(); };
  const liveRows = () => hinted.find('#board-rows').querySelectorAll('.board-row');
  hinted.click(hinted.find('[data-tile-id="red-6-1"]'));
  liveRows()[0].scrollLeft = 160;
  const beforeHintRows = liveRows().map((row) => row.scrollLeft);
  hinted.click(hinted.find('#hint-puzzle')); await settle();
  const firstSource = hinted.content.querySelector('.hint-source');
  const firstDestination = hinted.content.querySelector('.hint-destination');
  assert(!hinted.find('#hint-panel').hidden && firstSource && firstDestination
    && hinted.play.snapshot().selected === 'red-6-1' && hinted.play.snapshot().state === initial
    && liveRows().every((row, index) => row.scrollLeft === beforeHintRows[index]),
    'Hint highlights live controls without changing selection, history, or view positions');
  hinted.click(hinted.find('#show-hint-tile'));
  assert(liveRows().every((row, index) => row.scrollLeft === beforeHintRows[index]),
    'Revealing a rack source leaves unrelated board viewports unchanged');
  hinted.click(hinted.find('#reveal-solution')); await settle();
  const previewBoard = hinted.find('#solution-rows').querySelectorAll('.tile-row')
    .map((row) => row.querySelectorAll('[data-tile-id]').map((tile) => tile.dataset.tileId));
  assert(searches === 1 && checkState({ inventory: initial.inventory, rack: [], board: previewBoard }).won,
    'Reveal reuses Hint\'s verified arrangement without a second search');
  hinted.click(hinted.find('#close-solution'));
  assert(hinted.play.snapshot().state === initial && hinted.play.snapshot().selected === 'red-6-1'
    && firstSource.classList.contains('hint-source') && liveRows()[0].scrollLeft === beforeHintRows[0],
    'Closing shared-target Reveal preserves the live hint, selection, and board viewport');
  if (hinted.play.snapshot().selected !== firstSource.dataset.tileId) hinted.click(firstSource);
  hinted.click(firstDestination);
  assert(hinted.find('#hint-panel').hidden && !hinted.content.querySelector('.hint-source')
    && hinted.play.snapshot().state.history.length === 1,
    'Ordinary placement clears the hint and creates only the player\'s move history');
  hinted.click(hinted.find('#hint-puzzle')); await settle();
  assert(searches === 2 && Array.isArray(preferredTargets[1]) && !hinted.find('#hint-panel').hidden,
    'A fresh hint recomputes after progress using the previous verified target as a preference');
  hinted.click(hinted.find('#check-puzzle'));
  assert(!hinted.find('#hint-panel').hidden && hinted.content.contains(hinted.content.querySelector('.hint-source'))
    && hinted.content.contains(hinted.content.querySelector('.hint-destination')) && searches === 2,
    'Read-only Check rebinds hint highlights to the rendered controls without searching again');
  hinted.click(hinted.find('#undo-move'));
  assert(hinted.find('#hint-panel').hidden && hinted.play.snapshot().state.history.length === 0,
    'Undo invalidates the displayed hint through the real play session');
  hinted.play.dispose();
  return passed;
}
