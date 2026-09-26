import {clearPlacement,clearMove,footprint,overlaps} from './vehicle-spacing.js';
import {roads,projectRoad,block} from './roads.js';
import {smoothRoute} from './route3d.js';
import {junctions} from './automatic-siren.js';
import {BEACH,inLake} from './beach-layout.js';
import {AERIAL,aerialReachable,aerialTarget} from './aerial-operations.js';
const crossings=junctions(roads);
// Penalize a building standing between the engine and the actual incident face.
function facadePenalty(a,b){return block.buildings.some(v=>{let lo=0,hi=1;for(const [start,delta,center,half]of[[a[0],b[0]-a[0],v.x,v.w/2-.2],[a[1],b[1]-a[1],v.z,v.d/2-.2]]){if(Math.abs(delta)<1e-8){if(Math.abs(start-center)>half)return false;}else{const t1=(center-half-start)/delta,t2=(center+half-start)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;}}return hi>0&&lo<1;})?300:0;}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const streetFurniture=roads.filter(r=>!r.trail&&Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])>25).flatMap(r=>{const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],len=Math.hypot(dx,dz),x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2;return [-1,1].map(side=>({position:{x:x+dz/len*6*side,z:z-dx/len*6*side},rotation:{y:0},userData:{staticFootprint:{width:side===1?.9:1.4,length:side===1?.9:1.4}}}));});
export function parkingManeuversClear(model,parking,obstacles){
 const others=[...obstacles,...streetFurniture].filter(o=>o!==model),probe={position:{x:0,z:0},rotation:{y:parking.yaw},scale:model.scale,userData:model.userData};
 for(const path of[smoothRoute([parking.entry,parking.approach,parking.target]),[parking.target,parking.exit]]){
  probe.position.x=path[0][0];probe.position.z=path[0][1];probe.rotation.y=parking.yaw;
  if(!clearPlacement(probe,probe.position.x,probe.position.z,probe.rotation.y,others))return false;
  for(const p of path.slice(1)){
   const yaw=Math.atan2(p[0]-probe.position.x,p[1]-probe.position.z);if(!clearMove(probe,...p,yaw,others))return false;
   probe.position.x=p[0];probe.position.z=p[1];probe.rotation.y=yaw;
  }
  if(!clearMove(probe,probe.position.x,probe.position.z,parking.yaw,others))return false;
 }
 return true;
}
export function reserveParking(engine,incident,engines,obstacles=engines.map(e=>e.model)){
 if(engine.kind==='VPL'&&incident.waterRescue)return{target:[120,-161.1],entry:[128,-157.1],approach:[123,-161.1],exit:[112,-157.1],yaw:-Math.PI/2};
 const reserved=engines.filter(e=>e!==engine&&e.parking),access=incident.accessTarget||incident.target,action=incident.actionPoint||incident.target;
 if(incident.waterRescue||incident.setting==='beach'){
  const slot=BEACH.parking.find(p=>!reserved.some(e=>distance(e.parking.target,p.target)<9));
  if(slot)return Object.fromEntries(Object.entries(slot).map(([k,v])=>[k,Array.isArray(v)?v.slice():v]));
 }
 const supplyPartners=incident.type==='INC'&&engine.kind==='EPA'?reserved.filter(e=>e.call===incident.id&&e.capacity>0):[];
 const candidates=[];
 for(const road of roads){
  if(road.name.includes('(simulation)')||road.trail&&engine.kind!=='CCF')continue;
  const dx=road.b[0]-road.a[0],dz=road.b[1]-road.a[1],len=Math.hypot(dx,dz);if(len<18)continue;
  // Bends are not junctions: a fixed 20 m end margin left short streets
  // with only their lamp-post midpoint. Keep a vehicle-sized end clearance;
  // actual junction and swept-maneuver checks below still protect access.
  const dir=[dx/len,dz/len],laneWidth=road.express?5:road.trail?1.3:2.1,shoulder=laneWidth+4,projection=projectRoad(access,road),base=(projection[0]-road.a[0])*dir[0]+(projection[1]-road.a[1])*dir[1],margin=Math.min(Math.max(6,(engine.model.userData.length||8)/2+2),len/2);
  const positions=new Set([Math.max(margin,Math.min(len-margin,base))]);
  for(let d=margin;d<=len-margin;d+=3)positions.add(d);
  for(const d of positions)for(const side of[-1,1]){
   const center=[road.a[0]+dir[0]*d,road.a[1]+dir[1]*d],target=[center[0]+dir[1]*side*shoulder,center[1]-dir[0]*side*shoulder],heading=[-side*dir[0],-side*dir[1]],yaw=Math.atan2(...heading),body=footprint(engine.model,...target,yaw);
   if(crossings.some(p=>distance(p,target)<14+body.length/2))continue;
   if(incident.narrowAccess&&(engine.model.userData.length||0)>7.5&&distance(target,action)<18)continue;
   if(inLake(target)||block.buildings.some(b=>overlaps(body,{x:b.x,z:b.z,width:b.w+1,length:b.d+1,yaw:0})))continue;
   if(incident.type==='INC'&&distance(target,action)<(['VSAV','POLICE'].includes(engine.kind)?18:9))continue;
   if(reserved.some(e=>distance(e.parking.target,target)<(engine.kind==='EPA'&&incident.site?.kind==='building'?12:20)||overlaps(body,footprint(e.model,...e.parking.target,e.parking.yaw))))continue;
   if(!clearPlacement(engine.model,...target,yaw,[...obstacles,...streetFurniture]))continue;
   const lane=[center[0]+dir[1]*side*laneWidth,center[1]-dir[0]*side*laneWidth];
   const aerial=engine.kind==='EPA'&&incident.site?.kind==='building',reachable=!aerial||aerialReachable({model:{position:{x:target[0],y:.2,z:target[1]},rotation:{y:yaw}}},aerialTarget(incident,incident.elevatedRescue?'rescue':'attack'));
   const oppositeSide=((action[0]-center[0])*dir[1]-(action[1]-center[1])*dir[0])*side<-.5;
   candidates.push({target,entry:[lane[0]-heading[0]*8,lane[1]-heading[1]*8],approach:[target[0]-heading[0]*3,target[1]-heading[1]*3],exit:[lane[0]+heading[0]*8,lane[1]+heading[1]*8],yaw,score:(supplyPartners.length&&!supplyPartners.some(e=>distance(target,e.parking.target)<=AERIAL.supplyDistance)?800:0)+(oppositeSide?125:0)+distance(target,action)+distance(target,access)*.2+facadePenalty(target,action)+(reachable?0:2000)});
  }
 }
 // Rank actual parking spaces, not just roads: a long boulevard must not send
 // the first engine to its far end when the incident is at the opposite end.
 candidates.sort((a,b)=>a.score-b.score);
 if(!candidates.length)throw new Error('Aucun emplacement disponible.');
 const choice=candidates.find(p=>parkingManeuversClear(engine.model,p,obstacles));
 if(!choice)throw new Error('Aucun emplacement accessible.');
 const {score,...parking}=choice;return parking;
}
