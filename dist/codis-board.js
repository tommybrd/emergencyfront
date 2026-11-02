// Tableau CODIS : vue d'ensemble de la salle, interventions, moyens avec statut radio, renforts et main courante.
import {time} from './sim.js';
import {escapeHtml as esc} from './player-profile.js';
import {displayName} from './call-taking.js';
// Codes de statut inspirés des terminaux embarqués ; équilibrage de jeu, pas une grille départementale.
export const RADIO_STATUS={1:'Disponible au centre',2:'Parti · en route',3:'Sur les lieux',4:'Transport victime',5:'Arrivé au CH',6:'Disponible sur route',7:'Indisponible'};
export function radioStatus(e){
 if(['scene','positioning','arrived'].includes(e.status))return 3;
 if(['departing','enroute','traffic'].includes(e.status))return 2;
 if(e.status==='transport')return 4;
 if(['hospital','doctorTransit'].includes(e.status))return 5;
 if(e.status==='returning')return e.localReturning?7:6;
 if(['maintenance','refilling','reconditioning'].includes(e.status))return 7;
 return 1;
}
const label=c=>`I${String(c.id).padStart(2,'0')}`;
export const CODIS_FILTERS=[['all','Toute la main courante'],['urgent','Messages urgents'],['radio','Radio']];
export function codisLogs(logs,filter='all',limit=40){
 const callId=/^call:(\d+)$/.exec(filter)?.[1];
 return logs.filter(l=>filter==='all'||filter==='urgent'&&l.urgent||filter==='radio'&&l.message.startsWith('Radio')||callId&&l.callId===Number(callId)).slice(-limit).reverse();
}
export function codisBoard(state,engines,{statusText=e=>e.status,filter='all'}={}){
 const open=state.calls.filter(c=>c.status!=='closed'),units=engines.filter(e=>e.kind!=='POLICE');
 const counts=Object.fromEntries(Object.keys(RADIO_STATUS).map(k=>[k,0]));for(const e of units)counts[radioStatus(e)]++;
 const reinforcements=open.flatMap(c=>(c.reinforcementAlerts||[]).map(a=>({c,a})));
 const incidents=open.length?open.map(c=>{const engaged=units.filter(e=>e.call===c.id);return `<button class="codisRow" data-codis-call="${c.id}"><b>${label(c)}</b><span>${esc(c.type)}</span><span class="codisName">${esc(displayName(c))}<small>${esc(c.address||'')}</small></span><span>${time(c.at)} · ${Math.max(0,Math.round(state.minute-c.at))} min</span><span>${engaged.length?engaged.map(e=>`<i data-status="${radioStatus(e)}">${esc(e.id)}</i>`).join(''):'<em>Aucun moyen</em>'}</span></button>`;}).join(''):'<p class="codisEmpty">Aucune intervention en cours.</p>';
 const fleet=units.map(e=>{const code=radioStatus(e),c=state.calls.find(c=>c.id===e.call);return `<tr data-status="${code}"><td><b>${esc(e.id)}</b></td><td><span class="codisCode">${code}</span>${esc(RADIO_STATUS[code])}</td><td>${c?label(c):'—'}</td><td>${esc(statusText(e))}</td></tr>`;}).join('');
 const pending=reinforcements.length?reinforcements.map(({c,a})=>`<li><b>${label(c)}</b> ${esc(a.sender||'')} : ${esc(a.message)} <time>${time(a.minute??state.minute)}</time></li>`).join(''):'<li class="codisEmpty">Aucun renfort en attente.</li>';
 const logs=codisLogs(state.logs,filter).map(l=>`<li class="${l.urgent?'urgent':''}"><time>${time(l.at)}</time>${l.callId?`<b>${'I'+String(l.callId).padStart(2,'0')}</b>`:''}${esc(l.message)}</li>`).join('')||'<li class="codisEmpty">Aucun message.</li>';
 return `<div class="codisSummary">${Object.entries(RADIO_STATUS).map(([k,v])=>`<span data-status="${k}"><b>${counts[k]}</b>${esc(v)}</span>`).join('')}</div>
<section><h3>Interventions en cours · ${open.length}</h3><div class="codisIncidents">${incidents}</div></section>
<section><h3>Renforts en attente · ${reinforcements.length}</h3><ul class="codisPending">${pending}</ul></section>
<section><h3>Moyens · statuts radio</h3><div class="codisTableWrap"><table class="codisFleet"><thead><tr><th>Engin</th><th>Statut</th><th>Inter.</th><th>Détail</th></tr></thead><tbody>${fleet}</tbody></table></div></section>
<section><h3>Main courante</h3><ul class="codisLog">${logs}</ul></section>`;
}
export function codisFilterOptions(state,current='all'){
 const calls=state.calls.filter(c=>c.status!=='closed'||state.logs.some(l=>l.callId===c.id)).slice(-12);
 return [...CODIS_FILTERS,...calls.map(c=>[`call:${c.id}`,`${label(c)} · ${displayName(c)}`])].map(([v,t])=>`<option value="${v}"${v===current?' selected':''}>${esc(t)}</option>`).join('');
}
