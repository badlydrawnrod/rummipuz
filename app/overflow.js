// Keep scroll cues outside the tiles; unavailable arrows take up no space.
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
  // If both end markers cannot fit together, keep the leading marker we just
  // revealed instead of repeatedly snapping between the two ends.
  let revealLeading = false;
  let moving = false;
  let restoring = false;
  let settleTimer;

  function show(button, visible) {
    button.hidden = !visible;
    button.disabled = !visible;
    button.style.visibility = visible ? 'visible' : 'hidden';
    button.setAttribute('aria-hidden', String(!visible));
    if (!visible && document.activeElement === button) scroller.focus({ preventScroll: true });
  }

  function update(allowSnap = true) {
    if (disposed || wrapper.clientWidth === 0) return;
    // Compare against the full width, not the narrower viewport between arrows,
    // so cues do not trap a row in overflow after resizing or removing tiles.
    const tiles = scroller.querySelectorAll('.tile-slot');
    const overflowing = tiles.length > 0 && scroller.scrollWidth > wrapper.clientWidth + 1;
    const firstTile = tiles[0]?.getBoundingClientRect();
    const firstTileLeft = firstTile ? firstTile.left - scroller.getBoundingClientRect().left : 0;
    show(earlier, overflowing && firstTileLeft < -1);
    // If only the leading + is clipped, reveal it instead of offering an arrow.
    if (allowSnap && !restoring && !moving && earlier.hidden && scroller.scrollLeft > 0) {
      revealLeading = true;
      scroller.scrollLeft = 0;
    }
    // Test the space available without the forward arrow. Removing it widens
    // the viewport, so using the current narrower width would make it flicker
    // back into view at the end of a row.
    const gap = parseFloat(view.getComputedStyle(wrapper).columnGap) || 0;
    const withoutLater = scroller.clientWidth +
      (later.hidden ? 0 : later.getBoundingClientRect().width + gap);
    const lastTile = tiles[tiles.length - 1]?.getBoundingClientRect();
    const lastTileRight = lastTile ? lastTile.right - scroller.getBoundingClientRect().left : 0;
    show(later, overflowing && lastTileRight > withoutLater + 1);
    // A trailing placement gap alone must not keep a "more tiles" arrow alive.
    // Expose that final + after reclaiming the arrow's space.
    if (allowSnap && !restoring && !moving && overflowing && later.hidden && (!revealLeading || !earlier.hidden) &&
        scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1) {
      scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
    }
  }

  function onScroll() {
    moving = true;
    view.clearTimeout(settleTimer);
    settleTimer = view.setTimeout(() => {
      moving = false;
      update(!restoring);
    }, 150);
    update(!restoring);
  }

  function refresh() {
    update();
    view.cancelAnimationFrame(frame);
    // Layout settles after controls appear/disappear or a hidden puzzle opens.
    frame = view.requestAnimationFrame(update);
  }

  function restoreScrollLeft(position) {
    restoring = true;
    view.cancelAnimationFrame(frame);
    scroller.scrollLeft = position;
    update(false);
    frame = view.requestAnimationFrame(() => {
      // Arrow visibility can change the available width. Re-measure without
      // snapping to an edge marker so the restored tile stays in view.
      update(false);
      restoring = false;
    });
  }

  function scroll(direction, event) {
    event.stopPropagation();
    revealLeading = direction < 0;
    const tiles = scroller.querySelectorAll('.tile-slot');
    const measured = tiles.length > 1
      ? Math.abs(tiles[1].getBoundingClientRect().left - tiles[0].getBoundingClientRect().left) : 0;
    const list = scroller.querySelector('.tile-row');
    const gap = list ? parseFloat(view.getComputedStyle(list).columnGap) || 0 : 0;
    const tileWidth = tiles[0]?.getBoundingClientRect().width || 64;
    const marker = scroller.querySelector('.placement-slot');
    const step = measured || tileWidth + gap + (marker ? marker.getBoundingClientRect().width + gap : 0);
    const reduced = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // The first animation frames move through the leading +. Snapping it back
    // into view during those frames would cancel the requested scroll.
    onScroll();
    scroller.scrollBy({ left: direction * step, behavior: reduced ? 'auto' : 'smooth' });
    refresh();
  }
  const onEarlier = (event) => scroll(-1, event);
  const onLater = (event) => scroll(1, event);
  earlier.addEventListener('click', onEarlier);
  later.addEventListener('click', onLater);
  scroller.addEventListener('scroll', onScroll, { passive: true });
  view.addEventListener('resize', refresh);
  const observer = view.ResizeObserver ? new view.ResizeObserver(refresh) : null;
  observer?.observe(wrapper);
  const list = scroller.querySelector('.tile-row');
  if (list) observer?.observe(list);
  refresh();
  return {
    refresh,
    restoreScrollLeft,
    dispose() {
      if (disposed) return;
      disposed = true;
      view.cancelAnimationFrame(frame);
      view.clearTimeout(settleTimer);
      observer?.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      view.removeEventListener('resize', refresh);
      earlier.removeEventListener('click', onEarlier);
      later.removeEventListener('click', onLater);
      wrapper.replaceWith(scroller);
    },
  };
}
