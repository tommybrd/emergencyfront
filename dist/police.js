import {setHighVisibility} from './crew-insignia.js';
import {applyServiceSignals} from './service-signals.js';
import * as T from 'three';
import {vehicle,person,box,sign} from './models.js';
import {roads,streetRoute} from './roads.js';
import {smoothRoute} from './route3d.js';
import {reserveParking} from './parking.js';
import {clearMove,clearPlacement} from './vehicle-spacing.js';
import {installBlueLedEffects,updateBlueLedEffects,updateRotaryBeacons,updateAmberEffects} from './rotary-beacons.js';
// Trois forces : rôles et délais de concours relèvent de l'équilibrage de jeu.
export const FORCES={
 PM:{label:'Police municipale',role:'Circulation, stationnement, périmètre simple',color:'#eef0ec',ink:'#1f3f7a',text:'POLICE MUNICIPALE',band:'#1f4f9c',stripe:'#d8b62a',uniform:'#1f3a66'},
 PN:{label:'Police nationale',role:'Sécurisation, réquisitions, constatations',color:'#aeb8ba',ink:'#173350',text:'POLICE NATIONALE',band:'#214879',stripe:'#bc3036',uniform:'#263d54'},
 BAC:{label:'Brigade anti-criminalité',role:'Violences urbaines, protection des secours',color:'#30353a',unmarked:true,uniform:'#2b2f33'}
};
// Police municipale en journée seulement ; la BAC tourne surtout la nuit ; chaque unité déjà engagée allonge le délai.
export function concoursDelay(force,minute,busy=0){
 const h=((minute/60)%24+24)%24,night=h<7||h>=21;
 if(force==='PM'&&night)return null;
 return (force==='PM'?4:force==='BAC'?(night?5:9):6)+busy*3;
}
export function createPolice(world,{advance,actors,release}){
 const patrolRoads=roads.filter(r=>!r.trail&&!r.name.includes('(simulation)')&&Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])>50),units=[];
 function addPatrol(force='PN'){
  const i=units.length,info=FORCES[force];
  const model=vehicle(world,'VLCG',info.color,{serviceCar:true});model.userData.kind='POLICE';model.userData.force=force;model.name=info.label;
  for(const b of model.userData.blueParts||model.userData.beacons)model.remove(b);model.userData.beacons=[];const blueStart=model.children.length;
  if(info.unmarked){
   // BAC : véhicule banalisé, gyrophare magnétique posé côté conducteur et feux bleus de calandre.
   model.userData.beacons.push(box(model,.2,.15,.2,new T.MeshStandardMaterial({color:'#3f6f9c',emissive:'#168aff',emissiveIntensity:0}),-.36,1.74,.25));
   box(model,.22,.03,.22,'#14181b',-.36,1.665,.25);
  }else{
   box(model,1.42,.055,.24,'#1d2830',0,1.67,0);
   for(const x of[-.57,-.34,-.11,.11,.34,.57])model.userData.beacons.push(box(model,.17,.075,.19,new T.MeshStandardMaterial({color:'#4b79a6',emissive:'#168aff',emissiveIntensity:0}),x,1.735,0));
   box(model,1.48,.11,.27,new T.MeshStandardMaterial({color:'#9ec9df',transparent:true,opacity:.24,depthWrite:false}),0,1.75,0);
  }
  model.userData.blueParts=model.children.slice(blueStart);applyServiceSignals(model,'police');installBlueLedEffects(model);
  if(!info.unmarked)for(const side of[-1,1]){const label=sign(model,info.text,2.2,.28,side*.965,1.06,-.3,info.color,info.ink);label.rotation.y=side*Math.PI/2;box(model,.025,.13,1.18,info.band,side*.975,.8,-1);box(model,.025,.13,.62,info.stripe,side*.975,.8,.5);if(force==='PM')box(model,.026,.05,2.2,info.stripe,side*.976,.69,-.4);}
  const road=patrolRoads[i*5%patrolRoads.length],dx=road.b[0]-road.a[0],dz=road.b[1]-road.a[1],d=Math.hypot(dx,dz);model.position.set((road.a[0]+road.b[0])/2-dz/d*2.1,.2,(road.a[1]+road.b[1])/2+dx/d*2.1);model.rotation.y=Math.atan2(dx,dz);
  const officers=[person(world,0,0,info.uniform),person(world,0,0,info.uniform)];officers.forEach(p=>p.visible=false);
  const n=units.filter(v=>v.force===force).length+1;
  units.push({id:force==='PN'?'Police '+n:force+' '+n,force,kind:'POLICE',model,officers,status:'patrol',service:true,segment:1,call:null,path:null,patrolIndex:i*5,stall:0});
 }
 for(let i=0;i<2;i++)addPatrol();
 function route(v,target,parking=null){const p=v.model.position;v.parking=parking;v.path=smoothRoute(parking?[...streetRoute([p.x,p.z],parking.entry,{startYaw:v.model.rotation.y,endYaw:parking.yaw}),parking.approach,parking.target]:streetRoute([p.x,p.z],target,{startYaw:v.model.rotation.y}));v.segment=1;}
 function update(s,dt){
  // Pas de patrouille sur les feux de forêt : la piste unique doit rester libre pour les CCF (noria, relève).
   const needsPolice=c=>['AVP','INC'].includes(c.type)&&c.status!=='closed'&&c.siteCompletedAt==null&&c.scene!=='forest'&&!c.forestFire;
  // Reinforcements cover simultaneous incidents; reuse the pool on later calls.
  const uncovered=s.calls.filter(c=>needsPolice(c)&&!units.some(v=>v.call===c.id));
  const available=units.filter(v=>v.force==='PN'&&!v.retired).filter(v=>!v.call||!s.calls.some(c=>c.id===v.call&&needsPolice(c))).length;
  for(let i=available;i<uncovered.length;i++){addPatrol();const v=units.at(-1);v.model.visible=false;v.respawnAt=s.minute;}

  for(const v of units){
   if(v.retired)continue;
   const current=s.calls.find(c=>c.id===v.call);
   for(const p of v.officers)setHighVisibility(p,current?.type==='AVP'&&v.status==='scene');if(v.status==='scene'&&v.model.visible!==false){const blocked=actors().some(e=>e!==v&&e.path?.length&&e.model.position.distanceTo(v.model.position)<14&&!clearMove(e.model,e.path[Math.min(e.segment,e.path.length-1)][0],e.path[Math.min(e.segment,e.path.length-1)][1],e.model.rotation.y,[v.model]));v.blockingTime=blocked?(v.blockingTime||0)+dt:0;if(v.blockingTime>3){release(v);v.model.visible=false;v.officers.forEach(p=>p.visible=false);v.path=null;v.respawnAt=s.minute+10;v.blockingTime=0;if(current)current.policeStatus='Repositionnement';}}
   if(v.call&&(!current||current.status==='closed'||current.siteCompletedAt!=null)){release(v);if(v.requested){v.retired=true;v.call=null;v.path=null;v.model.visible=false;v.officers.forEach(p=>p.visible=false);continue;}v.call=null;v.parking=null;v.status='patrol';v.path=null;v.officers.forEach(p=>p.visible=false);}
   const c=v.force==='PN'&&!v.call&&s.calls.find(c=>['AVP','INC'].includes(c.type)&&c.status!=='closed'&&c.siteCompletedAt==null&&!units.some(o=>o.call===c.id));
   if(c){v.call=c.id;v.status='enroute';v.stall=0;const parking=reserveParking(v,c,actors());route(v,parking.target,parking);c.policeStatus='En route';}
   if(v.model.visible!==false&&!v.path&&v.status==='patrol'){const r=patrolRoads[(++v.patrolIndex)%patrolRoads.length];route(v,r.b);}
   if(v.model.visible!==false&&v.path){const before=v.model.position.clone();if(advance(v,dt)){release(v);v.path=null;if(v.call){v.status='scene';v.model.rotation.y=v.parking.yaw;const c=s.calls.find(c=>c.id===v.call);if(c)if(v.requested)setForceStatus(c,v,'Sur place');else c.policeStatus='Sur place';v.officers.forEach((p,i)=>{p.visible=true;p.position.copy(v.model.position);p.position.x+=Math.cos(v.model.rotation.y)*(2+i);p.position.z-=Math.sin(v.model.rotation.y)*(2+i);p.rotation.y=v.model.rotation.y;});}}v.stall=before.distanceTo(v.model.position)<.01?v.stall+dt:0;
    // A stalled autonomous patrol clears the road and retries from a free patrol point.
    if(v.stall>20){release(v);v.model.visible=false;v.officers.forEach(p=>p.visible=false);v.path=null;v.respawnAt=s.minute+5;v.stall=0;const c=s.calls.find(c=>c.id===v.call);if(c)c.policeStatus='Repositionnement';}
   }
   if(v.model.visible===false){if(s.minute<v.respawnAt)continue;const r=patrolRoads[(++v.patrolIndex)%patrolRoads.length],dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],d=Math.hypot(dx,dz),x=(r.a[0]+r.b[0])/2-dz/d*2.1,z=(r.a[1]+r.b[1])/2+dx/d*2.1,yaw=Math.atan2(dx,dz);if(clearPlacement(v.model,x,z,yaw,actors().map(a=>a.model))){v.model.position.set(x,.2,z);v.model.rotation.y=yaw;v.model.visible=true;const c=s.calls.find(c=>c.id===v.call);v.stall=0;if(c&&(needsPolice(c)||v.requested)){v.status='enroute';const parking=reserveParking(v,c,actors());route(v,parking.target,parking);if(v.requested)setForceStatus(c,v,'En route');else c.policeStatus='En route';}else{v.call=null;v.status='patrol';v.path=null;}}}
  }
 }
 function setForceStatus(c,v,status){c.policeForces={...(c.policeForces||{}),[v.force]:status};}
 // Demande de concours depuis la fiche : une unité dédiée part d'un point de patrouille après le délai annoncé.
 function request(s,c,force){
  const info=FORCES[force];if(!info||!c||c.status==='closed'||c.siteCompletedAt!=null)return {error:'Intervention terminée.'};
  if(units.some(v=>!v.retired&&v.call===c.id&&v.force===force))return {error:`${info.label} déjà engagée sur l’intervention n°${c.id}.`};
  const delay=concoursDelay(force,s.minute,units.filter(v=>!v.retired&&v.force===force&&v.call).length);
  if(delay==null)return {error:'Police municipale indisponible la nuit · demandez la Police nationale.'};
  addPatrol(force);const v=units.at(-1);v.model.visible=false;v.respawnAt=s.minute+delay;v.call=c.id;v.requested=true;v.status='called';setForceStatus(c,v,`Demandée · ~${delay} min`);
  return {message:`Concours ${info.label} demandé pour l’intervention n°${c.id} · arrivée estimée dans ${delay} min.`};
 }
 function lights(t,night){for(const v of units){v.model.userData.headlights.forEach(l=>l.material.emissiveIntensity=night||v.call!=null||v.status!=='ready'?3:0);updateBlueLedEffects(v.model,!!v.call,t*1000,night);updateRotaryBeacons(v.model,!!v.call,t,v.model.position);updateAmberEffects(v.model,v.status==='scene','alternate',t*1000,night);v.model.userData.light.visible=!!v.call&&v.model.userData.beacons.length>0;v.model.userData.light.intensity=v.call?(night?3:1):0;}}
 return {units,update,lights,request};
}
