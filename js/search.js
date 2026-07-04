/* ═══════════════════════════════════
   SEARCH — Live highlight on canvas
   ═══════════════════════════════════ */

const Search = (() => {
  const input = document.getElementById('search-input');

  function run() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      // Clear highlight
      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('dimmed', 'highlighted');
      });
      return;
    }

    const persons = Store.getAll();
    const matched = Object.entries(persons)
      .filter(([, p]) => (p.nama || '').toLowerCase().includes(q))
      .map(([id]) => id);

    Renderer.render(matched);
  }

  input.addEventListener('input', run);

  // Clear on Escape
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; run(); input.blur(); }
  });

  return { run };
})();
