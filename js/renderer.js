/* ═══════════════════════════════════
   RENDERER — Nodes + Lines
   ═══════════════════════════════════ */

const Renderer = (() => {
  const canvas   = document.getElementById('tree-canvas');
  const linesSvg = document.getElementById('lines-svg');
  const empty    = document.getElementById('empty-state');
  const SVGNS    = 'http://www.w3.org/2000/svg';

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

  /* ── Small line helper ── */
  function mkLine(x1, y1, x2, y2, stroke, dash) {
    const line = document.createElementNS(SVGNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', dash);
    line.setAttribute('opacity', '0.55');
    return line;
  }

  /* ── Unordered pair key, e.g. "id1|id2" (sorted) ── */
  function pairKey(a, b) {
    return [a, b].sort().join('|');
  }

  /* ── Draw all relation lines + couple anchors ──
     - Spouse pairs get a connecting line + a green anchor dot at their midpoint.
     - A child with two parents who are spouses gets ONE line from that
       couple's anchor dot (their shared downline).
     - Everyone else (single parent, or parents who aren't a couple) keeps
       a direct line straight from parent to child.
  */
  function drawLines(positions) {
    linesSvg.innerHTML = '';

    // 1) Spouse lines + anchors
    const seenPairs   = new Set();
    const coupleAnchor = {};

    Store.getRelations()
      .filter(r => r.type === 'spouse')
      .forEach(r => {
        const key = pairKey(r.from, r.to);
        if (seenPairs.has(key)) return;
        seenPairs.add(key);

        const a = positions[r.from], b = positions[r.to];
        if (!a || !b) return;

        linesSvg.appendChild(mkLine(
          a.x + ANCHOR, a.y + ANCHOR, b.x + ANCHOR, b.y + ANCHOR,
          '#ec4899', '4,3'
        ));

        const mx = (a.x + b.x) / 2 + ANCHOR;
        const my = (a.y + b.y) / 2 + ANCHOR;
        coupleAnchor[key] = { x: mx, y: my };

        const dot = document.createElementNS(SVGNS, 'circle');
        dot.setAttribute('cx', mx);
        dot.setAttribute('cy', my);
        dot.setAttribute('r', 5);
        dot.setAttribute('fill', '#22c55e');
        dot.setAttribute('stroke', '#fff');
        dot.setAttribute('stroke-width', '1.5');
        linesSvg.appendChild(dot);
      });

    // 2) Parent → child lines, grouped by child
    const childParents = {};
    Store.getRelations().forEach(r => {
      if (r.type === 'child') {
        (childParents[r.to] = childParents[r.to] || []).push(r.from);
      } else if (r.type === 'parent') {
        (childParents[r.from] = childParents[r.from] || []).push(r.to);
      }
    });

    Object.keys(childParents).forEach(childId => {
      const parents  = [...new Set(childParents[childId])];
      const childPos = positions[childId];
      if (!childPos) return;

      if (parents.length === 2) {
        const key = pairKey(parents[0], parents[1]);
        if (coupleAnchor[key]) {
          const a = coupleAnchor[key];
          linesSvg.appendChild(mkLine(
            a.x, a.y, childPos.x + ANCHOR, childPos.y + ANCHOR,
            '#334155', '5,4'
          ));
          return;
        }
      }

      // Fallback: direct line(s) from each known parent
      parents.forEach(p => {
        const pp = positions[p];
        if (!pp) return;
        linesSvg.appendChild(mkLine(
          pp.x + ANCHOR, pp.y + ANCHOR, childPos.x + ANCHOR, childPos.y + ANCHOR,
          '#334155', '5,4'
        ));
      });
    });
  }

  /* ── Draw one node ── */
  function drawNode(id, person, pos) {
    const gClass   = person.gender === 'F' ? 'female' : person.gender === 'M' ? 'male' : '';
    const color    = TINDAKAN_COLORS[person.tindakan];
    const locked   = person.locked;
    const selected = Drag.getSelected().has(id);

    const el = document.createElement('div');
    el.className  = `node${selected ? ' selected' : ''}`;
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

    // A single tap opens the popup (or toggles selection in select mode);
    // holding and moving drags; a plain long-press enters select mode.
    // All of that is handled inside Drag — no separate click listener needed.
    el.addEventListener('mousedown',  e => { e.stopPropagation(); Drag.start(id, e); });
    el.addEventListener('touchstart', e => { e.stopPropagation(); Drag.start(id, e); }, { passive: false });

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

    drawLines(positions);

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

  return { render, drawLines };
})();
