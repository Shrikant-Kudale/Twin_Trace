// Actions: resolve (name | link | image -> product name) and search (web twins). No paid APIs.
const UA = 'Mozilla/5.0 (compatible; TwinTrace/2.0)';
const T = (p, ms = 8000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const strip = s => (s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const blocked = h => /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$|^\[/.test(h);
async function get(u, ms = 8000) {
  const x = new URL(u);
  if (!/^https?:$/.test(x.protocol) || blocked(x.hostname)) throw new Error('blocked url');
  const r = await T(fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' }, redirect: 'follow' }), ms);
  if (!r.ok) throw new Error('http ' + r.status);
  return (await r.text()).slice(0, 600000);
}
const money = s => {
  const m = (s || '').match(/(₹|Rs\.?|INR|\$|USD|€|£)\s?([\d,]+(?:\.\d{1,2})?)/);
  if (!m) return {};
  return { price: parseFloat(m[2].replace(/,/g, '')), cur: /₹|Rs|INR/.test(m[1]) ? 'INR' : /\$|USD/.test(m[1]) ? 'USD' : m[1] === '€' ? 'EUR' : 'GBP' };
};
function meta(h) {
  const g = re => (h.match(re) || [])[1];
  const og = p => g(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)`, 'i')) || g(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${p}["']`, 'i'));
  const title = og('og:title') || g(/<title[^>]*>(.*?)<\/title>/is) || '';
  const pr = og('product:price:amount') || og('og:price:amount') || g(/"price"\s*:\s*"?([\d.]+)/);
  return { title: strip(title).split(/ \| /)[0], image: og('og:image'), price: pr ? parseFloat(pr) : undefined, cur: og('product:price:currency') || g(/"priceCurrency"\s*:\s*"([A-Z]{3})"/) };
}
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
  const jobs = [['DuckDuckGo', () => ddg(q + ' buy')], ['Bing', () => bing(q + ' buy online price')], ['Open Food Facts', () => off(q)]];
  const rs = await Promise.allSettled(jobs.map(j => j[1]()));
  const sources = rs.map((r, i) => ({ name: jobs[i][0], ok: r.status === 'fulfilled', count: r.status === 'fulfilled' ? r.value.length : 0, error: r.status === 'rejected' ? r.reason.message : undefined }));
  const seen = new Set(), res = [];
  for (const r of rs) if (r.status === 'fulfilled') for (const c of r.value) {
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
  }));
  return { results: top, sources };
}
const VP = 'Identify the retail product in this image. Reply with ONLY its likely product title (brand, model, key variant or size). No other words. If unsure give your best guess.';
async function vision(uri) {
  const b64 = uri.split(',')[1], mime = (uri.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const openai = (url, model, headers) => async () => {
    const r = await T(fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ model, messages: [{ role: 'user', content: [{ type: 'text', text: VP }, { type: 'image_url', image_url: { url: uri } }] }] }) }), 25000);
    if (!r.ok) throw new Error('http ' + r.status); return (await r.json()).choices[0].message.content;
  };
  const chain = [
    ['gemini', async () => {
      const k = process.env.GEMINI_API_KEY; if (!k) throw new Error('no key');
      const r = await T(fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: VP }, { inline_data: { mime_type: mime, data: b64 } }] }] }) }), 25000);
      if (!r.ok) throw new Error('http ' + r.status); return (await r.json()).candidates[0].content.parts[0].text;
    }],
    ['huggingface-qwen', async () => { if (!process.env.HF_TOKEN) throw new Error('no token'); return openai('https://router.huggingface.co/v1/chat/completions', process.env.HF_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct', { Authorization: 'Bearer ' + process.env.HF_TOKEN })(); }],
    ['pollinations', openai('https://text.pollinations.ai/openai', 'openai', {})]
  ];
  for (const [via, fn] of chain) { try { const t = await fn(); if (t && t.trim()) return { name: t.trim().replace(/^["'`]+|["'`.]+$/g, '').slice(0, 200), via }; } catch (e) { /* next */ } }
  throw new Error('No vision provider answered. Type the name instead, or set GEMINI_API_KEY / HF_TOKEN.');
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = req.body || {};
  try {
    if (b.action === 'resolve') {
      if (b.type === 'link') { const m = meta(await get(b.value, 9000)); if (!m.title) throw new Error('Could not read a product name from that page'); return res.json({ name: m.title.slice(0, 200), image: m.image, price: m.price, cur: m.cur, via: 'link' }); }
      if (b.type === 'image') { if (!/^data:image\//.test(b.value || '')) throw new Error('Bad image'); return res.json(await vision(b.value)); }
      return res.json({ name: String(b.value || '').slice(0, 200), via: 'typed' });
    }
    if (b.action === 'search') { if (!b.q || b.q.length < 2) throw new Error('Query too short'); return res.json(await search(String(b.q).slice(0, 200))); }
    res.status(400).json({ error: 'Unknown action' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
