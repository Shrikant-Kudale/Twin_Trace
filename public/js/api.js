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
  async refreshPill() { try { const h = await TT.health(false), on = Object.keys(h.active).filter(x => h.active[x]); $('#pill').textContent = on.length ? 'AI: ' + on.join(', ') : 'AI: free routes (click to test)'; $('#pill').className = 'pill ' + (on.length ? 'ok' : 'warn'); } catch (e) { $('#pill').textContent = 'AI: offline'; } },
  async testAI() { $('#pill').textContent = 'AI: testing...'; try { const h = await TT.health(true); $('#pill').textContent = h.ping.ok ? 'AI: working via ' + h.ping.via : 'AI: no provider answered (OCR fallback active)'; $('#pill').title = h.ping.ok ? '' : h.ping.error; } catch (e) { $('#pill').textContent = 'AI: offline'; } }
};
