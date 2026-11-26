/* Decision layer: market statistics, robust price-anomaly detection, goal-specific reports */
const Insight = (() => {
  const med = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const money = n => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  function stats(cands) {
    const tw = cands.filter(c => c.v === 'twin' && c.price > 0 && c.source !== 'My CSV'), cs = {};
    tw.forEach(c => { const k = c.cur || '?'; cs[k] = (cs[k] || 0) + 1; });
    const cur = Object.keys(cs).sort((a, b) => cs[b] - cs[a])[0], L = tw.filter(c => (c.cur || '?') === cur);
    if (!L.length) return null;
    const p = L.map(c => c.price), m = med(p), mad = med(p.map(x => Math.abs(x - m))) || m * .05;
    return { cur, n: L.length, min: Math.min(...p), max: Math.max(...p), med: m, mad, spread: (Math.max(...p) / Math.min(...p) - 1) * 100, best: L.reduce((a, b) => b.price < a.price ? b : a), L };
  }
  // Modified z-score (median / MAD): robust to the very outliers we are hunting. Needs 4+ priced twins.
  function mark(cands) {
    cands.forEach(c => { delete c.flag; });
    const s = stats(cands); if (!s || s.n < 4) return s;
    s.L.forEach(c => { const z = .6745 * (c.price - s.med) / s.mad; if (z < -3.5 && c.price < .6 * s.med) c.flag = 'Suspiciously cheap'; else if (z > 3.5 && c.price > 1.6 * s.med) c.flag = 'Overpriced outlier'; });
    return s;
  }
  const table = (h, rows) => `<table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
  function market(web) {
    const s = stats(web), g = {};
    web.filter(c => c.v === 'twin').forEach(c => { (g[c.domain] = g[c.domain] || []).push(c); });
    const rows = Object.entries(g).slice(0, 10).map(([d, l]) => { const p = l.filter(c => c.price > 0 && (!s || (c.cur || '?') === s.cur)).map(c => c.price); return [esc(d), l.length, p.length ? money(Math.min(...p)) : '-', p.length && s ? ((Math.min(...p) / s.med - 1) * 100).toFixed(0) + '%' : '-']; });
    return rows.length ? `<div class="card" style="margin-top:14px"><h3>Market map: who sells it</h3>${table(['Seller','Twin listings','Lowest price','vs median'], rows)}</div>` : '';
  }
  function html(lens, R, my, hasCat) {
    const c = R.cands, s = stats(c), web = c.filter(x => x.source !== 'My CSV'), own = c.filter(x => x.source === 'My CSV'), tw = web.filter(x => x.v === 'twin');
    let t = 'Summary', h = '';
    if (lens === 'price') {
      t = 'Price check';
      if (!s) h = 'No priced twins found, so there is no market price yet. Try a more specific name.';
      else {
        h = `Market median <b>${money(s.med)} ${s.cur}</b> across ${s.n} priced twins (range ${money(s.min)} to ${money(s.max)}, spread ${s.spread.toFixed(0)}%). Cheapest: <b>${money(s.best.price)}</b> at ${esc(s.best.domain)}.`;
        if (my > 0) { const d = (my / s.med - 1) * 100; h += `<p class="big">Your price ${money(my)} is ${Math.abs(d) <= 5 ? 'in line with the market.' : d > 0 ? d.toFixed(0) + '% above the median. Expect fewer sales unless you differentiate.' : (-d).toFixed(0) + '% below the median. You may be leaving margin on the table.'}</p>`; }
        else h += '<p class="src">Enter your price above to see where you stand.</p>';
      }
    } else if (lens === 'risk') {
      t = 'Counterfeit radar'; const f = c.filter(x => x.flag);
      if (!s || s.n < 4) h = `Only ${s ? s.n : 0} priced twins found. At least 4 are needed for a reliable outlier test.`;
      else h = f.length ? `<b class="no">${f.length} listing(s) priced far from the market median (${money(s.med)} ${s.cur}).</b> Verify the seller before trusting them.` + table(['Listing','Seller','Price','vs median','Flag'], f.map(x => [`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>`, esc(x.domain), money(x.price), ((x.price / s.med - 1) * 100).toFixed(0) + '%', esc(x.flag)])) : `<b class="yes">No price anomalies</b> among ${s.n} priced twins.`;
    } else if (lens === 'gap') {
      t = 'Catalogue gap check';
      if (!hasCat) h = 'Upload your catalogue CSV first (optional row in the search box).';
      else { const m = own.filter(x => x.v === 'twin').sort((a, b) => b.s - a.s), l = own.filter(x => x.v === 'likely').sort((a, b) => b.s - a.s);
        h = m.length ? `<b class="no">Already in your catalogue (${m.length} row${m.length > 1 ? 's' : ''}).</b>` + table(['Row title','Score'], m.slice(0, 5).map(x => [esc(x.name), Math.round(x.s * 100) + '%'])) : l.length ? `<b class="warn">Possible matches to review manually.</b>` + table(['Row title','Score'], l.slice(0, 5).map(x => [esc(x.name), Math.round(x.s * 100) + '%'])) : '<b class="yes">Not found. Safe to add as a new SKU.</b>'; }
    } else if (lens === 'audit') {
      t = 'Listing audit';
      if (tw.length < 3) h = 'At least 3 web twins are needed to audit a listing.';
      else { const q = new Set(tok(R.q.name)), df = {}; tw.forEach(x => new Set(tok(x.name)).forEach(w => { if (!q.has(w)) df[w] = (df[w] || 0) + 1; }));
        const add = Object.keys(df).filter(w => df[w] >= Math.ceil(tw.length / 2)).slice(0, 12);
        h = add.length ? `Most competing listings of this product also say: ${add.map(w => `<span class="tg g">${esc(w)}</span>`).join('')}. Consider adding them to your title for search visibility and clarity.` : 'Your title already covers the terms competitors use.'; if (s && my > 0) h += `<p class="src">Your price vs market median: ${((my / s.med - 1) * 100).toFixed(0)}%.</p>`; }
    } else h = `${tw.length} twin listings across ${new Set(tw.map(x => x.domain)).size} sellers.` + (s ? ` Median price ${money(s.med)} ${s.cur}.` : '');
    return `<div class="card insight"><h3>${t}</h3>${h}</div>` + market(web);
  }
  return { stats, mark, html };
})();
