import { llm } from './_lib/providers.js';
import { keysOf } from './_lib/keys.js';
const cache = new Map();
const tpl = (a, b) => {
  const t = s => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
  const A = t(a), B = t(b), sh = [...A].filter(x => B.has(x)), num = sh.some(x => /\d/.test(x));
  return `VERDICT: ${sh.length / new Set([...A, ...B]).size > 0.6 && num ? 'YES' : 'NO'}\nREASON: Rule-based check: ${sh.length} shared words${num ? ' including a model or size token' : ', no shared model or size token'}.`;
};
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { a, b } = req.body || {};
  if (!a || !b || a.length > 300 || b.length > 300) return res.status(400).json({ error: 'a and b required (max 300 chars)' });
  const k = [a, b].sort().join('||');
  let out = cache.get(k), provider = 'cache';
  if (!out) {
    try { const r = await llm({ text: `Are these two product listings the SAME product (same brand, model, size, variant, colour)?\nA: ${a}\nB: ${b}\nAnswer exactly:\nVERDICT: YES or NO\nREASON: one short sentence.`, keys: keysOf(req), ms: 15000 }); out = r.text; provider = r.via; }
    catch (e) { out = tpl(a, b); provider = 'template'; }
    cache.set(k, out);
  }
  res.status(200).json({ verdict: /VERDICT:\s*YES/i.test(out) ? 'YES' : 'NO', reason: (out.match(/REASON:\s*(.*)/i) || [, out.slice(0, 160)])[1].trim(), provider });
}
