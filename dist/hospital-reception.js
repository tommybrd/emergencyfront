import * as T from 'three';
import {person,box} from './models.js';
import {placeStretcherBearer,stretcherGrip,stretcherEnd,turnToward} from './stretcher-crew.js';
export const HOSPITAL_DOORS=[-135,-131,-121,-111];
const clamp=x=>Math.max(0,Math.min(1,x)),up=new T.Vector3(0,1,0);
export function updateReception(e,stretcher,team,minute){
 let r=e.hospitalReception;
 if(e.status!=='hospital'){if(r)r.group.visible=false;return;}
 if(!r){const group=new T.Group();(stretcher.parent||e.model.parent).add(group);group.name='Équipe des urgences';const staff=[0,1].map(()=>{const p=person(group,0,0,'#dbe9e4');p.name='Soignant des urgences';box(p,.16,.1,.025,'#4f9699',-.14,1.25,.17);return p;});r=e.hospitalReception={group,staff};}
 r.group.visible=true;
 const arrived=e.hospitalArrivedAt??e.transportAt-15,duration=Math.max(1,(e.transportAt??arrived+15)-arrived),p=clamp((minute-arrived)/duration);
 const rear=e.model.localToWorld(new T.Vector3(0,0,-e.model.userData.length/2-2));rear.y=0;
 const inside=e.model.localToWorld(new T.Vector3(0,0,-e.model.userData.length/2+1));inside.y=0;
 const door=new T.Vector3(379.25,0,HOSPITAL_DOORS.reduce((a,b)=>Math.abs(b-e.model.position.z)<Math.abs(a-e.model.position.z)?b:a));
 const unloading=clamp((p-.2)/.22),handover=clamp((p-.55)/.35);
 stretcher.position.copy(p<.42?inside.clone().lerp(rear,unloading):rear.clone().lerp(door,handover));stretcher.position.y=.1;
 stretcher.rotation.y=turnToward(e.model.rotation.y,Math.atan2(door.x-rear.x,door.z-rear.z),clamp((p-.42)/.13));stretcher.visible=p>=.2&&p<.92;
 e.model.userData.rearDoors?.forEach(({pivot,side})=>pivot.rotation.y=-side*1.75*Math.min(clamp(p/.16),clamp((.78-p)/.16)));
 r.stage=p<.2?'approach':p<.42?'unloading':p<.55?'handover':p<.92?'receiving':'complete';
 const toward=door.clone().sub(rear).setY(0).normalize(),side=new T.Vector3(toward.z,0,-toward.x);
 const standby=(i,extra=0)=>rear.clone().addScaledVector(toward,-2.4-extra).addScaledVector(side,i===0?-1.85:1.85).setY(0);
 const guide=new T.Vector3(1.65,0,-e.model.userData.length/2-1.5).applyAxisAngle(up,e.model.rotation.y).add(e.model.position).setY(0);
 r.staff.forEach((person,i)=>{
  person.visible=p<.92;if(!person.visible)return;
  if(p>=.55){placeStretcherBearer(person,stretcher,i,true,minute*6);return;}
  const waiting=standby(i,2),at=door.clone().lerp(waiting,clamp(p/.32));
  // L'équipe du véhicule a lâché les poignées avant la relève des urgences.
  at.lerp(stretcherEnd(stretcher,i),clamp((p-.53)/.02));person.position.copy(at).setY(0);
  person.rotation.set(0,Math.atan2(stretcher.position.x-at.x,stretcher.position.z-at.z),0);stretcherGrip(person,false);
  person.children[1].rotation.x=p<.32||p>.53?Math.sin(minute*6+i)*.25:0;person.children[2].rotation.x=-person.children[1].rotation.x;
 });
 team.forEach((person,i)=>{
  person.visible=p<.84;if(!person.visible)return;
  if(i<2){
   placeStretcherBearer(person,stretcher,i,p<.42,minute*6);
   if(i===0&&p<.42){person.position.copy(guide).lerp(stretcherEnd(stretcher,0),clamp((p-.38)/.04));stretcherGrip(person,false);}
   if(p>=.5){person.position.copy(stretcherEnd(stretcher,i)).lerp(standby(i,1),clamp((p-.5)/.03));person.rotation.set(0,e.model.rotation.y,0);stretcherGrip(person,false);}
  }else{person.position.copy(standby(1,4));person.rotation.set(0,e.model.rotation.y,0);stretcherGrip(person,false);}
 });
}
