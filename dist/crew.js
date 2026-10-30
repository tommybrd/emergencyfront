import {STAFF_LOCKER,stationWalkRoute,stationBoardingRoute,boardingAccess,stationWalkStart,walkDistance} from './station-access.js';
import {exercisePose,footballPosition} from './station-exercises.js';
import {centerRoute} from './roads.js';
import {configureCrew,loadGuardSize} from './crew-config.js';
export function initCrew(s){configureCrew(s,loadGuardSize());}
export function duty(minute){const h=minute/60%24;return h<6||h>=22?'dormitory':h<8?'breakfast':h<8.5?'relief':h<8.75?'briefing':h<10?'equipment':h<12?'sport':h<14?'meal':h<18?'training':h<19?'sport':h<21?'meal':'rest';}
export const dutyLabels={relief:'Relève et consignes',briefing:'Rassemblement de 8 h 30',dormitory:'Repos au dortoir',breakfast:'Petit-déjeuner',equipment:'Vérification et rangement',sport:'Sport',meal:'Repas',training:'Manœuvre et entretien',rest:'Temps calme'};
export function crewPosition(p,minute,engines=[]){const check=inspectionPosition(p,minute,engines);if(check)return check.point;const outing=sportPosition(p,minute);if(outing)return outing;const i=p.slot??((p.id-1)%48),task=duty(minute);if(task==='briefing')return p.role==='captain'?[-73,82]:[-80+(i%6)*2.4,86+Math.floor(i/6)*2];if(task==='dormitory'||task==='rest'){const bed=i%24;return[-87+(bed%6)*6,18+Math.floor(bed/6)*6];}if(i>=19){const n=i-19;if(task==='meal'||task==='breakfast')return[-75+(n%8)*2,33+Math.floor(n/8)*2];return[-90+(n%12)*3.4,36+Math.floor(n/12)*4];}if(task==='meal'||task==='breakfast')return[-73+(i%6)*1.4,40+Math.floor(i/6)*3];if(task==='sport')return exercisePose(i,minute,true).point;if(task==='training')return exercisePose(i,minute).point;return[-57+(i%4)*2,38+Math.floor(i/4)*2];}
export function syncCrew(s){s.freeStaff=s.roster.filter(p=>p.present&&!p.engine&&!['captain','nurse'].includes(p.role)).length;s.spv=s.roster.some(p=>p.present&&p.kind==='SPV');}
export function assignCrew(s,e){const candidates=s.roster.filter(p=>p.present&&!p.engine&&!p.releaseOnReturn&&(e.kind==='VLCG'?p.role==='captain':e.kind==='VLI'?p.role==='nurse':!['captain','nurse'].includes(p.role)));if(candidates.length<e.size)return false;e.crewIds=candidates.slice(0,e.size).map(p=>{p.engine=e.id;return p.id;});e.crew=e.crewIds.length;syncCrew(s);return true;}
export function releaseCrew(s,e){
 if(e.localVolunteer&&e.localCrew?.length){e.localReturning=true;e.localReleaseAt=s.minute;}
 for(const p of s.roster.filter(p=>p.engine===e.id)){
  p.engine=null;
  if(!e.external&&e.model&&p.present){const b=e.boarding?.find(b=>b.id===p.id),walking=b&&s.minute<e.departAt,from=walking?boardingPosition(b,Math.max(0,(s.minute-e.alertAt-b.delay)/(b.duration-b.delay||1))).point:boardingAccess(e);p.stationEntry={point:stationWalkStart(from)};}
  if(p.releaseOnReturn)p.present=false;
 }
 e.crewIds=[];e.crew=0;syncCrew(s);
}
export function recallCrew(s,count){let next=Math.max(0,...s.roster.map(p=>p.id))+1;for(let i=0;i<count;i++){const slot=Array.from({length:18},(_,n)=>n).find(n=>!s.roster.some(p=>p.present&&p.slot===n));if(slot===undefined)break;s.roster.push({id:next++,slot,kind:'SPV',present:true,engine:null});}syncCrew(s);}
export function dismissCrew(s){let n=0;for(const p of s.roster)if(p.present&&p.kind==='SPV'&&!p.engine){p.present=false;n++;}syncCrew(s);return n;}
export function currentCrewPosition(p,minute,engines=[]){return p.stationPoint&&Math.abs(minute-p.stationPoint.at)<.05?p.stationPoint.point.slice():crewPosition(p,minute,engines);}
export function prepareCrew(s,e,rnd=Math.random,engines=[]){e.boarding=(e.crewIds||[]).map(id=>{
 const p=s.roster.find(p=>p.id===id),from=currentCrewPosition(p,s.minute,engines),locker=STAFF_LOCKER.slice(),outside=sportPosition(p,s.minute)&&!(from[0]>-111&&from[0]<-29&&from[1]<103),returning=outside?sportReturnPath(from):[],entry=returning.length?returning.at(-1):from;
 const path=[from,...returning,...stationWalkRoute(entry,locker).slice(1),...stationBoardingRoute(locker,e).slice(1)];
 const wake=duty(s.minute)==='dormitory'?1+rnd()*2:0,equip=1.2+rnd()*1.4,walk=path.slice(1).reduce((sum,q,i)=>sum+Math.hypot(q[0]-path[i][0],q[1]-path[i][1]),0)/(outside?65:14);
 return{id,from,locker,path,delay:wake+equip,duration:wake+equip+walk,accessVersion:151};});return Math.max(0,...e.boarding.map(p=>p.duration));}
