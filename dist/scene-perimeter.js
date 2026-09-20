import * as T from 'three';
import {forestResponder,person,medicalResponder,box,cylinder} from './models.js';
import {nearestRoad,roads,block} from './roads.js';
import {planCivilian} from './civilian-routing.js';
import {disposeObject} from './dispose.js';
import {footprint,overlaps} from './vehicle-spacing.js';

export const roadKey=r=>[r.a.join(','),r.b.join(',')].sort().join('/');
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function local(zone,p){const dx=p[0]-zone.center[0],dz=p[1]-zone.center[1];return [dx*zone.dir[0]+dz*zone.dir[1],-dx*zone.dir[1]+dz*zone.dir[0]];}
function global(zone,x,z){return [zone.center[0]+zone.dir[0]*x-zone.dir[1]*z,zone.center[1]+zone.dir[1]*x+zone.dir[0]*z];}
export function insidePerimeter(zone,p,pad=0){const [x,z]=local(zone,p);return Math.abs(x)<zone.length+pad&&Math.abs(z)<zone.width+pad;}
export function perimeterLayout(c){
 let p=c.actionPoint||c.target;const road=nearestRoad(c.accessTarget||p).road,len=distance(road.a,road.b);let dir=[(road.b[0]-road.a[0])/len,(road.b[1]-road.a[1])/len];
 if(c.site?.kind==='building'&&c.site.position){const dx=p[0]-c.site.position[0],dz=p[1]-c.site.position[1],normal=Math.abs(dx)/c.site.width>Math.abs(dz)/c.site.depth?[Math.sign(dx),0]:[0,Math.sign(dz)];p=[p[0]+normal[0]*3.2,p[1]+normal[1]*3.2];dir=[normal[1],-normal[0]];}
 const traffic=c.type==='AVP'||['road','express'].includes(c.setting)||c.site?.kind==='road';
 const zone={center:p.slice(),dir,road,length:traffic?(c.scene==='pileup'?16:11):5,width:traffic?(road.express?8:5):3,traffic};
 const points=traffic?[[-zone.length,-zone.width],[-zone.length,zone.width],[0,zone.width],[zone.length,zone.width],[zone.length,-zone.width],[0,-zone.width]]:[[-5,-3],[-5,3],[5,3],[5,-3]];
 return {...zone,points:points.map(([x,z])=>global(zone,x,z))};
}

