/* App shell: view routing (hash), catalogue sub-tabs, AI status */
function show(v) {
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
  document.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
}
document.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => show(b.dataset.v); });
document.querySelectorAll('.subnav button').forEach(b => { b.onclick = () => { document.querySelectorAll('.subnav button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.ss').forEach(s => s.classList.toggle('on', s.id === b.dataset.s)); }; });
addEventListener('hashchange', () => { const v = location.hash.slice(1); if (document.getElementById('v-' + v)) show(v); });
{ const v = location.hash.slice(1); if (document.getElementById('v-' + v)) show(v); }
TT.refreshPill();
$('#pill').onclick = () => TT.testAI();
$('#diagbtn').onclick = () => TT.testAI();
