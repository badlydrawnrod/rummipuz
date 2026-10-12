import { initialiseRowDrag } from '../row-drag.js';

// Deterministic event and geometry checks for the dedicated row pointer gesture.
export function runRowDragChecks() {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };

  function harness() {
    const events = (object) => Object.assign(object, {
      listeners: new Map(),
      addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); },
      removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== fn)); },
      emit(type, event = {}) {
        const input = { target: this, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0,
          clientX: 20, clientY: 130, detail: 1, prevented: false,
          preventDefault() { this.prevented = true; }, stopImmediatePropagation() {}, ...event };
        for (const fn of this.listeners.get(type) ?? []) fn(input);
        return input;
      },
    });
    let sequence = 0;
    let now = 0;
    const timers = new Map();
    const frames = new Map();
    const view = events({
      innerHeight: 600, scrollY: 0, scrolls: [],
      setTimeout(fn, delay = 0) { const id = ++sequence; timers.set(id, { fn, due: now + delay }); return id; },
      clearTimeout(id) { timers.delete(id); },
      requestAnimationFrame(fn) { const id = ++sequence; frames.set(id, fn); return id; },
      cancelAnimationFrame(id) { frames.delete(id); },
      scrollBy(_x, y) { this.scrollY += y; this.scrolls.push(y); },
      advance(ms) {
        now += ms;
        const pending = [...timers].filter(([, timer]) => timer.due <= now);
        pending.forEach(([id, timer]) => { timers.delete(id); timer.fn(); });
      },
      fireTimers() { this.advance(Infinity); },
      get timerCount() { return timers.size; },
      get frameCount() { return frames.size; },
      fireFrame() { const first = frames.entries().next().value; if (!first) return; frames.delete(first[0]); first[1](); },
    });
    const document = events({ defaultView: view, hidden: false, activeElement: null });
    class Element {
      constructor(tag, data = {}) {
        events(this); this.tagName = tag; this.ownerDocument = document; this.dataset = data;
        this.children = []; this.parent = null; this.style = {}; this.attributes = {};
        this.disabled = false; this.textContent = ''; this.classes = new Set();
        this.classList = {
          add: (...names) => names.forEach((name) => this.classes.add(name)),
          remove: (...names) => names.forEach((name) => this.classes.delete(name)),
          contains: (name) => this.classes.has(name),
        };
      }
      set className(value) { this.classes = new Set(String(value).split(/\s+/).filter(Boolean)); }
      get className() { return [...this.classes].join(' '); }
      setAttribute(key, value) { this.attributes[key] = value; }
      matches(selector) {
        const data = selector.match(/^\[data-([a-z-]+)\]$/);
        if (data) {
          const key = data[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase());
          return this.dataset[key] !== undefined;
        }
        return selector.startsWith('.') && this.classes.has(selector.slice(1));
      }
      closest(selector) {
        return selector.split(',').some((part) => this.matches(part.trim())) ? this : this.parent?.closest(selector) ?? null;
      }
      contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
      querySelectorAll(selector) {
        return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
      }
      querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
      append(...nodes) { for (const node of nodes) { node.remove(); node.parent = this; this.children.push(node); } }
      remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
      setPointerCapture(id) { this.capture = id; }
      hasPointerCapture(id) { return this.capture === id; }
      releasePointerCapture(id) { if (this.capture === id) this.capture = null; }
      getBoundingClientRect() {
        const scroll = view.scrollY;
        if (this === board) return { left: 0, right: 300, top: 100 - scroll, bottom: 550 - scroll };
        if (this.dataset.rowView !== undefined) {
          const index = rows.findIndex((row) => row === this);
          const top = [120, 240, 360][index] - scroll;
          return { left: 0, right: 300, top, bottom: top + 80 };
        }
        return { left: 0, right: 300, top: 0, bottom: 10 };
      }
    }
    document.createElement = (tag) => new Element(tag);
    document.body = new Element('body');
    const content = new Element('main'); document.body.append(content);
    const board = new Element('section'); content.append(board);
    const ids = ['row-a', 'row-b', 'row-c'];
    const rows = ids.map((id, index) => {
      const row = new Element('div', { rowView: id });
      const handle = new Element('button', { rowHandle: id });
      const label = new Element('span', { rowLabel: '' }); label.textContent = `Row ${index + 1}`;
      row.append(handle, label); board.append(row); return row;
    });
    for (const id of [...ids, null]) {
      const marker = new Element('div', { rowDestination: JSON.stringify({ beforeRowId: id, positionToken: 0 }) });
      board.append(marker);
    }
    const rack = new Element('div'); content.append(rack);
    const status = { textContent: '' };
    let state = {};
    let ordered = [...ids];
    let completed = false;
    let reordered = [];
    let cancelCount = 0;
    const session = {
      snapshot: () => ({ state, completed, rows: ordered.map((id, index) => ({ id, number: index + 1 })) }),
      cancel() { cancelCount += 1; },
      rowDestination(beforeRowId = null) { return { beforeRowId, positionToken: 0 }; },
      reorder(id, destination) {
        if (destination.positionToken !== 0 || !ordered.includes(id)) return false;
        const source = ordered.indexOf(id);
        const target = destination.beforeRowId === null ? ordered.length : ordered.indexOf(destination.beforeRowId);
        if (target < 0 || destination.beforeRowId === id || target === source + 1) return false;
        ordered.splice(source, 1); ordered.splice(destination.beforeRowId === null ? ordered.length : ordered.indexOf(destination.beforeRowId), 0, id);
        state = {}; reordered.push(id); return true;
      },
    };
    const callbacks = { paints: 0, after: [] };
    const controller = initialiseRowDrag({ content, board, status, session,
      paintSelection: () => { callbacks.paints += 1; }, afterReorder: (id) => callbacks.after.push(id) });
    const pointer = (type, target, values = {}) => document.emit(type, { target, ...values });
    const down = (index, values = {}) => pointer('pointerdown', rows[index].querySelector('[data-row-handle]'), values);
    const move = (x, y, values = {}) => pointer('pointermove', document, { clientX: x, clientY: y, ...values });
    const up = (x, y, values = {}) => pointer('pointerup', document, { clientX: x, clientY: y, ...values });
    const marker = (before) => board.querySelectorAll('[data-row-destination]')
      .find((item) => JSON.parse(item.dataset.rowDestination).beforeRowId === before);
    return { document, view, content, board, rack, rows, status, session, controller, callbacks,
      get state() { return state; }, set state(value) { state = value; },
      get ordered() { return ordered; }, set ordered(value) { ordered = value; },
      get reordered() { return reordered; }, get cancelCount() { return cancelCount; },
      pointer, down, move, up, marker };
  }

  const mouse = harness();
  mouse.down(1);
  mouse.move(20, 134);
  assert(!mouse.rows[1].classList.contains('row-drag-source'), 'Mouse handle motion below six pixels does not activate');
  mouse.move(20, 136);
  assert(mouse.rows[1].classList.contains('row-drag-source') && mouse.callbacks.paints === 1,
    'Primary mouse handle drag activates after deliberate motion and clears tile selection');
  mouse.move(20, 125);
  assert(mouse.marker('row-a').classList.contains('row-insertion-active'), 'Pointer above the first midpoint selects the first gap');
  mouse.up(20, 490);
  assert(mouse.reordered[0] === 'row-b' && mouse.callbacks.after[0] === 'row-b',
    'Release is re-hit-tested at the final gap and reorders through the session');
  assert(!mouse.rows[1].classList.contains('row-drag-source') && !mouse.document.body.querySelector('.row-drag-preview'),
    'Successful release removes source styling and the simple row preview');

  const middle = harness();
  middle.down(0); middle.move(20, 128); middle.move(20, 285);
  assert(middle.marker('row-c').classList.contains('row-insertion-active'), 'Pointer between later row midpoints selects the middle gap');
  middle.up(20, 285);
  assert(middle.ordered.join(',') === 'row-b,row-a,row-c', 'Middle target changes visible row order');

  const last = harness();
  last.down(0); last.move(20, 128); last.move(20, 480); last.up(20, 480);
  assert(last.ordered.join(',') === 'row-b,row-c,row-a', 'After-final-midpoint target moves the source to the last position');

  const noop = harness();
  noop.down(0); noop.move(26, 130); noop.up(20, 130);
  assert(noop.reordered.length === 0 && noop.callbacks.after.length === 0,
    'Release in the source gap leaves session history and order unchanged');
  const outside = harness();
  outside.down(0); outside.move(20, 126); outside.move(20, 590); outside.up(20, 590);
  assert(outside.reordered.length === 0 && !outside.marker('row-a').classList.contains('row-insertion-active'),
    'Pointer outside board bounds clears the target and cannot reorder');
  const rack = harness();
  rack.down(0); rack.move(26, 130); rack.up(20, 580);
  assert(rack.reordered.length === 0, 'Rack region is outside the row drop surface');

  const touch = harness();
  touch.down(1, { pointerType: 'touch' });
  touch.view.advance(279);
  assert(!touch.rows[1].classList.contains('row-drag-source'), 'Touch remains inactive before the full hold threshold');
  touch.view.advance(1);
  assert(touch.rows[1].classList.contains('row-drag-source'), 'Touch handle activates after the hold threshold');
  touch.move(20, 125, { pointerType: 'touch' }); touch.up(20, 125, { pointerType: 'touch' });
  assert(touch.ordered.join(',') === 'row-b,row-a,row-c', 'Held touch gesture reorders to the first gap');
  const prehold = harness();
  prehold.down(1, { pointerType: 'touch' }); prehold.move(20, 142, { pointerType: 'touch' });
  assert(!prehold.rows[1].classList.contains('row-drag-source'), 'Touch movement over ten pixels cancels before hold activation');

  const cancelled = harness();
  cancelled.down(0); cancelled.move(26, 130); cancelled.document.emit('keydown', { key: 'Escape' });
  assert(!cancelled.rows[0].classList.contains('row-drag-source') && cancelled.reordered.length === 0,
    'Escape cancels an active row gesture and restores temporary UI');
  const pointerCancel = harness();
  pointerCancel.down(0); pointerCancel.move(26, 130); pointerCancel.document.emit('pointercancel', { pointerId: 1 });
  assert(!pointerCancel.board.classList.contains('row-dragging') && pointerCancel.reordered.length === 0,
    'Pointer cancellation removes insertion styling and preserves row order');
  const secondPointer = harness();
  secondPointer.down(0); secondPointer.move(26, 130);
  secondPointer.document.emit('pointerdown', { pointerId: 2, pointerType: 'touch', isPrimary: false });
  assert(!secondPointer.rows[0].classList.contains('row-drag-source') && secondPointer.reordered.length === 0,
    'A second pointer cancels the active row gesture');
  const stale = harness();
  stale.down(0); stale.move(26, 130); stale.state = {};
  stale.move(20, 490);
  assert(stale.reordered.length === 0 && !stale.rows[0].classList.contains('row-drag-source'),
    'State identity change invalidates an active row gesture');

  const disappeared = harness();
  disappeared.down(0); disappeared.move(26, 130); disappeared.rows[0].remove(); disappeared.move(20, 490);
  assert(disappeared.reordered.length === 0 && !disappeared.document.body.querySelector('.row-drag-preview'),
    'Removing the source row invalidates the gesture and cleans its preview');

  const completed = harness();
  completed.session.snapshot = () => ({ state: completed.state, completed: true,
    rows: completed.ordered.map((id, index) => ({ id, number: index + 1 })) });
  completed.down(0); completed.move(26, 130);
  assert(!completed.rows[0].classList.contains('row-drag-source') && completed.callbacks.paints === 0,
    'Completed sessions cannot start row gestures');

  const cancelAndCheckCleanup = (name, cancel) => {
    const h = harness();
    h.down(0); h.move(26, 130);
    cancel(h);
    h.view.fireFrame();
    assert(!h.board.classList.contains('row-dragging') && !h.rows[0].classList.contains('row-drag-source')
      && !h.document.body.querySelector('.row-drag-preview') && h.view.frameCount === 0
      && !h.rows[0].querySelector('[data-row-handle]').hasPointerCapture(1) && h.reordered.length === 0,
    `${name} cancels cleanly and leaves no frame able to reorder`);
  };
  cancelAndCheckCleanup('Window blur', (h) => h.view.emit('blur'));
  cancelAndCheckCleanup('Hidden document', (h) => { h.document.hidden = true; h.document.emit('visibilitychange'); });
  cancelAndCheckCleanup('Lost pointer capture', (h) => h.content.emit('lostpointercapture', {
    target: h.rows[0].querySelector('[data-row-handle]'), pointerId: 1,
  }));

  const pendingTouch = harness();
  pendingTouch.down(0, { pointerType: 'touch' });
  pendingTouch.view.emit('blur');
  pendingTouch.view.advance(280);
  assert(pendingTouch.view.timerCount === 0 && !pendingTouch.rows[0].classList.contains('row-drag-source'),
    'Blur clears the pending touch hold timer before it can activate');

  const edge = harness();
  edge.down(0); edge.move(20, 126); edge.move(20, 595); edge.view.fireFrame();
  assert(edge.view.scrolls.length === 1 && edge.view.scrolls[0] > 0,
    'Active pointer near viewport edge scrolls vertically through animation frames');
  edge.controller.dispose();
  assert(edge.view.listeners.get('blur')?.length === 0 && edge.document.listeners.get('pointermove')?.length === 0,
    'Dispose cancels the gesture and removes global event listeners');

  const separated = harness();
  separated.down(0, { target: separated.rack });
  assert(!separated.rows[0].classList.contains('row-drag-source'), 'Non-handle targets cannot start a row gesture');
  separated.pointer('pointerdown', separated.rows[0]);
  separated.pointer('pointerdown', separated.rows[0].querySelector('[data-row-label]'));
  assert(!separated.rows[0].classList.contains('row-drag-source'),
    'Row whitespace and labels remain outside the drag gesture');
  separated.controller.dispose(); mouse.controller.dispose(); middle.controller.dispose(); last.controller.dispose();
  noop.controller.dispose(); outside.controller.dispose(); rack.controller.dispose(); touch.controller.dispose();
  prehold.controller.dispose(); cancelled.controller.dispose(); stale.controller.dispose();
  pointerCancel.controller.dispose(); secondPointer.controller.dispose();
  disappeared.controller.dispose(); completed.controller.dispose(); pendingTouch.controller.dispose();
  return passed;
}
