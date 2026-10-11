import { createOverflowControls } from '../overflow.js';

export function runOverflowChecks() {
  const passed = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(`Failed: ${name}`);
    passed.push(name);
  };
  function harness({ width = 300, extent = 600, reduced = false, observer = true,
    tileCount = 2, markers = true, stride = 128 } = {}) {
    const events = (properties = {}) => {
      const listeners = new Map();
      return Object.assign(properties, {
        addEventListener(type, fn) { listeners.set(type, fn); },
        removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
        emit(type) {
          const event = { stopped: false, stopPropagation() { this.stopped = true; } };
          listeners.get(type)?.(event); return event;
        },
        get listenerCount() { return listeners.size; },
      });
    };
    let wrapper;
    const frames = new Map();
    let id = 0;
    let resizeObserver;
    const view = events({
      requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
      cancelAnimationFrame(key) { frames.delete(key); },
      matchMedia: () => ({ matches: reduced }),
      getComputedStyle: () => ({ columnGap: '8px' }),
      ResizeObserver: observer ? class {
        constructor(fn) { this.callback = fn; this.observed = []; resizeObserver = this; }
        observe(node) { this.observed.push(node); }
        disconnect() { this.disconnected = true; }
      } : undefined,
    });
    const document = { defaultView: view, activeElement: null,
      createElement() {
        return events({ hidden: false, style: {}, attributes: {},
          setAttribute(name, value) { this.attributes[name] = value; },
          append(...nodes) { this.children = nodes; },
          get clientWidth() { return width; },
        });
      },
    };
    const list = {};
    const scroller = events({ ownerDocument: document, scrollLeft: 0, calls: [],
      before(node) { wrapper = node; },
      querySelector(selector) {
        if (selector === '.tile-row') return list;
        if (selector === '.placement-slot') return markers ? { getBoundingClientRect: () => ({ width: 48 }) } : null;
        return null;
      },
      querySelectorAll() {
        return Array.from({ length: tileCount }, (_, index) => ({
          getBoundingClientRect: () => ({ left: index * stride - this.scrollLeft, width: 64 }),
        }));
      },
      focus() { document.activeElement = this; },
      scrollBy(options) {
        this.calls.push(options);
        this.scrollLeft = Math.max(0, Math.min(this.scrollWidth - this.clientWidth, this.scrollLeft + options.left));
        this.emit('scroll');
      },
    });
    Object.defineProperties(scroller, {
      clientWidth: { get: () => width - (wrapper.children?.[0].hidden ? 0 : 112) },
      scrollWidth: { get: () => Math.max(extent, scroller.clientWidth) },
    });
    const controls = createOverflowControls(scroller, 'row 2');
    const earlier = wrapper.children[0]; const later = wrapper.children[2];
    return { controls, view, document, scroller, wrapper, earlier, later, frames,
      get observer() { return resizeObserver; },
      resize(next) { width = next; view.emit('resize'); },
      tiles(next) { extent = next; controls.refresh(); },
      frame() { const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(); },
    };
  }
  const h = harness(); h.frame();
  assert(h.earlier.style.visibility === 'hidden' && h.later.style.visibility === 'visible',
    'At the start of an overflowing row only the forward cue is visible');
  assert(h.earlier.disabled && !h.later.disabled && !h.earlier.hidden && !h.later.hidden,
    'Both arrow gutters stay reserved while the unavailable direction is inert');
  assert(h.later.attributes['aria-label'] === 'Show more tiles in row 2' && h.earlier.attributes['aria-hidden'] === 'true',
    'Directional cues have row-specific labels and hidden cues are excluded from accessibility');
  assert(h.wrapper.children[1] === h.scroller, 'Arrow buttons sit outside the tile scroll region');
  assert(h.later.emit('click').stopped && h.scroller.calls[0].left === 128 && h.scroller.calls[0].behavior === 'smooth',
    'Arrow activation includes the tile, placement marker and spacing without bubbling into game controls');
  assert(h.earlier.style.visibility === 'visible' && h.later.style.visibility === 'visible',
    'Scrolling away from the start exposes both directions');
  h.scroller.scrollLeft = h.scroller.scrollWidth - h.scroller.clientWidth;
  h.document.activeElement = h.later; h.scroller.emit('scroll');
  assert(h.later.disabled && h.later.style.visibility === 'hidden' && !h.earlier.disabled,
    'At the end only the backward cue remains');
  assert(h.document.activeElement === h.scroller, 'Focus remains usable when its arrow disappears');
  h.earlier.emit('click');
  assert(h.scroller.calls.at(-1).left === -128 && !h.later.disabled, 'Backward scrolling uses the same full tile interval and reveals the forward cue again');
  h.scroller.scrollLeft = 0; h.scroller.emit('scroll');
  assert(h.earlier.disabled && !h.later.disabled, 'Swipe or drag scrolling also refreshes directional cues');
  h.resize(650); h.frame();
  assert(h.earlier.hidden && h.later.hidden && h.scroller.clientWidth === 650,
    'Resizing to fit removes both cues and returns their space to the tiles');
  h.resize(300); h.frame();
  assert(!h.later.hidden && !h.later.disabled, 'Narrowing the viewport restores overflow cues');
  h.tiles(200); h.frame();
  assert(h.earlier.hidden && h.later.hidden, 'Removing tiles hides cues even when the old arrow gutters caused overflow');
  h.tiles(700); h.frame();
  assert(!h.later.hidden, 'Adding tiles refreshes overflow after a move');
  assert(h.observer.observed.length === 2, 'Resize observation covers both the viewport wrapper and tile content');
  h.controls.dispose();
  assert(h.observer.disconnected && !h.frames.size && !h.view.listenerCount && !h.scroller.listenerCount &&
    !h.earlier.listenerCount && !h.later.listenerCount, 'Re-render cleanup removes observers, frames and event handlers');

  const fit = harness({ extent: 250 }); fit.frame();
  assert(fit.earlier.hidden && fit.later.hidden && fit.scroller.clientWidth === 300, 'Rows that fit retain their full width without arrows');
  fit.controls.dispose();
  const hidden = harness({ width: 0 }); hidden.resize(300); hidden.frame();
  assert(!hidden.later.hidden && !hidden.later.disabled, 'Opening an initially hidden puzzle measures overflow after layout');
  hidden.controls.dispose();
  const fallback = harness({ observer: false, reduced: true }); fallback.frame();
  fallback.later.emit('click');
  assert(fallback.scroller.calls[0].behavior === 'auto', 'Reduced motion uses immediate arrow scrolling');
  fallback.resize(800); fallback.frame();
  assert(fallback.earlier.hidden && fallback.later.hidden, 'Resize fallback works without ResizeObserver');
  fallback.controls.dispose();
  for (const [options, expected, name] of [
    [{ tileCount: 1 }, 128, 'A single tile includes its placement marker and both gaps'],
    [{ tileCount: 1, markers: false }, 72, 'Completed rows without placement markers scroll by tile and gap'],
    [{ stride: 143 }, 143, 'Adjacent tile positions determine the step when displayed spacing changes'],
  ]) {
    const sized = harness(options); sized.frame(); sized.later.emit('click');
    assert(sized.scroller.calls[0].left === expected, name);
    sized.controls.dispose();
  }
  return passed;
}
