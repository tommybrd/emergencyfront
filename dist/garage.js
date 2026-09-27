import * as T from 'three';
import {box,sign,cylinder} from './models.js';
import {MAIN_BAYS} from './station-layout.js';
export function createGarage(root){
 const station=new T.Group();station.name='CIS Centre · cour de départ';root.add(station);const roofs=[];
 box(station,79,.2,44,'#929e98',-70,.17,81);
 // Continuous paved forecourt joins the access lane without a grass notch.
 box(station,79,.08,7,'#555f62',-70,.185,106);
 box(station,79,.08,2,'#b2b6ac',-70,.025,111);
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
 const gate=createStationFence(station);
 return{station,roofs,gate};
}

function createStationFence(parent){
 const metal='#3b5550',wireMaterial=new T.LineBasicMaterial({color:'#536c61'});
 function panel(group,width){
  for(const y of[.27,1.97])box(group,width,.055,.065,metal,0,y,0);
  const points=[];for(let x=-width/2;x<=width/2;x+=.3)points.push(x,.3,0,x,1.94,0);for(let y=.4;y<1.94;y+=.25)points.push(-width/2,y,0,width/2,y,0);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));group.add(new T.LineSegments(geo,wireMaterial));
 }
 function fence(a,b){const w=Math.hypot(b[0]-a[0],b[1]-a[1]),g=new T.Group();g.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2);g.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);parent.add(g);panel(g,w);for(let d=0;d<=Math.ceil(w/4);d++)box(g,.1,2.1,.1,metal,-w/2+w*d/Math.ceil(w/4),1.05,0);}
 for(const [a,b]of[[[-110,58],[-110,103]],[[-30,58],[-30,103]],[[-110,58],[-72,58]],[[-68,58],[-30,58]],[[-110,103],[-78,103]],[[-62,103],[-41,103]],[[-37,103],[-30,103]]])fence(a,b);
 // Pedestrian access aligns with the staff walkway; vehicle traffic uses the central gate.
 for(const [x,z]of[[-41,103],[-72,58]]){const g=new T.Group();g.position.set(x,0,z-1.5);g.rotation.y=Math.PI/2;parent.add(g);panel(g,3);}
 const root=new T.Group();root.name='Portail automatique CIS Centre';parent.add(root);
 const leaves=[-1,1].map(side=>{const g=new T.Group();g.position.set(-70+side*4,0,103);root.add(g);panel(g,7.8);for(const x of[-3.9,3.9])box(g,.09,1.8,.09,metal,x,1.1,0);return{g,side};});
 for(const x of[-78,-62])box(parent,.25,2.3,.25,metal,x,1.15,103);
 cylinder(root,.22,.22,.1,'#303d3d',-78,2.36,103,12);
 const lens=cylinder(root,.18,.2,.27,new T.MeshStandardMaterial({color:'#efa521',emissive:'#ff9b16',emissiveIntensity:.05,roughness:.25}),-78,2.54,103,12);
 const rotor=box(root,.29,.16,.035,new T.MeshStandardMaterial({color:'#ffe6a1',emissive:'#ffa313',emissiveIntensity:0}),-78,2.54,103);
 rotor.visible=false;
 return{root,leaves,lens,rotor,progress:0,hold:0,time:0};
}
export function updateStationGate(gate,engines,seconds){
 if(!gate||seconds<=0)return;
 const near=engines.some(e=>!e.external&&!e.atResidence&&((e.path&&Math.hypot(e.model.position.x+70,e.model.position.z-103)<32)||(e.status==='departing'&&e.wasAtStation)));
 gate.hold=near?5:Math.max(0,gate.hold-seconds);const wanted=gate.hold>0,old=gate.progress;
 gate.progress=Math.max(0,Math.min(1,gate.progress+(wanted?1:-1)*seconds/2));gate.time+=seconds;
 for(const {g,side}of gate.leaves)g.position.x=-70+side*(4+gate.progress*8);
 const active=wanted||old!==gate.progress;gate.rotor.rotation.y=gate.time*8;gate.rotor.visible=active;
 gate.lens.material.emissiveIntensity=active?1+Math.max(0,Math.sin(gate.time*10))*3:.05;
 gate.rotor.material.emissiveIntensity=active?3:0;
}
