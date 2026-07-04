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

    const roots = ids.filter(id => !Store.hasParent(id));
    const startRoots = roots.length ? roots : [ids[0]];

    const positions = {};
    const visited   = new Set();
    let xCursor     = 60;

    function placeSubtree(id, depth) {
      if (visited.has(id)) return;
      visited.add(id);

      positions[id] = { x: xCursor, y: 60 + depth * V_GAP };
      xCursor += H_GAP;

      // Spouses on same row
      Store.getSpouses(id)
        .filter(s => !visited.has(s))
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
    ids.filter(id => !visited.has(id)).forEach(id => {
      positions[id] = { x: xCursor, y: 60 };
      xCursor += H_GAP;
    });

    return positions;
  }

  return { compute };
})();
