import fs from 'fs';
export const root = new URL('../', import.meta.url).pathname;
let fails = 0;
export const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
export const done = () => { console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0); };
const R = (body, json) => ({ ok: true, status: 200, text: async () => body ?? '', json: async () => json ?? JSON.parse(body) });
// Fake internet: search pages, product pages, AI providers. Override per test with `extra`.
export const net = (extra = {}) => async (u, o) => {
  u = String(u); if (extra[u]) return extra[u](o);
  for (const [k, f] of Object.entries(extra)) if (u.includes(k)) return f(o);
  if (u.includes('duckduckgo.com')) return R(`<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fshop.example%2Fsony-xm5">Sony WH-1000XM5 Wireless Headphones Black</a><a class="result__snippet">Buy now ₹29,990</a><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fshop2.example%2Fxm4">Sony WH-1000XM4 Headphones</a><a class="result__snippet">$279</a><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.reddit.com%2Fr%2Fx">Sony XM5 thread</a>`);
  if (u.includes('bing.com')) return R(`<li class="b_algo"><h2><a href="https://www.bing.com/ck/a?!&amp;&amp;p=x&amp;u=a1${Buffer.from('https://store.example/xm5-black').toString('base64url')}&amp;ntb=1">Sony WH1000XM5 Noise Cancelling Headphones - Black</a></h2><p>Only $329.99</p></li>`);
  if (u.includes('openfoodfacts')) return R(JSON.stringify({ products: [] }));
  if (u.includes('shop.example') || u.includes('store.example')) return R(`<meta property="og:image" content="/a.jpg"><script type="application/ld+json">{"@type":"Product","name":"Sony XM5","mpn":"WH1000XM5B","offers":{"price":"329","priceCurrency":"USD"}}</script>`);
  if (u.includes('product.example')) return R(`<meta property="og:title" content="Logitech MX Master 3S | Store"><meta property="og:image" content="https://i/x.jpg"><meta property="product:price:amount" content="99.99">`);
  if (u.includes('blocked.example')) return { ok: false, status: 403, text: async () => 'denied' };
  if (u.includes('img.example/pic.png')) return { ok: true, headers: { get: () => 'image/png' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  if (u.includes('img.example/evil.svg')) return { ok: true, headers: { get: () => 'image/svg+xml' }, arrayBuffer: async () => new Uint8Array([1]).buffer };
  if (u.includes('api.x.ai')) return R('', { choices: [{ message: { content: '"Sony WH-1000XM5 headphones black"' } }] });
  throw new Error('offline ' + u);
};
export const call = async (fn, body, headers = {}, method = 'POST') => { let out, code = 200; await fn({ method, body, headers }, { status: c => ({ json: j => { out = j; code = c; } }) }); return { out, code }; };
export const read = p => fs.readFileSync(root + p, 'utf8');
