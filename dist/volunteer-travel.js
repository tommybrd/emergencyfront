import {block,roads,projectRoad,streetRoute,nearestRoad} from './roads.js';
import {smoothRoute} from './route3d.js';
import {clearPlacement} from './vehicle-spacing.js';
import {crewPosition} from './crew.js';
import {alongHomeWalk} from './player-home.js';
import {volunteerPool} from './reinforcements.js';
import {disposeObject} from './dispose.js';
import {createStaffParking,personalCar,volunteerPerson,staffBay,STAFF_PARKING_ENTRY} from './volunteer-models.js';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
const position=v=>[v.model.position.x,v.model.position.z];
const homes=block.buildings.filter(b=>['house','town'].includes(b.style)).sort((a,b)=>distance([a.x,a.z],[-70,80])-distance([b.x,b.z],[-70,80]));
const jobs=block.buildings.filter(b=>b.style==='mall'||b.style==='civic'||b.style==='tower'||b.style==='town'&&b.z===12);

export function volunteerOrigin(personId,activity,reserved=[]){
 const index=personId-14,choices=activity==='work'?jobs:activity==='city'?homes.filter(b=>b.style==='town'):homes,b=choices[index%choices.length];
 const candidates=roads.filter(r=>!r.trail&&!r.express&&!r.name.includes('(simulation)')).map(r=>({road:r,point:projectRoad([b.x,b.z],r)})).sort((a,c)=>distance([b.x,b.z],a.point)-distance([b.x,b.z],c.point));
 let road,n,parking;
 // Keep a manoeuvring space at the curb, also while the owner's car is away.
 // A full/short street falls back to the next street near the same building.
 for(const candidateRoad of candidates){
  const r=candidateRoad.road,roadLength=distance(r.a,r.b);if(roadLength<28)continue;
  const along=[(r.b[0]-r.a[0])/roadLength,(r.b[1]-r.a[1])/roadLength],normal=[-along[1],along[0]],side=(b.x-candidateRoad.point[0])*normal[0]+(b.z-candidateRoad.point[1])*normal[1]>=0?1:-1;
  const outward=normal.map(x=>x*side),base=Math.max(14,Math.min(roadLength-14,(candidateRoad.point[0]-r.a[0])*along[0]+(candidateRoad.point[1]-r.a[1])*along[1]));
  for(const offset of [0,...Array.from({length:40},(_,i)=>[12*(i+1),-12*(i+1)]).flat()]){
   const at=base+offset;if(at<14||at>roadLength-14)continue;
   const p=[r.a[0]+along[0]*at+outward[0]*8,r.a[1]+along[1]*at+outward[1]*8];
   if(reserved.some(other=>distance(p,other)<11.8))continue;
   road=r;n=outward;parking=p;break;
  }
  if(parking)break;
 }
 if(!parking)throw new Error('Aucune place de stationnement SPV disponible');
 const edge=Math.min(Math.abs(n[0])>.001?b.w/2/Math.abs(n[0]):Infinity,Math.abs(n[1])>.001?b.d/2/Math.abs(n[1]):Infinity);
 const door=[b.x-n[0]*(edge+.5),b.z-n[1]*(edge+.5)];
 // Park facing traffic on this side of the road, even when the journey
 // needs a longer route around the block to reach the CIS.
 const dir=[n[1],-n[0]];
 const curb=projectRoad(parking,road),merge=[curb[0]-dir[1]*2.1+dir[0]*10,curb[1]+dir[0]*2.1+dir[1]*10];
 return{parking,door,merge,dir,yaw:Math.atan2(...dir),label:(activity==='work'?'Travail':activity==='city'?'En ville':'Domicile')+' · '+road.name};
}

const stationWalk=bay=>[[bay[0]+1.4,bay[1]],[bay[0]+1.4,bay[1]<135?118:153],[-29,bay[1]<135?118:153],[-29,114],[-39,114],[-39,43],[-53,43]];
function toStation(v){
 const o=v.origin,prefix=smoothRoute([o.parking,[o.parking[0]+o.dir[0]*3,o.parking[1]+o.dir[1]*3],o.merge]);
 const road=smoothRoute(streetRoute(o.merge,STAFF_PARKING_ENTRY,{startYaw:o.yaw}));
 return [...prefix,...road.slice(1),...smoothRoute([STAFF_PARKING_ENTRY,[-22,115],[-22,133],[v.bay[0],133],v.bay]).slice(1)];
}
function toOrigin(v,parked){
 const start=position(v),o=v.origin,entry=[-19,105];let prefix=[];
 if(parked){const reverse=[start,[v.bay[0],137]];reverse.forEach(p=>p.gear=-1);prefix=[...reverse,...smoothRoute([[v.bay[0],137],[-19,137],[-19,115],entry]).slice(1)];}
 const road=smoothRoute(streetRoute(parked?entry:start,o.merge,{startYaw:parked?0:v.model.rotation.y,endYaw:o.yaw}));
 const park=smoothRoute([o.merge,[o.parking[0]+o.dir[0]*3,o.parking[1]+o.dir[1]*3],o.parking]);park.forEach(p=>p.gear=-1);
 return [...prefix,...road.slice(prefix.length?1:0),...park.slice(1)];
}

