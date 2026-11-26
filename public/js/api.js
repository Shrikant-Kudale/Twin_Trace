/* Browser API client. Adds the user's own keys (if any) to every request. */
const TT = {
  keys() { try { return JSON.parse(localStorage.getItem('tt-keys') || '{}'); } catch (e) { return {}; } },
  saveKeys(k) { try { localStorage.setItem('tt-keys', JSON.stringify(k)); } catch (e) { /* ignore */ } },
  async call(path, body) {
    const k = TT.keys(), h = { 'Content-Type': 'application/json' };
    if (Object.values(k).some(Boolean)) h['x-tt-keys'] = btoa(JSON.stringify(k));
    const r = await fetch('/api/' + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) });
    let j = {}; try { j = await r.json(); } catch (e) { /* non-JSON error page */ }
    if (!r.ok) throw new Error(j.error || 'API error ' + r.status);
    return j;
  },
  resolve: (type, value) => TT.call('resolve', { type, value }),
  search: q => TT.call('search', { q }),
  verify: (a, b) => TT.call('verify', { a, b }),
  health: ping => TT.call('health', { ping }),
  async refreshPill() { try { const h = await TT.health(false), on = Object.keys(h.active).filter(x => h.active[x]); $('#pill').textContent = on.length ? 'AI: ' + on.join(', ') : 'AI: free tier only (add keys)'; $('#pill').className = 'pill ' + (on.length ? 'ok' : 'warn'); } catch (e) { $('#pill').textContent = 'AI: offline'; } }
};
