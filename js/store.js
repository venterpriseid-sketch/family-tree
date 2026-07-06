/* ═══════════════════════════════════
   STORE — Data + Undo/Redo
   ═══════════════════════════════════

   Person fields:
     nama, usia (number), gender (F|M),
     pekerjaan, pekerjaanDetail,
     tempat, pendidikan, pendidikanDetail,
     tindakan, locked (boolean)
*/

const Store = (() => {
  const LS = { persons: 'ft_persons', relations: 'ft_relations', positions: 'ft_positions', coupleLocks: 'ft_couple_locks' };
  const UNDO_LIMIT = 10;

  let persons     = JSON.parse(localStorage.getItem(LS.persons)     || '{}');
  let relations   = JSON.parse(localStorage.getItem(LS.relations)   || '[]');
  let positions   = JSON.parse(localStorage.getItem(LS.positions)   || '{}');
  let coupleLocks = JSON.parse(localStorage.getItem(LS.coupleLocks) || '{}'); // pairKey -> true/false

  // Undo/redo stacks hold snapshots { persons, relations, positions }
  let undoStack = [];
  let redoStack = [];

  /* ── Snapshot helpers ── */
  function snapshot() {
    return {
      persons:     JSON.parse(JSON.stringify(persons)),
      relations:   JSON.parse(JSON.stringify(relations)),
      positions:   JSON.parse(JSON.stringify(positions)),
      coupleLocks: JSON.parse(JSON.stringify(coupleLocks)),
    };
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack = []; // clear redo on new action
  }

  /* ── Persist ── */
  function persist() {
    localStorage.setItem(LS.persons,     JSON.stringify(persons));
    localStorage.setItem(LS.relations,   JSON.stringify(relations));
    localStorage.setItem(LS.positions,   JSON.stringify(positions));
    localStorage.setItem(LS.coupleLocks, JSON.stringify(coupleLocks));
  }

  function restore(snap) {
    persons     = JSON.parse(JSON.stringify(snap.persons));
    relations   = JSON.parse(JSON.stringify(snap.relations));
    positions   = JSON.parse(JSON.stringify(snap.positions));
    coupleLocks = JSON.parse(JSON.stringify(snap.coupleLocks || {}));
    persist();
  }

  /* ── Unique ID ── */
  function uid() {
    return 'p' + Date.now() + Math.random().toString(36).slice(2, 5);
  }

  /* ── Person CRUD ── */
  function getAll()    { return persons; }
  function get(id)     { return persons[id]; }
  function count()     { return Object.keys(persons).length; }

  function add(data) {
    pushUndo();
    const id = uid();
    persons[id] = { ...data, nama: data.nama || 'Unknown', locked: false };
    persist();
    return id;
  }

  function update(id, data) {
    pushUndo();
    persons[id] = { ...persons[id], ...data };
    if (!persons[id].nama) persons[id].nama = 'Unknown';
    persist();
  }

  function remove(id) {
    pushUndo();
    delete persons[id];
    delete positions[id];
    relations = relations.filter(r => r.from !== id && r.to !== id);
    Object.keys(coupleLocks).forEach(k => { if (k.split('|').includes(id)) delete coupleLocks[k]; });
    persist();
  }

  function removeMany(ids) {
    pushUndo();
    ids.forEach(id => {
      delete persons[id];
      delete positions[id];
    });
    relations = relations.filter(r => !ids.includes(r.from) && !ids.includes(r.to));
    Object.keys(coupleLocks).forEach(k => { if (k.split('|').some(p => ids.includes(p))) delete coupleLocks[k]; });
    persist();
  }

  /* ── Position management ── */
  function getPosition(id) {
    return positions[id];
  }

  function setPosition(id, x, y) {
    positions[id] = { x, y };
    persist();
  }

  function resetPositions() {
    positions = {};
    persist();
  }

  /* ── Lock/Unlock ── */
  function setLocked(id, locked) {
    if (persons[id]) {
      persons[id].locked = !!locked;
      persist();
    }
  }

  function isLocked(id) {
    return persons[id]?.locked || false;
  }

  function setAllLocked(locked) {
    Object.keys(persons).forEach(id => {
      persons[id].locked = !!locked;
    });
    persist();
  }

  /* ── Relations ── */
  function getRelations()              { return relations; }

  function addRelation(type, from, to) {
    // avoid duplicate
    const exists = relations.some(r => r.type === type && r.from === from && r.to === to);
    if (!exists) {
      relations.push({ type, from, to });
      persist();
    }
  }

  /* ── Relation queries ── */
  function getParents(id) {
    return relations
      .filter(r => (r.type === 'child' && r.to === id) || (r.type === 'parent' && r.from === id))
      .map(r => r.type === 'child' ? r.from : r.to);
  }

  function getChildren(id) {
    return relations
      .filter(r => (r.type === 'child' && r.from === id) || (r.type === 'parent' && r.to === id))
      .map(r => r.type === 'child' ? r.to : r.from);
  }

  function getSpouses(id) {
    return relations
      .filter(r => r.type === 'spouse' && (r.from === id || r.to === id))
      .map(r => r.from === id ? r.to : r.from);
  }

  function hasParent(id) {
    return getParents(id).length > 0;
  }

  /* ── Couple lock (opt-in: locked pairs move together when dragged) ── */
  function pairKey(a, b) { return [a, b].sort().join('|'); }

  function isCoupleLocked(a, b) {
    return !!coupleLocks[pairKey(a, b)];
  }

  function setCoupleLock(a, b, locked) {
    coupleLocks[pairKey(a, b)] = !!locked;
    persist();
  }

  /* ── Filter (for export) ── */
  function filter({ gender, kerja, usiaMin, usiaMax }) {
    return Object.values(persons).filter(p => {
      if (gender && gender !== 'all' && p.gender    !== gender) return false;
      if (kerja  && kerja  !== 'all' && p.pekerjaan !== kerja)  return false;
      const age = parseInt(p.usia) || 0;
      if (usiaMin !== undefined && usiaMin !== '' && age < parseInt(usiaMin)) return false;
      if (usiaMax !== undefined && usiaMax !== '' && age > parseInt(usiaMax)) return false;
      return true;
    });
  }

  /* ── Undo / Redo ── */
  function undo() {
    if (!undoStack.length) return false;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    return true;
  }

  function redo() {
    if (!redoStack.length) return false;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    return true;
  }

  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }

  /* ── Backup / Restore JSON ── */
  function exportJSON() {
    return JSON.stringify({ persons, relations, coupleLocks }, null, 2);
  }

  function importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.persons || !data.relations) throw new Error('Invalid format');
      pushUndo();
      persons     = data.persons;
      relations   = data.relations;
      coupleLocks = data.coupleLocks || {};
      persist();
      return true;
    } catch {
      return false;
    }
  }

  return {
    getAll, get, count,
    add, update, remove, removeMany,
    getRelations, addRelation,
    getParents, getChildren, getSpouses, hasParent,
    isCoupleLocked, setCoupleLock,
    filter,
    undo, redo, canUndo, canRedo,
    exportJSON, importJSON,
    getPosition, setPosition, resetPositions,
    setLocked, isLocked, setAllLocked,
  };
})();
