import * as T from 'three';
const up=new T.Vector3(0,1,0);
export const STRETCHER_END=1.45;
export function stretcherEnd(stretcher,index){
 return new T.Vector3(0,0,index===0?STRETCHER_END:-STRETCHER_END).applyAxisAngle(up,stretcher.rotation.y).add(stretcher.position).setY(0);
}
export function stretcherGrip(person,carrying){
 person.children[3].rotation.x=person.children[4].rotation.x=carrying?-1.05:0;
}
export function placeStretcherBearer(person,stretcher,index,moving=false,phase=0){
 person.position.copy(stretcherEnd(stretcher,index));
 person.rotation.set(0,stretcher.rotation.y+(index===0?Math.PI:0),0);
 stretcherGrip(person,true);
 person.children[1].rotation.x=moving?Math.sin(phase+index*Math.PI)*.25:0;
 person.children[2].rotation.x=-person.children[1].rotation.x;
}
export function turnToward(from,to,fraction){return from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*fraction;}
// Contourner la carrosserie avant de rejoindre les rails arrière.
export function stretcherApproach(model,origin,fraction){
 const back=-model.userData.length/2,yaw=model.rotation.y,start=origin.clone().sub(model.position).applyAxisAngle(up,-yaw).setY(0),rear=new T.Vector3(0,0,back-2),side=start.x<0?-1:1;
 const local=start.z<=back-2?[start,rear]:[start,new T.Vector3(side*3.4,0,start.z),new T.Vector3(side*3.4,0,back-2.6),rear];
 const points=local.filter((p,i)=>i===0||p.distanceTo(local[i-1])>.01).map(p=>p.clone().applyAxisAngle(up,yaw).add(model.position));
 const lengths=points.slice(1).map((p,i)=>p.distanceTo(points[i])),length=lengths.reduce((a,b)=>a+b,0),distance=length*fraction;
 const at=distance=>{for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1)return points[i].clone().lerp(points[i+1],lengths[i]?Math.max(0,Math.min(1,distance/lengths[i])):1);distance-=lengths[i];}return points.at(-1).clone();};
 const a=at(Math.max(0,distance-.45)),b=at(Math.min(length,distance+.45));
 return {position:at(distance),yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
