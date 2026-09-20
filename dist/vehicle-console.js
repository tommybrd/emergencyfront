import {foamIncident,foamError} from './foam.js';
import {escapeHtml} from './player-profile.js';
import {AMBER_PATTERNS} from './signalling.js';
import {NOZZLES,equipmentStatus} from './hydraulics.js';
import {aerialActionError,aerialBusy,aerialStatus,aerialReturnError} from './aerial-operations.js';
import {canManualRecovery} from './traffic-recovery.js';

const symbols={
 foam:'<path d="m4 24 7-7m-2-3 5-5 6 6-5 5zM20 7l7-3m-4 7 7-1"/><circle cx="24" cy="21" r="3"/><circle cx="29" cy="25" r="2"/><circle cx="18" cy="25" r="2"/>',
 beacon:'<path d="M9 24V14a7 7 0 0 1 14 0v10M6 25h20M16 2v3M3 10l4 2m19 0 4-2M6 4l3 4m14 0 3-4"/>',
 horn:'<path d="M4 13h6l10-6v16l-10-6H4zM24 10q6 5 0 10M28 7q8 8 0 16"/>',
 pedal:'<path d="M4 10h5l8-5v14l-8-5H4zM21 7q6 5 0 10M13 25h16l-3-4H16zM21 26v2"/>',
 amber:'<rect x="3" y="11" width="28" height="11" rx="2"/><path d="M8 13v7m6-7v7m6-7v7m6-7v7M7 6V3m10 3V1m10 5V3"/>',
 mast:'<path d="M16 27V9m-4 18h8M8 6h17v6H8zM16 1v2M3 4l3 2m22 0 3-2M3 16l3-2m22 0 3 2"/>',
 flood:'<path d="M6 11h9v9H6zM10 20v6H4m14-14 11-5m-11 9h13m-13 4 11 5"/>',
 ladder:'<path d="m5 22 21-17m-18 20L29 8M9 19l4 4m0-8 4 4m0-8 4 4m0-8 4 4M4 26h25M26 5h5v6"/>',
 aerialNozzle:'<path d="M4 27 18 14m-9 13 14-13M7 22l4 4m0-8 4 4m0-8 4 4M19 13V8h10v7H19m3-7V5h4m2-3 4-1m-3 4 4 1"/>',
 stretcher:'<path d="M4 18h26M7 16v-4h19v4M11 12V9h9l4 3M8 18v7m18-7v7M3 5l4-3 4 3M7 2v7M27 21v7m-4-3 4 3 4-3"/>',
 hydrant:'<path d="M10 25V11h13v14M7 25h19M9 11V7h15v4M13 7V4h7v3M6 13h4m13 0h5v8m-14-6h5"/>',
 follow:'<circle cx="17" cy="15" r="8"/><circle cx="17" cy="15" r="3"/><path d="M17 2v5m0 16v5M4 15h5m16 0h5"/>',
 station:'<path d="M4 26V11l13-8 13 8v15M8 26V14h18v12M8 18h18M8 22h18M17 3v6"/>',
 incident:'<rect x="8" y="5" width="19" height="23" rx="2"/><path d="M13 5V2h8v3M13 12h9m-9 5h9m-9 5h6M4 13v10"/>',
 unblock:'<path d="M7 9a11 11 0 1 1-1 13M7 3v7H1M9 22v-8h11l5 5v3zM20 14v5h5"/><circle cx="12" cy="23" r="2"/><circle cx="22" cy="23" r="2"/>',
 battery:'<path d="M5 10V8h6v2m11 0V8h6v2M4 10h26v15H4zM8 17h6m-3-3v6m11-3h5"/>',
 left:'<path d="M29 15H4m8-7-8 7 8 7"/>',
 right:'<path d="M4 15h25m-8-7 8 7-8 7"/>',
 outward:'<path d="M14 15H2m7-6-7 6 7 6m11-6h12m-7-6 7 6-7 6"/>',
 alternate:'<path d="M14 10H3m5-5-5 5 5 5m11 5h12m-5-5 5 5-5 5"/>',
 flash:'<path d="m14 3-7 12h8l-2 12 13-15h-9l4-9"/>',
 nozzle:'<path d="m5 26 7-7m-3-3 7-7 8 8-7 7zM20 5l7-3m-2 7 6-2m-3 7h5"/>'
};
export function consoleIcon(name){return `<svg viewBox="0 0 34 30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbols[name]||symbols.beacon}</svg>`;}
function key({action,icon,label,color='',on=false,disabled=false,busy=false}){
 const hint=escapeHtml(label);
 return `<button type="button" class="signalKey ${color} ${busy?'keyBusy':''}" ${action} title="${hint}" aria-label="${hint}" aria-pressed="${!!on}" ${disabled?'disabled':''}>${consoleIcon(icon)}</button>`;
}

