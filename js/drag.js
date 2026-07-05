/* ═══════════════════════════════════
   DRAG — Node dragging
   ═══════════════════════════════════ */

const Drag = (() => {
  const wrap   = document.getElementById('canvas-wrap');
  const canvas = document.getElementById('tree-canvas');
  const svg    = document.getElementById('lines-svg');

  let isDragging = false;
  let draggedId = null;
  let dragStart = null;
  let dragOffset = null;

  function start(id, event) {
    if (Store.isLocked(id)) return;
    
    isDragging = true;
    draggedId = id;

    const node = document.querySelector(`.node[data-id="${id}"]`);
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const canvasRect = wrap.getBoundingClientRect();

    // Get starting mouse/touch position
    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;

    dragStart = { x: clientX, y: clientY };
    dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    node.style.zIndex = '1000';
    node.classList.add('dragging');
    wrap.style.cursor = 'grabbing';

    Popup.close();
    event.preventDefault();
  }

  function move(event) {
    if (!isDragging || !draggedId) return;

    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;

    const canvasRect = wrap.getBoundingClientRect();
    const treeRect = canvas.getBoundingClientRect();

    // Calculate new position relative to canvas
    const newX = clientX - treeRect.left;
    const newY = clientY - treeRect.top;

    // Update node position
    const node = document.querySelector(`.node[data-id="${draggedId}"]`);
    if (node) {
      node.style.left = newX + 'px';
      node.style.top = newY + 'px';
    }

    // Redraw lines in real-time
    redrawLines();
  }

  function end(event) {
    if (!isDragging || !draggedId) return;

    isDragging = false;

    const node = document.querySelector(`.node[data-id="${draggedId}"]`);
    if (node) {
      node.style.zIndex = '';
      node.classList.remove('dragging');

      // Save position
      const x = parseFloat(node.style.left);
      const y = parseFloat(node.style.top);
      Store.setPosition(draggedId, x, y);
    }

    wrap.style.cursor = '';
    draggedId = null;
  }

  function redrawLines() {
    const svg = document.getElementById('lines-svg');
    svg.innerHTML = '';

    const positions = {};
    document.querySelectorAll('.node').forEach(el => {
      const id = el.dataset.id;
      const x = parseFloat(el.style.left) || parseFloat(el.getAttribute('data-x')) || 0;
      const y = parseFloat(el.style.top) || parseFloat(el.getAttribute('data-y')) || 0;
      positions[id] = { x, y };
    });

    const ANCHOR = 30;
    Store.getRelations().forEach(rel => {
      const a = positions[rel.from], b = positions[rel.to];
      if (!a || !b) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x + ANCHOR);
      line.setAttribute('y1', a.y + ANCHOR);
      line.setAttribute('x2', b.x + ANCHOR);
      line.setAttribute('y2', b.y + ANCHOR);
      line.setAttribute('stroke', rel.type === 'spouse' ? '#ec4899' : '#334155');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', rel.type === 'spouse' ? '4,3' : '5,4');
      line.setAttribute('opacity', '0.55');
      svg.appendChild(line);
    });
  }

  // Mouse events
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);

  // Touch events
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);

  return { start };
})();
