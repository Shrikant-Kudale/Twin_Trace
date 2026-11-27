/* Browser API client */
const TT = {
  async call(path, body) {
    const r = await fetch('/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    let j = {}; try { j = await r.json(); } catch (e) { /* non-JSON error page */ }
    if (!r.ok) throw new Error(j.error || 'API error ' + r.status);
    return j;
  },
  resolve: (type, value) => TT.call('resolve', { type, value }),
  search: q => TT.call('search', { q }),
  verify: (a, b) => TT.call('verify', { a, b }),
  health: ping => TT.call('health', { ping }),
  async refreshPill() { try { const h = await TT.health(false), on = Object.keys(h.active).filter(x => h.active[x]); $('#pill').textContent = 'AI: ' + on.length + ' routes ready'; $('#pill').title = on.join(', '); $('#pill').className = 'pill ' + (on.length > 1 ? 'ok' : 'warn'); } catch (e) { $('#pill').textContent = 'AI: offline'; } },
  async testAI() {
    if (typeof show === 'function') show('guide');
    const d = $('#diag'); d.textContent = 'Testing every route...';
    try {
      const h = await TT.health(true);
      d.innerHTML = `<table><tr><th>Provider</th><th>Status</th><th>Time</th><th>Detail</th></tr>${h.providers.map(p => `<tr><td>${esc(p.name)}</td><td class="${p.ok ? 'yes' : 'no'}">${p.ok ? 'working' : 'failed'}</td><td>${p.ms} ms</td><td>${esc(p.ok ? p.model : p.error)}</td></tr>`).join('')}</table><p class="src">Search: Brave ${h.search.brave ? 'on' : 'off'}, Google CSE ${h.search.google ? 'on' : 'off'} (Bing and DuckDuckGo are always tried).</p>`;
      const ok = h.providers.filter(p => p.ok).length; $('#pill').textContent = ok ? `AI: ${ok} route${ok > 1 ? 's' : ''} working` : 'AI: none working (OCR fallback active)';
    } catch (e) { d.textContent = e.message; }
  }
};
