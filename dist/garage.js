import * as T from 'three';
import {box,sign,cylinder,textTexture,mat} from './models.js';
import {MAIN_BAYS} from './station-layout.js';
let warningGlowTexture;
function garageWarningGlow(){
 if(warningGlowTexture)return warningGlowTexture;
 const size=32,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-r)**2*200);}
 warningGlowTexture=new T.DataTexture(data,size,size);warningGlowTexture.needsUpdate=true;return warningGlowTexture;
}

export function createGarage(root){
 const station=new T.Group();station.name='CIS Centre · cour de départ';root.add(station);const roofs=[],doors=[];
 box(station,79,.2,44,'#929e98',-70,.17,81);
 // Continuous paved forecourt joins the access lane without a grass notch.
 box(station,79,.08,7,'#555f62',-70,.185,106);
 box(station,79,.08,2,'#b2b6ac',-70,.025,111);
 box(station,77,.05,27,'#687c79',-70,.3,89);
 for(const bay of MAIN_BAYS){
  const {x,index,group}=bay,medical=group==='medical',color=medical?'#367e87':'#ad4235',g=new T.Group();station.add(g);g.name=`${medical?'SAP':'Incendie et appui'} · garage ${index+1}`;
  box(g,5.25,.08,18.5,'#798b86',x,.29,68.25);
  box(g,5.4,5.6,.3,'#c8d1c5',x,3,59);
  // Rear walls enclose the equipment area; open-front bays keep parked engines visible.
  for(const side of[-1,1]){
   box(g,.16,5.6,5,'#bcc9bf',x+side*2.7,3,61.5);
   box(g,.16,.55,12.5,'#bcc9bf',x+side*2.7,.6,70.25);
   box(g,.25,5.7,.25,color,x+side*2.7,3,77.5);
   box(g,.1,.025,11,'#e6dec0',x+side*2.35,.35,70);
  }
  box(g,5.1,.7,.4,'#8da09a',x,5.7,77.5);
  box(g,5.4,.45,.5,color,x,6.25,77.5);
  doors.push(createBayDoor(g,{home:[x,71],front:[x,77.5],width:5.05,height:5.25,color,headerY:6.25}));
  roofs.push(box(g,5.45,.24,19,'#637f76',x,6.65,68.3));
 }
 sign(station,'CIS CENTRE · INCENDIE & APPUI',24,.8,-83.4,7.25,77.8,'#ad4235','#fff2d0');
 sign(station,'SECOURS À PERSONNE',20,.8,-45.6,7.25,77.8,'#367e87','#fff2d0');
 for(const x of[-95,-70,-45]){box(station,.18,.025,4,'#e5e1c8',x,.36,89);for(const side of[-1,1]){const arrow=box(station,.14,.025,1.4,'#e5e1c8',x+side*.45,.36,90.4);arrow.rotation.y=side*-.7;}}
 const label=sign(station,'COUR DE DÉPART',17,1.3,-70,.36,99,'#687c79','#e8e1c4');label.rotation.x=-Math.PI/2;
 const gate=createStationFence(station);
 return{station,roofs,gate,doors};
}

