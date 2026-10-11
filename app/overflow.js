// Keep scroll cues outside the tiles; showing one arrow reserves both gutters.
export function createOverflowControls(scroller, label) {
  const document = scroller.ownerDocument;
  const view = document.defaultView;
  const wrapper = document.createElement('div');
  wrapper.className = 'tile-scroll-controls';
  const earlier = document.createElement('button');
  const later = document.createElement('button');
  for (const [button, direction, text] of [[earlier, -1, '‹'], [later, 1, '›']]) {
    button.type = 'button';
    button.className = 'scroll-arrow';
    button.textContent = text;
    button.setAttribute('aria-label', `Show ${direction < 0 ? 'earlier' : 'more'} tiles in ${label}`);
    button.hidden = true;
  }
  scroller.before(wrapper);
  wrapper.append(earlier, scroller, later);
  let frame;
  let disposed = false;

  function show(button, visible, overflowing) {
    button.hidden = !overflowing;
    button.disabled = !visible;
    button.style.visibility = visible ? 'visible' : 'hidden';
    button.setAttribute('aria-hidden', String(!visible));
    if (!visible && document.activeElement === button) scroller.focus({ preventScroll: true });
  }

  function update() {
    if (disposed || wrapper.clientWidth === 0) return;
    // Compare against the full width, not the narrower viewport between arrows,
    // so cues do not trap a row in overflow after resizing or removing tiles.
    const overflowing = scroller.scrollWidth > wrapper.clientWidth + 1;
    const end = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    show(earlier, overflowing && scroller.scrollLeft > 1, overflowing);
    show(later, overflowing && scroller.scrollLeft < end - 1, overflowing);
  }

  function refresh() {
    update();
    view.cancelAnimationFrame(frame);
    // Layout settles after controls appear/disappear or a hidden puzzle opens.
    frame = view.requestAnimationFrame(update);
  }

  function scroll(direction, event) {
    event.stopPropagation();
    const tiles = scroller.querySelectorAll('.tile-slot');
    const measured = tiles.length > 1
      ? Math.abs(tiles[1].getBoundingClientRect().left - tiles[0].getBoundingClientRect().left) : 0;
    const list = scroller.querySelector('.tile-row');
    const gap = list ? parseFloat(view.getComputedStyle(list).columnGap) || 0 : 0;
    const tileWidth = tiles[0]?.getBoundingClientRect().width || 64;
    const marker = scroller.querySelector('.placement-slot');
    const step = measured || tileWidth + gap + (marker ? marker.getBoundingClientRect().width + gap : 0);
    const reduced = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({ left: direction * step, behavior: reduced ? 'auto' : 'smooth' });
    refresh();
  }
  const onEarlier = (event) => scroll(-1, event);
  const onLater = (event) => scroll(1, event);
  earlier.addEventListener('click', onEarlier);
  later.addEventListener('click', onLater);
  scroller.addEventListener('scroll', update, { passive: true });
  view.addEventListener('resize', refresh);
  const observer = view.ResizeObserver ? new view.ResizeObserver(refresh) : null;
  observer?.observe(wrapper);
  const list = scroller.querySelector('.tile-row');
  if (list) observer?.observe(list);
  refresh();
  return {
    refresh,
    dispose() {
      disposed = true;
      view.cancelAnimationFrame(frame);
      observer?.disconnect();
      scroller.removeEventListener('scroll', update);
      view.removeEventListener('resize', refresh);
      earlier.removeEventListener('click', onEarlier);
      later.removeEventListener('click', onLater);
    },
  };
}
