// Timings and flow are deliberately balanced for a 24-minute game, not a training simulator.
export const AERIAL={flow:500,reach:30,supplyDistance:60,stabilize:8,connect:18,raise:24,load:10,lower:12,handover:5,pack:12};
const clamp=v=>v>=1-1e-9?1:v<=1e-9?0:v;
const distance=(a,b)=>Math.hypot(a.model.position.x-b.model.position.x,a.model.position.z-b.model.position.z);
export function initAerial(e){if(e.kind==='EPA')e.aerial={mode:null,phase:'idle',progress:0,connection:0,extension:0,stabilizers:0,sourceId:null,target:null,lower:null,flow:0};}
export function initElevatedRescue(c,random=Math.random){
 if(c.type!=='SUAP'||c.site?.kind!=='building'||c.site.height<6||!c.patients?.some(p=>p.transportRequired!==false)||!(c.aerialEvacuationChance>0)||random()>=c.aerialEvacuationChance)return;
 const p=c.patients.find(p=>p.transportRequired!==false),floor=Math.min(2,Math.max(1,Math.floor((c.site.height-2)/3)));
 p.trapped=true;p.aerialRescue=true;
 c.elevatedRescue={phase:'waiting',progress:0,done:false,announced:false,unitId:null,upper:[c.actionPoint[0],floor*3+.15,c.actionPoint[1]]};
}
export function aerialTarget(c,mode='attack'){
 if(mode==='rescue')return c?.elevatedRescue?.upper?.slice();
 if(!c?.actionPoint)return null;
 // Stand off from the facade; the stream, not the basket, reaches the flames.
 const yaw=c.site?.yaw||0,height=Math.min(c.site?.height||6,Math.max(4,c.fireHeight||4));
 return [c.actionPoint[0]+Math.sin(yaw)*8,height,c.actionPoint[1]+Math.cos(yaw)*8];
}
export function aerialReachable(e,target){
 if(!target)return false;
 const yaw=e.model.rotation.y,p=e.model.position,origin=[p.x-Math.sin(yaw)*2.75,p.y+3.6,p.z-Math.cos(yaw)*2.75];
 return Math.hypot(target[0]-origin[0],target[1]-origin[1],target[2]-origin[2])<=AERIAL.reach;
}
function legacyRescue(e,c){return c?.complication?.status==='active'&&c.complication.choice==='aerial'&&c.complication.unitId===e.id;}
function eligibleSource(e,p){return p!==e&&p.call===e.call&&p.status==='scene'&&p.capacity>0&&p.hydrant&&p.supplyProgress>=1&&distance(e,p)<=AERIAL.supplyDistance;}
export function aerialSource(e,engines){return engines.filter(p=>eligibleSource(e,p)).sort((a,b)=>distance(e,a)-distance(e,b))[0];}
export function aerialActionError(e,c,mode,engines){
 if(e.kind!=='EPA'||e.status!=='scene'||e.call!==c?.id||c.status==='closed')return 'EPA nécessaire sur les lieux.';
 if(!c.reconComplete)return 'Reconnaissance en cours.';
 if(e.buildingCrew)return 'Équipe engagée dans le bâtiment · attendez son retour.';
 if(e.aerial?.mode||e.aerial?.extension>0||e.aerial?.stabilizers>0||(mode!=='position'&&legacyRescue(e,c)))return 'EPA déjà occupée · terminez ou repliez l’action en cours.';
 if(mode==='attack'){
  if(c.type!=='INC'||c.site?.kind!=='building'||c.progress>=1||c.inspection&&c.fireConfirmed!==true)return 'Lance sur nacelle réservée aux feux de bâtiment confirmés.';
  if(!aerialSource(e,engines))return 'Alimentez un fourgon sur un poteau à moins de 60 m de l’EPA.';
 }else if(mode!=='position'&&(mode!=='rescue'||!c.elevatedRescue||c.elevatedRescue.done))return 'Aucun brancardage par nacelle demandé.';
 if(!aerialReachable(e,aerialTarget(c,mode)))return 'Façade hors de portée · rapprochez l’EPA avec le placement ⌖.';
 return null;
}
export function requestAerial(e,c,mode,engines,emit=()=>{}){
 if(mode==='position'&&e.aerial?.mode==='position'){stopAerial(e);return null;}
 if(mode==='attack'&&e.aerial?.mode==='attack'){stopAerial(e);emit(e.id,'Lance sur nacelle coupée. Repli en cours.');return null;}
 const error=aerialActionError(e,c,mode,engines);if(error)return error;
 const a=e.aerial,target=aerialTarget(c,mode),yaw=c.site?.yaw||0;
 Object.assign(a,{mode,phase:'stabilize',progress:0,target,lower:[target[0]+Math.sin(yaw)*1.7,.2,target[2]+Math.cos(yaw)*1.7],sourceId:mode==='attack'?aerialSource(e,engines).id:null,flow:0});
 e.ladderDeployed=true;
 if(mode==='rescue'){c.elevatedRescue.unitId=e.id;c.elevatedRescue.phase='stabilize';}
 emit(e.id,mode==='attack'?`Établissement de la lance sur nacelle, alimentation par ${a.sourceId}.`:'Stabilisation pour brancardage en étage.');
 return null;
}
export function stopAerial(e){const a=e.aerial;if(!a)return;if(a.mode||a.extension>0||a.stabilizers>0||a.connection>0){a.phase='pack';a.progress=0;}a.flow=0;e.flow=0;e.workActive=false;e.ladderDeployed=false;}
export function aerialBusy(e){const a=e.aerial;return !!(a&&(a.mode||a.extension>0||a.stabilizers>0||a.connection>0));}
export function aerialReturnError(e){return e.aerial?.mode==='rescue'&&e.aerial.phase!=='pack'?'Brancardage en cours · retour possible après remise de la victime au VSAV.':null;}
export function aerialLinked(e,engines){return engines.some(v=>v.aerial?.sourceId===e.id&&v.aerial.connection>0);}
export function stopAerialFor(e,engines){stopAerial(e);for(const v of engines)if(v.aerial?.sourceId===e.id)stopAerial(v);}
const labels={stabilize:'Pose des stabilisateurs',connect:'Raccordement au fourgon',raise:'Nacelle vers la façade',load:'Installation du brancard',lower:'Descente de la victime',handover:'Remise au VSAV',attack:'Lance sur nacelle',pack:'Repli de l’EPA',deployed:'Échelle en position de secours'};
export function aerialStatus(e){const a=e.aerial;return !a||!a.mode&&!a.stabilizers?'':a.waiting||labels[a.phase]||'';}
export function elevatedStatus(c){const r=c?.elevatedRescue;if(!r||!c.reconComplete)return '';return r.done?'Victime descendue · relais VSAV':r.unitId?labels[r.phase]||'Brancardage en cours':'Escalier trop étroit · EPA pour brancardage';}

