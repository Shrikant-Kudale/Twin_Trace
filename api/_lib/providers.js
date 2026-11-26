import { T } from './net.js';
const ENV = { xai: 'XAI_API_KEY', pollinations: 'POLLINATIONS_API_KEY', gemini: 'GEMINI_API_KEY', hf: 'HF_TOKEN' };
// One routing layer for text and vision. Tries each configured provider in order and reports every failure.
export async function llm({ text, image, keys = {}, ms = 25000 }) {
  const key = n => keys[n] || process.env[ENV[n]];
  const content = image ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: image } }] : text;
  const oa = (url, model, k) => async () => {
    const r = await T(fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(k ? { Authorization: 'Bearer ' + k } : {}) }, body: JSON.stringify({ model, messages: [{ role: 'user', content }] }) }), ms);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return (await r.json()).choices[0].message.content;
  };
  const gemini = async () => {
    const parts = [{ text }];
    if (image) parts.push({ inline_data: { mime_type: (image.match(/data:([^;]+)/) || [])[1] || 'image/jpeg', data: image.split(',')[1] } });
    const r = await T(fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${key('gemini')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) }), ms);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return (await r.json()).candidates[0].content.parts[0].text;
  };
  const ollama = async () => {
    const r = await T(fetch(process.env.OLLAMA_URL.replace(/\/$/, '') + '/api/generate', { method: 'POST', body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2', prompt: text, stream: false }) }), 30000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return (await r.json()).response;
  };
  const chain = [
    ['xAI Grok', key('xai') && oa('https://api.x.ai/v1/chat/completions', process.env.XAI_MODEL || 'grok-4', key('xai'))],
    ['Pollinations (key)', key('pollinations') && oa('https://gen.pollinations.ai/v1/chat/completions', 'openai', key('pollinations'))],
    ['Gemini', key('gemini') && gemini],
    ['Hugging Face Qwen', key('hf') && oa('https://router.huggingface.co/v1/chat/completions', process.env.HF_MODEL || 'Qwen/Qwen2.5-VL-7B-Instruct', key('hf'))],
    ['Pollinations (free)', oa('https://text.pollinations.ai/openai', 'openai')],
    ['Ollama', !image && process.env.OLLAMA_URL && ollama]
  ];
  const tried = [];
  for (const [via, fn] of chain) {
    if (!fn) continue;
    try { const t = await fn(); if (t && t.trim()) return { text: t.trim(), via, tried }; tried.push(via + ': empty answer'); } catch (e) { tried.push(via + ': ' + e.message); }
  }
  const err = new Error('No AI provider answered (' + (tried.join('; ') || 'none configured') + '). Open "AI keys" and add an xAI Grok or Pollinations key.');
  err.tried = tried; throw err;
}
