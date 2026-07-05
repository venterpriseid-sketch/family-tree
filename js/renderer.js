/* ═══════════════════════════════════
   RENDERER — Nodes + Lines
   ═══════════════════════════════════ */

const Renderer = (() => {
  const canvas   = document.getElementById('tree-canvas');
  const linesSvg = document.getElementById('lines-svg');
  const empty    = document.getElementById('empty-state');

  /* Anchor point center of node (30 = half of 60px circle) */
  const ANCHOR = 30;

  const TINDAKAN_COLORS = {
    'Prospek':    '#22c55e',
    'Rekrut':     '#3b82f6',
    'Followup':   '#a855f7',
    'Janji Temu': '#eab308',
    'Belum Ada':  '#94a3b8',
  };

  /* ── Initials from name ── */
  function initials(nama) {
    if (!nama || nama === 'Unknown') return '?';
    return nama.trim().split(/\s+/)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  /* ── Draw relation line ── */
  function drawLine(pos, rel) {
    const a = pos[rel.from], b = pos[rel.to];
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
    linesSvg.appendChild(line);
  }

  /* ── Draw one node ── */
  function drawNode(id, person, pos) {
    const gClass = person.gender === 'F' ? 'female' : person.gender === 'M' ? 'male' : '';
    const color  = TINDAKAN_COLORS[person.tindakan];
    const locked = person.locked;

    const el = document.createElement('div');
    el.className  = 'node';
    el.style.left = pos.x + 'px';
    el.style.top  = pos.y + 'px';
    el.dataset.id = id;

    el.innerHTML = `
      <div class="node-circle ${gClass} ${locked ? 'locked' : ''}">
        ${initials(person.nama)}
        ${color ? `<div class="node-tindakan" style="background:${color}"></div>` : ''}
      </div>
      <div class="node-name">${person.nama || 'Unknown'}</div>
    `;

    el.addEventListener('click', e => { e.stopPropagation(); Popup.open(id, e); });
    el.addEventListener('mousedown', e => { e.stopPropagation(); Drag.start(id, e); });
    el.addEventListener('touchstart', e => { e.stopPropagation(); Drag.start(id, e); }, false);
    
    canvas.appendChild(el);
  }

  /* ── Main render ── */
  function render(highlightIds = null) {
    canvas.innerHTML   = '';
    linesSvg.innerHTML = '';

    const persons = Store.getAll();
    const ids     = Object.keys(persons);

    empty.style.display = ids.length ? 'none' : 'block';
    if (!ids.length) return;

    const positions = Layout.compute();

    Store.getRelations().forEach(rel => drawLine(positions, rel));

    ids.forEach(id => {
      drawNode(id, persons[id], positions[id] || { x: 60, y: 60 });
    });

    // Apply search highlight
    if (highlightIds && highlightIds.length) {
      document.querySelectorAll('.node').forEach(el => {
        const inSet = highlightIds.includes(el.dataset.id);
        el.classList.toggle('highlighted', inSet);
        el.classList.toggle('dimmed', !inSet);
      });
    }
  }

  return { render };
})();
