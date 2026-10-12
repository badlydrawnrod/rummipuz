// Whole-row reordering is a separate pointer gesture from tile placement.
// Only the small row handle can start it; row whitespace remains native scroll.
export function initialiseRowDrag({ content, board, status, session, paintSelection, afterReorder }) {
  const document = content.ownerDocument;
  const view = document.defaultView;
  let gesture = null;
  let suppressClick = false;
  let suppressionTimer = 0;

  const clearSuppression = () => {
    suppressClick = false;
    view.clearTimeout(suppressionTimer);
  };
  const suppressNextClick = () => {
    suppressClick = true;
    view.clearTimeout(suppressionTimer);
    suppressionTimer = view.setTimeout(() => { suppressClick = false; }, 750);
  };
  const rowViews = () => [...board.querySelectorAll('[data-row-view]')];
  const rowId = (row) => row.dataset.rowView;
  const sourceStillExists = (current) => {
    const snapshot = session.snapshot();
    return snapshot.state === current.state && !snapshot.completed
      && snapshot.rows.some((row) => row.id === current.rowId)
      && rowViews().some((row) => rowId(row) === current.rowId);
  };
  const markerFor = (beforeRowId) => [...board.querySelectorAll('[data-row-destination]')]
    .find((marker) => {
      try { return JSON.parse(marker.dataset.rowDestination).beforeRowId === beforeRowId; }
      catch { return false; }
    }) ?? null;

  function targetAt(x, y) {
    const bounds = board.getBoundingClientRect();
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
    const rows = rowViews().filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.bottom > bounds.top && rect.top < bounds.bottom;
    });
    if (!rows.length) return markerFor(null);
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (y < (rect.top + rect.bottom) / 2) return markerFor(rowId(row));
    }
    return markerFor(null);
  }

  function clearTarget(current) {
    current.target?.classList.remove('row-insertion-active');
    current.target = null;
  }

  function updateTarget(current) {
    clearTarget(current);
    if (!sourceStillExists(current)) { finish(true, 'Row reorder cancelled.'); return; }
    current.target = targetAt(current.x, current.y);
    current.target?.classList.add('row-insertion-active');
  }

  function positionPreview(current) {
    current.preview.style.left = `${current.x}px`;
    current.preview.style.top = `${current.y}px`;
  }

  function edgeSpeed(position, start, end, margin, maximum) {
    if (position < start || position > end) return 0;
    if (position < start + margin) return -maximum * (1 - (position - start) / margin);
    if (position > end - margin) return maximum * (1 - (end - position) / margin);
    return 0;
  }

  function scrollFrame() {
    if (!gesture?.active) return;
    const speed = edgeSpeed(gesture.y, 0, view.innerHeight, 64, 12);
    if (speed) view.scrollBy(0, speed);
    positionPreview(gesture);
    updateTarget(gesture);
    if (gesture?.active) gesture.frame = view.requestAnimationFrame(scrollFrame);
  }

  function beginDrag() {
    if (!gesture || gesture.pointerType !== 'touch' || !sourceStillExists(gesture)) return;
    activate(gesture);
  }

  function activate(current) {
    if (gesture !== current || current.active || !sourceStillExists(current)) return;
    current.active = true;
    // Reordering must not inherit a tile selection from an earlier action.
    session.cancel();
    paintSelection();
    board.classList.add('row-dragging');
    current.source.classList.add('row-drag-source');
    const preview = document.createElement('div');
    preview.className = 'row-drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.textContent = `Row ${current.rowNumber}`;
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '1000';
    document.body.append(preview);
    current.preview = preview;
    positionPreview(current);
    updateTarget(current);
    if (!gesture) return;
    status.textContent = `Move row ${current.rowNumber} to a highlighted gap, then release.`;
    current.frame = view.requestAnimationFrame(scrollFrame);
  }

  function finish(cancelled = true, message = 'Row order unchanged.') {
    if (!gesture) return;
    const current = gesture;
    let destination = null;
    if (!cancelled && current.active && sourceStillExists(current)) {
      // The pointer may have moved since the last animation frame.
      clearTarget(current);
      const target = targetAt(current.x, current.y);
      if (target) {
        try { destination = JSON.parse(target.dataset.rowDestination); } catch { destination = null; }
      }
    }
    gesture = null; // releasePointerCapture can synchronously fire lostpointercapture.
    view.clearTimeout(current.timer);
    view.cancelAnimationFrame(current.frame);
    clearTarget(current);
    current.source.classList.remove('row-drag-source');
    board.classList.remove('row-dragging');
    current.preview?.remove();
    if (current.handle.hasPointerCapture?.(current.id)) current.handle.releasePointerCapture(current.id);
    if (!current.active) return;
    suppressNextClick();
    if (destination && sourceStillExists(current)
        && session.reorder(current.rowId, destination)) {
      afterReorder(current.rowId);
      return;
    }
    status.textContent = message;
  }

  function onPointerDown(event) {
    if (gesture) { finish(true, 'Row reorder cancelled.'); return; }
    clearSuppression();
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return;
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const handle = event.target.closest?.('[data-row-handle]');
    if (!handle || !content.contains(handle) || handle.disabled || !board.contains(handle)) return;
    const source = handle.closest('[data-row-view]');
    if (!source || source.dataset.rowView !== handle.dataset.rowHandle) return;
    const snapshot = session.snapshot();
    const row = snapshot.rows.find((entry) => entry.id === handle.dataset.rowHandle);
    if (!row || snapshot.completed) return;
    gesture = { id: event.pointerId, pointerType: event.pointerType, handle, source,
      rowId: row.id, rowNumber: row.number, state: snapshot.state,
      startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
      active: false, target: null };
    handle.setPointerCapture?.(event.pointerId);
    if (event.pointerType === 'touch') gesture.timer = view.setTimeout(beginDrag, 280);
  }

  function onPointerMove(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (!sourceStillExists(gesture)) { finish(true, 'Row reorder cancelled.'); return; }
    if (!gesture.active) {
      const distance = Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY);
      if (gesture.pointerType === 'mouse' && distance >= 6) activate(gesture);
      else if (gesture.pointerType === 'touch' && distance > 10) {
        finish(true, 'Row reorder cancelled.');
        suppressNextClick();
      }
      return;
    }
    event.preventDefault();
    positionPreview(gesture);
    updateTarget(gesture);
  }

  function onPointerUp(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    finish(false);
  }

  function onPointerCancel(event) {
    if (gesture?.id === event.pointerId) finish(true, 'Row reorder cancelled.');
  }

  function onLostCapture(event) { onPointerCancel(event); }
  function onKeyDown(event) {
    if (event.key === 'Escape' && gesture) { finish(true, 'Row reorder cancelled.'); event.preventDefault(); }
  }
  function onBlur() { finish(true, 'Row reorder cancelled.'); }
  function onVisibility() { if (document.hidden) finish(true, 'Row reorder cancelled.'); }
  function onClick(event) {
    if (!suppressClick || event.detail === 0 || !event.target.closest?.('[data-row-handle]')) return;
    suppressClick = false;
    view.clearTimeout(suppressionTimer);
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function onDragStart(event) {
    if (event.target.closest?.('[data-row-handle]') && board.contains(event.target)) event.preventDefault();
  }
  function onContextMenu(event) {
    if (event.target.closest?.('[data-row-handle]') && board.contains(event.target)) event.preventDefault();
  }

  const listeners = [
    [document, 'pointerdown', onPointerDown, true],
    [document, 'pointermove', onPointerMove, { passive: false }],
    [document, 'pointerup', onPointerUp],
    [document, 'pointercancel', onPointerCancel],
    [document, 'keydown', onKeyDown],
    [document, 'visibilitychange', onVisibility],
    [content, 'lostpointercapture', onLostCapture],
    [content, 'click', onClick, true],
    [content, 'dragstart', onDragStart, true],
    [content, 'contextmenu', onContextMenu, true],
    [view, 'blur', onBlur],
  ];
  for (const [target, type, handler, options] of listeners) target.addEventListener(type, handler, options);
  return {
    cancel: () => finish(true, 'Row reorder cancelled.'),
    dispose() {
      finish(true, 'Row reorder cancelled.');
      clearSuppression();
      for (const [target, type, handler, options] of listeners) target.removeEventListener(type, handler, options);
    },
  };
}
