import { strip } from './net.js';
function metaBase(h) {
  const g = re => (h.match(re) || [])[1];
  const og = p => g(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)`, 'i')) || g(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${p}["']`, 'i'));
  const title = og('og:title') || g(/<title[^>]*>(.*?)<\/title>/is) || '';
  const pr = og('product:price:amount') || og('og:price:amount') || g(/"price"\s*:\s*"?([\d.]+)/);
  return { title: strip(title).split(/ \| /)[0], image: og('og:image'), price: pr ? parseFloat(pr) : undefined, cur: og('product:price:currency') || g(/"priceCurrency"\s*:\s*"([A-Z]{3})"/) };
}

function ld(h) {
  const out = {};
  const walk = n => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (/Product/.test([].concat(n['@type'] || []).join())) {
      out.name = out.name || n.name; out.brand = out.brand || (n.brand && (n.brand.name || n.brand));
      out.mpn = out.mpn || n.mpn || n.sku; out.gtin = out.gtin || n.gtin13 || n.gtin || n.gtin14 || n.gtin12;
      const o = [].concat(n.offers || [])[0] || {}; out.price = out.price || parseFloat(o.price || o.lowPrice); out.cur = out.cur || o.priceCurrency;
    }
    Object.values(n).forEach(walk);
  };
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>(.*?)<\/script>/gis)) { try { walk(JSON.parse(m[1])); } catch (e) { /* ignore bad JSON-LD */ } }
  return out;
}
// Merges Open Graph tags with schema.org Product data (name, brand, MPN/GTIN identifiers, price)
export const meta = h => { const b = metaBase(h), L = ld(h); return { ...b, title: b.title || strip(L.name || ''), brand: typeof L.brand === 'string' ? L.brand : undefined, ids: [L.mpn, L.gtin].filter(Boolean).map(String), price: b.price ?? (isNaN(L.price) ? undefined : L.price), cur: b.cur || L.cur }; };
export { ld };
