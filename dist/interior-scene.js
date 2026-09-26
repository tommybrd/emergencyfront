import * as T from 'three';
import {box,person,medicalResponder} from './models.js';
// One furnished apartment at human scale, inside the building footprint.
export function createInterior(parent,c){
 const root=new T.Group();root.name='Appartement en coupe';parent.add(root);
 root.position.set(c.target[0],.22,c.target[1]);root.rotation.y=c.site.yaw||0;
 const w=Math.min(12,c.site.width*.78),d=Math.min(10,c.site.depth*.78);
 box(root,w,.12,d,'#b69d7e',0,0,0);
 box(root,w,2.5,.12,'#d6cebb',0,1.3,-d/2);
 box(root,.12,2.5,d,'#d6cebb',-w/2,1.3,0);
 // Door opening between bedroom and living area.
 for(const z of[-d*.32,d*.32])box(root,.1,2.3,d*.25,'#c7bcaa',0,1.2,z);
 const bedX=-w*.25,bedZ=-d*.18;
 box(root,1.15,.34,2.05,'#745f4c',bedX,.27,bedZ);
 box(root,1.1,.16,1.98,'#ece8da',bedX,.52,bedZ);
 box(root,1.08,.07,1.4,'#687f91',bedX,.64,bedZ+.27);
 box(root,.82,.12,.4,'#f4eddf',bedX,.65,bedZ-.68);
 box(root,1.2,.8,.12,'#745f4c',bedX,.54,bedZ-1.03);
 box(root,2,.48,.8,'#7b8771',w*.25,.4,-d*.27);
 box(root,2,.72,.18,'#7b8771',w*.25,.64,-d*.27-.4);
 box(root,1.3,.12,.7,'#90775a',w*.25,.55,0);
 for(const x of[-.5,.5])for(const z of[-.25,.25])box(root,.07,.48,.07,'#655b4b',w*.25+x,.25,z);
 box(root,2,.85,.55,'#ddd6c5',-w*.26,.48,d*.32);
 box(root,2.06,.09,.6,'#646b6a',-w*.26,.95,d*.32);
 box(root,.5,.03,.35,'#adb9b9',-w*.26,.999,d*.32);
 const responders=[0,1].map(i=>c.type==='INC'?person(root,w*.18+i,d*.16,'#374b60',true):medicalResponder(root,w*.18+i,d*.16));
 responders.forEach(p=>p.visible=false);
 return {root,responders};
}
export function updateInterior(interior,c,units){
 interior.root.visible=!!c.cutaway&&c.status!=='closed';
 const workers=units.filter(e=>e.crew>0&&e.kind!=='PC'&&e.kind!=='VLCG');
 interior.responders.forEach((p,i)=>{p.visible=interior.root.visible&&c.reconComplete&&workers.some(e=>e.buildingCrew>i||e.workActive&&e.crew>i);});
}
