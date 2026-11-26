/* Head to head: why do two product names match (or not)? */
(() => {
  const N = ['Word overlap', 'Character overlap', 'Model / spec match', 'Price closeness'];
  function run() {
    const a = $('#ha').value.trim(), b = $('#hb').value.trim(); if (!a || !b) return null;
    const r = sim(prep(a, parseFloat($('#hpa').value)), prep(b, parseFloat($('#hpb').value))), v = verdict(r.s);
    $('#hout').hidden = false;
    $('#hout').innerHTML = `<div class="kpis"><div class="kpi"><b>${Math.round(r.s * 100)}%</b><span>similarity</span></div><div class="kpi"><b class="badge ${v}" style="font-size:20px">${VL[v]}</b><span>70%+ twin, 50-70% likely</span></div></div><table><tr><th>Signal</th><th>Value</th></tr>${N.map((n, k) => `<tr><td>${n}</td><td><div class="bar" style="width:${r.sig[k] * 100}%"></div>${r.sig[k].toFixed(2)}</td></tr>`).join('')}</table><p>${r.idm ? '<span class="tg g">identifier match</span> ' : ''}${r.shared.map(x => `<span class="tg g">${esc(x)}</span>`).join('')}${r.miss.map(x => `<span class="tg w">- ${esc(x)}</span>`).join('')}${r.conf.map(x => `<span class="tg r">${esc(x)}</span>`).join('')}${r.vd.map(x => `<span class="tg r">variant: ${esc(x)}</span>`).join('')}</p><p id="hv"></p>`;
    return [a, b];
  }
  $('#hgo').onclick = run;
  $('#hai').onclick = async () => { const p = run(); if (!p) return; $('#hv').textContent = 'Asking AI...'; try { const j = await TT.verify(p[0], p[1]); $('#hv').innerHTML = `<b class="${j.verdict === 'YES' ? 'yes' : 'no'}">AI: ${j.verdict}</b> <span class="tag">${esc(j.provider)}</span> ${esc(j.reason)}`; } catch (e) { $('#hv').textContent = e.message; } };
})();
