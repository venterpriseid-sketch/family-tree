/* ═══════════════════════════════════
   TOAST — Notification
   ═══════════════════════════════════ */
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  function show(msg, ms = 2500) {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), ms);
  }
  return { show };
})();

/* ═══════════════════════════════════
   CONFIRM — Modal confirmation dialog
   ═══════════════════════════════════ */
const Confirm = (() => {
  const overlay = document.getElementById('confirm-overlay');

  function show(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    overlay.classList.add('active');

    const yesBtn = document.getElementById('confirm-yes');
    // Clone to remove old listeners
    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    newYes.addEventListener('click', () => {
      overlay.classList.remove('active');
      onConfirm();
    });
  }

  function close() { overlay.classList.remove('active'); }

  return { show, close };
})();
