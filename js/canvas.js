/* ═══════════════════════════════════
   CANVAS — Pan, Zoom, Pinch (iPad)
   Header is fixed — only tree moves.
   ═══════════════════════════════════ */

const Canvas = (() => {
  const wrap     = document.getElementById('canvas-wrap');
  const treeEl   = document.getElementById('tree-canvas');
  const svgEl    = document.getElementById('lines-svg');

  let scale = 1, tx = 0, ty = 0;
  let panning   = false;
  let panStart  = null;

  /* pinch state */
  let pinching     = false;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let pinchMidX = 0, pinchMidY = 0;

  const MIN_SCALE = 0.15;
  const MAX_SCALE = 3;

  /* ── Apply transform ── */
  function applyTransform() {
    const t = `translate(${tx}px,${ty}px) scale(${scale})`;
    treeEl.style.transform = t;
    svgEl.style.transform  = t;
  }

  /* ── Center view ── */
  function centerFirst() {
    const rect = wrap.getBoundingClientRect();
    tx = rect.width  / 2 - 30;
    ty = rect.height / 2 - 80;
    scale = 1;
    applyTransform();
  }

  function zoomTo(factor, cx, cy) {
    const rect = wrap.getBoundingClientRect();
    const mx = (cx ?? rect.width  / 2);
    const my = (cy ?? rect.height / 2);
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    applyTransform();
  }

  /* ── Zoom buttons ── */
  function zoomIn()  { zoomTo(1.2); }
  function zoomOut() { zoomTo(0.8); }

  /* ── Mouse: wheel zoom ── */
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    zoomTo(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  /* ── Mouse: pan ── */
  wrap.addEventListener('mousedown', e => {
    if (Whiteboard.isActive()) return;
    if (e.target.closest('.node') || e.target.closest('#node-popup')) return;
    panning  = true;
    panStart = { x: e.clientX - tx, y: e.clientY - ty };
    wrap.style.cursor = 'grabbing';
    Popup.close();
  });

  window.addEventListener('mousemove', e => {
    if (!panning) return;
    tx = e.clientX - panStart.x;
    ty = e.clientY - panStart.y;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    panning = false;
    wrap.style.cursor = '';
  });

  /* ── Touch: pan + pinch (iPad) ── */
  function touchDist(t1, t2) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }
  function touchMid(t1, t2, rect) {
    return {
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    };
  }

  wrap.addEventListener('touchstart', e => {
    if (Whiteboard.isActive()) return; // whiteboard handles its own touch

    if (e.touches.length === 2) {
      pinching = true; panning = false;
      pinchStartDist  = touchDist(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
      const mid = touchMid(e.touches[0], e.touches[1], wrap.getBoundingClientRect());
      pinchMidX = mid.x; pinchMidY = mid.y;
      e.preventDefault();
    } else if (e.touches.length === 1 && !e.target.closest('.node')) {
      panning  = true;
      const t  = e.touches[0];
      panStart = { x: t.clientX - tx, y: t.clientY - ty };
      Popup.close();
    }
  }, { passive: false });

  wrap.addEventListener('touchmove', e => {
    if (Whiteboard.isActive()) return;

    if (pinching && e.touches.length === 2) {
      e.preventDefault();
      const dist    = touchDist(e.touches[0], e.touches[1]);
      const factor  = dist / pinchStartDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale * factor));
      tx = pinchMidX - (pinchMidX - tx) * (newScale / scale);
      ty = pinchMidY - (pinchMidY - ty) * (newScale / scale);
      scale = newScale;
      applyTransform();
    } else if (panning && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      tx = t.clientX - panStart.x;
      ty = t.clientY - panStart.y;
      applyTransform();
    }
  }, { passive: false });

  wrap.addEventListener('touchend', e => {
    if (e.touches.length < 2) pinching = false;
    if (e.touches.length === 0) panning = false;
  });

  return { centerFirst, zoomIn, zoomOut, isPanning: () => panning, getScale: () => scale };
})();
