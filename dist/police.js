import * as T from 'three';
import {vehicle,person,box,sign} from './models.js';
import {roads,streetRoute} from './roads.js';
import {smoothRoute} from './route3d.js';
import {reserveParking} from './parking.js';
import {clearMove,clearPlacement} from './vehicle-spacing.js';
import {installBlueLedEffects,updateBlueLedEffects} from './rotary-beacons.js';
export function createPolice(world,{advance,actors,release}){
 const patrolRoads=roads.filter(r=>!r.trail&&!r.name.includes('(simulation)')&&Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])>50),units=[];
 for(let i=0;i<2;i++){
  const model=vehicle(world,'VLCG','#aeb8ba',{serviceCar:true});model.userData.kind='POLICE';model.name='Police nationale';
  for(const b of model.userData.beacons)b.visible=false;model.userData.beacons=[];
  box(model,1.42,.055,.24,'#1d2830',0,1.67,0);
  for(const x of[-.57,-.34,-.11,.11,.34,.57])model.userData.beacons.push(box(model,.17,.075,.19,new T.MeshStandardMaterial({color:'#4b79a6',emissive:'#168aff',emissiveIntensity:0}),x,1.735,0));
  box(model,1.48,.11,.27,new T.MeshStandardMaterial({color:'#9ec9df',transparent:true,opacity:.24,depthWrite:false}),0,1.75,0);installBlueLedEffects(model);
  for(const side of[-1,1]){const label=sign(model,'POLICE NATIONALE',2.2,.28,side*.965,1.06,-.3,'#aeb8ba','#173350');label.rotation.y=side*Math.PI/2;box(model,.025,.13,1.18,'#214879',side*.975,.8,-1);box(model,.025,.13,.62,'#bc3036',side*.975,.8,.5);}
  const road=patrolRoads[i*5%patrolRoads.length],dx=road.b[0]-road.a[0],dz=road.b[1]-road.a[1],d=Math.hypot(dx,dz);model.position.set((road.a[0]+road.b[0])/2-dz/d*2.1,.2,(road.a[1]+road.b[1])/2+dx/d*2.1);model.rotation.y=Math.atan2(dx,dz);
  const officers=[person(world,0,0,'#263d54'),person(world,0,0,'#263d54')];officers.forEach(p=>p.visible=false);
  units.push({id:'Police '+(i+1),kind:'POLICE',model,officers,status:'patrol',service:true,segment:1,call:null,path:null,patrolIndex:i*5,stall:0});
 }
 function route(v,target,parking=null){const p=v.model.position;v.parking=parking;v.path=smoothRoute(parking?[...streetRoute([p.x,p.z],parking.entry,{startYaw:v.model.rotation.y,endYaw:parking.yaw}),parking.approach,parking.target]:streetRoute([p.x,p.z],target,{startYaw:v.model.rotation.y}));v.segment=1;}
 function update(s,dt){
  for(const v of units){
   const current=s.calls.find(c=>c.id===v.call);
   if(v.status==='scene'&&v.model.visible!==false){const blocked=actors().some(e=>e!==v&&e.path?.length&&e.model.position.distanceTo(v.model.position)<14&&!clearMove(e.model,e.path[Math.min(e.segment,e.path.length-1)][0],e.path[Math.min(e.segment,e.path.length-1)][1],e.model.rotation.y,[v.model]));v.blockingTime=blocked?(v.blockingTime||0)+dt:0;if(v.blockingTime>3){release(v);v.model.visible=false;v.officers.forEach(p=>p.visible=false);v.path=null;v.respawnAt=s.minute+10;v.blockingTime=0;if(current)current.policeStatus='Repositionnement';}}
   if(v.call&&(!current||current.status==='closed'||current.siteCompletedAt!=null)){release(v);v.call=null;v.parking=null;v.status='patrol';v.path=null;v.officers.forEach(p=>p.visible=false);}
   const c=!v.call&&s.calls.find(c=>c.type==='AVP'&&c.status!=='closed'&&c.siteCompletedAt==null&&!units.some(o=>o.call===c.id));
   if(c){v.call=c.id;v.status='enroute';const parking=reserveParking(v,c,actors());route(v,parking.target,parking);c.policeStatus='En route';}
   if(v.model.visible!==false&&!v.path&&v.status==='patrol'){const r=patrolRoads[(++v.patrolIndex)%patrolRoads.length];route(v,r.b);}
   if(v.model.visible!==false&&v.path){const before=v.model.position.clone();if(advance(v,dt)){release(v);v.path=null;if(v.call){v.status='scene';v.model.rotation.y=v.parking.yaw;const c=s.calls.find(c=>c.id===v.call);if(c)c.policeStatus='Sur place';v.officers.forEach((p,i)=>{p.visible=true;p.position.copy(v.model.position);p.position.x+=Math.cos(v.model.rotation.y)*(2+i);p.position.z-=Math.sin(v.model.rotation.y)*(2+i);p.rotation.y=v.model.rotation.y;});}}v.stall=before.distanceTo(v.model.position)<.01?v.stall+dt:0;
    // A stalled autonomous patrol clears the road and retries from a free patrol point.
    if(v.stall>20){release(v);v.model.visible=false;v.officers.forEach(p=>p.visible=false);v.path=null;v.respawnAt=s.minute+5;v.stall=0;}
   }
   if(v.model.visible===false){if(s.minute<v.respawnAt)continue;const r=patrolRoads[(++v.patrolIndex)%patrolRoads.length],dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],d=Math.hypot(dx,dz),x=(r.a[0]+r.b[0])/2-dz/d*2.1,z=(r.a[1]+r.b[1])/2+dx/d*2.1,yaw=Math.atan2(dx,dz);if(clearPlacement(v.model,x,z,yaw,actors().map(a=>a.model))){v.model.position.set(x,.2,z);v.model.rotation.y=yaw;v.model.visible=true;const c=s.calls.find(c=>c.id===v.call);if(c)c.policeStatus='En route';v.call=null;v.status='patrol';}}
  }
 }
 function lights(t,night){for(const v of units){v.model.userData.headlights.forEach(l=>l.material.emissiveIntensity=night?3:0);updateBlueLedEffects(v.model,!!v.call,t*1000,night);v.model.userData.light.visible=!!v.call;v.model.userData.light.intensity=v.call?(night?3:1):0;}}
 return {units,update,lights};
}
