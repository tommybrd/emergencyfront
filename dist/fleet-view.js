// Colonne des moyens : chaque vue de base n'y montre que ses véhicules ; sans vue active, elle reste la liste complète.
export const FLEET_BASES={centre:{title:'CIS Centre',button:'garage'},sud:{title:'CIS Sud',button:'garageSouth'},police:{title:'Commissariat',button:'viewPolice'},samu:{title:'SAMU · Centre hospitalier',button:'viewSamu'}};
export function onFleetBase(base,e){
 if(!base)return true;
 if(base==='centre')return !e.external;
 if(base==='sud')return !!e.localVolunteer;
 return base==='samu'&&e.kind==='SAMU';
}
const POLICE_STATUS={patrol:['En patrouille','isAvailable'],called:['Demandée','isUnavailable'],enroute:['En route','isUnavailable'],scene:['Sur les lieux','isUnavailable'],returning:['Retour au commissariat','isReturning']};
export function policeFleet(units,forces){
 const shown=units.filter(v=>!v.retired);
 return `<section class="fleetGroup" style="--rows:${Math.max(1,Math.ceil(shown.length/2))}"><h3>Unités de police</h3><div class="fleetGroupCards">${shown.map(v=>{const [status,tone]=POLICE_STATUS[v.status]||POLICE_STATUS.enroute;return `<button data-police-unit="${v.id}" title="${v.id} · ${status}" class="fleetCard ${tone}"><span class="mini">${v.id}</span><span class="fleetInfo">${status}<span class="crew">${forces[v.force]?.label||v.force}</span></span></button>`;}).join('')}</div></section>`;
}
