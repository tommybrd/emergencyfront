import * as T from 'three';
import {box,sign} from './models.js';
import {MAIN_BAYS} from './station-layout.js';
export function createGarage(root){
 const station=new T.Group();station.name='CIS Centre · cour de départ';root.add(station);const roofs=[];
 box(station,79,.2,44,'#929e98',-70,.17,81);
 box(station,77,.05,27,'#687c79',-70,.3,89);
 for(const bay of MAIN_BAYS){
  const {x,index,group}=bay,medical=group==='medical',color=medical?'#367e87':'#ad4235',g=new T.Group();station.add(g);g.name=`${medical?'SAP':'Incendie et appui'} · garage ${index+1}`;
  box(g,5.25,.08,16,'#798b86',x,.29,67);
  box(g,5.4,5.6,.3,'#c8d1c5',x,3,59);
  // Rear walls enclose the equipment area; open-front bays keep parked engines visible.
  for(const side of[-1,1]){
   box(g,.16,5.6,5,'#bcc9bf',x+side*2.7,3,61.5);
   box(g,.16,.55,10,'#bcc9bf',x+side*2.7,.6,69);
   box(g,.25,5.7,.25,color,x+side*2.7,3,75);
   box(g,.1,.025,11,'#e6dec0',x+side*2.35,.35,70);
  }
  box(g,5.1,.7,.4,'#8da09a',x,5.7,75);
  box(g,5.4,.45,.5,color,x,6.25,75);
  sign(g,`${medical?'SAP':'INC'} ${medical?index-8:index+1}`,3,.5,x,6.25,75.3,color,'#fff2d0');
  roofs.push(box(g,5.45,.24,16.5,'#637f76',x,6.65,67));
 }
 sign(station,'CIS CENTRE · INCENDIE & APPUI',24,.8,-83.4,7.25,75.3,'#ad4235','#fff2d0');
 sign(station,'SECOURS À PERSONNE',20,.8,-45.6,7.25,75.3,'#367e87','#fff2d0');
 for(const x of[-95,-70,-45]){box(station,.18,.025,4,'#e5e1c8',x,.36,89);for(const side of[-1,1]){const arrow=box(station,.14,.025,1.4,'#e5e1c8',x+side*.45,.36,90.4);arrow.rotation.y=side*-.7;}}
 const label=sign(station,'COUR DE DÉPART',17,1.3,-70,.36,99,'#687c79','#e8e1c4');label.rotation.x=-Math.PI/2;
 return{station,roofs};
}
