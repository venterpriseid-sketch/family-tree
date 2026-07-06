/* ═══════════════════════════════════
   FORM — Add / Edit person
   ═══════════════════════════════════ */

const Form = (() => {
  let mode            = null;
  let contextPersonId = null;
  let selectedGender  = '';

  const overlay = document.getElementById('form-modal');
  const titleEl = document.getElementById('form-title');

  const F = {
    nama:             () => document.getElementById('f-nama'),
    usia:             () => document.getElementById('f-usia'),
    pekerjaan:        () => document.getElementById('f-pekerjaan'),
    pekerjaanDetail:  () => document.getElementById('f-pekerjaan-detail'),
    tempat:           () => document.getElementById('f-tempat'),
    pendidikan:       () => document.getElementById('f-pendidikan'),
    pendidikanDetail: () => document.getElementById('f-pendidikan-detail'),
    tindakan:         () => document.getElementById('f-tindakan'),
  };

  /* ── Gender toggle ── */
  function setGender(g) {
    selectedGender = g;
    document.getElementById('gb-f').classList.toggle('active', g === 'F');
    document.getElementById('gb-m').classList.toggle('active', g === 'M');
  }

  /* ── Show/hide detail sub-sections ── */
  function toggleDetailVisibility(type) {
    const val = document.getElementById(`f-${type}`).value;
    const show = type === 'pekerjaan'
      ? val === 'Bekerja'
      : val && val !== 'TIDAK SATUPUN';
    document.getElementById(`detail-${type}`).style.display = show ? 'block' : 'none';
  }

  /* ── Reset ── */
  function resetForm() {
    selectedGender = '';
    Object.values(F).forEach(fn => { fn().value = ''; });
    document.getElementById('gb-f').classList.remove('active');
    document.getElementById('gb-m').classList.remove('active');
    document.getElementById('detail-pekerjaan').style.display  = 'none';
    document.getElementById('detail-pendidikan').style.display = 'none';
  }

  /* ── Open helpers ── */
  function openModal(title, modeVal, personId = null) {
    mode            = modeVal;
    contextPersonId = personId;
    resetForm();
    titleEl.textContent = title;
    overlay.classList.add('active');
  }

  function openAddRoot() { openModal('Tambah Anggota', 'root'); }

  function openEdit() {
    const id     = Popup.getActiveId();
    const person = Store.get(id);
    Popup.close();
    openModal('Edit Info', 'edit', id);
    F.nama().value             = person.nama             || '';
    F.usia().value             = person.usia             || '';
    F.pekerjaan().value        = person.pekerjaan        || '';
    F.pekerjaanDetail().value  = person.pekerjaanDetail  || '';
    F.tempat().value           = person.tempat           || '';
    F.pendidikan().value       = person.pendidikan       || '';
    F.pendidikanDetail().value = person.pendidikanDetail || '';
    F.tindakan().value         = person.tindakan         || '';
    setGender(person.gender || '');
    toggleDetailVisibility('pekerjaan');
    toggleDetailVisibility('pendidikan');
  }

  function openAddRelation(type) {
    const id = Popup.getActiveId();
    Popup.close();
    const labels = { parent: 'Tambah Orang Tua', child: 'Tambah Anak', spouse: 'Tambah Pasangan' };
    openModal(labels[type], type, id);
  }

  function close() { overlay.classList.remove('active'); }

  /* ── Save ── */
  function save() {
    const data = {
      nama:             F.nama().value.trim() || 'Unknown',
      usia:             F.usia().value,
      gender:           selectedGender,
      pekerjaan:        F.pekerjaan().value,
      pekerjaanDetail:  F.pekerjaanDetail().value,
      tempat:           F.tempat().value,
      pendidikan:       F.pendidikan().value,
      pendidikanDetail: F.pendidikanDetail().value,
      tindakan:         F.tindakan().value,
    };

    if (mode === 'edit') {
      Store.update(contextPersonId, data);
      Toast.show('Info diupdate');
    } else {
      // Snapshot BEFORE adding, so we know where contextPersonId actually
      // is right now (whether manually placed or auto-computed).
      const snapshot = contextPersonId ? Layout.compute() : null;
      const newId = Store.add(data);

      if (contextPersonId && mode !== 'root') {
        // parent  → new node is ABOVE  contextPerson (upline)
        // child   → new node is BELOW  contextPerson (downline)
        // spouse  → new node is BESIDE contextPerson (same line)
        Store.addRelation(mode, contextPersonId, newId);

        // A child added from just one parent's popup still belongs to
        // BOTH parents when that parent has a spouse — link the spouse
        // too, otherwise the couple-anchor line never has both parents
        // it needs and falls back to a line straight from one parent.
        if (mode === 'child') {
          Store.getSpouses(contextPersonId).forEach(spouseId => {
            Store.addRelation('child', spouseId, newId);
          });
        }

        Layout.placeNear(newId, contextPersonId, mode, snapshot);
      }

      Toast.show(`${data.nama} ditambahkan`);
    }

    close();
    Renderer.render();
  }

  return { openAddRoot, openEdit, openAddRelation, close, save, setGender, toggleDetailVisibility };
})();
