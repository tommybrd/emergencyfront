import * as T from 'three';
import {box,cylinder,person} from './models.js';
import {nearestRoad,projectRoad} from './roads.js';
import {streetRoute,smoothRoute} from './route3d.js';
import {clearPlacement,clearMove} from './vehicle-spacing.js';
import {disposeObject} from './dispose.js';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const point=v=>[v.model.position.x,v.model.position.z];
// Municipal depot at the eastern edge of town, away from the CIS and CH.
export const DEPOT={target:[367,122],entry:[362.1,135],exit:[362.1,110],yaw:Math.PI};
export const cleanupActive=c=>!!c.roadCleanup&&!['done'].includes(c.roadCleanup.phase);
export function cleanupPanel(c){const job=c.roadCleanup;if(!job)return '';return `<p class="cleanupStatus" role="status">${job.phase==='done'?'✓ Chaussée dégagée':job.phase==='queued'?'↗ Dépannage demandé':job.phase==='enroute'?'↗ Dépanneuse en route':job.phase==='loading'?'⚒ Dépannage et nettoyage':job.phase==='reopening'?'↗ Repli du balisage':'↗ Épave en cours d’évacuation'}${job.total?` · ${job.removed}/${job.total} véhicule(s)`:''}</p>`;}

export function towTruck(world){
 const g=new T.Group();g.name='Dépanneuse municipale';world.add(g);
 box(g,2.32,.3,8,'#384953',0,.72,0);box(g,2.25,1.6,2.05,'#49778a',0,1.63,2.7);
 box(g,2.28,.6,.05,'#1e353d',0,2.04,3.74);for(const side of[-1,1])box(g,.045,.61,1.24,'#213b43',side*1.14,2.04,2.65);
 box(g,2.5,.25,.25,'#b7c2bf',0,.72,3.94);box(g,1.16,.44,.08,'#29363d',0,1.04,3.8);
 const deck=new T.Group();g.add(deck);deck.position.set(0,1.05,-1.28);box(deck,2.48,.18,5.35,'#8f9a96');for(const side of[-1,1])box(deck,.09,.25,5.35,'#bfc7bd',side*1.23,.16,0);
 const ramp=new T.Group();deck.add(ramp);ramp.position.set(0,0,-2.65);ramp.rotation.x=-.32;for(const side of[-1,1])box(ramp,.7,.07,3,'#7b8786',side*.73,-.01,-1.5);ramp.visible=false;
 const wheels=[];for(const z of[-2.45,2.65])for(const side of[-1,1]){const wheel=new T.Group();g.add(wheel);wheel.position.set(side*1.19,.63,z);const tire=cylinder(wheel,.56,.56,.32,'#273136',0,0,0,12);tire.rotation.z=Math.PI/2;const hub=cylinder(wheel,.3,.3,.34,'#b6c0bf',0,0,0,12);hub.rotation.z=Math.PI/2;wheels.push(wheel);}
 const amber=[];for(const side of[-1,1]){const lamp=box(g,.45,.15,.35,new T.MeshStandardMaterial({color:'#eea947',emissive:'#fa9a1d',emissiveIntensity:.05}),side*.78,2.52,2.6);amber.push(lamp);}
 const headlights=[];for(const side of[-1,1])headlights.push(box(g,.4,.22,.06,new T.MeshStandardMaterial({color:'#fff4d6',emissive:'#ffe4aa',emissiveIntensity:0}),side*.85,1.03,3.81));
 g.userData={kind:'VTU',length:8.1,wheels,headlights,amber,deck,ramp};return g;
}
function municipalWorker(parent,p){const model=person(parent,...p,'#d88836');box(model,.62,.34,.37,'#d8e28d',0,1.12,0);const broom=new T.Group();model.add(broom);const shaft=cylinder(broom,.025,.025,1.2,'#b7a783',.45,.65,.35,6);shaft.rotation.z=-.2;box(broom,.52,.12,.16,'#656855',.57,.1,.35);model.userData.broom=broom;return model;}
function walk(model,target,minutes,clock){const dx=target[0]-model.position.x,dz=target[1]-model.position.z,d=Math.hypot(dx,dz),step=Math.min(d,minutes*3.2);if(d>.01){model.position.x+=dx/d*step;model.position.z+=dz/d*step;model.rotation.y=Math.atan2(dx,dz);}model.children[1].rotation.x=d>.2?Math.sin(clock*6)*.4:0;model.children[2].rotation.x=-model.children[1].rotation.x;return d<=step+.05;}

