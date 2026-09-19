import * as T from 'three';
const clamp=x=>Math.max(0,Math.min(1,x)),up=new T.Vector3(0,1,0);
export function updateLoading(e,stretcher,team,origin,minute=0){
 if(e.kind!=='VSAV')return;
 const loading=e.status==='scene'&&e.patientAssigned&&e.patientTransportRequired!==false,unloading=e.status==='hospital';
 const p=unloading?clamp((minute-(e.hospitalArrivedAt??e.transportAt-15))/5):e.patientProgress||0;
 const opening=unloading?Math.min(clamp(p/.12),clamp((1-p)/.12)):loading?Math.min(clamp((p-.64)/.1),clamp((1-p)/.06)):0;
 e.model.userData.rearDoors?.forEach(({pivot,side})=>pivot.rotation.y=-side*1.75*opening);
 if(!unloading&&(!loading||p<=.5))return;
 const back=-e.model.userData.length/2,point=z=>new T.Vector3(0,0,z).applyAxisAngle(up,e.model.rotation.y).add(e.model.position),rear=point(back-2),inside=point(back+1);
 if(unloading){
  const outside=rear.clone();outside.x=379;outside.z=-120;
  stretcher.position.copy(p<.45?inside.clone().lerp(rear,clamp((p-.12)/.33)):rear.clone().lerp(outside,clamp((p-.45)/.4)));stretcher.position.y=.1;
  stretcher.rotation.y=p<.45?e.model.rotation.y:Math.atan2(outside.x-rear.x,outside.z-rear.z);stretcher.visible=p>=.12&&p<.9;
 }else{
  const boarding=clamp((p-.82)/.12);stretcher.position.copy(p<.82?origin.clone().lerp(rear,clamp((p-.5)/.28)):rear.clone().lerp(inside,boarding));stretcher.position.y=.1+boarding*.24;stretcher.rotation.y=e.model.rotation.y;stretcher.visible=p<.94;
 }
 team.forEach((person,i)=>{person.visible=stretcher.visible;person.position.copy(stretcher.position).add(new T.Vector3(i?1:-1,0,-.5).applyAxisAngle(up,stretcher.rotation.y));person.position.y=0;person.rotation.y=stretcher.rotation.y;});
}
