import { get } from './_lib/net.js';
import { meta } from './_lib/parse.js';
import { llm } from './_lib/providers.js';
const VP = 'Identify the retail product in this image. Reply with ONLY its likely product title (brand, model, key variant or size). No other words. If unsure give your best guess.';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = req.body || {};
  try {
    if (b.type === 'link') {
      const m = meta(await get(b.value, 9000));
      if (!m.title) throw new Error('Could not read a product name from that page');
      return res.status(200).json({ name: m.title.slice(0, 200), image: m.image, price: m.price, cur: m.cur, ids: m.ids, via: 'link' });
    }
    if (b.type === 'image') {
      if (!/^data:image\//.test(b.value || '')) throw new Error('Bad image');
      const r = await llm({ text: VP, image: b.value });
      return res.status(200).json({ name: r.text.replace(/^["'`]+|["'`.]+$/g, '').slice(0, 200), via: r.via });
    }
    return res.status(200).json({ name: String(b.value || '').slice(0, 200), via: 'typed' });
  } catch (e) { res.status(500).json({ error: e.message, tried: e.tried }); }
}
