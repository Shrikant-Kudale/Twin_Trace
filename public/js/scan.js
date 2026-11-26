/* Batch Scan: market price, spread, best seller and counterfeit flags for a whole watchlist */
(() => {
  let out = [];
  async function one(name) {
    const s = await TT.search(name), Q = prep(name); scoreCands(Q, s.results);
    const st = Insight.mark(s.results);
    return { product: name, twins: s.results.filter(c => c.v === 'twin').length, listings: s.results.length, currency: st ? st.cur : '', lowest: st ? st.min : '', median: st ? st.med : '', highest: st ? st.max : '', spread_pct: st ? +st.spread.toFixed(1) : '', best_seller: st ? st.best.domain : '', flagged: s.results.filter(c => c.flag).length };
  }
  function draw() { $('#st').innerHTML = out.length ? `<table><tr>${Object.keys(out[0]).map(k => `<th>${k.replace('_', ' ')}</th>`).join('')}</tr>${out.map(r => `<tr>${r.error ? `<td>${esc(r.product)}</td><td colspan="9" class="no">${esc(r.error)}</td>` : Object.values(r).map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>` : 'Results appear here.'; }
  $('#sf').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { let l = t.split(/\r?\n/).map(x => x.split(',')[0].replace(/^"|"$/g, '').trim()).filter(Boolean); if (/^(title|name|product)/i.test(l[0] || '')) l = l.slice(1); $('#sl').value = l.slice(0, 25).join('\n'); }); };
  $('#sgo').onclick = async () => {
    const names = $('#sl').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 25); if (!names.length) return;
    out = []; $('#sgo').disabled = true;
    for (let i = 0; i < names.length; i++) {
      $('#sp').textContent = `Scanning ${i + 1} of ${names.length}: ${names[i]}`;
      try { out.push(await one(names[i])); } catch (e) { out.push({ product: names[i], error: e.message }); }
      draw(); await new Promise(r => setTimeout(r, 600));
    }
    $('#sp').textContent = `Done: ${out.length} products`; $('#sgo').disabled = false;
  };
  $('#sd').onclick = () => { const ok = out.filter(r => !r.error); if (ok.length) dl('twintrace_batch_scan.csv', Object.keys(ok[0]).join(',') + '\n' + ok.map(r => Object.values(r).map(cq).join(',')).join('\n'), 'text/csv'); };
})();
