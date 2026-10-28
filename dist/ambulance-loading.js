import * as T from 'three';
import {updateReception} from './hospital-reception.js';
import {placeStretcherBearer,stretcherGrip,stretcherEnd,turnToward,stretcherApproach} from './stretcher-crew.js';
const clamp=x=>Math.max(0,Math.min(1,x)),up=new T.Vector3(0,1,0);
export function updateLoading(e,stretcher,team,origin,minute=0){
 if(e.kind!=='VSAV'&&!e.medicalTransport)return;
 updateReception(e,stretcher,team,minute);if(e.status==='hospital')return;
 const loading=e.status==='scene'&&e.patientAssigned&&e.patientTransportRequired!==false;
 const p=e.patientProgress||0;
 const opening=loading?Math.min(clamp((p-.64)/.1),clamp((1-p)/.06)):0;
 e.model.userData.rearDoors?.forEach(({pivot,side})=>pivot.rotation.y=-side*1.75*opening);
 if(!loading||p<=.5){team.forEach(person=>stretcherGrip(person,false));return;}
 const back=-e.model.userData.length/2,point=z=>new T.Vector3(0,0,z).applyAxisAngle(up,e.model.rotation.y).add(e.model.position),rear=point(back-2),inside=point(back+1);
 const boarding=clamp((p-.82)/.12),walk=stretcherApproach(e.model,origin,clamp((p-.5)/.28));stretcher.position.copy(p<.82?walk.position:rear.clone().lerp(inside,boarding));stretcher.position.y=.1+boarding*.24;
 stretcher.rotation.y=turnToward(walk.yaw,e.model.rotation.y,clamp((p-.78)/.04));stretcher.visible=p<.94;
 team.forEach((person,i)=>{
  person.visible=stretcher.visible;if(!person.visible)return;
  if(i<2)placeStretcherBearer(person,stretcher,i,p<.78||p>.82,minute*6);
  else{person.position.copy(stretcher.position).add(new T.Vector3(.8,0,-2.8).applyAxisAngle(up,stretcher.rotation.y));person.position.y=0;person.rotation.set(0,stretcher.rotation.y,0);stretcherGrip(person,false);}
  // Le porteur de tête libère les rails avant l'entrée du brancard dans la cellule.
  if(i===0&&p>.78){const guide=new T.Vector3(1.65,0,back-1.5).applyAxisAngle(up,e.model.rotation.y).add(e.model.position);guide.y=0;person.position.copy(stretcherEnd(stretcher,0)).lerp(guide,clamp((p-.78)/.04));person.rotation.set(0,e.model.rotation.y-Math.PI/2,0);stretcherGrip(person,false);}
 });
 if(e.patientWalking)team.forEach(person=>stretcherGrip(person,false));
}
