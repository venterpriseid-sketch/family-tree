/* ═══════════════════════════════════
   ACTIONS — Delete, Bulk, Undo/Redo
   ═══════════════════════════════════ */

const Actions = (() => {

  /* ── Delete single ── */
  function deletePerson() {
    const id   = Popup.getActiveId();
    if (!id) return;
    const name = Store.get(id)?.nama || 'Anggota';
    Confirm.show(
      `Hapus ${name}?`,
      'Data relasi juga akan dihapus.',
      () => {
        Store.remove(id);
        Popup.close();
        Renderer.render();
        Toast.show(`${name} dihapus`);
      }
    );
  }

  /* ── Bulk remove ── */
  function openBulkRemove() {
    const persons = Store.getAll();
    const ids     = Object.keys(persons);
    if (!ids.length) { Toast.show('Belum ada anggota'); return; }

    const overlay = document.getElementById('bulk-modal');
    const list    = document.getElementById('bulk-list');
    list.innerHTML = '';

    ids.forEach(id => {
      const p   = persons[id];
      const row = document.createElement('label');
      row.className = 'bulk-row';
      row.innerHTML = `
        <input type="checkbox" class="bulk-check" data-id="${id}" />
        <span class="bulk-name">${p.nama}</span>
        <span class="bulk-meta">${p.gender || ''} ${p.usia ? '· ' + p.usia + ' thn' : ''}</span>
      `;
      list.appendChild(row);
    });

    overlay.classList.add('active');
  }

  function closeBulkRemove() {
    document.getElementById('bulk-modal').classList.remove('active');
  }

  function confirmBulkRemove() {
    const checked = [...document.querySelectorAll('.bulk-check:checked')];
    if (!checked.length) { Toast.show('Pilih minimal 1 anggota'); return; }
    const ids   = checked.map(c => c.dataset.id);
    const names = ids.map(id => Store.get(id)?.nama).join(', ');
    Confirm.show(
      `Hapus ${ids.length} anggota?`,
      `${names}\n\nTindakan ini tidak bisa diundo secara otomatis.`,
      () => {
        Store.removeMany(ids);
        closeBulkRemove();
        Renderer.render();
        Toast.show(`${ids.length} anggota dihapus`);
      }
    );
  }

  /* ── Select all / none ── */
  function bulkSelectAll() {
    document.querySelectorAll('.bulk-check').forEach(c => c.checked = true);
  }
  function bulkSelectNone() {
    document.querySelectorAll('.bulk-check').forEach(c => c.checked = false);
  }

  /* ── Couple lock ── */
  function toggleCoupleLock() {
    const id = Popup.getActiveId();
    if (!id) return;
    const spouses = Store.getSpouses(id);
    if (!spouses.length) return;
    const newState = !Store.isCoupleLocked(id, spouses[0]);
    spouses.forEach(s => Store.setCoupleLock(id, s, newState));
    Popup.close();
    Toast.show(newState ? 'Pasangan dikunci — geser salah satu, dua-duanya ikut' : 'Kunci dilepas — sekarang bisa gerak sendiri-sendiri');
  }

  /* ── Save current layout ── */
  function saveLayout() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length) { Toast.show('Belum ada anggota'); return; }
    nodes.forEach(el => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      Store.setPosition(el.dataset.id, x, y);
    });
    Toast.show('Layout disimpan ✓');
  }

  /* ── Reset all saved positions (emergency fix for stuck/overlapping nodes) ── */
  function resetLayout() {
    Confirm.show(
      'Reset semua posisi?',
      'Semua circle akan disusun ulang otomatis dari awal. Data anggota & relasi tidak hilang.',
      () => {
        Store.resetPositions();
        Renderer.render();
        Export.close();
        Toast.show('Posisi di-reset');
      }
    );
  }

  /* ── Undo / Redo ── */
  function undo() {
    if (Store.undo()) { Renderer.render(); Toast.show('Undo'); }
    else               Toast.show('Tidak ada yang bisa di-undo');
  }

  function redo() {
    if (Store.redo()) { Renderer.render(); Toast.show('Redo'); }
    else               Toast.show('Tidak ada yang bisa di-redo');
  }

  /* ── Keyboard shortcuts ── */
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
  });

  return { deletePerson, openBulkRemove, closeBulkRemove, confirmBulkRemove, bulkSelectAll, bulkSelectNone, saveLayout, resetLayout, toggleCoupleLock, undo, redo };
})();
