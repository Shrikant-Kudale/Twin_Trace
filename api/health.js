import { providers, ask, usable } from './_lib/providers.js';
export default async function handler(req, res) {
  const b = req.body || {}, P = providers(), active = {};
  P.forEach(p => { active[p.n] = !p.env || !!process.env[p.env]; });
  const out = { ok: true, active, search: { brave: !!process.env.BRAVE_API_KEY, google: !!(process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_CX) } };
  if (b.ping) out.providers = await Promise.all(P.filter(p => usable(p)).map(async p => {
    const t = Date.now();
    try { const r = await ask(p, { text: 'Reply with the single word OK.' }, 15000); return { name: p.n, ok: true, ms: Date.now() - t, model: r.model }; }
    catch (e) { return { name: p.n, ok: false, ms: Date.now() - t, error: e.message.slice(0, 300) }; }
  }));
  res.status(200).json(out);
}
