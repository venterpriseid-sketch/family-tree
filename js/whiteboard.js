/* ═══════════════════════════════════
   WHITEBOARD — Pencil-only drawing
   Uses Pointer Events API.
   pointerType === 'pen' = Apple Pencil
   Palm rejection: ignore touch/mouse
   when whiteboard mode is active.
   ═══════════════════════════════════ */

const Whiteboard = (() => {
  const cvs     = document.getElementById('whiteboard');
  const toolbar = document.getElementById('wb-toolbar');
  const ctx     = cvs.getContext('2d');

  let active  = false;
  let tool    = 'pen';   // 'pen' | 'eraser'
  let drawing = false;
  let lastX = 0, lastY = 0;

  const PEN_COLOR  = '#1e293b';
  const PEN_WIDTH  = 2;
  const ERASER_W   = 28;

  /* ── Resize canvas to fill container ── */
  function resize() {
    const wrap = document.getElementById('canvas-wrap');
    const dpr  = window.devicePixelRatio || 1;
    const w    = wrap.offsetWidth;
    const h    = wrap.offsetHeight;
    // Save drawing, resize, restore
    const img = ctx.getImageData(0, 0, cvs.width, cvs.height);
    cvs.width  = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width  = w + 'px';
    cvs.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.putImageData(img, 0, 0);
  }

  window.addEventListener('resize', resize);

  /* ── Toggle whiteboard ── */
  function toggle() {
    active = !active;
    cvs.style.display     = active ? 'block' : 'none';
    toolbar.classList.toggle('visible', active);
    if (active) {
      resize();
      setTool('pen');
    }
    return active;
  }

  function isActive() { return active; }

  /* ── Tool switch ── */
  function setTool(t) {
    tool = t;
    document.getElementById('wb-pen-btn').classList.toggle('active',    t === 'pen');
    document.getElementById('wb-eraser-btn').classList.toggle('active', t === 'eraser');
    cvs.style.cursor = t === 'eraser' ? 'cell' : 'crosshair';
  }

  /* ── Drawing helpers ── */
  function startStroke(x, y) {
    drawing = true;
    lastX = x; lastY = y;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function continueStroke(x, y) {
    if (!drawing) return;
    if (tool === 'eraser') {
      ctx.clearRect(x - ERASER_W / 2, y - ERASER_W / 2, ERASER_W, ERASER_W);
    } else {
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth   = PEN_WIDTH;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastX = x; lastY = y;
  }

  function endStroke() { drawing = false; }

  function clearAll() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
  }

  /* ── Pointer Events (pen only, palm rejection) ── */
  cvs.addEventListener('pointerdown', e => {
    if (!active) return;
    // Only respond to Apple Pencil (pen) — reject touch and mouse
    if (e.pointerType !== 'pen') return;
    e.preventDefault();
    cvs.setPointerCapture(e.pointerId);
    const rect = cvs.getBoundingClientRect();
    startStroke(e.clientX - rect.left, e.clientY - rect.top);
  });

  cvs.addEventListener('pointermove', e => {
    if (!active || !drawing) return;
    if (e.pointerType !== 'pen') return;
    e.preventDefault();
    const rect = cvs.getBoundingClientRect();
    continueStroke(e.clientX - rect.left, e.clientY - rect.top);
  });

  cvs.addEventListener('pointerup',     () => endStroke());
  cvs.addEventListener('pointercancel', () => endStroke());

  /* ── Prevent touch scrolling on canvas when active ── */
  cvs.addEventListener('touchstart', e => { if (active) e.preventDefault(); }, { passive: false });
  cvs.addEventListener('touchmove',  e => { if (active) e.preventDefault(); }, { passive: false });

  return { toggle, isActive, setTool, clearAll };
})();
