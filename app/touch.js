// Touch gestures only manage transient UI. All drops use the same session as mouse play.
export function initialiseTouch({ content, status, session, paintSelection, afterMove }) {
  const document = content.ownerDocument;
  const view = document.defaultView;
  let gesture = null;
  let suppressClick = false;
  let suppressionTimer;

  function suppressNextClick() {
    suppressClick = true;
    view.clearTimeout(suppressionTimer);
    suppressionTimer = view.setTimeout(() => { suppressClick = false; }, 750);
  }

  function destinationAt(x, y) {
    const target = document.elementFromPoint(x, y)?.closest('[data-destination]');
    return target && content.contains(target) && !target.disabled ? target : null;
  }

  function positionPreview(current) {
    current.preview.style.left = `${current.x}px`;
    current.preview.style.top = `${current.y}px`;
  }

  function previewDestination(current) {
    const tile = current.preview.getBoundingClientRect();
    const x = (tile.left + tile.right) / 2;
    const y = (tile.top + tile.bottom) / 2;
    const direct = destinationAt(x, y);
    if (direct) return direct;
    let nearest = null;
    let distance = Infinity;
    for (const target of content.querySelectorAll('[data-destination]')) {
      if (target.disabled || target.hidden) continue;
      const bounds = target.getBoundingClientRect();
      const scroller = target.closest('.board-row, .rack-scroll');
      const clip = scroller?.getBoundingClientRect();
      const left = Math.max(bounds.left, 0, clip?.left ?? 0);
      const right = Math.min(bounds.right, view.innerWidth, clip?.right ?? view.innerWidth);
      const top = Math.max(bounds.top, 0, clip?.top ?? 0);
      const bottom = Math.min(bounds.bottom, view.innerHeight, clip?.bottom ?? view.innerHeight);
      if (right <= left || bottom <= top) continue;
      // Accept overlap by the visible tile plus a small margin, then choose the
      // nearest target centre so neighbouring gaps have predictable boundaries.
      if (tile.right + 12 < left || tile.left - 12 > right ||
          tile.bottom + 12 < top || tile.top - 12 > bottom) continue;
      // Clipped or covered destinations must never attract a drop.
      if (destinationAt((left + right) / 2, (top + bottom) / 2) !== target) continue;
      const score = (x - (left + right) / 2) ** 2 + (y - (top + bottom) / 2) ** 2;
      if (score < distance) { nearest = target; distance = score; }
    }
    return nearest;
  }

  function updatePreview() {
    const current = gesture;
    positionPreview(current);
    current.target?.classList.remove('touch-destination');
    current.target = previewDestination(current);
    current.target?.classList.add('touch-destination');
  }

  function edgeSpeed(position, start, end, margin) {
    if (position < start || position > end) return 0;
    if (position < start + margin) return -8 * (1 - (position - start) / margin);
    if (position > end - margin) return 8 * (1 - (end - position) / margin);
    return 0;
  }

  function scrollFrame() {
    if (!gesture?.active) return;
    const { x, y } = gesture;
    const bounds = gesture.preview.getBoundingClientRect();
    const scroller = document.elementFromPoint((bounds.left + bounds.right) / 2,
      (bounds.top + bounds.bottom) / 2)?.closest('.board-row, .rack-scroll');
    if (scroller && content.contains(scroller)) {
      const bounds = scroller.getBoundingClientRect();
      scroller.scrollLeft += edgeSpeed(x, bounds.left, bounds.right, 36);
    }
    view.scrollBy(0, edgeSpeed(y, 0, view.innerHeight, 48));
    updatePreview(); // Re-hit-test destinations after scrolling under the visible tile.
    gesture.frame = view.requestAnimationFrame(scrollFrame);
  }

  function finish(cancelled = true) {
    if (!gesture) return;
    const current = gesture;
    // Position and hit-test the visible tile at release before removing its preview.
    let target = null;
    if (current.active && !cancelled) {
      positionPreview(current);
      target = previewDestination(current);
    }
    gesture = null; // Releasing capture can synchronously emit lostpointercapture.
    view.clearTimeout(current.timer);
    view.cancelAnimationFrame(current.frame);
    current.target?.classList.remove('touch-destination');
    current.preview?.remove();
    current.tile.classList.remove('touch-source');
    if (current.tile.hasPointerCapture(current.id)) current.tile.releasePointerCapture(current.id);
    if (!current.active) return;
    suppressNextClick();
    if (target && session.drop(current.tile.dataset.tileId, JSON.parse(target.dataset.destination))) {
      afterMove(current.tile.dataset.tileId);
    } else {
      session.cancel();
      paintSelection();
      status.textContent = 'Drag cancelled. No tiles moved.';
    }
  }

  function startDrag() {
    if (!gesture || !session.beginDrag(gesture.tile.dataset.tileId)) { finish(); return; }
    gesture.active = true;
    paintSelection();
    gesture.tile.classList.add('touch-source');
    const preview = gesture.tile.cloneNode(true);
    preview.removeAttribute('data-tile-id');
    preview.removeAttribute('aria-pressed');
    preview.removeAttribute('id');
    preview.classList.remove('touch-source');
    preview.classList.add('touch-preview');
    preview.setAttribute('aria-hidden', 'true');
    preview.tabIndex = -1;
    preview.disabled = true;
    preview.draggable = false;
    document.body.append(preview);
    gesture.preview = preview;
    updatePreview();
    status.textContent = 'Move the tile over a + position or New row, then release when the destination is highlighted. Move to an edge to scroll.';
    gesture.frame = view.requestAnimationFrame(scrollFrame);
  }

  function onPointerDown(event) {
    // A second finger cancels even when it lands outside the puzzle.
    if (gesture) { finish(); suppressNextClick(); return; }
    suppressClick = false;
    view.clearTimeout(suppressionTimer);
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    const tile = event.target.closest('[data-tile-id]');
    if (!tile || !content.contains(tile) || tile.disabled || session.snapshot().completed) return;
    gesture = { id: event.pointerId, tile, x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, active: false };
    // Capture keeps cancellation and release reliable outside the source tile.
    tile.setPointerCapture(event.pointerId);
    gesture.timer = view.setTimeout(startDrag, 280);
  }

  function onPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (!gesture.active) {
      // Moving before the hold threshold cannot accidentally move or select a tile.
      if (Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) > 10) {
        finish(); suppressNextClick();
      }
      return;
    }
    event.preventDefault();
    updatePreview();
  }

  function onPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    finish(false); // A short tap is handled by the normal button click.
  }

  function onPointerCancel(event) {
    if (gesture?.id === event.pointerId) { finish(); suppressNextClick(); }
  }

  function onClick(event) {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function onDragStart(event) {
    if (gesture) event.preventDefault(); // Avoid simultaneous native and touch drags.
  }

  function onContextMenu(event) {
    const tile = event.target.closest('[data-tile-id]');
    // Some browsers request the menu after cancelling the pointer, so do not
    // depend on an active gesture. Leave short taps and whitespace scrolling alone.
    if (tile && content.contains(tile) && !tile.disabled && !session.snapshot().completed) {
      event.preventDefault();
    }
  }

  function onVisibility() { if (document.hidden) finish(); }
  const listeners = [
    [document, 'pointerdown', onPointerDown, true],
    [document, 'pointermove', onPointerMove, { passive: false }],
    [document, 'pointerup', onPointerUp],
    [document, 'pointercancel', onPointerCancel],
    [content, 'lostpointercapture', onPointerCancel],
    [content, 'click', onClick, true],
    [content, 'dragstart', onDragStart, true],
    [content, 'contextmenu', onContextMenu, true],
    [document, 'visibilitychange', onVisibility],
    [view, 'blur', finish],
  ];
  for (const [target, type, handler, options] of listeners) target.addEventListener(type, handler, options);
  return {
    cancel: () => finish(),
    dispose() {
      finish();
      view.clearTimeout(suppressionTimer);
      for (const [target, type, handler, options] of listeners) target.removeEventListener(type, handler, options);
    },
  };
}
