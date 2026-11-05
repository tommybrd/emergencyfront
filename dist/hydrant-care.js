// Entretien des poteaux : certains sont défaillants sans que cela se voie, jusqu'au contrôle ou au raccordement.
// Taux de panne, rayon de tournée et délai de réparation : équilibrage de jeu.
export const FAULT_SHARE=.08,ROUND_RADIUS=140,REPAIR_MINUTES=240,FAULT_DETECTED_AT=.4;
export const ROUND_SLOTS=[11*60,15*60+30],ROUND_END=17*60;
const SECTORS=[{name:'Centre-ville',target:[70,-25]},{name:'Les Hauts',target:[215,-35]},{name:'Centre commercial',target:[210,100]},{name:'Stade municipal',target:[325,100]}];
export function dueHydrantRounds(state){
 if(!state.campaign||state.training)return [];
 state.hydrantRoundsDone??=[];
 const day=Math.floor(state.minute/1440),due=[];
 for(const slot of ROUND_SLOTS){
  const at=day*1440+slot,key=String(at);
  if(state.minute<at||state.minute>=day*1440+ROUND_END||at<state.shiftStart||state.hydrantRoundsDone.includes(key))continue;
  state.hydrantRoundsDone.push(key);
  const sector=SECTORS[(state.hydrantRoundsDone.length-1+(state.citySeed??0))%SECTORS.length];
  due.push({type:'OD',catalogId:'hydrant-round',name:'Tournée de contrôle des poteaux · '+sector.name,setting:'sidewalk',target:sector.target.slice(),requires:'VTU',duration:30,prevention:true,allowComplications:false,expiresAt:day*1440+ROUND_END,at:state.minute,hydrantRound:{sector:sector.name,center:sector.target.slice()}});
 }
 return due;
}
const marks=h=>h.userData.faultMarks||[];
export function revealFault(h){delete h.userData.hiddenFault;h.userData.outOfService=true;h.name='Poteau hors service';marks(h).forEach(m=>m.visible=true);}
// Une tournée terminée contrôle les poteaux du secteur ; les défaillants partent en réparation au service des eaux.
export function completeRound(c,hydrants,minute){
 const near=hydrants.filter(h=>Math.hypot(h.position.x-c.hydrantRound.center[0],h.position.z-c.hydrantRound.center[1])<=ROUND_RADIUS),faulty=near.filter(h=>h.userData.hiddenFault||h.userData.outOfService&&h.userData.repairAt==null);
 for(const h of near)h.userData.checkedAt=minute;
 for(const h of faulty){revealFault(h);h.userData.repairAt=minute+REPAIR_MINUTES;}
 return `${near.length} poteau${near.length>1?'x':''} contrôlé${near.length>1?'s':''} · ${faulty.length?`${faulty.length} hors service, signalé${faulty.length>1?'s':''} au service des eaux`:'tous en état'}.`;
}
export function tickRepairs(hydrants,minute){
 const repaired=hydrants.filter(h=>h.userData.repairAt!=null&&minute>=h.userData.repairAt);
 for(const h of repaired){delete h.userData.repairAt;h.userData.outOfService=false;h.name='Poteau incendie';marks(h).forEach(m=>m.visible=false);}
 return repaired.length;
}
