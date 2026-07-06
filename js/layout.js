/* ═══════════════════════════════════
   LAYOUT — Tree positioning
   ═══════════════════════════════════ */

const Layout = (() => {
  const H_GAP = 108;
  const V_GAP = 115;

  function compute() {
    const persons = Store.getAll();
    const ids     = Object.keys(persons);
    if (!ids.length) return {};

    const positions = {};

    // First, check for saved positions
    ids.forEach(id => {
      const saved = Store.getPosition(id);
      if (saved) {
        positions[id] = { ...saved };
      }
    });

    // Remember which ids were ALREADY saved before this call — the
    // auto-layout below must never reposition these, even if it walks
    // through them while placing a newly-added relative.
    const savedIds = new Set(Object.keys(positions));

    // If no saved positions, compute layout
    const unsavedIds = ids.filter(id => !positions[id]);
    if (unsavedIds.length) {
      const roots = unsavedIds.filter(id => !Store.hasParent(id));
      const startRoots = roots.length ? roots : [unsavedIds[0]];

      const visited  = new Set();
      const savedXs  = Object.values(positions).map(p => p.x);
      let xCursor    = savedXs.length ? Math.max(...savedXs) + H_GAP : 60;

      function placeSubtree(id, depth) {
        if (visited.has(id)) return;
        visited.add(id);

        if (!savedIds.has(id)) {
          positions[id] = { x: xCursor, y: 60 + depth * V_GAP };
          xCursor += H_GAP;
        }

        // Spouses on same row
        Store.getSpouses(id)
          .filter(s => !visited.has(s))
          .forEach(sid => {
            visited.add(sid);
            if (!savedIds.has(sid)) {
              positions[sid] = { x: xCursor, y: 60 + depth * V_GAP };
              xCursor += H_GAP;
            }
          });

        // Children go one level down
        Store.getChildren(id).forEach(cid => placeSubtree(cid, depth + 1));
      }

      startRoots.forEach(r => placeSubtree(r, 0));

      // Disconnected nodes
      unsavedIds.filter(id => !visited.has(id)).forEach(id => {
        if (!savedIds.has(id)) {
          positions[id] = { x: xCursor, y: 60 };
          xCursor += H_GAP;
        }
      });
    }

    return positions;
  }

  /* ── Place a freshly-added person near the relative that spawned them,
     instead of far away at the edge of the whole canvas.
       - parent : directly above the child
       - child  : directly below the parent (centered under the couple,
                  if that parent has a spouse already positioned)
       - spouse : right beside the context person
     `positions` should be a snapshot from compute() taken BEFORE the new
     person was added to the Store, so `contextId` reflects where it's
     actually shown right now. ── */
  function placeNear(newId, contextId, mode, positions) {
    const base = (positions && positions[contextId]) || Store.getPosition(contextId) || { x: 60, y: 60 };
    let x, y;

    if (mode === 'parent') {
      x = base.x;
      y = base.y - V_GAP;
    } else if (mode === 'child') {
      const spouseIds = Store.getSpouses(contextId).filter(s => positions && positions[s]);
      x = spouseIds.length ? (base.x + positions[spouseIds[0]].x) / 2 : base.x;
      y = base.y + V_GAP;
    } else { // spouse
      x = base.x + H_GAP;
      y = base.y;
    }

    // Nudge away if it would land right on top of an existing node
    const taken = positions ? Object.values(positions) : [];
    let guard = 0;
    while (taken.some(p => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40) && guard < 20) {
      x += H_GAP * 0.6;
      guard++;
    }

    Store.setPosition(newId, x, y);
  }

  /* ── One-time self-heal: separate any nodes whose SAVED positions are
     stuck on top of each other (e.g. leftover from an older buggy build).
     When two circles share nearly the same spot, whichever renders later
     in the DOM eats every pointer event, making the other one feel
     permanently "glued" and undraggable. Runs a few passes in case more
     than 2 nodes are piled up together. ── */
  function deconflict() {
    const MIN_DIST = 45; // smaller than a node's diameter counts as "stuck"
    let changedAny = false;

    for (let pass = 0; pass < 5; pass++) {
      const ids = Object.keys(Store.getAll()).filter(id => Store.getPosition(id));
      let movedThisPass = false;

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = Store.getPosition(ids[i]);
          const b = Store.getPosition(ids[j]);
          if (Math.abs(a.x - b.x) < MIN_DIST && Math.abs(a.y - b.y) < MIN_DIST) {
            Store.setPosition(ids[j], b.x + H_GAP, b.y);
            changedAny = true;
            movedThisPass = true;
          }
        }
      }

      if (!movedThisPass) break;
    }

    return changedAny;
  }

  return { compute, placeNear, deconflict, H_GAP, V_GAP };
})();
