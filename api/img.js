import { blocked } from './_lib/net.js';
// Image proxy: many shops block hotlinking, so product images are fetched server-side and re-served.
export default async function handler(req, res) {
  try {
    const u = new URL(String((req.query || {}).u || ''));
    if (!/^https?:$/.test(u.protocol) || blocked(u.hostname)) return res.status(400).json({ error: 'blocked' });
    const r = await Promise.race([fetch(u.href, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TwinTrace/3.0)', Referer: u.origin + '/', Accept: 'image/*' }, redirect: 'follow' }), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 8000))]);
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\/(png|jpe?g|webp|gif|avif)/.test(ct)) return res.status(502).json({ error: 'not a supported image' });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4e6) return res.status(413).json({ error: 'too large' });
    res.setHeader('Content-Type', ct); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(buf);
  } catch (e) { res.status(502).json({ error: e.message }); }
}