export function staffExitConflict(v,actors){
 const p=v.model.position;if(v.phase!=='homebound'||p.x<-27||p.x>-12||p.z<109||p.z>123)return false;
 return actors.some(e=>!e.personal&&!e.service&&e.status!=='traffic'&&e.path&&Math.abs(e.model.position.z-105)<8&&Math.abs(e.model.position.x+19)<45);
}
export function createVolunteerTravel(world,state,{vehicles,advance,release}){
 const parking=createStaffParking(world),records=new Map();let departureOwner=null;
 function path(v,points,phase){release(v);v.path=points;v.segment=1;v.phase=phase;v.status='volunteer';v.controlWaiting=null;v.blockedSeconds=0;}
 function walk(v,points,phase){v.walk={points,at:state.minute,duration:Math.max(.5,length(points)/14)};v.phase=phase;v.driver.visible=true;}
 function dispose(v){release(v);disposeObject(v.model);disposeObject(v.driver);records.delete(v.personId);}
 function create(request){
  const old=records.get(request.personId);if(old)dispose(old);
  const origin=volunteerOrigin(request.personId,request.activity||'home',[...records.values()].map(v=>v.origin.parking)),bay=staffBay(request.personId),model=personalCar(world,request.personId),driver=volunteerPerson(world,request.personId);
  model.position.set(...[origin.parking[0],.15,origin.parking[1]]);model.rotation.y=origin.yaw;model.visible=false;driver.visible=false;
  const v={personId:request.personId,request,origin,model,driver,bay:bay.point,bayYaw:bay.yaw,phase:'preparing',personal:true,status:'volunteer',path:null,segment:1,beacons:false};
  request.originLabel=origin.label;records.set(v.personId,v);return v;
 }
 function goHome(v){v.driver.visible=false;if(v.recoveredWithoutCar){v.phase='away';v.path=null;return;}v.parkingExitPending=distance(position(v),v.bay)<1;path(v,toOrigin(v,v.parkingExitPending),'homebound');}
 function finishWalk(v){
  v.driver.visible=false;
  if(v.phase==='walking'){v.phase='changing';v.readyAt=state.minute+1.5;}
  else if(v.phase==='walkingBack')goHome(v);
  else if(v.phase==='homeWalk'){v.phase='away';v.request.physicalReady=false;}
 }
 function updateWalk(v){
  const f=(state.minute-v.walk.at)/v.walk.duration,p=alongHomeWalk(v.walk.points,f);
  v.driver.position.set(p.point[0],.25,p.point[1]);v.driver.rotation.set(0,p.yaw,0);
  v.driver.children[1].rotation.x=Math.sin(state.minute*5+v.personId)*.35;v.driver.children[2].rotation.x=-v.driver.children[1].rotation.x;
  if(f>=1)finishWalk(v);
 }
 function updateEta(v){
  const r=v.request;if(r.status!=='enroute')return;
  r.phase=v.phase;r.originLabel=v.origin.label;
  if(v.phase==='preparing')r.at=(v.departAt||state.minute+r.preparation)+length(v.trip||toStation(v))/5+length(stationWalk(v.bay))/14+1.5;
  else if(v.path)r.at=state.minute+length([position(v),...v.path.slice(v.segment)])/5+length(stationWalk(v.bay))/14+1.5;
  else if(v.phase==='walking')r.at=v.walk.at+v.walk.duration+1.5;
  else if(v.phase==='changing')r.at=v.readyAt;
 }
 function sync(){
  volunteerPool(state);
  for(const r of state.recallRequests){if(r.status!=='enroute')continue;const v=records.get(r.personId);if(!v||v.request!==r)create(r);}
  for(const v of records.values()){
   const r=v.request,roster=state.roster.find(p=>p.id===v.personId);
   if(r.status==='cancelled'&&!['homebound','homeWalk','away','walkingBack'].includes(v.phase)){
    if(!v.model.visible){dispose(v);continue;}
    if(v.phase==='preparing'){walk(v,[[v.driver.position.x,v.driver.position.z],v.origin.door],'homeWalk');}
    else if(['walking','changing'].includes(v.phase)){walk(v,[[v.driver.position.x,v.driver.position.z],...stationWalk(v.bay).slice().reverse()],'walkingBack');}
    else goHome(v);
   }
   if(v.phase==='available'&&roster&&!roster.present)walk(v,[crewPosition(roster,state.minute),...stationWalk(v.bay).slice().reverse()],'walkingBack');
   if(v.phase==='preparing'&&!v.model.visible&&clearPlacement(v.model,...v.origin.parking,v.origin.yaw,vehicles().map(o=>o.model))){
    v.model.visible=true;v.driver.visible=true;v.preparedAt=state.minute;v.departAt=state.minute+r.preparation;v.trip=toStation(v);
    v.driver.position.set(v.origin.door[0],.25,v.origin.door[1]);
   }
   if(v.phase==='preparing'&&v.model.visible){
    const p=alongHomeWalk([v.origin.door,v.origin.parking],(state.minute-v.preparedAt)/Math.max(1,r.preparation));
    v.driver.position.set(p.point[0],.25,p.point[1]);v.driver.rotation.y=p.yaw;
    if(state.minute>=v.departAt){v.driver.visible=false;path(v,v.trip,'driving');}
   }
   if(v.phase==='recovering'&&state.minute>=v.recoverAt){walk(v,stationWalk(v.bay),'walking');}
   if(v.phase==='changing'&&state.minute>=v.readyAt){v.phase='available';r.physicalReady=true;}
   if(v.walk&&['walking','walkingBack','homeWalk'].includes(v.phase))updateWalk(v);
   if(state.minute-(v.etaAt||-Infinity)>=1){updateEta(v);v.etaAt=state.minute;}
  }
  state.volunteerReturning=[...records.values()].filter(v=>['walkingBack','homebound','homeWalk'].includes(v.phase)).map(v=>v.personId);
 }
 function move(dt){
  // Finish one reverse-and-turn before the next driver leaves their bay.
  // Release once aligned in the aisle, not after the whole journey home.
  if(departureOwner&&(!departureOwner.path||departureOwner.model.position.x>departureOwner.bay[0]+8||departureOwner.model.position.z<115)){departureOwner.parkingExitPending=false;departureOwner=null;}
  departureOwner??=[...records.values()].filter(v=>v.path&&v.parkingExitPending).sort((a,b)=>b.bay[0]-a.bay[0]||a.personId-b.personId)[0]||null;
  for(const v of records.values()){
  v.parkingExitGranted=departureOwner===v;
  if(!v.path)continue;
  if(v.parkingExitPending&&departureOwner!==v){v.controlWaiting='Sortie parking SPV';continue;}
  if(staffExitConflict(v,vehicles())){
   if(v.model.position.z>=116){v.controlWaiting='Priorité aux secours · sortie parking';continue;}
   if(!v.mergeRetreat&&v.model.position.z>109&&(v.controlWaiting||v.trafficWaiting)){
    const back=[v.model.position.x,118];back.gear=-1;
    if(clearPlacement(v.model,...back,Math.PI,vehicles().filter(o=>o!==v).map(o=>o.model))){v.path=[position(v),back,...v.path.slice(v.segment)];v.segment=1;v.mergeRetreat=true;release(v);}
   }
  }else v.mergeRetreat=false;
  v.travelSpeed=position(v)[1]>118&&position(v)[0]<-12?3.5:nearestRoad(position(v)).road.express?16:5;
  if(v.phase==='driving'&&v.model.position.z>118&&v.model.position.x<-24)v.phase='parking';
  if(!advance(v,dt))continue;
  release(v);v.path=null;v.controlWaiting=null;v.reversing=false;
  if(v.phase==='homebound')walk(v,[v.origin.parking,v.origin.door],'homeWalk');
  else{v.model.rotation.y=v.bayYaw;walk(v,stationWalk(v.bay),'walking');}
 }}
 function lights(night){for(const v of records.values()){
  const moving=!!v.path;
  v.model.userData.headlights.forEach(l=>l.material.emissiveIntensity=night&&moving?3:0);
  v.model.userData.rearLights.forEach(l=>l.material.emissiveIntensity=moving&&(v.trafficWaiting||v.controlWaiting)?2:night&&moving?.7:0);
 }}
 function recover(v){release(v);if(departureOwner===v)departureOwner=null;v.model.visible=false;v.driver.visible=false;v.recoveredWithoutCar=true;v.parkingExitPending=false;v.controlWaiting=null;v.stallWatch=null;const remaining=length([position(v),...(v.path||[]).slice(v.segment||1)])/5;v.path=null;if(v.phase==='homebound'||v.request.status==='cancelled'){v.phase='away';return;}v.phase='recovering';v.recoverAt=state.minute+Math.max(5,remaining);v.request.at=v.recoverAt+length(stationWalk(v.bay))/14+1.5;}
 return{parking,records,sync,move,lights,recover,vehicles:()=>[...records.values()],ready:r=>!!r.physicalReady};
}
