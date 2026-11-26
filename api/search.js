import { search } from './_lib/sources.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const q = String((req.body || {}).q || '').slice(0, 200);
  if (q.length < 2) return res.status(400).json({ error: 'Query too short' });
  try { res.status(200).json(await search(q)); } catch (e) { res.status(500).json({ error: e.message }); }
}
