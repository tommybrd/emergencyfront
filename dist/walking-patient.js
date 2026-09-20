import * as T from 'three';
import {person} from './models.js';
import {walkRoute} from './building-actions.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// A conservative gameplay choice made after the assessment, never at dispatch.
export function canWalkPatient(c,p){return !!p&&!p.severe&&!p.trapped&&!p.fromComplication&&!c.extrication&&!c.elevatedRescue&&!c.waterRescue&&!c.nautical&&p.transportRequired!==false&&['sap-blesse-commerce','sap-brulure','sap-malaise-travail','sap-blessure-plage'].includes(c.catalogId);}
export function updateWalkingPatient(e,group,team,origin,c,t){
 e.walkingPatientModel??=person(group,0,0,'#b58569');const model=e.walkingPatientModel;model.visible=false;
 if(e.status!=='scene'||!e.patientAssigned||!e.patientWalking)return false;
 const p=e.patientProgress||0;if(p<=.5)return false;
 const back=new T.Vector3(0,0,-e.model.userData.length/2-1.6).applyAxisAngle(new T.Vector3(0,1,0),e.model.rotation.y).add(e.model.position);
 const key=[origin.x,origin.z,back.x,back.z].join(':');
 if(e.walkingRouteKey!==key){e.walkingRouteKey=key;e.walkingRoute=walkRoute([origin.x,origin.z],[back.x,back.z]);}
 const route=e.walkingRoute;if(!route){e.patientWalking=false;return false;}
 let rest=clamp((p-.5)/.32)*route.slice(1).reduce((sum,q,i)=>sum+Math.hypot(q[0]-route[i][0],q[1]-route[i][1]),0),yaw=e.model.rotation.y;
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(rest<=d||i===route.length-1){const k=d?Math.min(1,rest/d):1;model.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k);yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);break;}rest-=d;}
 if(p>.82){const k=clamp((p-.82)/.12);model.position.copy(back).lerp(e.model.position,k*.45);model.position.y=k*.25;yaw=e.model.rotation.y;}
 model.visible=p<.94;model.rotation.set(0,yaw,0);model.children[1].rotation.x=Math.sin(t*5)*.25;model.children[2].rotation.x=-model.children[1].rotation.x;
 team.forEach((member,i)=>{member.visible=model.visible&&i===0;if(!member.visible)return;member.position.copy(model.position);member.position.x+=Math.cos(yaw)*.85;member.position.z-=Math.sin(yaw)*.85;member.position.y=0;member.rotation.set(0,yaw,0);member.children[1].rotation.x=Math.sin(t*5)*.3;member.children[2].rotation.x=-member.children[1].rotation.x;});return true;
}
