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

    // If no saved positions, compute layout
    const unsavedIds = ids.filter(id => !positions[id]);
    if (unsavedIds.length) {
      const roots = unsavedIds.filter(id => !Store.hasParent(id));
      const startRoots = roots.length ? roots : [unsavedIds[0]];

      const visited = new Set();
      let xCursor = Math.max(...Object.values(positions).map(p => p.x || 60)) + H_GAP || 60;

      function placeSubtree(id, depth) {
        if (visited.has(id)) return;
        visited.add(id);

        positions[id] = { x: xCursor, y: 60 + depth * V_GAP };
        xCursor += H_GAP;

        // Spouses on same row
        Store.getSpouses(id)
          .filter(s => !visited.has(s) && !positions[s])
          .forEach(sid => {
            visited.add(sid);
            positions[sid] = { x: xCursor, y: 60 + depth * V_GAP };
            xCursor += H_GAP;
          });

        // Children go one level down
        Store.getChildren(id).forEach(cid => placeSubtree(cid, depth + 1));
      }

      startRoots.forEach(r => placeSubtree(r, 0));

      // Disconnected nodes
      unsavedIds.filter(id => !visited.has(id)).forEach(id => {
        positions[id] = { x: xCursor, y: 60 };
        xCursor += H_GAP;
      });
    }

    return positions;
  }

  return { compute };
})();
