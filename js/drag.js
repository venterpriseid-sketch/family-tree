/* ═══════════════════════════════════
   DRAG — Node dragging, couple-lock, multi-select
   ═══════════════════════════════════ */

const Drag = (() => {
  const wrap = document.getElementById('canvas-wrap');

  const MOVE_THRESHOLD = 6;     // px in screen space before a hold becomes a drag
  const LONG_PRESS_MS  = 500;   // hold this long (without moving) to enter select mode

  let selectMode  = false;
  let selectedIds = new Set();

  let pending        = null;   // { id, startX, startY, timer }
  let consumedByHold = false;  // long-press already acted on this gesture
  let isDragging      = false;
  let movingSet        = null; // Map<id, {x,y}> initial local positions
  let dragStartClient = null;

  /* ── Helpers ── */
  function getClient(event) {
    if (event.type.includes('touch')) {
      const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
      return { x: t.clientX, y: t.clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  function nodeEl(id) {
    return document.querySelector(`.node[data-id="${id}"]`);
  }

  function readLocalPos(id) {
    const el = nodeEl(id);
    if (el && el.style.left) {
      return { x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0 };
    }
    const saved = Store.getPosition(id);
    return saved ? { ...saved } : { x: 60, y: 60 };
  }

  /* ── Start (mousedown / touchstart) ── */
  function start(id, event) {
    if (Store.isLocked(id) || isDragging) return;

    const client = getClient(event);
    consumedByHold = false;

    pending = { id, startX: client.x, startY: client.y };
    pending.timer = setTimeout(() => {
      if (!pending || isDragging) return;
      consumedByHold = true;
      if (!selectMode) setSelectMode(true);
      toggleSelected(id);
      if (navigator.vibrate) navigator.vibrate(15);
      pending = null;
    }, LONG_PRESS_MS);

    event.preventDefault();
  }

  function beginActualDrag(id, client) {
    isDragging = true;
    dragStartClient = { x: client.x, y: client.y };

    // By default husband/wife move independently. If the couple has been
    // explicitly locked (via the popup), dragging one brings the other.
    const base = (selectMode && selectedIds.has(id)) ? new Set(selectedIds) : new Set([id]);
    const full = new Set(base);
    base.forEach(pid => {
      Store.getSpouses(pid).forEach(sid => {
        if (Store.isCoupleLocked(pid, sid)) full.add(sid);
      });
    });

    movingSet = new Map();
    full.forEach(pid => {
      movingSet.set(pid, readLocalPos(pid));
      const el = nodeEl(pid);
      if (el) { el.classList.add('dragging'); el.style.zIndex = '1000'; }
    });

    Popup.close();
    wrap.style.cursor = 'grabbing';
  }

  /* ── Move (mousemove / touchmove) ── */
  function move(event) {
    if (pending && !isDragging) {
      const client = getClient(event);
      const dx = client.x - pending.startX, dy = client.y - pending.startY;
      if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
        const id = pending.id;
        clearTimeout(pending.timer);
        pending = null;
        beginActualDrag(id, client);
      } else {
        return;
      }
    }

    if (!isDragging || !movingSet) return;
    if (event.cancelable) event.preventDefault();

    const client = getClient(event);
    const scale  = Canvas.getScale();
    const dx = (client.x - dragStartClient.x) / scale;
    const dy = (client.y - dragStartClient.y) / scale;

    movingSet.forEach((initial, pid) => {
      const el = nodeEl(pid);
      if (!el) return;
      el.style.left = (initial.x + dx) + 'px';
      el.style.top  = (initial.y + dy) + 'px';
    });

    redrawAllLines();
  }

  /* ── End (mouseup / touchend) ── */
  function end(event) {
    if (pending) {
      clearTimeout(pending.timer);
      const id = pending.id;
      pending = null;
      if (!consumedByHold) handleTap(id, event);
      consumedByHold = false;
      return;
    }

    if (!isDragging) return;
    isDragging = false;

    movingSet.forEach((_, pid) => {
      const el = nodeEl(pid);
      if (!el) return;
      el.classList.remove('dragging');
      el.style.zIndex = '';
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      Store.setPosition(pid, x, y);
    });

    movingSet = null;
    wrap.style.cursor = '';
  }

  function handleTap(id, event) {
    if (selectMode) {
      toggleSelected(id);
    } else {
      const c = getClient(event);
      Popup.open(id, { clientX: c.x, clientY: c.y });
    }
  }

  /* ── Selection ── */
  function toggleSelected(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    document.querySelectorAll('.node').forEach(el => {
      el.classList.toggle('selected', selectedIds.has(el.dataset.id));
    });
    updateSelectUI();
  }

  function setSelectMode(on) {
    selectMode = on;
    if (!on) {
      selectedIds.clear();
      document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
    }
    document.body.classList.toggle('select-mode', on);
    updateSelectUI();
  }

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    Toast.show(selectMode
      ? 'Mode pilih aktif — tap anggota, lalu geser salah satu'
      : 'Mode pilih dimatikan');
  }

  function updateSelectUI() {
    const btn = document.getElementById('select-toggle-btn');
    if (!btn) return;
    btn.classList.toggle('active', selectMode);
    btn.textContent = selectMode
      ? (selectedIds.size ? `✓ Selesai (${selectedIds.size})` : '✓ Selesai')
      : '☑ Pilih';
  }

  /* ── Lines (shared with Renderer, kept live during drag) ── */
  function redrawAllLines() {
    const positions = {};
    document.querySelectorAll('.node').forEach(el => {
      positions[el.dataset.id] = {
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
      };
    });
    Renderer.drawLines(positions);
  }

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);

  return {
    start,
    toggleSelectMode,
    isSelectMode: () => selectMode,
    getSelected: () => selectedIds,
  };
})();
