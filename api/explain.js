// Fallback chain: cache -> Gemini (free tier) -> Pollinations (free, no key) -> Ollama (self-hosted) -> template
const cache = new Map();
const prompt = (a, b) => `Are these two product listings the SAME product (same brand, model, size/variant)?\nA: ${a}\nB: ${b}\nAnswer in exactly this format:\nVERDICT: YES or NO\nREASON: one short sentence.`;
const T = (p, ms = 15000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

async function gemini(p) {
  const k = process.env.GEMINI_API_KEY; if (!k) throw new Error('no key');
  const m = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const r = await T(fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: p }] }] }) }));
  if (!r.ok) throw new Error('gemini ' + r.status);
  const j = await r.json(); return j.candidates[0].content.parts[0].text;
}
async function pollinations(p) {
  const r = await T(fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: p }] }) }));
  if (!r.ok) throw new Error('poll ' + r.status);
  const j = await r.json(); return j.choices[0].message.content;
}
async function ollama(p) {
  const u = process.env.OLLAMA_URL; if (!u) throw new Error('no ollama');
  const r = await T(fetch(u.replace(/\/$/, '') + '/api/generate', { method: 'POST', body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2', prompt: p, stream: false }) }), 30000);
  if (!r.ok) throw new Error('ollama ' + r.status);
  return (await r.json()).response;
}
function template(a, b) {
  const t = s => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
  const A = t(a), B = t(b), shared = [...A].filter(x => B.has(x));
  const nums = x => [...x].filter(w => /\d/.test(w));
  const sameNums = nums(A).some(n => B.has(n));
  const j = shared.length / new Set([...A, ...B]).size;
  return `VERDICT: ${j > 0.6 && sameNums ? 'YES' : 'NO'}\nREASON: Rule-based check: ${shared.length} shared words, ${sameNums ? 'a shared model/size token' : 'no shared model/size token'}.`;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { a, b } = req.body || {};
  if (!a || !b || a.length > 300 || b.length > 300) return res.status(400).json({ error: 'a and b required (max 300 chars)' });
  const key = [a, b].sort().join('||');
  let out = cache.get(key), provider = 'cache';
  if (!out) {
    const p = prompt(a, b);
    for (const [name, fn] of [['gemini', gemini], ['pollinations', pollinations], ['ollama', ollama]]) {
      try { out = await fn(p); provider = name; break; } catch (e) { /* next */ }
    }
    if (!out) { out = template(a, b); provider = 'template'; }
    cache.set(key, out);
  }
  const verdict = /VERDICT:\s*YES/i.test(out) ? 'YES' : 'NO';
  const reason = (out.match(/REASON:\s*(.*)/i) || [, out.slice(0, 160)])[1].trim();
  res.status(200).json({ verdict, reason, provider });
}