export function createScenePerimeters(world,{engines,vehicles,release=()=>{}}){
 const records=new Map();let revision=0;
 function make(c,owner,minute){
  const zone=perimeterLayout(c),group=new T.Group();world.add(group);
  const cones=zone.points.map(p=>{const cone=new T.Group();group.add(cone);cone.position.set(p[0],.25,p[1]);box(cone,.68,.08,.68,'#303b3c',0,0,0);cylinder(cone,.07,.28,.68,'#ef8439',0,.39,0,8);cylinder(cone,.16,.21,.12,'#fff5d7',0,.32,0,8);cone.visible=false;return cone;});
  const worker=owner.kind==='CCF'?forestResponder(group,owner.model.position.x,owner.model.position.z):['VSAV','VTU'].includes(owner.kind)?medicalResponder(group,owner.model.position.x,owner.model.position.z):person(group,owner.model.position.x,owner.model.position.z,'',true),base=[owner.model.position.x,owner.model.position.z];
  const record={id:c.id,zone,group,cones,worker,base,owner,phase:'laying',index:0,at:minute,clearing:new Set(),active:false};
  records.set(c.id,record);c.perimeter='Pose du balisage';return record;
 }
 function walk(r,target,minutes){const p=r.worker.position,dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,minutes*5);if(d>.01){p.x+=dx/d*step;p.z+=dz/d*step;r.worker.rotation.y=Math.atan2(dx,dz);}r.worker.children[1].rotation.x=d>.2?Math.sin(r.at*6)*.4:0;r.worker.children[2].rotation.x=-r.worker.children[1].rotation.x;return d<=step+.05;}
 function update(calls,minute){
  for(const e of engines)e.perimeterCrew=0;
  for(const c of calls){
   let r=records.get(c.id);const owner=engines.find(e=>e.call===c.id&&e.status==='scene'&&e.kind!=='VLCG');
   const hazardous=c.type==='AVP'||c.type==='INC'&&c.fireConfirmed!==false||c.type==='OD';
   const cleanup=c.roadCleanup&&c.roadCleanup.phase!=='done',holdCleanup=cleanup&&!c.roadCleanup.reopenRequested;
   const needed=holdCleanup||hazardous&&c.status!=='closed'&&c.siteCompletedAt==null&&!!owner;
   if(!r){if(needed&&owner){make(c,owner,minute);owner.perimeterCrew=1;}continue;}
   if(cleanup&&c.roadCleanup.reopenRequested&&!r.municipal){r.municipal=true;const position=r.worker.position.clone(),yaw=r.worker.rotation.y;disposeObject(r.worker);r.worker=person(r.group,position.x,position.z,'#db913d');r.worker.rotation.y=yaw;box(r.worker,.62,.28,.37,'#d9e58b',0,1.1,0);r.base=r.zone.points[0].slice();}
   const dt=Math.max(0,Math.min(1,minute-r.at));r.at=minute;
   if(needed&&['packing','leaving'].includes(r.phase)){r.phase='laying';r.index=r.cones.findIndex(cone=>!cone.visible);if(r.index<0)r.phase='active';}
   if(!needed&&!['packing','leaving'].includes(r.phase)){r.phase='packing';r.index=r.cones.length-1;r.worker.visible=true;c.perimeter='Repli du balisage';}
   if(r.phase==='laying'){
    r.worker.visible=true;while(r.index<r.cones.length&&r.cones[r.index].visible)r.index++;
    if(r.index>=r.cones.length){r.phase='active';c.perimeter='Zone balisée';continue;}
    if(walk(r,r.zone.points[r.index],dt)){
     r.cones[r.index++].visible=true;
     if(!r.active){r.active=true;revision++;for(const v of vehicles())if(insidePerimeter(r.zone,[v.model.position.x,v.model.position.z],16))r.clearing.add(v);}
    }
   }else if(r.phase==='active'){r.worker.visible=!walk(r,r.base,dt);}
   else if(r.phase==='packing'){
    while(r.index>=0&&!r.cones[r.index].visible)r.index--;
    if(r.index<0){r.active=false;revision++;r.phase='leaving';c.perimeter=null;continue;}
    if(walk(r,r.zone.points[r.index],dt))r.cones[r.index--].visible=false;
   }else if(r.phase==='leaving'&&walk(r,r.base,dt)){disposeObject(r.group);records.delete(c.id);}
   if(r.worker.visible&&!r.municipal&&r.owner.status==='scene')r.owner.perimeterCrew=1;
  }
 }
 function blockedRoads(){return new Set([...records.values()].filter(r=>r.active&&r.zone.traffic).map(r=>roadKey(r.zone.road)));}
 function reason(v,x,z,yaw=v.model.rotation.y){
  if(v.status!=='traffic'&&!v.personal)return null;
  for(const r of records.values()){
   if(!r.active||!r.zone.traffic)continue;
   // Stop early enough to leave room for a civilian to pull over for an
   // approaching ambulance; a queue right against the cones would trap it.
   const zoneYaw=Math.atan2(...r.zone.dir),buffer=!v.yielding&&Math.abs(Math.cos(yaw-zoneYaw))>.8?12:0;
   const zf={x:r.zone.center[0],z:r.zone.center[1],yaw:zoneYaw,length:(r.zone.length+buffer)*2+.8,width:r.zone.width*2+.8};
   if(r.clearing.has(v)){if(!overlaps(zf,footprint(v.model)))r.clearing.delete(v);else continue;}
   if(overlaps(zf,footprint(v.model,x,z,yaw)))return 'Balisage · passage protégé';
  }return null;
 }
 function reroute(cars){const blocked=blockedRoads();for(const v of cars){
  if(v.yielding||!v.path||!v.nextRoad||v.perimeterRevision===revision)continue;v.perimeterRevision=revision;
  if(blocked.has(roadKey(v.nextRoad))&&distance([v.model.position.x,v.model.position.z],v.road.b)>28){release(v);planCivilian(v,roads,Math.random,blocked);}
 }}
 function blockedPoint(p,pad=0){return [...records.values()].some(r=>r.active&&insidePerimeter(r.zone,p,pad));}
 function pedestrianTarget(v,desired){
  const r=v.road,len=distance(r.a,r.b),dir=[(r.b[0]-r.a[0])/len,(r.b[1]-r.a[1])/len],normal=[dir[1],-dir[0]];
  let result=desired.slice();
  for(const area of records.values()){
   if(!area.active||roadKey(r)!==roadKey(area.zone.road))continue;
   const along=(result[0]-area.zone.center[0])*dir[0]+(result[1]-area.zone.center[1])*dir[1],reach=area.zone.length+10;
   if(Math.abs(along)>=reach)continue;
   for(const offset of[3,5,7]){
    const amount=offset*Math.min(1,(reach-Math.abs(along))/7),p=[desired[0]+normal[0]*amount,desired[1]+normal[1]*amount];
    if(!blockedPoint(p,.6)&&!block.buildings.some(b=>Math.abs(p[0]-b.x)<b.w/2+.6&&Math.abs(p[1]-b.z)<b.d/2+.6)){result=p;break;}
   }
  }return result;
 }
 function movePedestrian(v,desired,seconds){
  if(!v.walkInitialized){v.model.position.set(desired[0],0,desired[1]);v.walkInitialized=true;return;}
  const p=v.model.position,target=pedestrianTarget(v,desired),dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,seconds*4.5);
  if(!step)return;
  const next=[p.x+dx/d*step,p.z+dz/d*step];
  const alreadyInside=blockedPoint([p.x,p.z],.6);
  if(blockedPoint(next,.6)&&!alreadyInside){v.waitingForPerimeter=true;return;}
  v.waitingForPerimeter=false;p.set(next[0],0,next[1]);v.model.rotation.y=Math.atan2(dx,dz);
 }
 return {records,update,blockedRoads,reason,reroute,blockedPoint,movePedestrian};
}