export function tickAerial(engines,calls,minutes,emit){
 for(const p of engines){p.aerialDemand=0;}
 for(const c of calls){const r=c.elevatedRescue;if(r&&!r.announced&&c.reconComplete&&c.status!=='closed'){
  r.announced=true;c.finishBudget+=90;
  emit(c,engines.find(e=>e.call===c.id&&e.status==='scene')?.id||'Centre','Escalier trop étroit pour le brancard. Renfort EPA demandé.',true);
 }}
 for(const e of engines){
  const a=e.aerial;if(!a)continue;a.waiting=null;a.flow=0;e.flow=0;e.workActive=false;
  const c=calls.find(c=>c.id===(e.call??e.lastCall));
  if(!a.mode&&!a.stabilizers&&e.ladderDeployed&&c){const error=requestAerial(e,c,'position',engines);if(error){e.ladderDeployed=false;continue;}}
  if(!a.mode&&!a.stabilizers)continue;
  if(a.phase!=='pack'&&(e.status!=='scene'||!c||c.status==='closed'||a.mode==='attack'&&c.progress>=1))stopAerial(e);
  if(a.phase==='pack'){
   a.connection=clamp(a.connection-minutes/AERIAL.pack);a.extension=clamp(a.extension-minutes/AERIAL.pack);
   if(!a.extension&&!a.connection)a.stabilizers=clamp(a.stabilizers-minutes/4);
   if(!a.stabilizers&&!a.extension&&!a.connection){Object.assign(a,{mode:null,phase:'idle',progress:0,sourceId:null,target:null});}
   continue;
  }
  const source=engines.find(p=>p.id===a.sourceId),r=c?.elevatedRescue;
  if(a.mode==='attack'&&!eligibleSource(e,source||{})){
   a.waiting='Lance coupée · alimentation du fourgon interrompue';
   if(!a.supplyReported){a.supplyReported=true;emit(c,e.id,'Lance sur nacelle coupée. Alimentation du fourgon à rétablir.',true);}continue;
  }
  a.supplyReported=false;
  if(a.phase==='deployed')continue;
  if(a.phase==='attack'){source.aerialDemand+=AERIAL.flow;continue;}
  const duration=AERIAL[a.phase]||1;a.progress=clamp(a.progress+minutes/duration);
  if(a.phase==='stabilize')a.stabilizers=a.progress;
  if(a.phase==='connect')a.connection=a.progress;
  if(a.phase==='raise')a.extension=a.progress;
  if(r&&a.mode==='rescue'){r.phase=a.phase;r.progress=a.progress;}
  if(a.progress<1)continue;
  const next={stabilize:a.mode==='attack'?'connect':'raise',connect:'raise',raise:a.mode==='attack'?'attack':a.mode==='position'?'deployed':'load',load:'lower',lower:'handover',handover:'pack'}[a.phase];
  if(a.phase==='handover'){
   r.done=true;r.handover=a.lower.slice();c.actionPoint=[a.lower[0],a.lower[2]];
   c.patients.filter(p=>p.aerialRescue).forEach(p=>p.trapped=false);
   emit(c,e.id,'Victime au sol, brancardage terminé. Relais VSAV.');e.ladderDeployed=false;
  }
  a.phase=next;a.progress=0;if(r&&a.mode==='rescue')r.phase=next;
  if(next==='attack')emit(c,e.id,'Lance sur nacelle établie. Attaque en cours.');
 }
}
export function transferAerialFlow(engines){for(const e of engines){const a=e.aerial;if(!a||a.mode!=='attack'||a.phase!=='attack'||a.waiting)continue;const p=engines.find(p=>p.id===a.sourceId);a.flow=e.flow=p?.externalFlow||0;e.workActive=e.flow>0;}}
