import * as T from 'three';
import {box,cylinder,sign,mat,reflectiveBands} from './models.js';
// Proportions Duster III, habillage opérationnel original inspiré des références du joueur.
export function dusterModel(parent){
 const g=new T.Group();parent.add(g);g.name='Dacia Duster · VLCG';
 const red='#bd292b',yellow='#e5ed32',black='#263036',glass='#263f49',metal='#bac4c3',w=.9065,L=4.343,front=L/2,back=-L/2;
 const profile=(points,width,color)=>{const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.025});geo.rotateY(-Math.PI/2);geo.translate(width/2,0,0);const m=new T.Mesh(geo,mat(color));m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 // Wheel openings cut into the body side, then dark liners and flush plastic flares.
 const axles=[-1.36,1.30],axleY=.38,opening=.46,sill=.62,reach=Math.sqrt(opening**2-(sill-axleY)**2),start=Math.atan2(sill-axleY,reach);
 const arc=(cz,r,a0,a1,steps=12)=>Array.from({length:steps+1},(_,i)=>{const a=a0+(a1-a0)*i/steps;return[cz+Math.cos(a)*r,axleY+Math.sin(a)*r];});
 box(g,1.65,.17,4.12,black,0,.47,0);
 profile([[back,sill],[back,1.15],[-1.8,1.28],[1.35,1.23],[front,1.04],[front,sill],...arc(axles[1],opening,start,Math.PI-start),...arc(axles[0],opening,start,Math.PI-start)],1.79,red);
 for(const z of axles)profile(arc(z,opening,0,Math.PI),1.5,'#161c20');
 profile([[-1.83,1.18],[-1.69,1.56],[-1.29,1.7],[.63,1.7],[1.27,1.25]],1.65,red);
 box(g,1.68,.055,1.98,red,0,1.72,-.28);
 // Angled windscreen, rear hatch glass and separate front/rear doors.
 const wind=box(g,1.51,.70,.025,glass,0,1.47,1.01);wind.rotation.x=-.81;
 const rear=box(g,1.49,.34,.025,glass,0,1.4,-1.83);rear.rotation.x=.25;
 const headlights=[],wheels=[],beacons=[];
 for(const side of[-1,1]){
  const x=side*(w+.015);
  for(const [z,d]of[[.37,.91],[-.73,1.04]])box(g,.024,.36,d,glass,side*.87,1.47,z);
  box(g,.055,.43,.10,black,side*.86,1.45,-.19);
  box(g,.035,.56,.025,black,x,1.02,-.18);
  for(const z of[.09,-1.02])box(g,.05,.05,.18,black,x,1.18,z);
  box(g,.18,.14,.26,black,side*1.015,1.38,.84);
  box(g,.07,.18,1.62,black,x,.67,-.03);
  box(g,.036,.065,3.65,yellow,x,1.13,-.12);
  box(g,.08,.65,.15,black,side*.925,.96,.95);
  for(const z of axles){
   const s=new T.Shape();s.absarc(0,0,opening+.08,-.06,Math.PI+.06,false);s.absarc(0,0,opening-.045,Math.PI+.06,-.06,true);
   const geo=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelSegments:1,bevelSize:.018,bevelThickness:.018,curveSegments:16});geo.rotateY(Math.PI/2);
   const flare=new T.Mesh(geo,mat(black));flare.position.set(side>0?.89:-.96,axleY,z);flare.castShadow=flare.receiveShadow=true;g.add(flare);
   const tyre=cylinder(g,.36,.36,.24,black,side*.84,.38,z,18);tyre.rotation.z=Math.PI/2;wheels.push(tyre);const hub=cylinder(g,.255,.255,.255,metal,side*.845,.38,z,10);hub.rotation.z=Math.PI/2;
  }
  for(let i=0;i<8;i++)for(let row=0;row<2;row++)if((row+i)%2===0)box(g,.025,.105,.23,yellow,x+side*.02,.82+row*.11,-1.22+i*.25);
  const label=sign(g,'VLCG 41',1.15,.12,x+side*.03,1.235,-.79,null,'#fff1b5');label.rotation.y=side*Math.PI/2;
  box(g,.065,.08,2.1,black,side*.66,1.8,-.3);for(const z of[-1.2,.58])box(g,.07,.12,.11,black,side*.66,1.75,z);
  headlights.push(box(g,.49,.13,.06,new T.MeshStandardMaterial({color:'#dfe7d9',emissive:'#fff3cf',emissiveIntensity:0}),side*.57,1.02,front+.025));
  box(g,.16,.42,.06,'#8f2929',side*.68,1.02,back-.025);
 }
 box(g,1.83,.26,.22,yellow,0,.76,front);box(g,1.32,.25,.04,black,0,.78,front+.13);box(g,1.78,.18,.16,black,0,.55,front+.04);
 box(g,1.03,.13,.04,black,0,1.04,front+.055);
 const badge=sign(g,'DACIA',.48,.085,0,1.045,front+.08,black,'#dce3df');
 const hatch=sign(g,'DUSTER',.68,.09,0,1.12,back-.04,null,'#dae2dc');hatch.rotation.y=Math.PI;
 box(g,1.8,.2,.16,black,0,.61,back-.04);
 for(const side of[-1,1]){const bands=box(g,1,1,1,yellow);reflectiveBands(bands,side<0?-.84:0,side<0?0:.84,.7,1.23,side*.65,Array.from({length:10},(_,i)=>i*.23-.5),.12,back-.07);}
 const roof=sign(g,'41 · VLCG',1.25,.46,0,1.76,-.52,red,yellow);roof.rotation.x=-Math.PI/2;
 box(g,1.40,.045,.33,black,0,1.88,.21);
 for(let i=0;i<8;i++)beacons.push(box(g,.155,.10,.27,new T.MeshStandardMaterial({color:'#237ac4',emissive:'#168aff',emissiveIntensity:0}),-.60+i*.172,1.96,.21));
 const light=new T.PointLight('#0754ff',0,15,2),ring=new T.Mesh(new T.RingGeometry(3,3.06,32),mat('#83d3e6'));ring.rotation.x=-Math.PI/2;ring.position.y=.07;light.visible=ring.visible=false;g.add(light,ring);
 g.userData={kind:'VLCG',bodyStyle:'dacia-duster',playerVehicle:'duster',length:L,wheels,headlights,beacons,blueParts:[...beacons],frontBlue:beacons,rearBlue:[],rearAmber:[],light,ring,penetrationY:1.03};return g;
}