export function upgradeStationBoarding(s,e){
 if(e.external||!e.wasAtStation||e.status!=='departing'||!e.boarding?.some(b=>b.accessVersion!==151))return false;
 const elapsed=s.minute-e.alertAt;
 e.boarding=e.boarding.map(b=>{if(elapsed>=b.duration)return{...b,path:[boardingAccess(e),boardingAccess(e)],delay:0,duration:0,accessVersion:151};
  const from=stationWalkStart(boardingPosition(b,Math.max(0,(elapsed-b.delay)/(b.duration-b.delay||1))).point),outside=from[0]>-29||from[0]<-111||from[1]>112,returning=outside?sportReturnPath(from):[],entry=returning.at(-1)||from,path=[from,...returning,...stationWalkRoute(entry,STAFF_LOCKER).slice(1),...stationBoardingRoute(STAFF_LOCKER,e).slice(1)],delay=Math.max(0,b.delay-elapsed);
  return{...b,from,locker:STAFF_LOCKER.slice(),path,delay,duration:delay+walkDistance(path)/(outside?65:14),accessVersion:151};
 });e.alertAt=s.minute;e.departAt=s.minute+Math.max(0,...e.boarding.map(b=>b.duration));return true;
}
export function boardingPosition(b,fraction){const path=b.path,lengths=path.slice(1).map((q,i)=>Math.hypot(q[0]-path[i][0],q[1]-path[i][1]));let distance=lengths.reduce((a,b)=>a+b,0)*fraction;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=path[i],z=path[i+1],k=lengths[i]?distance/lengths[i]:1;return{point:[a[0]+(z[0]-a[0])*k,a[1]+(z[1]-a[1])*k],yaw:Math.atan2(z[0]-a[0],z[1]-a[1])};}distance-=lengths[i];}return{point:path[0],yaw:0};}

// Morning outing follows the road network, on the pavement, then a match at the stadium.
const sportsRoute=centerRoute([-39,112],[290,96]).map((p,i,a)=>{const q=a[Math.min(i+1,a.length-1)],r=a[Math.max(0,i-1)],dx=q[0]-r[0],dz=q[1]-r[1],d=Math.hypot(dx,dz)||1;return[p[0]+dz/d*6,p[1]-dx/d*6];});
sportsRoute.unshift(...stationWalkRoute(STAFF_LOCKER,[-39,112]));sportsRoute.push([300,96],[310,96]);
export function sportPosition(p,minute){
 const clock=minute%1440;if(clock<600||clock>=720||p.role==='captain'||p.role==='nurse')return null;
 const phase=clock-600,slot=p.slot??p.id,offset=(slot%4)*.8;
 if(phase>=40&&phase<80)return footballPosition(slot,clock);
 const fraction=phase<40?phase/40:(120-phase)/40,at=boardingPosition({path:sportsRoute},Math.max(0,Math.min(1,fraction)));
 const outdoors=at.point[0]>-29||at.point[1]>112||at.point[0]<-111?offset:0;return [at.point[0]+outdoors,at.point[1]+outdoors];
}

export function inspectionPosition(p,minute,engines){
 if(duty(minute)!=='equipment'||p.role==='captain'||p.role==='nurse')return null;
 const available=engines.filter(e=>e.status==='ready'&&!e.external&&!e.dedicated),e=available[(p.slot??p.id)%available.length];if(!e)return null;
 const phase=(minute-525+(p.slot??p.id)*3)%15/15,points=[[-1.95,5.6],[-1.95,-7.9],[1.95,-7.9],[1.95,5.6],[-1.95,5.6]],at=boardingPosition({path:points},phase),yaw=e.model.rotation.y;
 return {engine:e,phase,point:[e.model.position.x+at.point[0]*Math.cos(yaw)+at.point[1]*Math.sin(yaw),e.model.position.z-at.point[0]*Math.sin(yaw)+at.point[1]*Math.cos(yaw)]};
}

function sportReturnPath(from){let best=0,distance=Infinity;for(let i=0;i<sportsRoute.length;i++){const d=Math.hypot(from[0]-sportsRoute[i][0],from[1]-sportsRoute[i][1]);if(d<distance){best=i;distance=d;}}return sportsRoute.slice(0,best+1).reverse();}
