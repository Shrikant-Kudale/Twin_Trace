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
export { UA, T, strip, get, money, blocked };
