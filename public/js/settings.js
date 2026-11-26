/* AI keys panel: stored only in this browser, with a live connection test */
(() => {
  const F = ['xai', 'pollinations', 'gemini', 'hf'];
  const load = () => { const k = TT.keys(); F.forEach(f => { $('#k-' + f).value = k[f] || ''; }); };
  $('#k-save').onclick = () => { const k = {}; F.forEach(f => { const v = $('#k-' + f).value.trim(); if (v) k[f] = v; }); TT.saveKeys(k); $('#k-out').textContent = 'Saved in this browser only.'; TT.refreshPill(); };
  $('#k-clear').onclick = () => { TT.saveKeys({}); load(); TT.refreshPill(); $('#k-out').textContent = 'Cleared.'; };
  $('#k-test').onclick = async () => { $('#k-out').textContent = 'Testing...'; try { const h = await TT.health(true); $('#k-out').innerHTML = h.ping.ok ? `<b class="yes">Working via ${esc(h.ping.via)}</b>` : `<span class="no">${esc(h.ping.error)}</span>`; } catch (e) { $('#k-out').textContent = e.message; } };
  load();
})();
