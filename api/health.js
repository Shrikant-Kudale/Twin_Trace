import { llm } from './_lib/providers.js';
import { keysOf } from './_lib/keys.js';
const E = { xai: 'XAI_API_KEY', pollinations: 'POLLINATIONS_API_KEY', gemini: 'GEMINI_API_KEY', hf: 'HF_TOKEN' };
export default async function handler(req, res) {
  const keys = keysOf(req), b = req.body || {}, active = {};
  for (const k in E) active[k] = !!(keys[k] || process.env[E[k]]);
  const out = { ok: true, active, ollama: !!process.env.OLLAMA_URL };
  if (b.ping) { try { const r = await llm({ text: 'Reply with the single word OK.', keys }); out.ping = { ok: true, via: r.via }; } catch (e) { out.ping = { ok: false, error: e.message }; } }
  res.status(200).json(out);
}
