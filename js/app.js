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

  // Initial render
  Renderer.render();

  // If first person ever, center canvas
  if (!Store.count()) {
    Canvas.centerFirst();
  }
})();
