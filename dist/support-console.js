import {assessMeans} from './means-assessment.js';
import {roadSignPanel} from './road-sign.js';
import {escapeHtml as esc} from './player-profile.js';
import {SECTORS,commandAvailable,assignSector} from './incident-coordination.js';
import {longSupplyOptions,beginLongSupply,stopLongSupply} from './support-vehicles.js';
import {situationWithMeans} from './command.js';
const supplyCache=new WeakMap();
function sourceOptions(e,engines,hydrants){
 const key=JSON.stringify([e.status,e.call,e.crew,e.longSupplyTarget,e.model.position.toArray(),engines.map(v=>[v.id,v.status,v.call,v.hydrant?.id,v.supplyProgress>0,v.supplyHydrant?.id,v.model.position.toArray()]),hydrants.map(h=>[h.id,h.visible,!!h.parent,h.userData?.outOfService,h.position.toArray()])]);
 if(supplyCache.get(e)?.key===key)return supplyCache.get(e).options;
 const options=hydrants.flatMap((h,index)=>longSupplyOptions(e,engines,[h]).map(o=>({...o,index}))).sort((a,b)=>a.engine.id.localeCompare(b.engine.id)||a.supply.distance-b.supply.distance);
 supplyCache.set(e,{key,options});return options;
}
export function supportVehiclePanel(e,c,engines,hydrants){
 if(e.kind==='VSR')return roadSignPanel(e);
 if(!['PC','VPCE'].includes(e.kind))return '';
 const ready=e.status==='scene'&&c&&c.status!=='closed'&&e.crew>=2;
 if(!ready)return `<section class="supportCommands"><b>${e.kind==='PC'?'Coordination':'Longue alimentation'}</b><p>Actions disponibles sur les lieux avec deux personnels.</p></section>`;
 if(e.kind==='PC')return pcSituation(c,engines)+`<section class="supportCommands" data-support-console><h3>Coordination de l’intervention</h3><button data-support-action="report">📻 Bilan des moyens</button>${engines.filter(v=>v.call===c.id&&v.status==='scene'&&!['PC','VLCG'].includes(v.kind)).map(v=>`<div class="sectorAssignment"><b>${esc(v.id)}</b><div>${Object.entries(SECTORS).filter(([key])=>['attack','contain'].includes(key)?v.capacity:key==='supply'?v.capacity||v.kind==='VPCE':['VSAV','VLI','EPA','VSR','FPT','VTU','VPL'].includes(v.kind)).map(([key,label])=>`<button data-support-action="sector" data-support-engine="${esc(v.id)}" data-support-sector="${key}" aria-pressed="${c.sectors?.[v.id]===key}">${label}</button>`).join('')}</div></div>`).join('')}<small>Protection effective avec un engin débitant ; secours coordonnés avec un équipage sur place.</small></section>`;
 if(e.longSupplyTarget){const receiver=engines.find(v=>v.id===e.longSupplyTarget),packing=!receiver?.hydrant,phase=e.containerPhase==='unloading'?'Dépose de la berce':e.containerPhase==='loading'?'Rechargement de la berce':packing?'Rangement des tuyaux':receiver?.supplyProgress>=1?'Alimentation établie':'Établissement des tuyaux',progress=e.containerPhase==='unloading'?e.containerProgress:e.containerPhase==='loading'?1-e.containerProgress:packing?1-(receiver?.supplyProgress||0):receiver?.supplyProgress||0;return `<section class="supportCommands" data-support-console><h3>Alimentation · ${esc(e.longSupplyTarget)}</h3><p role="status">${phase} · ${Math.round(progress*100)} %</p><progress max="1" value="${progress}"></progress><button data-support-action="pack" ${packing?'disabled':''}>Ranger la ligne et reprendre la berce</button></section>`;}
 const options=sourceOptions(e,engines,hydrants);
 return `<section class="supportCommands" data-support-console><h3>Établir une longue alimentation</h3>${options.length?`<label>Engin et poteau<select data-support-source>${options.map(o=>{const value=o.engine.id+'|'+o.index;return `<option value="${esc(value)}" ${e.longSupplyChoice===value?'selected':''}>${esc(o.engine.id)} · Poteau ${o.index+1} · ${Math.round(o.supply.distance)} m</option>`;}).join('')}</select></label><button data-support-action="supply">Déposer la berce et établir</button>`:'<p>Aucune liaison disponible : placer le VPCE à moins de 65 m d’un engin incendie non alimenté. Un poteau libre doit être accessible à moins de 500 m de tuyaux.</p>'}</section>`;
}
export function supportAction(e,c,command,data,engines,hydrants){
 if(e.kind==='VSR'&&command==='road-sign'&&!e.path&&['scene','idle','ready'].includes(e.status)){e.roadSignDeployed=!e.roadSignDeployed;return {message:e.roadSignDeployed?'Déploiement du panneau de signalisation.':'Repli du panneau de signalisation.'};}
 if(!c||e.call!==c.id||c.status==='closed'||e.status!=='scene'||e.crew<2)return {error:'L’engin doit être sur les lieux avec son équipage.'};
 if(e.kind==='PC'&&command==='report')return {message:situationWithMeans(c,engines).message};
 if(e.kind==='PC'&&command==='sector'){const unit=engines.find(v=>v.id===data.engine);return unit&&commandAvailable(c,engines)&&assignSector(c,unit,data.sector,engines)?{message:`${unit.id} affecté au secteur ${SECTORS[data.sector].toLowerCase()}.`}:{error:'Affectation indisponible.'};}
 if(e.kind==='VPCE'&&command==='pack'&&e.longSupplyTarget){stopLongSupply(e,engines);return {message:'Rangement de la ligne puis reprise de la berce.'};}
 if(e.kind==='VPCE'&&command==='supply'){const h=hydrants[Number(data.hydrant)];return h&&beginLongSupply(e,data.engine,engines,[h])?{message:'Dépose de la berce et établissement vers '+data.engine+'.'}:{error:'Liaison indisponible : vérifier le poteau, la distance et l’engin à alimenter.'};}
 return {error:'Action indisponible.'};
}

export function pcSituation(c,engines){
 const a=assessMeans(c,engines),units=engines.filter(e=>e.call===c.id&&!['ready','returning'].includes(e.status));
 return `<section class="supportCommands pcSituation"><h3>Bilan de l’intervention</h3><b>${esc(c.name)}</b><p>${esc(c.address||'')}</p><p>${esc(situationWithMeans(c,engines).message)}</p>${a.requirements?.length?`<table><thead><tr><th>Besoin</th><th>Nécessaires</th><th>Sur place</th><th>En route / mobilisés</th><th>À engager</th></tr></thead><tbody>${a.requirements.map(r=>`<tr><th>${esc(r.label)}</th><td>${r.required}</td><td>${r.present}</td><td>${r.enroute}</td><td>${r.missing}</td></tr>`).join('')}</tbody></table>`:''}<h4>Moyens engagés</h4><ul>${units.map(e=>`<li>${esc(e.id)} · ${e.status==='scene'?'sur place':e.status==='departing'?'mobilisation':e.status==='transport'?'transport':e.status==='hospital'?'au CH':e.status==='positioning'?'mise en place':'en route'}</li>`).join('')||'<li>Aucun moyen</li>'}</ul></section>`;
}
