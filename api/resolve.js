import { get } from './_lib/net.js';
import { meta } from './_lib/parse.js';
import { llm } from './_lib/providers.js';
const VP = 'Identify the retail product in this image. Reply with ONLY its likely product title (brand, model, key variant or size). No other words. If unsure give your best guess.';
// Many shops block bots. Product URLs usually contain the name as a slug, so use that as a fallback.
const slug = u => { try { const s = new URL(u).pathname.split('/').map(x => decodeURIComponent(x).replace(/\.(html?|php|aspx?)$/i, '')).filter(x => /[a-z]{2,}[-_+][a-z0-9]+/i.test(x)).sort((a, b) => b.length - a.length)[0]; return s ? s.replace(/[-_+]+/g, ' ').trim().slice(0, 120) : ''; } catch (e) { return ''; } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = req.body || {};
  try {
    if (b.type === 'link') {
      let m = {}, why = '';
      try { m = meta(await get(b.value, 9000)); } catch (e) { why = e.message; }
      if (m.title) return res.status(200).json({ name: m.title.slice(0, 200), image: m.image, price: m.price, cur: m.cur, ids: m.ids, via: 'link' });
      const s = slug(b.value);
      if (s.split(' ').length >= 2) return res.status(200).json({ name: s, via: 'link (name taken from the URL; the page blocked automated reading' + (why ? ': ' + why : '') + ')' });
      throw new Error('Could not read that page' + (why ? ' (' + why + ')' : '') + '. The site may block automated access. Type the product name instead.');
    }
    if (b.type === 'image') {
      if (!/^data:image\//.test(b.value || '')) throw new Error('Bad image');
      const r = await llm({ text: VP, image: b.value });
      return res.status(200).json({ name: r.text.replace(/^["'`]+|["'`.]+$/g, '').slice(0, 200), via: r.via });
    }
    return res.status(200).json({ name: String(b.value || '').slice(0, 200), via: 'typed' });
  } catch (e) { res.status(500).json({ error: e.message, tried: e.tried }); }
}
