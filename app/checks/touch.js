import { initialiseTouch } from '../touch.js';
import { createPlaySession } from '../play-session.js';
import { createGameState, checkState } from '../state.js';

// Deterministic event/clock harness: exercises the actual touch controller without a browser.
// Real pointer capture, hit testing, layout and scrolling still need tablet verification.
export function runTouchChecks(sample, styles) {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  const initial = createGameState(sample);
  function harness() {
    function events(properties = {}) {
      const listeners = new Map();
      return Object.assign(properties, {
        addEventListener(type, handler, options) {
          const list = listeners.get(type) || [];
          list.push({ handler, options }); listeners.set(type, list);
        },
        removeEventListener(type, handler) {
          listeners.set(type, (listeners.get(type) || []).filter((entry) => entry.handler !== handler));
        },
        emit(type, values = {}) {
          const event = { defaultPrevented: false, stopped: false,
            preventDefault() { this.defaultPrevented = true; },
            stopImmediatePropagation() { this.stopped = true; }, ...values };
          for (const { handler } of listeners.get(type) || []) {
            handler(event); if (event.stopped) break;
          }
          return event;
        },
        get listenerCount() { return [...listeners.values()].reduce((sum, list) => sum + list.length, 0); },
      });
    }
    function element(properties = {}) {
      const classes = new Set();
      return { dataset: {}, style: {}, disabled: false,
        getBoundingClientRect() {
          if (this.classList.contains('touch-preview')) {
            const x = parseFloat(this.style.left); const y = parseFloat(this.style.top);
            return { left: x - 32, right: x + 32, top: y - 118, bottom: y - 24 };
          }
          return this.bounds || { left: 800, right: 848, top: 800, bottom: 856 };
        },
        classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name),
          contains: (name) => classes.has(name) },
        setAttribute() {}, removeAttribute(name) { if (name === 'data-tile-id') delete this.dataset.tileId; },
        closest(selector) {
          if (selector === '[data-tile-id]') return this.dataset.tileId ? this : null;
          if (selector === '[data-destination]') return this.dataset.destination ? this : null;
          return this.scroller || null;
        },
        cloneNode() { return element({ dataset: { ...this.dataset } }); },
        setPointerCapture(id) { this.capture = id; },
        hasPointerCapture(id) { return this.capture === id; },
        releasePointerCapture() { this.capture = null; },
        remove() { previews.delete(this); }, ...properties };
    }
    let clock = 0;
    let sequence = 0;
    const timers = new Map();
    const frames = new Map();
    const previews = new Set();
    const members = new Set();
    const view = events({ innerHeight: 600, innerWidth: 1000, scrolls: [],
      setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { fn, at: clock + delay }); return id; },
      clearTimeout(id) { timers.delete(id); },
      requestAnimationFrame(fn) { const id = ++sequence; frames.set(id, fn); return id; },
      cancelAnimationFrame(id) { frames.delete(id); },
      scrollBy(x, y) { this.scrolls.push([x, y]); },
    });
    const document = events({ defaultView: view, hidden: false,
      body: { append: (node) => previews.add(node) }, hit: null,
      elementFromPoint(x, y) { return typeof this.hit === 'function' ? this.hit(x, y) : this.hit; },
    });
    const content = events({ ownerDocument: document, contains: (node) => members.has(node),
      querySelectorAll: () => destinations });
    const session = createPlaySession(initial);
    const status = { textContent: '' };
    const destinations = [];
    let moves = 0;
    const paintSelection = () => {
      for (const target of destinations) target.disabled = !session.snapshot().selected;
    };
    const controls = initialiseTouch({ content, status, session, paintSelection,
      afterMove() { moves++; paintSelection(); } });
    content.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-tile-id]');
      if (tile && members.has(tile)) session.select(tile.dataset.tileId);
      else if (members.has(event.target) && !event.target.disabled) {
        session.place(JSON.parse(event.target.dataset.destination)); moves++;
      }
      paintSelection();
    });
    return { document, view, content, session, status, controls, previews, frames, timers,
      get moves() { return moves; },
      tile(id) { const node = element({ dataset: { tileId: id } }); members.add(node); return node; },
      destination(value) {
        const node = element({ dataset: { destination: JSON.stringify(value) } });
        members.add(node); destinations.push(node); paintSelection(); return node;
      },
      scroller() {
        const node = element({ scrollLeft: 0, getBoundingClientRect: () => ({ left: 0, right: 300, top: 0, bottom: 600 }) });
        members.add(node); return node;
      },
      pointer(type, tile, values = {}) {
        return document.emit(type, { target: tile, pointerType: 'touch', isPrimary: true,
          pointerId: 1, clientX: 100, clientY: 100, ...values });
      },
      advance(ms) {
        clock += ms;
        for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn(); }
      },
      frame() { const callbacks = [...frames.values()]; frames.clear(); for (const fn of callbacks) fn(); },
    };
  }

  const taps = harness();
  const tile = taps.tile('blue-6-1');
  const newRow = taps.destination({ area: 'new-row' });
  assert(taps.content.emit('contextmenu', { target: tile }).defaultPrevented,
    'Playable tiles suppress the browser context menu before a touch hold');
  assert(taps.content.emit('contextmenu', { target: { closest: () => tile } }).defaultPrevented,
    'Nested tile numbers and symbols also suppress the browser context menu');
  assert(!taps.content.emit('contextmenu', { target: newRow }).defaultPrevented,
    'Context menus outside tiles retain their browser behavior');
  taps.pointer('pointerdown', tile); taps.advance(100); taps.pointer('pointerup', tile);
  assert(taps.session.snapshot().state === initial && taps.previews.size === 0 && !taps.session.snapshot().selected,
    'Short touch leaves placement and selection to the normal button click');
  taps.content.emit('click', { target: tile });
  assert(taps.session.snapshot().selected === 'blue-6-1' && !newRow.disabled,
    'Tap selects a physical tile and enables placement targets');
  taps.content.emit('click', { target: tile });
  assert(!taps.session.snapshot().selected && taps.session.snapshot().state === initial,
    'Tapping the selected tile cancels without moving');
  taps.content.emit('click', { target: tile }); taps.content.emit('click', { target: newRow });
  assert(taps.session.snapshot().state.board[2][0] === 'blue-6-1' && taps.moves === 1,
    'Tap-to-place uses the existing immutable move rules');
  taps.controls.dispose();

  for (const pointerType of ['mouse', 'pen']) {
    const h = harness(); const source = h.tile('blue-6-1');
    h.pointer('pointerdown', source, { pointerType }); h.advance(300);
    assert(!h.session.snapshot().dragging && !h.previews.size,
      `${pointerType} input does not start a touch gesture`);
    h.controls.dispose();
  }
  const early = harness(); const source = early.tile('blue-6-1');
  early.pointer('pointerdown', source); early.advance(150);
  early.pointer('pointermove', source, { clientX: 130 }); early.advance(300);
  const earlyClick = early.content.emit('click', { target: source });
  assert(!early.previews.size && early.session.snapshot().state === initial && !early.session.snapshot().selected && earlyClick.stopped,
    'Movement before the hold threshold cancels without accidental selection or placement');
  early.pointer('pointerdown', source); early.pointer('pointerup', source);
  early.content.emit('click', { target: source });
  assert(early.session.snapshot().selected === 'blue-6-1', 'A fresh tap immediately after cancellation is accepted');
  early.controls.dispose();

  const cancelledMenu = harness(); const menuTile = cancelledMenu.tile('blue-6-1');
  cancelledMenu.pointer('pointerdown', menuTile); cancelledMenu.advance(280);
  cancelledMenu.pointer('pointercancel', menuTile);
  assert(cancelledMenu.content.emit('contextmenu', { target: menuTile }).defaultPrevented,
    'Context menu is still blocked if the browser cancels the pointer first');
  cancelledMenu.controls.dispose();

  const drag = harness(); const dragged = drag.tile('blue-6-1');
  const destination = drag.destination({ area: 'new-row' });
  drag.pointer('pointerdown', dragged); drag.advance(279);
  assert(!drag.session.snapshot().dragging, 'Touch drag waits for a deliberate hold');
  drag.advance(1);
  assert(drag.session.snapshot().dragging === 'blue-6-1' && drag.previews.size === 1 && dragged.capture === 1,
    'Hold starts shared-session drag with a preview and pointer capture');
  assert(drag.session.snapshot().state === initial && ![...drag.previews][0].dataset.tileId,
    'Preview cannot enter the physical tile inventory and holding creates no move');
  assert(drag.content.emit('dragstart', { target: dragged }).defaultPrevented,
    'Touch gesture prevents a simultaneous native drag');
  assert(drag.content.emit('contextmenu', { target: dragged }).defaultPrevented && drag.session.snapshot().dragging === 'blue-6-1',
    'Long-press context menu is blocked without interrupting the active drag');
  drag.document.hit = destination;
  const moveEvent = drag.pointer('pointermove', dragged, { clientX: 200 });
  assert(moveEvent.defaultPrevented && destination.classList.contains('touch-destination'),
    'Touch movement highlights the enabled destination under the visible tile');
  drag.pointer('pointerup', dragged, { clientX: 200 });
  assert(drag.moves === 1 && drag.session.snapshot().state.board[2][0] === 'blue-6-1',
    'Release commits exactly one shared-session move');
  assert(!drag.previews.size && !drag.frames.size && !dragged.capture && !destination.classList.contains('touch-destination'),
    'Successful drop removes preview, capture, animation and destination highlight');
  assert(drag.content.emit('click', { target: dragged }).stopped && !drag.session.snapshot().selected,
    'Compatibility click after dragging cannot reselect the tile');
  drag.session.undo();
  assert(JSON.stringify(drag.session.snapshot().state) === JSON.stringify(initial), 'Touch move undoes to the exact initial state');
  drag.controls.dispose();

  for (const scenario of ['tile-centre', 'overlap', 'nearest-left', 'nearest-right', 'outside', 'disabled', 'clipped', 'covered', 'release-position']) {
    const h = harness(); const node = h.tile('blue-6-1');
    const left = h.destination({ area: 'new-row' });
    const right = h.destination({ area: 'rack', index: 0 });
    left.bounds = { left: 176, right: 224, top: 151, bottom: 207 };
    right.bounds = { left: 240, right: 288, top: 151, bottom: 207 };
    const hit = (x, y) => [left, right].find(({ bounds }) =>
      x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) || null;
    h.document.hit = scenario === 'covered' ? () => null : hit;
    h.pointer('pointerdown', node); h.advance(280);
    let x = 200; let y = 250;
    let expected = left;
    if (scenario === 'overlap') y = 300;
    if (scenario === 'nearest-left') x = 231;
    if (scenario === 'nearest-right') { x = 239; expected = right; }
    if (scenario === 'outside') { y = 400; expected = null; }
    if (scenario === 'disabled') { left.disabled = true; right.disabled = true; expected = null; }
    if (scenario === 'clipped') {
      left.bounds = { left: 320, right: 368, top: 151, bottom: 207 };
      left.scroller = h.scroller(); x = 300; expected = null;
      h.document.hit = (hitX, hitY) => hitX < 300 ? hit(hitX, hitY) : null;
      right.disabled = true;
    }
    if (scenario === 'covered') expected = null;
    h.pointer('pointermove', node, { clientX: x, clientY: y });
    assert([left, right].every((target) => target.classList.contains('touch-destination') === (target === expected)),
      `${scenario}: geometry highlights the destination nearest the visible tile`);
    if (scenario === 'release-position') { x = 264; expected = right; }
    h.pointer('pointerup', node, { clientX: x, clientY: y });
    const state = h.session.snapshot().state;
    assert(expected === left ? state.board[2]?.[0] === 'blue-6-1'
      : expected === right ? state.rack[0] === 'blue-6-1' : state === initial,
    `${scenario}: release uses current tile geometry and rejects unavailable destinations`);
    h.controls.dispose();
  }

  for (const [id, location, expected] of [
    ['blue-3-2', { area: 'board', row: 1, index: 3 }, (state) => state.board[1].join() === 'blue-4-2,blue-5-2,blue-3-2'],
    ['blue-6-1', { area: 'rack', index: 0 }, (state) => state.rack[0] === 'blue-6-1'],
  ]) {
    const h = harness(); const node = h.tile(id); const target = h.destination(location);
    h.pointer('pointerdown', node); h.advance(280);
    h.document.hit = target; h.pointer('pointerup', node);
    assert(expected(h.session.snapshot().state) && checkState(h.session.snapshot().state).conserved,
      `Touch ${id} to ${location.area} preserves copy identity and insertion order`);
    assert(checkState(h.session.snapshot().state).invalidRows.length === (location.area === 'board' ? 1 : 0),
      `Touch ${id} retains row-validity feedback after placement`);
    h.controls.dispose();
  }

  const empty = harness();
  for (const id of initial.board[1]) {
    empty.session.select(id); empty.session.place({ area: 'rack', index: 0 });
  }
  const returning = empty.tile('blue-3-2'); const emptyTarget = empty.destination({ area: 'board', row: 1, index: 0 });
  empty.pointer('pointerdown', returning); empty.advance(280);
  empty.document.hit = emptyTarget; empty.pointer('pointerup', returning);
  assert(empty.session.snapshot().state.board[1].join() === 'blue-3-2', 'Touch can return a rack tile to an empty board row');
  empty.controls.dispose();

  for (const cancellation of ['outside', 'stale-target', 'pointercancel', 'lostcapture', 'second-finger', 'blur', 'hidden', 'escape', 'dispose']) {
    const h = harness(); const node = h.tile('blue-6-1');
    const target = h.destination({ area: 'new-row' });
    h.pointer('pointerdown', node); h.advance(280);
    h.document.hit = target; h.pointer('pointermove', node);
    if (cancellation === 'outside' || cancellation === 'stale-target') {
      h.document.hit = cancellation === 'outside' ? null : { closest: () => target, disabled: false };
      if (cancellation === 'stale-target') target.disabled = true;
      h.pointer('pointerup', node);
    } else if (cancellation === 'pointercancel') h.pointer('pointercancel', node);
    else if (cancellation === 'lostcapture') h.content.emit('lostpointercapture', { pointerId: 1 });
    else if (cancellation === 'second-finger') h.pointer('pointerdown', { closest: () => null }, { pointerId: 2, isPrimary: false });
    else if (cancellation === 'blur') h.view.emit('blur');
    else if (cancellation === 'hidden') { h.document.hidden = true; h.document.emit('visibilitychange'); }
    else if (cancellation === 'escape') h.controls.cancel();
    else h.controls.dispose();
    assert(h.session.snapshot().state === initial && !h.session.snapshot().dragging && !h.session.snapshot().selected && h.moves === 0,
      `${cancellation}: cancellation conserves the exact state and history`);
    assert(!h.previews.size && !h.frames.size && !node.capture && !target.classList.contains('touch-destination'),
      `${cancellation}: cancellation cleans up all transient drag UI`);
    h.controls.dispose();
    assert(h.document.listenerCount === 0 && h.view.listenerCount === 0 && h.timers.size === 0,
      `${cancellation}: disposal removes document/window listeners and timers`);
  }

  const scroll = harness(); const scrollingTile = scroll.tile('blue-6-1');
  const scrollTarget = scroll.destination({ area: 'new-row' });
  const scroller = scroll.scroller(); scrollTarget.scroller = scroller;
  scroll.pointer('pointerdown', scrollingTile); scroll.advance(280);
  scroll.document.hit = scrollTarget;
  scroll.pointer('pointermove', scrollingTile, { clientX: 290, clientY: 590 }); scroll.frame();
  assert(scroller.scrollLeft > 0 && scroll.view.scrolls[0][1] > 0,
    'Dragging at row and viewport edges scrolls horizontally and vertically');
  assert(scrollTarget.classList.contains('touch-destination'), 'Auto-scroll rechecks the destination under the visible tile');
  scroll.controls.cancel(); scroll.controls.dispose();

  const complete = harness();
  for (const [id, location] of [
    ['blue-6-1', { area: 'new-row' }],
    ['red-6-1', { area: 'board', row: 2, index: 1 }],
    ['black-6-1', { area: 'board', row: 2, index: 2 }],
  ]) {
    const node = complete.tile(id); const target = complete.destination(location);
    complete.pointer('pointerdown', node); complete.advance(280);
    complete.document.hit = target; complete.pointer('pointerup', node);
    assert(checkState(complete.session.snapshot().state).conserved, `Touch sample move ${id} conserves every physical tile`);
  }
  assert(complete.moves === 3 && checkState(complete.session.snapshot().state).won && !complete.session.snapshot().completed,
    'Touch controls can solve the full sample while retaining explicit Check');
  complete.session.check();
  complete.pointer('pointerdown', complete.tile('blue-6-1')); complete.advance(300);
  assert(complete.session.snapshot().completed && !complete.previews.size, 'Completion prevents further touch dragging');
  complete.controls.dispose();
  assert(/button\.tile\s*\{[^}]*touch-action: none/.test(styles) && !/\.board-row\s*\{[^}]*touch-action: none/.test(styles),
    'Touch-action reserves tile gestures while leaving row whitespace available for native scrolling');
  assert(/\.placement\s*\{[^}]*min-width: 48px/.test(styles), 'Insertion targets are at least 48 CSS pixels wide');
  return passed;
}
