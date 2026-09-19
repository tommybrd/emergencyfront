import {INCIDENTS} from './incident-catalog.js';
const labels = {SUAP:'SAP', AVP:'Accident', INC:'Incendie', OD:'Divers'};
const colors = {SUAP:'#589da9', AVP:'#caab56', INC:'#c97454', OD:'#8b9c77'};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const search = document.getElementById('search');
const catalog = document.getElementById('catalog');
const results = document.getElementById('results');
const count = document.getElementById('count');
let references;
try {
  const response = await fetch('./data/departures-reference.json');
  if (!response.ok) throw new Error('Bibliographie indisponible');
  references = await response.json();
} catch {
  references = {rows:[], sources:[]};
}
const byId = new Map(references.rows.map(row => [row.id, row]));
const sources = new Map(references.sources.map(source => [source.id, source]));
function render() {
  const query = normalize(search.value);
  const rows = INCIDENTS.filter(row => (catalog.value === 'all' || row.type === catalog.value) && normalize(row.name + ' ' + labels[row.type]).includes(query));
  count.textContent = `${rows.length} mission(s) jouable(s)`;
  results.innerHTML = rows.map(row => {
    const links = [...new Set(row.sources.map(id => {
      const reference = byId.get(id), source = sources.get(reference?.source);
      return source ? `<a href="${esc(source.url)}#page=${reference.page}" target="_blank" rel="noopener">${esc(source.title)} · p. ${reference.page} ↗</a>` : '';
    }).filter(Boolean))];
    return `<li class="card" style="--accent:${colors[row.type]}"><h2><span class="badge">${labels[row.type]}</span>${esc(row.name)}</h2><p class="meta">Poids dans sa famille : ${row.weight.day} le jour / ${row.weight.night} la nuit. Un motif récent a moins de chances de se répéter.</p>${row.inspection ? '<p>Les lances ne sont nécessaires que si un feu est confirmé après reconnaissance.</p>' : ''}${links.length ? `<details><summary>Documents de référence</summary>${links.map(link => `<p>${link}</p>`).join('')}</details>` : ''}</li>`;
  }).join('') || '<li class="empty">Aucun motif ne correspond à cette recherche.</li>';
}
search.addEventListener('input', render);
catalog.addEventListener('change', render);
render();
