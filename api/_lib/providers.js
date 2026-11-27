import { T } from './net.js';
const list = (a, b) => [...new Set([a, ...b].filter(Boolean))];
// Routing order: free routes first, then keyed routes as fallback. Each entry lists models to try in order.
export const providers = () => { const e = process.env; return [
  { n: 'Pollinations (free)', url: 'https://text.pollinations.ai/openai', m: ['openai', 'gemini'], ms: 14000 },
  { n: 'Pollinations (key)', env: 'POLLINATIONS_API_KEY', url: 'https://gen.pollinations.ai/v1/chat/completions', m: ['openai', 'gemini'] },
  { n: 'Groq', env: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', m: { img: [e.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'], txt: [e.GROQ_MODEL || 'llama-3.3-70b-versatile'] } },
  { n: 'OpenRouter (free models)', env: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', m: { img: ['qwen/qwen2.5-vl-72b-instruct:free', 'google/gemini-2.0-flash-exp:free'], txt: ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-exp:free'] } },
  { n: 'Google Gemini', env: 'GEMINI_API_KEY', gemini: true, m: list(e.GEMINI_MODEL, ['gemini-2.5-flash', 'gemini-2.0-flash']) },
  { n: 'xAI Grok', env: 'XAI_API_KEY', url: 'https://api.x.ai/v1/chat/completions', m: { img: list(e.XAI_MODEL, ['grok-4', 'grok-2-vision-1212']), txt: list(e.XAI_MODEL, ['grok-4', 'grok-3-mini']) } },
  { n: 'Hugging Face Qwen', env: 'HF_TOKEN', url: 'https://router.huggingface.co/v1/chat/completions', m: [e.HF_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct'] },
  { n: 'Ollama', env: 'OLLAMA_URL', ollama: true, textOnly: true }
]; };
const post = async (url, headers, body, ms) => {
  const r = await T(fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }), ms);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 140));
  return r.json();
};
export const usable = (p, image) => (!p.env || !!process.env[p.env]) && !(image && p.textOnly);
export async function ask(p, { text, image }, ms = 20000) {
  const key = process.env[p.env], errs = [];
  if (p.ollama) return { text: (await post(key.replace(/\/$/, '') + '/api/generate', {}, { model: process.env.OLLAMA_MODEL || 'llama3.2', prompt: text, stream: false }, 30000)).response, model: 'ollama' };
  for (const model of Array.isArray(p.m) ? p.m : (image ? p.m.img : p.m.txt)) {
    try {
      let out;
      if (p.gemini) {
        const parts = [{ text }]; if (image) parts.push({ inline_data: { mime_type: (image.match(/data:([^;]+)/) || [])[1] || 'image/jpeg', data: image.split(',')[1] } });
        out = (await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {}, { contents: [{ parts }] }, ms)).candidates[0].content.parts[0].text;
      } else {
        const content = image ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: image } }] : text;
        out = (await post(p.url, key ? { Authorization: 'Bearer ' + key } : {}, { model, messages: [{ role: 'user', content }] }, ms)).choices[0].message.content;
      }
      if (out && out.trim()) return { text: out.trim(), model };
      errs.push(model + ': empty answer');
    } catch (e) { errs.push(model + ': ' + e.message); }
  }
  throw new Error(errs.join(' | '));
}
export async function llm({ text, image, ms = 20000 }) {
  const tried = [], t0 = Date.now();
  for (const p of providers()) {
    if (!usable(p, image) || Date.now() - t0 > 45000) continue;
    try { const r = await ask(p, { text, image }, p.ms || ms); return { text: r.text, via: p.n + ' (' + r.model + ')', tried }; } catch (e) { tried.push(p.n + ': ' + e.message); }
  }
  const err = new Error('No AI provider answered. ' + (tried.join(' ; ') || 'None available.')); err.tried = tried; throw err;
}
