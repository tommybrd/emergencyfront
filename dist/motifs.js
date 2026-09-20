import {INCIDENTS} from './incident-catalog.js';
const labels={SUAP:'SAP',AVP:'Accident',INC:'Incendie',OD:'Divers'},colors={SUAP:'#589da9',AVP:'#caab56',INC:'#c97454',OD:'#8b9c77'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const catalog=document.getElementById('catalog'),search=document.getElementById('search'),results=document.getElementById('results'),count=document.getElementById('count');
try{
 const response=await fetch('./data/departures-reference.json');if(!response.ok)throw new Error('reference unavailable');
 const data=await response.json(),byId=new Map(data.rows.map(r=>[r.id,r])),sources=new Map(data.sources.map(s=>[s.id,s]));
 const link=r=>`<a href="${esc(sources.get(r.source).url)}#page=${r.page}" target="_blank" rel="noopener">${esc(r.motif)} · SDIS ${r.source.includes('76')?'76':'31'}, p. ${r.page} ↗</a>`;
 function render(){
  const query=normalize(search.value),game=catalog.value==='game';
  const rows=(game?INCIDENTS:data.rows.filter(r=>catalog.value==='all'||r.source===catalog.value)).filter(r=>normalize(game?r.name+' '+labels[r.type]:r.motif+' '+r.family+' '+r.context).includes(query));
  count.textContent=`${rows.length} ${game?'mission(s) jouable(s)':'ligne(s) de départ-types'}`;
  results.innerHTML=rows.length?rows.map(r=>game?`<li class="card" style="--accent:${colors[r.type]}"><h2><span class="badge">${labels[r.type]}</span>${esc(r.name)}</h2><p class="meta">Poids dans sa famille : ${r.weight.day} le jour / ${r.weight.night} la nuit. Un motif récent a moins de chances de se répéter.</p>${r.inspection?'<p>Vérification sur place : les lances ne sont nécessaires que si un feu est confirmé.</p>':''}<details><summary>Motifs d’origine</summary>${r.sources.map(id=>`<p>${link(byId.get(id))}</p>`).join('')}</details></li>`:`<li class="card"><h2>${esc(r.motif)}</h2><p class="meta">${esc(sources.get(r.source).title)} · page ${r.page}<br>${esc(r.family)} · ${esc(r.context)}</p><div class="resource-grid">${Object.entries(r.departures).map(([k,v])=>`<p><b>${esc(k)}</b>${esc(v)}</p>`).join('')}</div><small>${link(r)}</small></li>`).join(''):'<li class="empty">Aucun motif ne correspond à cette recherche.</li>';
 }
 catalog.addEventListener('change',render);search.addEventListener('input',render);render();
}catch{
 count.textContent='Le catalogue ne peut pas être affiché. Les grilles CSV et les documents sources restent accessibles ci-dessus.';
}