function waterInstrument(e){
 const capacity=Math.max(1,Number(e.capacity)||1),water=Math.max(0,Math.min(capacity,Number(e.water)||0)),percent=Math.round(water/capacity*100),low=percent<=30,critical=percent<=15;
 const supplied=!!e.hydrant&&e.supplyProgress>=1,status=water===0?'Citerne vide':critical?'Réserve critique':low?'Réserve faible':'Niveau normal',number=n=>Math.round(n).toLocaleString('fr-FR');
 const hint=escapeHtml(`${status} · ${number(water)} litres sur ${number(capacity)} · ${supplied?'Alimentation établie':equipmentStatus(e)||'Eau de la citerne'}`);
 return `<div class="waterInstrument ${critical?'critical':low?'low':''}" title="${hint}"><div class="tankGauge" role="meter" aria-label="Niveau d’eau dans la citerne" aria-valuemin="0" aria-valuemax="${capacity}" aria-valuenow="${water}" aria-valuetext="${number(water)} litres · ${percent} % · ${status}" style="--tank-level:${percent}%"><span class="tankFluid"></span><span class="tankTicks"></span><svg viewBox="0 0 20 26" aria-hidden="true"><path d="M10 2C8 6 3 12 3 17a7 7 0 0 0 14 0c0-5-5-11-7-15Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></div><div class="tankReadout"><div class="tankNumbers"><b class="tankPercent">${percent}<small>%</small></b><span class="tankLitres"><strong>${number(water)}</strong><small>/ ${number(capacity)} L</small></span></div><div class="tankFlow">${consoleIcon('nozzle')}<span>${number(e.pumpFlow??e.flow??0)} L/min</span><span class="tankCondition ${supplied?'supplied':''}" aria-label="${escapeHtml(supplied?'Alimentation établie':status)}">${supplied?consoleIcon('hydrant'):low?'⚠':'●'}</span></div></div></div>`;
}

