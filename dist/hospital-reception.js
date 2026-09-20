import * as T from 'three';
import {person,box} from './models.js';
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
 stretcher.rotation.y=p<.55?e.model.rotation.y:Math.atan2(door.x-rear.x,door.z-rear.z);stretcher.visible=p>=.2&&p<.92;
 e.model.userData.rearDoors?.forEach(({pivot,side})=>pivot.rotation.y=-side*1.75*Math.min(clamp(p/.16),clamp((.78-p)/.16)));
 r.stage=p<.2?'approach':p<.42?'unloading':p<.55?'handover':p<.92?'receiving':'complete';
 r.staff.forEach((person,i)=>{person.visible=p<.92;person.position.copy(p<.42?door.clone().lerp(rear,clamp(p/.32)):rear.clone().lerp(door,handover));person.position.z+=i?.85:-.85;person.rotation.set(0,Math.atan2((p<.42?rear:door).x-person.position.x,(p<.42?rear:door).z-person.position.z),0);person.children[1].rotation.x=p<.32||p>.55?Math.sin(minute*6+i)*.3:0;person.children[2].rotation.x=-person.children[1].rotation.x;});
 team.forEach((person,i)=>{person.visible=p<.84;const base=p<.55?stretcher.position:rear.clone().lerp(e.model.position,clamp((p-.55)/.29));person.position.copy(base).add(new T.Vector3(i?1.2:-1.2,0,-.5).applyAxisAngle(up,e.model.rotation.y));person.position.y=0;person.rotation.set(0,e.model.rotation.y,0);});
}