// The shutter retracts upward into its barrel. Names stay on the lintel when
// the moving name panel has rolled away, including after fleet composition.
export function createBayDoor(parent,{home,front,width,height=5.25,yaw=0,color='#ad4235',headerY=6.25}){
 const root=new T.Group();root.name='Porte sectionnelle';root.position.set(front[0],.3,front[1]);root.rotation.y=yaw;parent.add(root);
 const curtain=new T.Group();root.add(curtain);const slats=[];
 const slatMesh=new T.InstancedMesh(new T.BoxGeometry(width,height/16-.022,.095),mat('#82958e'),16);slatMesh.castShadow=slatMesh.receiveShadow=true;curtain.add(slatMesh);
 for(let i=0;i<16;i++){const slat=new T.Object3D();slat.position.set(0,(i+.5)*height/16,.025);slat.updateMatrix();slatMesh.setMatrixAt(i,slat.matrix);slats.push(slat);}slatMesh.computeBoundingSphere();slatMesh.frustumCulled=false;
 const bottom=box(curtain,width,.11,.12,'#334d48',0,.055,.05);
 const barrel=cylinder(root,.19,.19,width+.05,'#60756e',0,height+.21,0,12);barrel.rotation.z=Math.PI/2;
 for(const side of[-1,1])box(root,.085,height,.17,'#435f58',side*(width/2+.07),height/2,0);
 const label=sign(root,'',width*.83,.66,0,Math.min(2.7,height*.55),.084,color,'#fff2d0');
 const header=sign(root,'',width*.82,.43,0,headerY-.3,.3,color,'#fff2d0');
 const warningFixture=new T.Group();warningFixture.name='Feu orange à éclats · sortie de garage';warningFixture.position.set(width/2-.23,headerY-.3,.36);root.add(warningFixture);
 const warningBase=box(warningFixture,.46,.3,.12,'#344543',0,0,0);
 const warningLens=box(warningFixture,.38,.22,.065,new T.MeshStandardMaterial({color:'#dc8b14',emissive:'#ff3b00',emissiveIntensity:.02,roughness:.25,transparent:true,opacity:.82}),0,0,.08);
 const warningLeds=new T.InstancedMesh(new T.CylinderGeometry(.034,.034,.012,12),new T.MeshStandardMaterial({color:'#ffd177',emissive:'#ff4b00',emissiveIntensity:0}),4);
 const warningGlow=new T.Sprite(new T.SpriteMaterial({map:garageWarningGlow(),color:'#ff8800',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));warningGlow.position.set(0,0,.2);warningGlow.scale.set(.78,.6,1);warningGlow.visible=false;warningFixture.add(warningGlow);
 const led=new T.Object3D();led.rotation.x=Math.PI/2;for(let i=0;i<4;i++){led.position.set((i-1.5)*.08,0,.12);led.updateMatrix();warningLeds.setMatrixAt(i,led.matrix);}warningLeds.visible=false;warningFixture.add(warningLeds);
 return{root,curtain,slats,slatMesh,bottom,barrel,label,header,warningFixture,warningBase,warningLens,warningLeds,warningGlow,warningStartedAt:null,home,front,yaw,height,progress:0,hold:0,vehicleId:null};
}
function nameDoor(door,id){
 if(door.vehicleId===id)return;door.vehicleId=id;door.root.name='Garage · '+(id||'travée libre');
 for(const panel of[door.label,door.header]){panel.material.map.dispose();panel.material.map=textTexture(id||'LIBRE',panel.userData.signStyle);panel.material.needsUpdate=true;panel.userData.signText=id||'LIBRE';}
}
// Point sur l'aire, 7 m devant la porte, dans l'axe de la travée.
export function routineApronPoint(door){
 const dx=door.front[0]-door.home[0],dz=door.front[1]-door.home[1],n=Math.hypot(dx,dz)||1;
 return [door.front[0]+dx/n*7,door.front[1]+dz/n*7];
}
// Pendant l'essai du matin, l'EPA glisse de sa travée à l'aire puis revient : l'échelle ne se lève jamais dans la remise.
export function placeRoutineApron(e,door){
 if(!e||e.status!=='ready')return;
 const data=e.model.userData,out=data.routineOut||0;
 if(!out&&!data.onApron)return;
 const apron=routineApronPoint(door),home=e.home;
 e.model.position.set(home[0]+(apron[0]-home[0])*out,.2,home[1]+(apron[1]-home[1])*out);
 data.onApron=out>0;
}
export function updateGarageDoors(doors,engines,seconds){
 for(const door of doors||[]){
  const e=engines.find(e=>e.home&&Math.hypot(e.home[0]-door.home[0],e.home[1]-door.home[1])<1);
  nameDoor(door,e?.id||null);
  placeRoutineApron(e,door);
  const distance=e?Math.hypot(e.model.position.x-door.front[0],e.model.position.z-door.front[1]):Infinity;
  const wants=!!e&&((e.status==='departing'&&distance<24)||(e.path&&distance<23&&['returning','enroute','moving'].includes(e.status))||e.model.userData.routineCheck&&distance<12);
  if(seconds>0){door.hold=wants?2:Math.max(0,door.hold-seconds);door.progress=Math.max(0,Math.min(1,door.progress+(wants||door.hold>0?1:-1)*seconds/2.4));}
  const raised=door.height*door.progress;
  if(door.drawnProgress!==door.progress){door.drawnProgress=door.progress;door.slats.forEach((slat,i)=>{const center=(i+.5)*door.height/16+raised;slat.visible=center<door.height;slat.position.y=center;slat.scale.setScalar(slat.visible?1:0);slat.updateMatrix();door.slatMesh.setMatrixAt(i,slat.matrix);});door.slatMesh.instanceMatrix.needsUpdate=true;}
  door.bottom.position.y=raised+.055;door.bottom.visible=door.progress<.98;
  door.label.position.y=Math.min(2.7,door.height*.55)+raised;door.label.visible=door.label.position.y+.33<door.height;
  door.barrel.scale.x=door.barrel.scale.z=1+door.progress*.5;
  const warning=door.progress>0||wants||door.hold>0;
  door.root.userData.open=door.progress;door.root.userData.vehicleId=door.vehicleId;door.root.userData.openWarning=warning;
 }
}
// Fixed LED flashes use render time, independently of the guard speed and shutter movement.
export function updateGarageWarnings(doors,now){
 for(const door of doors||[]){
  const active=!!door.root.userData.openWarning;
  if(!active)door.warningStartedAt=null;
  else if(door.warningStartedAt==null)door.warningStartedAt=now;
  const phase=active?Math.max(0,now-door.warningStartedAt)%1000:1000;
  const lit=active&&(phase<90||phase>=180&&phase<270);
  door.warningLens.material.emissiveIntensity=lit?4:.02;
  door.warningLeds.visible=lit;door.warningLeds.material.emissiveIntensity=lit?5:0;
  door.warningGlow.visible=lit;door.warningGlow.material.opacity=lit?.32:0;
  door.warningFixture.userData.flashing=lit;
 }
}
export function garagePassageBlocked(doors,e){
 if(!e.path)return false;
 return (doors||[]).some(door=>door.progress<.98&&Math.hypot(e.home?.[0]-door.home[0],e.home?.[1]-door.home[1])<1&&Math.hypot(e.model.position.x-door.front[0],e.model.position.z-door.front[1])<10);
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
