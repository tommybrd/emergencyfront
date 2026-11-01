// Joignabilité des SPV du CIS Sud : beaucoup travaillent en journée, la plupart sont joignables le soir et la nuit.
export const LOCAL_VOLUNTEERS=11;
const CURVE=[[0,10,'nuit'],[6,8,'lever'],[7,6,'départ au travail'],[8,4,'journée · au travail'],[12,5,'pause de midi'],[14,4,'journée · au travail'],[17,5,'fin de journée'],[18,7,'retour du travail'],[19,9,'soirée'],[22,10,'nuit']];
function slot(minute){const h=((minute%1440)+1440)%1440/60;let found=CURVE[0];for(const s of CURVE)if(h>=s[0])found=s;return found;}
// ±1 per hour, drawn from the guard seed so a replayed day keeps the same availability.
function hourNoise(minute,seed){const hour=Math.floor(minute/60);let x=(Math.imul((seed>>>0)^0x9e3779b9,31)+Math.imul(hour,2654435761))>>>0;x^=x>>>15;x=Math.imul(x,2246822519)>>>0;x=(x^x>>>13)>>>0;return x%3-1;}
export function volunteerReach(minute,seed=0){const [,base,label]=slot(minute);return {count:Math.max(3,Math.min(LOCAL_VOLUNTEERS,base+hourNoise(minute,seed))),label};}
// SPV already engaged on a local engine stay with it; SPV heading home remain reachable.
export function localVolunteersBusy(engines){return engines.filter(e=>e.localVolunteer&&e.status!=='ready'&&!e.localReturning).reduce((n,e)=>n+e.size,0);}
export function localVolunteersFree(engines,minute,seed=0){return Math.max(0,volunteerReach(minute,seed).count-localVolunteersBusy(engines));}
export function localShortage(selected,engines,minute,seed=0){
 const needed=selected.filter(e=>e.localVolunteer&&e.status==='ready').reduce((n,e)=>n+e.size,0);if(!needed)return null;
 const free=localVolunteersFree(engines,minute,seed),{label}=volunteerReach(minute,seed);
 return needed>free?`CIS Sud · effectif SPV insuffisant : ${free} disponible${free>1?'s':''} à cette heure (${label}), ${needed} nécessaires.`:null;
}
