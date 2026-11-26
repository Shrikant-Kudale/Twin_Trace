import { get, strip, money } from './net.js';
import { meta } from './parse.js';
const JUNK = /(wikipedia|reddit|youtube|pinterest|quora|facebook|instagram|tiktok|twitter|x\.com|medium|linkedin)\./i;
async function ddg(q) {
  const h = await get('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), 9000);
  const out = h.split('result__a"').slice(1, 13).map(b => {
    const a = b.match(/href="([^"]+)"[^>]*>(.*?)<\/a>/s), s = b.match(/result__snippet[^>]*>(.*?)<\/a>/s);
    if (!a) return null;
    let u = a[1]; const d = u.match(/uddg=([^&]+)/); if (d) u = decodeURIComponent(d[1]); if (u.startsWith('//')) u = 'https:' + u;
    return { title: strip(a[2]), url: u, snippet: strip(s ? s[1] : ''), source: 'DuckDuckGo' };
  }).filter(Boolean);
  if (!out.length) throw new Error('no results (possibly rate-limited)');
  return out;
}
async function bing(q) {
  const h = await get('https://www.bing.com/search?q=' + encodeURIComponent(q), 9000);
  const out = h.split('<li class="b_algo"').slice(1, 13).map(b => {
    const a = b.match(/<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s), p = b.match(/<p[^>]*>(.*?)<\/p>/s);
    return a && { title: strip(a[2]), url: a[1], snippet: strip(p ? p[1] : ''), source: 'Bing' };
  }).filter(Boolean);
  if (!out.length) throw new Error('no results');
  return out;
}
async function off(q) {
  const j = JSON.parse(await get('https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=10&search_terms=' + encodeURIComponent(q), 9000));
  const out = (j.products || []).filter(p => p.product_name).map(p => ({ title: [(p.brands || '').split(',')[0], p.product_name, p.quantity].filter(Boolean).join(' '), url: 'https://world.openfoodfacts.org/product/' + p.code, image: p.image_front_small_url || p.image_url, source: 'Open Food Facts' }));
  if (!out.length) throw new Error('no food matches');
  return out;
}
async function search(q) {
  const jobs = [['DuckDuckGo', () => ddg(q + ' buy')], ['Bing', () => bing(q + ' buy online price')], ['Bing (specs)', () => bing(q + ' specifications')], ['DuckDuckGo (exact)', () => ddg('"' + q + '"')], ['Open Food Facts', () => off(q)]];
  const rs = await Promise.allSettled(jobs.map(j => j[1]()));
  const sources = rs.map((r, i) => ({ name: jobs[i][0], ok: r.status === 'fulfilled', count: r.status === 'fulfilled' ? r.value.length : 0, error: r.status === 'rejected' ? r.reason.message : undefined }));
  const seen = new Set(), res = [];
  for (const r of rs) if (r.status === 'fulfilled') for (const c of r.value) {
    if (JUNK.test(c.url)) continue;
    const k = c.url.replace(/^https?:\/\/(www\.)?/, '').split('?')[0].toLowerCase();
    if (seen.has(k)) continue; seen.add(k);
    try { c.domain = new URL(c.url).hostname.replace(/^www\./, ''); } catch (e) { continue; }
    Object.assign(c, money(c.title + ' ' + (c.snippet || ''))); res.push(c);
  }
  const top = res.slice(0, 30);
  await Promise.allSettled(top.filter(c => c.source !== 'Open Food Facts').slice(0, 12).map(async c => {
    const m = meta(await get(c.url, 4000));
    if (m.image) c.image = m.image.startsWith('http') ? m.image : undefined;
    if (m.price && !c.price) { c.price = m.price; c.cur = m.cur || c.cur; }
    if (m.title && m.title.length > 8 && m.title.length < 160) c.pageTitle = m.title;
    c.ids = m.ids; c.brand = m.brand;
  }));
  return { results: top, sources };
}
export { search };
