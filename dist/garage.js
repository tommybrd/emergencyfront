import * as T from 'three';
import {box,cylinder,sign} from './models.js';
export function createGarage(root){
 const station=new T.Group();station.name='CIS Valmont · cour de départ';root.add(station);const roofs=[];
 // An outdoor court, wide enough to turn before entering an individual bay.
 box(station,58,.2,47,'#929e98',-70,.17,79);
 box(station,28,.055,46,'#687c79',-70,.3,79);
 for(const x of[-83.5,-56.5])box(station,.14,.025,43,'#e3dfc5',x,.34,79);
 for(const side of[-1,1]){
  const medical=side===1,x=medical?-49:-91,front=medical?-56:-84,back=medical?-42:-98;
  const slots=medical?[60,69,78,87,96]:[60,64.5,69,73.5,78,82.5,87,91.5,96];
  const pitch=medical?9:4.5,color=medical?'#367e87':'#ad4235';
  for(const [i,z]of slots.entries()){
   const bay=new T.Group();bay.name=`${medical?'SAP':'Incendie et appui'} · garage ${i+1}`;station.add(bay);
   box(bay,14,.08,pitch-.2,'#798b86',x,.29,z);
   box(bay,.35,5.6,pitch,'#c8d1c5',back,3,z);
   for(const edge of[-1,1]){
    box(bay,14,5.6,.18,'#bcc9bf',x,3,z+edge*pitch/2);
    box(bay,.5,5.6,.35,color,front,3,z+edge*pitch/2);
    box(bay,11,.025,.1,'#e6dec0',x,.35,z+edge*(pitch/2-.45));
   }
   // Raised sectional door: every opening faces the court, without an indoor aisle.
   box(bay,.5,.85,pitch-.5,'#8da09a',front,5.4,z);
   for(let r=0;r<3;r++)box(bay,.53,.045,pitch-.55,'#657d76',front,5.12+r*.22,z);
   box(bay,.55,.45,pitch,color,front,6,z);
   const plaque=sign(bay,`${medical?'SAP':'INC'} ${i+1}`,Math.min(3,pitch-.8),.48,front-side*.3,6,z,color,'#fff2d0');plaque.rotation.y=-side*Math.PI/2;
   const roof=box(bay,14.7,.24,pitch+.05,'#637f76',x,6.4,z);roofs.push(roof);
   box(bay,.1,.09,pitch-.9,new T.MeshStandardMaterial({color:'#eee8d3',emissive:'#fff0d0',emissiveIntensity:.45}),front-side*.35,4.85,z);
   const lamp=cylinder(bay,.09,.09,.12,'#8ac5a1',front-side*.32,4.3,z+pitch/2-.45,8);lamp.rotation.z=Math.PI/2;
  }
  const title=sign(station,medical?'SECOURS À PERSONNE':'INCENDIE & APPUI',12,.65,x,5.9,medical?100.65:98.4, color,'#fff2d0');
 }
 // Clear departure lane and pedestrian crossing along the living building.
 for(let z=68;z<=96;z+=12){box(station,.18,.025,3,'#e5e1c8',-70,.36,z);for(const side of[-1,1]){const arrow=box(station,.14,.025,1.2,'#e5e1c8',-70+side*.4,.36,z+1.05);arrow.rotation.y=side*-.7;}}
 for(let x=-82;x<=-58;x+=2)box(station,1,.025,2.2,'#e6e1c9',x,.36,57);
 const label=sign(station,'COUR DE DÉPART',17,1.3,-70,.36,98,'#687c79','#e8e1c4');label.rotation.x=-Math.PI/2;
 for(const x of[-81,-59])box(station,.55,2,.55,'#9cafa2',x,1,103);
 sign(station,'CIS VALMONT',10,.85,-70,2.7,56.5,'#324f50','#fff0d0');
 return{station,roofs};
}
