/* TwinTrace similarity engine: tokens, signals, identifiers, spec/colour/variant conflicts */
const STOP = new Set('buy online price best india the and for with at on of in new free shipping official amazon flipkart ebay walmart store shop'.split(' '));
const COLORS = new Set('black white silver gray grey blue red green gold pink purple yellow orange midnight starlight graphite titanium natural beige brown navy'.split(' '));
const VAR = ['pro', 'max', 'ultra', 'plus', 'mini', 'lite', 'se', 'fe', 'xl'];
const tok = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
function prep(t, p, ids = []) {
  const k = tok(t), s = new Set(k), j = k.join(' '), tri = new Set();
  for (let i = 0; i < j.length - 2; i++) tri.add(j.slice(i, i + 3));
  return { t, k, s, tri, comp: k.join(''), p, num: k.filter(w => /\d/.test(w) && w.length > 1), col: k.filter(w => COLORS.has(w)), ids: (ids || []).map(x => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '')).filter(x => x.length >= 5) };
}
const ov = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };
const unit = t => (t.match(/^\d+([a-z]+)$/) || [])[1];
function sim(q, c, idf = () => 1) {
  const hit = x => c.s.has(x) || ((x.length > 2 || /\d/.test(x)) && c.comp.includes(x));
  const sh = [...q.s].filter(hit), i = sh.length;
  const W = x => [...x].reduce((a, t) => a + idf(t), 0), cov = W(sh) / (W(q.s) || 1), word = (i / (q.s.size + c.s.size - i || 1) + cov) / 2, char = ov(q.tri, c.tri) / (q.tri.size || 1);
  const model = q.num.length ? q.num.filter(hit).length / q.num.length : .5;
  const pr = q.p > 0 && c.p > 0 ? Math.min(q.p, c.p) / Math.max(q.p, c.p) : .5;
  const conf = [];
  q.num.forEach(x => { const u = unit(x); if (u) c.num.forEach(y => { if (unit(y) === u && y !== x && !q.s.has(y)) conf.push(x + ' vs ' + y); }); });
  if (q.col.length && c.col.length && !q.col.some(x => c.col.includes(x))) conf.push('color: ' + q.col[0] + ' vs ' + c.col[0]);
  const vd = VAR.filter(v => q.s.has(v) !== c.s.has(v));
  const idm = q.ids.some(x => c.comp.includes(x)) || c.ids.some(x => q.comp.includes(x));
  let s = .3 * word + .25 * char + .35 * model + .1 * pr;
  if (conf.length || vd.length) s *= .6;
  if (idm) s = Math.max(s, .97);
  return { s, idm, sig: [word, char, model, pr], conf, vd, shared: sh, miss: [...q.s].filter(x => !hit(x)) };
}
const verdict = s => s >= .7 ? 'twin' : s >= .5 ? 'likely' : 'diff', VL = { twin: 'Twin', likely: 'Likely twin', diff: 'Different' };
// Scores candidates against the query. Rare tokens (model numbers) weigh more than common words (headphones) via IDF over the candidate pool.
function scoreCands(Q, cands) {
  const P = cands.map(c => { c.name = c.pageTitle && c.source !== 'My CSV' ? c.pageTitle : c.title; return prep(c.name, c.price, c.ids); });
  const df = {}; P.forEach(p => p.s.forEach(t => { df[t] = (df[t] || 0) + 1; }));
  const N = P.length + 1, idf = t => Math.log(1 + N / (1 + (df[t] || 0)));
  cands.forEach((c, i) => { Object.assign(c, sim(Q, P[i], idf)); c.v = verdict(c.s); });
}
