/* ═══════════════════════════════════
   EXPORT — PDF list + JSON backup
   ═══════════════════════════════════ */

const Export = (() => {
  const overlay  = document.getElementById('export-modal');
  const countEl  = document.getElementById('export-count');

  const filters = { gender: 'all', kerja: 'all', usiaMin: '', usiaMax: '' };

  /* ── Chip groups ── */
  ['filter-gender', 'filter-kerja'].forEach(groupId => {
    document.getElementById(groupId).addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll(`#${groupId} .chip`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filters[groupId.replace('filter-', '')] = chip.dataset.val;
      updateCount();
    });
  });

  /* ── Age range inputs ── */
  document.getElementById('filter-usia-min').addEventListener('input', e => {
    filters.usiaMin = e.target.value;
    updateCount();
  });
  document.getElementById('filter-usia-max').addEventListener('input', e => {
    filters.usiaMax = e.target.value;
    updateCount();
  });

  function updateCount() {
    countEl.textContent = `${Store.filter(filters).length} anggota`;
  }

  function open() { updateCount(); overlay.classList.add('active'); }
  function close() { overlay.classList.remove('active'); }

  /* ── Tindakan colors (for PDF badges) ── */
  const TINDAKAN = {
    'Prospek':    [34, 197,  94],
    'Rekrut':     [59, 130, 246],
    'Followup':   [168, 85, 247],
    'Janji Temu': [234,179,   8],
    'Belum Ada':  [148,163, 184],
  };

  /* ── Generate PDF ── */
  function generatePDF() {
    const list = Store.filter(filters);
    if (!list.length) { Toast.show('Tidak ada anggota yang cocok'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297, M = 16, CW = PW - M * 2;

    const navy  = [15, 23, 42];
    const white = [255,255,255];
    const slate = [71, 85,105];
    const muted = [148,163,184];
    const bg    = [245,247,250];

    /* Cover */
    doc.setFillColor(...navy);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFontSize(32); doc.setFont('helvetica','bold');
    doc.setTextColor(...white);
    doc.text('Family Tree', PW/2, 80, { align:'center' });
    doc.setFontSize(11); doc.setFont('helvetica','normal');
    doc.setTextColor(...muted);
    doc.text('Daftar Anggota Keluarga', PW/2, 94, { align:'center' });
    doc.text(`${list.length} anggota  ·  ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}`, PW/2, 104, { align:'center' });

    /* Data page */
    doc.addPage();
    let y = M;

    /* Page header */
    function pageHeader() {
      doc.setFillColor(...navy);
      doc.rect(0, 0, PW, 18, 'F');
      doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.setTextColor(...white);
      doc.text('🌳 Family Tree', M, 12);
      doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text(`${list.length} anggota`, PW - M, 12, { align:'right' });
      y = 26;
    }

    pageHeader();

    list.forEach((p, i) => {
      const ROW_H = 14;
      if (y + ROW_H > PH - M) { doc.addPage(); pageHeader(); }

      /* alternating row bg */
      if (i % 2 === 0) {
        doc.setFillColor(...bg);
        doc.rect(M, y - 4, CW, ROW_H, 'F');
      }

      /* number */
      doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.setTextColor(...muted);
      doc.text(String(i + 1).padStart(2,'0'), M + 1, y + 4);

      /* name */
      doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.setTextColor(...navy);
      doc.text(p.nama || '-', M + 12, y + 4);

      /* gender dot */
      const gc = p.gender === 'F' ? [236,72,153] : p.gender === 'M' ? [59,130,246] : muted;
      doc.setFillColor(...gc);
      doc.circle(M + 70, y + 2, 2, 'F');

      /* usia + tempat */
      doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.setTextColor(...slate);
      const info = [p.usia ? `${p.usia} thn` : null, p.tempat || null].filter(Boolean).join('  ·  ');
      if (info) doc.text(info, M + 75, y + 4);

      /* pendidikan */
      if (p.pendidikan) {
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text(p.pendidikan, M + 130, y + 4);
      }

      /* tindakan badge */
      if (p.tindakan) {
        const tc = TINDAKAN[p.tindakan] || muted;
        doc.setFillColor(...tc);
        const tw = doc.getTextWidth(p.tindakan) + 5;
        doc.roundedRect(PW - M - tw - 2, y - 2, tw + 4, 8, 1.5, 1.5, 'F');
        doc.setFontSize(7); doc.setFont('helvetica','bold');
        doc.setTextColor(...white);
        doc.text(p.tindakan, PW - M - tw / 2 - 2, y + 3.5, { align:'center' });
      }

      /* pekerjaan detail (second line if present) */
      if (p.pekerjaanDetail || p.pendidikanDetail) {
        y += ROW_H - 2;
        if (y + 7 > PH - M) { doc.addPage(); pageHeader(); }
        doc.setFontSize(7.5); doc.setFont('helvetica','normal');
        doc.setTextColor(...muted);
        const detail = [
          p.pekerjaanDetail  ? `Kerja: ${p.pekerjaanDetail}` : null,
          p.pendidikanDetail ? `Edu: ${p.pendidikanDetail}`  : null,
        ].filter(Boolean).join('   ');
        doc.text(detail, M + 12, y + 2);
        y += 4;
      }

      y += ROW_H;
    });

    /* footer */
    doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.setTextColor(...muted);
    doc.text('Family Tree App', PW/2, PH - 8, { align:'center' });

    doc.save(`family-tree-${Date.now()}.pdf`);
    close();
    Toast.show('PDF didownload!');
  }

  /* ── JSON backup ── */
  function downloadJSON() {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `family-tree-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Backup JSON didownload!');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const ok = Store.importJSON(e.target.result);
      if (ok) { Renderer.render(); Toast.show('Data berhasil diimport!'); }
      else    { Toast.show('Format file tidak valid'); }
    };
    reader.readAsText(file);
  }

  return { open, close, generatePDF, downloadJSON, importJSON };
})();