export function vehicleConsole(e,{boarding=false,autoSiren=false,follow=false,returnLabel='Retour au CIS',incident=null,engines=[],supply=null}={}){
 const scene=e.status==='scene',fire=e.capacity>0&&e.kind!=='CCGC',amber=e.amber??['scene','reconditioning'].includes(e.status);
 const attackOn=e.aerial?.mode==='attack',rescueOn=e.aerial?.mode==='rescue',attackError=e.kind==='EPA'?aerialActionError(e,incident,'attack',engines):null,rescueError=e.kind==='EPA'?aerialActionError(e,incident,'rescue',engines):null;
 const buttons=[
  {action:'data-blue',icon:'beacon',label:'Gyrophares bleus',color:'blueKey',on:e.beacons,disabled:boarding},
  {action:'data-siren',icon:'horn',label:autoSiren&&!e.siren?'Deux-tons automatique actif · forcer le permanent':'Deux-tons permanent',color:'hornKey',on:e.siren||autoSiren},
  {action:'data-siren-once',icon:'pedal',label:'Deux-tons · maintenir appuyé',color:'momentaryKey',on:e.sirenHeld},
  ...(e.model.userData.rearAmber?.length?[{action:'data-amber',icon:'amber',label:'Rampe orange arrière',color:'amberKey',on:amber}]:[]),
  ...(e.zoneLightRig?[{action:'data-zone-light',icon:e.kind==='EPA'?'flood':'mast',label:e.kind==='EPA'?'Éclairage de zone':'Mât d’éclairage',color:'workKey',on:e.zoneLighting,disabled:!scene,busy:e.zoneLighting?e.zoneLightRig.extension<1:e.zoneLightRig.extension>0}]:[]),
  ...(e.kind==='EPA'?[
   {action:'data-ladder',icon:'ladder',label:incident?.elevatedRescue&&!incident.elevatedRescue.done?(rescueError||'Brancardage · rejoindre la fenêtre puis descendre la victime'):'Déployer ou replier l’échelle',color:'workKey',on:e.ladderDeployed,disabled:!scene||aerialBusy(e)||!!(incident?.elevatedRescue&&!incident.elevatedRescue.done&&rescueError)},
   {action:'data-aerial-action="attack"',icon:'aerialNozzle',label:attackOn?'Couper la lance sur nacelle et replier':attackError||'Lance sur nacelle · 500 L/min',color:'waterKey',on:attackOn,disabled:attackOn?e.aerial.phase==='pack':!!attackError,busy:attackOn&&e.aerial.phase!=='attack'},
   {action:'data-aerial-action="rescue"',icon:'stretcher',label:rescueOn?aerialStatus(e):rescueError||'Brancardage par nacelle · puis relais VSAV',color:'workKey',on:rescueOn,disabled:!!rescueError,busy:rescueOn}
  ]:[]),
  ...(fire&&foamIncident(incident)?[{action:'data-foam',icon:'foam',label:e.foamOn?`Couper la mousse · ${Math.ceil(e.foamReserve)} L d’émulseur`:(foamError(e,incident)||`Mousse · petite lance 1 · dosage automatique · ${Math.ceil(e.foamReserve)} L`),color:'foamKey',on:e.foamOn,disabled:!e.foamOn&&!!foamError(e,incident),busy:e.foamOn&&e.foamFlow<=0}]:[]),
  ...(fire?[{action:'data-hydrant',icon:'hydrant',label:e.hydrant?'Débrancher le poteau d’incendie':e.supplyProgress>0?'Rangement de l’alimentation':supply?`Alimenter sur poteau · ${Math.round(supply.distance)} m de tuyaux`:'Aucun poteau accessible · citerne uniquement',color:'waterKey',on:!!e.hydrant,disabled:!scene||!e.hydrant&&!supply,busy:e.hydrant?e.supplyProgress<1:e.supplyProgress>0}]:[])
 ];
 const modes=e.model.userData.rearAmber?.length>=8?`<div class="amberModes" role="group" aria-label="Sens de la rampe orange vus depuis l’arrière">${AMBER_PATTERNS.map(([mode,label])=>key({action:`data-amber-mode="${mode}"`,icon:mode,label:'Rampe arrière · '+label,color:'amberKey',on:amber&&(e.amberPattern||'alternate')===mode})).join('')}</div>`:'';
 const pump=fire?`<div class="pumpScreen">${waterInstrument(e)}<div class="nozzleControls" role="group" aria-label="Lances à déployer">${Object.entries(NOZZLES).map(([id,n])=>`<div class="nozzleRow ${id}" title="${n.label} · ${n.flow} L/min par lance"><span aria-label="${n.label}">${consoleIcon('nozzle')}</span>${Array.from({length:n.max+1},(_,count)=>`<button type="button" data-nozzle="${id}" data-number="${count}" title="${count} ${n.label.toLowerCase()} · ${count*n.flow} L/min" aria-label="${count} ${n.label.toLowerCase()}" ${!scene?'disabled':''} aria-pressed="${e.nozzles[id]===count}">${count}</button>`).join('')}</div>`).join('')}</div></div>`:'';
 const navigation=[
  {action:'data-follow',icon:'follow',label:'Suivre l’engin',on:follow},
  ...(e.call?[{action:'data-back-incident',icon:'incident',label:'Fiche intervention'}]:[]),
  {action:'data-cis',icon:'station',label:aerialReturnError(e)||returnLabel,disabled:['ready','hospital','transport','reconditioning','returning'].includes(e.status)||!!aerialReturnError(e)},
  {action:'data-unblock',icon:'unblock',label:canManualRecovery(e)?'Débloquer · replacer à quelques mètres (12 m maximum)':'Déblocage disponible si le véhicule est bloqué en trajet',color:'warningKey',on:canManualRecovery(e),disabled:!canManualRecovery(e)}
 ];
 return `<div class="signalController ${e.kind==='EPA'?'aerialController':''}"><i class="caseScrew screwTL" aria-hidden="true"></i><i class="caseScrew screwTR" aria-hidden="true"></i><div class="signalScreen"><div class="consoleButtons" role="group" aria-label="Commandes embarquées">${buttons.map(key).join('')}</div>${modes}${pump}${e.aerial?.mode?`<div class="aerialReadout" role="status">${consoleIcon(e.aerial.mode==='attack'?'aerialNozzle':'stretcher')}<span>${escapeHtml(aerialStatus(e))}${e.aerial.flow>0?` · ${Math.round(e.aerial.flow)} L/min`:e.aerial.phase==='pack'?'':` · ${Math.round(e.aerial.progress*100)} %`}${e.aerial.sourceId?`<small>${escapeHtml(e.aerial.sourceId)}</small>`:''}</span></div>`:''}<div class="signalVoltage" aria-label="Alimentation 12 volts">${consoleIcon('battery')}<span class="voltageBars" aria-hidden="true">▮▮▮▮▮▮▮▮</span><span>12 V</span></div></div><div class="signalFooter" role="group" aria-label="Navigation">${navigation.map(key).join('')}</div><i class="caseScrew screwBL" aria-hidden="true"></i><i class="caseScrew screwBR" aria-hidden="true"></i></div>`;
}
