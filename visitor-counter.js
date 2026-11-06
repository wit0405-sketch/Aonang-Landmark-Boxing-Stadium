(() => {
  const counter = document.getElementById('visitorCount');
  if (!counter) return;
  const baseline = 256;
  const display = value => {
    const safeValue = Math.max(baseline, Math.min(999999, Number(value) || baseline));
    counter.textContent = String(Math.floor(safeValue)).padStart(6, '0');
  };
  display(baseline);
  let countedThisSession = false;
  try { countedThisSession = sessionStorage.getItem('aonang-visitor-counted-v1') === '1'; } catch (_) {}
  if (countedThisSession) {
    try { display(sessionStorage.getItem('aonang-visitor-count-v1')); } catch (_) {}
    return;
  }
  fetch('/api/visitors?increment=1', { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(response => { if (!response.ok) throw new Error('Visitor counter unavailable'); return response.json(); })
    .then(data => {
      if (!Number.isFinite(Number(data.count))) return;
      display(data.count);
      try {
        sessionStorage.setItem('aonang-visitor-counted-v1', '1');
        sessionStorage.setItem('aonang-visitor-count-v1', String(data.count));
      } catch (_) {}
    })
    .catch(() => {});
})();