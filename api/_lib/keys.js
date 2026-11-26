// Per-request keys sent by the browser (base64 JSON in x-tt-keys). Never logged or stored.
export const keysOf = req => { try { return JSON.parse(Buffer.from(String((req.headers || {})['x-tt-keys'] || ''), 'base64').toString()); } catch (e) { return {}; } };
