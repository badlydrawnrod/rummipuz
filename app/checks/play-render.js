import { initialisePlay } from '../play.js';
import { createGameState, checkState } from '../state.js';

// Exercise the real renderer/event handlers in a small DOM harness. Geometry
// models fixed tile widths; actual browser layout and touch still need review.
export function runPlayRenderChecks(sample) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  function harness(state) {
    const events = (object) => Object.assign(object, {
      listeners: new Map(),
      addEventListener(type, fn) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
      },
      removeEventListener(type, fn) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== fn));
      },
      emit(type, target = this) {
        const event = { target, detail: 0, stopImmediatePropagation() {}, stopPropagation() {}, preventDefault() {} };
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
      }
      setAttribute(key, value) { this.attributes[key] = value; }
      matches(selector) {
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
        const attr = selector.match(/^\[data-(tile-id|destination)\]$/);
        if (attr) return this.dataset[attr[1] === 'tile-id' ? 'tileId' : 'destination'] !== undefined;
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
      'replay-code', 'confirm-reset', 'keep-playing', 'close-solution']) {
      const node = new Element('button'); node.id = id; content.append(node);
    }
    const rack = new Element('div'); rack.className = 'rack-scroll';
    const tiles = new Element('ul'); tiles.className = 'tile-row'; tiles.id = 'rack-tiles';
    content.append(rack); rack.append(tiles);
    const status = new Element('p');
    const play = initialisePlay({ content, status, state });
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
  assert(rows().length === 1 && /Row 1/.test(rows()[0].querySelector('.board-row-label').textContent)
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
  return passed;
}
