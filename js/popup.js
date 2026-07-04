/* ═══════════════════════════════════
   POPUP — Node context menu
   ═══════════════════════════════════ */

const Popup = (() => {
  const el    = document.getElementById('node-popup');
  const title = document.getElementById('popup-person-name');
  let activeId = null;

  function open(id, event) {
    activeId = id;
    title.textContent = Store.get(id)?.nama || 'Unknown';
    el.style.display  = 'block';

    const vw = window.innerWidth, vh = window.innerHeight;
    let x = event.clientX + 10, y = event.clientY - 10;
    if (x + 190 > vw) x = event.clientX - 194;
    if (y + 320 > vh) y = vh - 326;
    if (y < 60) y = 64;

    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    event.stopPropagation();
  }

  function close() { el.style.display = 'none'; activeId = null; }
  function getActiveId() { return activeId; }

  document.addEventListener('click', e => {
    if (!e.target.closest('#node-popup')) close();
  });

  return { open, close, getActiveId };
})();
