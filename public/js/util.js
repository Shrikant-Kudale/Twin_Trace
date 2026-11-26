/* Shared helpers and theme (dark / light, remembered, follows system by default) */
const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('tt', t); } catch (e) { /* private mode */ } $('#th').textContent = t === 'dark' ? 'Light theme' : 'Dark theme'; }
let _t = null; try { _t = localStorage.getItem('tt'); } catch (e) { /* ignore */ }
setTheme(_t || (matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
$('#th').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
function dl(n, t, m) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: m })); a.download = n; a.click(); }
const cq = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
