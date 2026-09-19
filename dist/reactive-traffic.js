import {nearestRoad,block} from './roads.js';
import {smoothRoute} from './route3d.js';
import {clearMove,clearPlacement} from './vehicle-spacing.js';
import {inStation} from './traffic-control.js';

const point=v=>[v.model.position.x,v.model.position.z];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const urgent=e=>e.beacons&&e.path&&['enroute','transport','moving','returning'].includes(e.status);

// A yielding car keeps its original journey. It moves to a free curb, waits for
// the whole convoy and merges back through the same collision checks as traffic.
export function createReactiveTraffic({vehicles,engines,crossings,release,hydrants=[],pedestrians=[],permitted=()=>true}){
 function approaching(v,origin=point(v),yaw=v.model.rotation.y){
  const dir=[Math.sin(yaw),Math.cos(yaw)];
  return engines.filter(e=>{
   if(!urgent(e)||Math.cos(e.model.rotation.y-yaw)<.75)return false;
   const p=point(e),ahead=(origin[0]-p[0])*dir[0]+(origin[1]-p[1])*dir[1];
   const side=Math.abs((origin[0]-p[0])*dir[1]-(origin[1]-p[1])*dir[0]);
   return ahead>-14&&ahead<65&&side<3.1;
  });
 }
 function freeGround(p){
  return permitted(p)&&!block.buildings.some(b=>Math.abs(p[0]-b.x)<b.w/2+2&&Math.abs(p[1]-b.z)<b.d/2+2)
   && !engines.some(e=>e.parking&&distance(p,e.parking.target)<18)
   && !hydrants.some(h=>Math.hypot(p[0]-h.position.x,p[1]-h.position.z)<2.4)
   && !pedestrians.some(v=>v.model.visible!==false&&Math.hypot(p[0]-v.model.position.x,p[1]-v.model.position.z)<2.5);
 }
 function begin(v){
  if(!v.path||v.reversing||v.maneuver||inStation(...point(v),10)||!approaching(v).length)return;
  const start=point(v),yaw=v.model.rotation.y,dir=[Math.sin(yaw),Math.cos(yaw)],right=[-dir[1],dir[0]],nearest=nearestRoad(start),r=nearest.road;
  if(r.trail||r.name.includes('(simulation)')||nearest.distance>6||crossings.some(p=>distance(p,start)<36))return;
  if(Math.min(distance(start,r.a),distance(start,r.b))<26)return;
  const roadYaw=Math.atan2(r.b[0]-r.a[0],r.b[1]-r.a[1]);if(Math.abs(Math.cos(roadYaw-yaw))<.98)return;
  const width=r.express?7.5:5.35,offset=width-nearest.distance;
  if(offset<1.5)return;
  const merge=[start[0]+dir[0]*20,start[1]+dir[1]*20];
  if(crossings.some(p=>distance(p,merge)<28))return;
  const obstacles=vehicles().filter(o=>o!==v).map(o=>o.model);
  let target,pullPath;
  // A shorter manoeuvre leaves a queued car behind the cones and outside
  // the reserved ambulance bay. Validate the complete turn before starting.
  for(const forward of[10,6]){
   const curb=[start[0]+dir[0]*forward*.7+right[0]*offset,start[1]+dir[1]*forward*.7+right[1]*offset];
   const end=[start[0]+dir[0]*forward+right[0]*offset,start[1]+dir[1]*forward+right[1]*offset];
   if(!freeGround(curb)||!freeGround(end))continue;
   const path=smoothRoute([start,curb,end]),probe={position:v.model.position.clone(),rotation:{y:yaw},scale:v.model.scale,userData:v.model.userData};let clear=true;
   for(const p of path.slice(1)){const heading=Math.atan2(p[0]-probe.position.x,p[1]-probe.position.z);if(!clearMove(probe,...p,heading,obstacles)){clear=false;break;}probe.position.x=p[0];probe.position.z=p[1];probe.rotation.y=heading;}
   if(clear&&clearPlacement(probe,...end,yaw,obstacles)){target=end;pullPath=path;break;}
  }
  if(!target)return;
  // Rejoin a point ahead on the saved route, without skipping a turn.
  let segment=v.segment;
  while(segment<v.path.length){const p=v.path[segment];if((p[0]-merge[0])*dir[0]+(p[1]-merge[1])*dir[1]>=0)break;segment++;}
  if(segment>=v.path.length)return;
  const next=v.path[segment];if(Math.abs((next[0]-start[0])*dir[1]-(next[1]-start[1])*dir[0])>1)return;
  v.yielding={phase:'pulling',path:v.path,segment,origin:start,yaw,merge,target,clearFor:0};
  release(v);v.path=pullPath;v.segment=1;v.controlWaiting=null;v.trafficWaiting=false;v.blockedSeconds=0;
 }
 function update(cars,dt){
  for(const v of cars){
   if(!v.yielding){begin(v);continue;}
   const y=v.yielding;
   if(y.phase!=='waiting')continue;
   const traffic=vehicles().filter(o=>o!==v&&o.path);
   const mergingLaneBusy=traffic.some(o=>{const p=point(o),dx=p[0]-y.merge[0],dz=p[1]-y.merge[1];return Math.abs(dx*Math.cos(y.yaw)-dz*Math.sin(y.yaw))<3&&Math.abs(dx*Math.sin(y.yaw)+dz*Math.cos(y.yaw))<18;});
   y.clearFor=approaching(v,y.origin,y.yaw).length||mergingLaneBusy?0:y.clearFor+dt;
   if(y.clearFor<1.2||!permitted(y.merge))continue;
   const obstacles=vehicles().map(o=>o.model);
   if(!clearMove(v.model,...y.merge,y.yaw,obstacles))continue;
   y.phase='merging';v.path=smoothRoute([point(v),[y.merge[0]-Math.sin(y.yaw)*3,y.merge[1]-Math.cos(y.yaw)*3],y.merge]);v.segment=1;v.controlWaiting=null;
  }
 }
 function advance(v,dt,move){
  const y=v.yielding;if(!y)return move(v,dt);
  if(y.phase==='waiting'){v.controlWaiting='Laisse passer les secours';return false;}
  if(!move(v,dt))return false;
  if(!clearPlacement(v.model,...point(v),y.yaw,vehicles().map(o=>o.model)))return false;
  v.model.rotation.y=y.yaw;release(v);v.controlWaiting=null;v.trafficWaiting=false;v.blockedSeconds=0;
  if(y.phase==='pulling'){y.phase='waiting';v.path=null;v.controlWaiting='Laisse passer les secours';}
  else{v.path=y.path;v.segment=y.segment;v.yielding=null;}
  return false;
 }
 return {update,advance};
}
