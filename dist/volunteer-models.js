import * as T from 'three';
import {box,cylinder,sign,person} from './models.js';

export const STAFF_PARKING_ENTRY=[-22,105];
export const staffBay=id=>({point:[-95+Math.floor((id-14)/2)*3.4,(id-14)%2?146:124],yaw:(id-14)%2?0:Math.PI});
export function createStaffParking(world){
 const group=new T.Group();world.add(group);
 box(group,70,.16,39,'#67726e',-65,.12,135);
 box(group,9,.13,31,'#67726e',-22,.13,120);
 box(group,3,.12,77,'#c6c6b1',-39,.2,78);
 for(let id=14;id<=50;id++){
  const {point:[x,z]}=staffBay(id);
  for(const side of[-1,1])box(group,.09,.025,6,'#d6ddc7',x+side*1.58,.23,z);
  box(group,3.2,.025,.09,'#d6ddc7',x,.23,z+(z<135?-3:3));
 }
 for(let x=-95;x<-28;x+=7)box(group,3,.025,.1,'#d6ddc7',x,.23,135);
 const label=sign(group,'P · PERSONNEL',18,1.6,-62,.25,153,'#67726e','#edf2dc');label.rotation.x=-Math.PI/2;
 sign(group,'ACCÈS PERSONNEL',10,1,-33,2.5,115,'#386674','#edf2dc');
 return group;
}

// Deliberately light geometry: no emergency equipment or textures per personal car.
export function personalCar(world,id){
 const g=new T.Group();world.add(g);const color=['#bfc5c1','#456879','#96584a','#7b8272','#d0bd9d','#50565c'][id%6],rubber='#263033',glass='#314b55';
 box(g,1.86,.52,4.3,color,0,.8,0);box(g,1.68,.59,2.24,glass,0,1.29,-.18);
 box(g,1.77,.1,2.12,color,0,1.64,-.2);box(g,1.88,.17,1,color,0,1.01,1.57);
 for(const side of[-1,1]){box(g,.05,.61,.1,color,side*.86,1.32,-.3);box(g,.14,.14,.26,rubber,side*.99,1.22,.92);box(g,.035,.38,2.3,color,side*.96,.92,-.15);}
 const wheels=[],headlights=[],rearLights=[];
 for(const side of[-1,1])for(const z of[-1.32,1.33]){
  const wheel=cylinder(g,.36,.36,.2,rubber,side*.91,.43,z,12);wheel.rotation.z=Math.PI/2;wheels.push(wheel);
  const hub=cylinder(g,.2,.2,.21,'#b6bdba',side*.92,.43,z,8);hub.rotation.z=Math.PI/2;
 }
 box(g,1.85,.2,.12,rubber,0,.58,2.15);box(g,1.85,.2,.12,rubber,0,.58,-2.15);
 for(const side of[-1,1]){
  headlights.push(box(g,.45,.16,.03,new T.MeshStandardMaterial({color:'#e9ead7',emissive:'#fff0b4',emissiveIntensity:0}),side*.61,.95,2.17));
  rearLights.push(box(g,.31,.17,.03,new T.MeshStandardMaterial({color:'#bb443d',emissive:'#f4472e',emissiveIntensity:0}),side*.69,.94,-2.17));
 }
 g.userData={kind:'VLCG',length:4.3,wheels,headlights,rearLights,personalCar:true,personId:id};
 return g;
}
export function volunteerPerson(world,id){return person(world,0,0,['#67849b','#ae8065','#61745e','#85748b'][id%4]);}
