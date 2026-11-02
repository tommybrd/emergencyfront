// Prévention : visites de sécurité de journée, sans gyrophares, interruptibles par un départ urgent.
// Horaires et durée : équilibrage de jeu.
export const PREVENTION_SLOTS=[9*60+30,14*60];
export const PREVENTION_END=17*60;
const SITES=[
 {setting:'office',name:'Visite de sécurité · immeuble de bureaux'},
 {setting:'mall',name:'Visite de sécurité · centre commercial'},
 {setting:'shop',name:'Visite de sécurité · atelier artisanal'}
];
export const isPrevention=c=>!!c?.prevention;
// Créneaux échus de la garde en cours, chacun une seule fois, jamais après la fin de journée.
export function duePrevention(state){
 state.preventionDone??=[];
 const day=Math.floor(state.minute/1440),due=[];
 for(const slot of PREVENTION_SLOTS){
  const at=day*1440+slot,key=String(at);
  if(state.minute<at||state.minute>=day*1440+PREVENTION_END||at<state.shiftStart||state.preventionDone.includes(key))continue;
  state.preventionDone.push(key);
  const site=SITES[(day+PREVENTION_SLOTS.indexOf(slot))%SITES.length];
  due.push({type:'OD',catalogId:'prevention',name:site.name,setting:site.setting,requires:'VTU',duration:40,prevention:true,allowComplications:false,expiresAt:day*1440+PREVENTION_END,at:state.minute});
 }
 return due;
}
// Une visite quittée par tous ses engins avant la fin est interrompue ; non commencée à 17 h, elle est reportée.
export function settlePrevention(c,engines,minute){
 if(!c.prevention||c.status==='closed'||c.siteCompletedAt!=null)return null;
 if(engines.some(e=>e.call===c.id)){c.preventionStarted=true;return null;}
 if(c.preventionStarted&&(c.progress||0)<1){c.status='closed';c.interrupted=true;c.closedAt=minute;return `Visite de prévention n°${c.id} interrompue : les engins sont repartis sur un départ urgent.`;}
 if(!c.preventionStarted&&minute>=c.expiresAt){c.status='closed';c.postponed=true;c.closedAt=minute;return `Visite de prévention n°${c.id} reportée faute de moyens disponibles.`;}
 return null;
}
