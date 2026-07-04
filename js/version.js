/* ═══════════════════════════════════
   VERSION — Check for updates
   ═══════════════════════════════════ */

const Version = (() => {
  let currentVersion = '1.00';

  async function load() {
    try {
      const res  = await fetch('./version.json?t=' + Date.now());
      const data = await res.json();
      currentVersion = data.version;
      document.getElementById('version-badge').textContent = `v${currentVersion}`;
    } catch {
      document.getElementById('version-badge').textContent = 'v?';
    }
  }

  async function checkUpdate() {
    const badge = document.getElementById('version-badge');
    badge.textContent = 'Checking...';
    try {
      const res  = await fetch('./version.json?t=' + Date.now());
      const data = await res.json();
      const remote = parseFloat(data.version);
      const local  = parseFloat(currentVersion);

      if (remote > local) {
        Toast.show(`Update tersedia! v${data.version} — refresh untuk update`);
        badge.textContent = `v${currentVersion} ↑`;
        badge.style.color = '#22c55e';
      } else {
        Toast.show(`Sudah versi terbaru (v${currentVersion})`);
        badge.textContent = `v${currentVersion}`;
      }
    } catch {
      Toast.show('Gagal cek update');
      badge.textContent = `v${currentVersion}`;
    }
  }

  return { load, checkUpdate };
})();