export function createRoadClearance(world,{engines,vehicles,advance,release=()=>{},emit=()=>{},perimeter=()=>null,maxVehicles=2}){
 const records=new Map(),fleet=[];let serial=0;
 const obstacles=()=>vehicles().map(v=>v.model);
 function request(c,hazard,minute){
  if(c.type!=='AVP'||!hazard||records.has(c.id))return false;
  const wrecks=hazard.children.slice(),group=new T.Group();group.name='Nettoyage chaussée '+c.id;world.add(group);
  const debris=[];for(let i=0;i<8;i++){const d=box(group,.18+(i%3)*.15,.08,.17+(i%2)*.18,'#686d67',hazard.position.x+Math.sin(i*4)*3,.25,hazard.position.z+Math.cos(i*3)*4);debris.push(d);}
  const job={phase:'queued',total:wrecks.length,removed:0,requestedAt:minute};c.roadCleanup=job;
  records.set(c.id,{c,job,hazard,wrecks,group,debris,workers:[],vehicle:null,at:minute,cleaned:0,trip:0});
  emit(c,'Centre','Secours terminés sur place. Dépannage et nettoyage demandés ; balisage maintenu.');return true;
 }
 function parking(r,model){
  const access=r.c.accessTarget||r.c.target,{road}=nearestRoad(access),center=projectRoad(access,road),dx=road.b[0]-road.a[0],dz=road.b[1]-road.a[1],len=Math.hypot(dx,dz),dir=[dx/len,dz/len],lane=road.express?5:2.1;
  const occupied=obstacles();
  // Work upstream of the cordon, without trying to cross the civilian queue.
  for(const sign of[1,-1])for(const shift of[38,32,25,19,14,10,7]){
   const heading=[dir[0]*sign,dir[1]*sign],right=[-heading[1],heading[0]],yaw=Math.atan2(...heading),target=[center[0]-heading[0]*shift+right[0]*lane,center[1]-heading[1]*shift+right[1]*lane];
   if(distance(projectRoad(target,road),target)>lane+.5||distance(target,road.a)<9||distance(target,road.b)<9)continue;
   if(!clearPlacement(model,...target,yaw,occupied))continue;
   return {target,yaw,entry:[target[0]-heading[0]*8,target[1]-heading[1]*8],exit:[target[0]+heading[0]*8,target[1]+heading[1]*8]};
  }return null;
 }
 function depart(r,minute){
  if(fleet.length>=maxVehicles)return;
  // Let the emergency vehicles leave the work area before the recovery crew.
  if(engines.some(e=>e.model.visible!==false&&distance(point(e),r.c.accessTarget||r.c.target)<28))return;
  const model=towTruck(world);model.visible=false;const park=parking(r,model);
  if(!park||!clearPlacement(model,...DEPOT.target,DEPOT.yaw,obstacles())){disposeObject(model);return;}
  model.position.set(DEPOT.target[0],.2,DEPOT.target[1]);model.rotation.y=DEPOT.yaw;model.visible=true;
  const v={id:'Dépanneuse '+(++serial),model,service:true,status:'service',path:null,segment:1,beacons:false,parking:park,call:r.c.id};r.vehicle=v;fleet.push(v);
  v.path=smoothRoute([DEPOT.target,DEPOT.exit,...streetRoute(DEPOT.exit,park.entry,{startYaw:DEPOT.yaw,endYaw:park.yaw}).slice(1),park.target]);
  r.job.phase='enroute';r.job.dispatchedAt??=minute;emit(r.c,v.id,'En route pour dégager la chaussée.');
 }
 function beginReturn(r,minute){
  const v=r.vehicle;release(v);v.status='service';v.segment=1;v.model.userData.ramp.visible=false;
  // Back out through the approach, then turn away from the retained cordon.
  v.path=smoothRoute([point(v),v.parking.entry,...streetRoute(v.parking.entry,DEPOT.entry,{startYaw:v.parking.yaw+Math.PI,endYaw:DEPOT.yaw}).slice(1),DEPOT.target]);
  r.job.phase=r.job.removed>=r.job.total?'reopening':'returning';r.trip++;r.departureAt=minute;
 }
 function update(minute,minutes,dt){
  for(const [id,r]of records){
   const {job}=r;let v=r.vehicle;
   if(job.phase==='queued'){
    if(minute-(r.lastAttempt??-Infinity)>=5){r.lastAttempt=minute;depart(r,minute);}continue;
   }
   if(v){
    const night=minute/60%24>=20||minute/60%24<7;
    v.model.userData.amber.forEach((lamp,i)=>lamp.material.emissiveIntensity=Math.sin(minute*9+i*Math.PI)>0?3:.08);
    v.model.userData.headlights.forEach(lamp=>lamp.material.emissiveIntensity=night?3:0);
   }
   if(v?.path){
    if(!advance(v,dt)){if(job.phase==='reopening'&&!r.released&&distance(point(v),r.c.accessTarget||r.c.target)>40){r.released=true;job.reopenRequested=true;r.debris.forEach(d=>d.visible=false);emit(r.c,'Voirie','Chaussée nettoyée. Retrait du balisage et réouverture.');}continue;}
    v.path=null;release(v);
    if(job.phase==='enroute'){
     v.model.rotation.y=v.parking.yaw;job.phase='loading';r.workAt=minute;r.loaded=false;
     if(!r.workers.length)for(let i=0;i<2;i++){const worker=municipalWorker(r.group,[v.model.position.x+Math.cos(v.model.rotation.y)*(2+i),v.model.position.z-Math.sin(v.model.rotation.y)*(2+i)]);r.workers.push(worker);}
     r.workers.forEach(w=>w.visible=true);v.model.userData.ramp.visible=true;emit(r.c,v.id,'Sur place. Récupération des véhicules et nettoyage en cours.');
     const wreck=r.wrecks.shift();r.cargo=wreck;r.cargoStart=wreck.getWorldPosition(new T.Vector3());world.attach(wreck);r.cargoStart.copy(wreck.position);r.cargoYaw=wreck.rotation.y;
     r.cable??=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#394349'}));r.group.add(r.cable);r.cable.visible=true;
    }else{
     if(r.cargo){disposeObject(r.cargo);r.cargo=null;}disposeObject(v.model);fleet.splice(fleet.indexOf(v),1);r.vehicle=null;v=null;
     if(job.removed<job.total){job.phase='queued';r.lastAttempt=minute-5;}
    }
   }
   if(job.phase==='loading'&&v){
    const age=minute-r.workAt,duration=24,progress=Math.max(0,Math.min(1,(age-7)/(duration-7)));
    if(!r.boarding)for(const [i,worker]of r.workers.entries()){
     const target=i===0?[r.cargoStart.x+2.5,r.cargoStart.z+1.5]:[r.hazard.position.x+Math.sin(Math.floor(age/4)*2)*3,r.hazard.position.z+Math.cos(Math.floor(age/4)*2)*3];
     walk(worker,target,minutes,minute+i);worker.userData.broom.rotation.x=i?Math.sin(minute*4)*.4:0;
    }
    // Winch the original prop onto the flatbed; no duplicate wreck appears.
    if(r.cargo&&!r.loaded){const end=v.model.localToWorld(new T.Vector3(0,1.2,-1.28));r.cargo.position.copy(r.cargoStart).lerp(end,progress);const winch=v.model.localToWorld(new T.Vector3(0,1.45,.8)),attr=r.cable.geometry.attributes.position;attr.setXYZ(0,winch.x,winch.y,winch.z);attr.setXYZ(1,r.cargo.position.x,r.cargo.position.y+.7,r.cargo.position.z);attr.needsUpdate=true;r.cable.geometry.computeBoundingSphere();r.cargo.rotation.set(0,r.cargoYaw+Math.atan2(Math.sin(v.model.rotation.y-r.cargoYaw),Math.cos(v.model.rotation.y-r.cargoYaw))*progress,0);}
    r.cleaned=Math.min(1,r.cleaned+minutes/(job.total*duration));r.debris.forEach((d,i)=>d.visible=r.cleaned<(i+1)/r.debris.length);
    if(age>=duration&&!r.loaded){
     r.loaded=true;r.cable.visible=false;v.model.attach(r.cargo);r.cargo.position.set(0,1.2,-1.28);r.cargo.rotation.set(0,0,0);job.removed++;r.boarding=true;
    }
    if(r.boarding){let aboard=true;const side=[v.model.position.x+Math.cos(v.model.rotation.y)*2,v.model.position.z-Math.sin(v.model.rotation.y)*2];for(const worker of r.workers)aboard=walk(worker,side,minutes,minute)&&aboard;
     if(aboard){r.boarding=false;r.workers.forEach(w=>w.visible=false);beginReturn(r,minute);}
    }
   }
   if(job.phase==='reopening'){
    // A towed vehicle is already clear of the road when it is on the moving bed.
    const area=perimeter(id),truckClear=!v||distance(point(v),r.c.accessTarget||r.c.target)>40;
    if(truckClear&&!r.released){r.released=true;job.reopenRequested=true;r.debris.forEach(d=>d.visible=false);emit(r.c,'Voirie','Chaussée nettoyée. Retrait du balisage et réouverture.');}
    if(!area&&r.released&&!v){job.phase='done';job.completedAt=minute;disposeObject(r.hazard);disposeObject(r.group);records.delete(id);}
   }
  }
 }
 return {records,vehicles:()=>fleet,request,update,owns:hazard=>[...records.values()].some(r=>r.hazard===hazard),clear(){for(const r of records.values()){if(r.vehicle){release(r.vehicle);disposeObject(r.vehicle.model);}disposeObject(r.cargo);disposeObject(r.group);disposeObject(r.hazard);}records.clear();fleet.length=0;}};
}
