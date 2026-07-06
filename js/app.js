/* ═══════════════════════════════════
   APP — Entry point
   ═══════════════════════════════════ */

(function init() {
  // PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Load version
  Version.load();

  // Self-heal any nodes stuck on top of each other from older bugs
  const fixedOverlap = Layout.deconflict();

  // Initial render
  Renderer.render();

  if (fixedOverlap) {
    Toast.show('Beberapa anggota numpuk posisinya — udah otomatis dipisahin');
  }

  // If first person ever, center canvas
  if (!Store.count()) {
    Canvas.centerFirst();
  }
})();
