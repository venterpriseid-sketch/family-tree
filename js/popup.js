/* ═══════════════════════════════════
   POPUP — Node context menu
   ═══════════════════════════════════ */

const Popup = (() => {
  const el    = document.getElementById('node-popup');
  const title = document.getElementById('popup-person-name');
  let activeId = null;

  function buildProfileHtml(person) {
    const rows = [];
    
    if (person.usia) {
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Usia</span>
          <span class="popup-profile-value">${person.usia} tahun</span>
        </div>
      `);
    }

    if (person.gender) {
      const genderText = person.gender === 'F' ? 'Perempuan' : 'Laki-laki';
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Gender</span>
          <span class="popup-profile-value">${genderText}</span>
        </div>
      `);
    }

    if (person.tempat) {
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Tempat</span>
          <span class="popup-profile-value">${person.tempat}</span>
        </div>
      `);
    }

    if (person.pekerjaan) {
      let pekerjaanText = person.pekerjaan;
      if (person.pekerjaanDetail) {
        pekerjaanText += ` — ${person.pekerjaanDetail}`;
      }
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Pekerjaan</span>
          <span class="popup-profile-value">${pekerjaanText}</span>
        </div>
      `);
    }

    if (person.pendidikan) {
      let pendidikanText = person.pendidikan;
      if (person.pendidikanDetail) {
        pendidikanText += ` — ${person.pendidikanDetail}`;
      }
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Pendidikan</span>
          <span class="popup-profile-value">${pendidikanText}</span>
        </div>
      `);
    }

    if (person.tindakan) {
      rows.push(`
        <div class="popup-profile-row">
          <span class="popup-profile-label">Tindakan</span>
          <span class="popup-profile-value">${person.tindakan}</span>
        </div>
      `);
    }

    return rows.length ? `<div class="popup-profile">${rows.join('')}</div>` : '';
  }

  function open(id, event) {
    activeId = id;
    const person = Store.get(id);
    title.textContent = person?.nama || 'Unknown';
    
    // Remove old profile if exists
    const oldProfile = el.querySelector('.popup-profile');
    if (oldProfile) oldProfile.remove();

    // Insert profile section after title
    const profileHtml = buildProfileHtml(person);
    if (profileHtml) {
      title.insertAdjacentHTML('afterend', profileHtml);
    }

    // Lock-couple button only makes sense if this person has a spouse
    const lockBtn   = document.getElementById('popup-lock-couple-btn');
    const lockLabel = document.getElementById('popup-lock-couple-label');
    const spouses   = Store.getSpouses(id);
    if (spouses.length) {
      const locked = Store.isCoupleLocked(id, spouses[0]);
      lockBtn.style.display = 'flex';
      lockLabel.textContent = locked ? 'Lepas Kunci Pasangan (bisa gerak sendiri)' : 'Kunci Pasangan (gerak bareng)';
    } else {
      lockBtn.style.display = 'none';
    }

    el.style.display  = 'block';

    const vw = window.innerWidth, vh = window.innerHeight;
    let x = event.clientX + 10, y = event.clientY - 10;
    if (x + 190 > vw) x = event.clientX - 194;
    if (y + 420 > vh) y = vh - 426;
    if (y < 60) y = 64;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    event.stopPropagation();
  }

  function close() { 
    el.style.display = 'none'; 
    activeId = null; 
  }
  
  function getActiveId() { return activeId; }

  document.addEventListener('click', e => {
    if (!e.target.closest('#node-popup')) close();
  });

  return { open, close, getActiveId };
})();
