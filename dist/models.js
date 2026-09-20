import * as T from 'three';
import {DEFAULT_PROFILE} from './player-profile.js';
import {disposeObject} from './dispose.js';
const mats=new Map();export const mat=(color,roughness=.75,metalness=0)=>{const key=color+':'+roughness+':'+metalness;if(!mats.has(key))mats.set(key,Object.assign(new T.MeshStandardMaterial({color,roughness,metalness}),{userData:{shared:true}}));return mats.get(key);};
export function box(parent,w,h,d,color,x=0,y=0,z=0){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='object'?color:mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function cylinder(parent,r1,r2,h,color,x=0,y=0,z=0,n=12){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,n),typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function textTexture(text,{background='#cf372a',color='#ffffff',size=64,width=512,height=128}={}){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');x.fillStyle=background;x.fillRect(0,0,width,height);x.fillStyle=color;x.font=`bold ${size}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,width/2,height/2,width-16);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function sign(parent,text,w,h,x,y,z,bg='#f0e7d3',fg='#32393a'){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(text,{background:bg,color:fg}),side:T.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
export function tree(parent,x,z,size=1,type=0){const g=new T.Group();g.userData.treeClearance=1.15*size;g.position.set(x,0,z);g.scale.setScalar(size);size=1;parent.add(g);cylinder(g,.2*size,.32*size,3*size,'#6c5745',0,1.5*size,0,6);const palette=['#53754b','#718b50','#3e6b58','#89924c'];for(let i=0;i<3;i++){const m=new T.Mesh(new T.IcosahedronGeometry((1.65-i*.28)*size,1),mat(palette[type%4]));m.position.set(i===1?.65*size:i===2?-.55*size:0,(3.6+i*.6)*size,i===2?.5*size:0);m.scale.y=1.1;m.castShadow=true;g.add(m);}return g;}
export function person(parent,x,z,color='#394e66',firefighter=false){const g=new T.Group();g.position.set(x,0,z);parent.add(g);const body=box(g,.52,.73,.3,firefighter?'#323b39':color,0,1.06,0);box(g,.2,.63,.23,'#273039',-.15,.43,0);box(g,.2,.63,.23,'#273039',.15,.43,0);box(g,.14,.64,.18,firefighter?'#323b39':color,-.36,1.01,0);const arm=box(g,.14,.64,.18,firefighter?'#323b39':color,.36,1.01,0);const head=new T.Mesh(new T.SphereGeometry(.23,8,6),mat('#c99775'));head.position.y=1.65;g.add(head);if(firefighter){const helmet=new T.Mesh(new T.SphereGeometry(.29,10,8,0,Math.PI*2,0,Math.PI*.65),mat('#e2c74d'));helmet.position.y=1.7;g.add(helmet);box(g,.54,.09,.32,'#dad474',0,.98,0);box(g,.22,.11,.25,'#dbd77c',-.15,.43,0);box(g,.22,.11,.25,'#dbd77c',.15,.43,0);cylinder(g,.13,.13,.6,'#a6afb0',0,1.05,-.25,8);arm.rotation.x=-1;}return g;}
export function vehicle(parent,kind='FPT',color='#bd292b',options={}){
 const g=kind==='FPT'||kind==='CCF'||kind==='EPA'||kind==='CCGC'?truckModel(parent,kind,color,options):vanModel(parent,kind,color,options);return g;
}
function profile(parent,points,width,color){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false});geometry.rotateY(-Math.PI/2);geometry.translate(width/2,0,0);const m=new T.Mesh(geometry,typeof color==='object'?color:mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function panel(parent,points,color){const vertices=[];for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const material=new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.2,metalness:.25});const m=new T.Mesh(geo,material);parent.add(m);return m;}
// Clip reflective bands to the body panel: no floating bars or protruding ends.
function reflectiveBands(mesh,x0,x1,y0,y1,slope,offsets,band,z){
 const vertices=[];
 for(const offset of offsets){let poly=[[x0,offset+slope*x0],[x1,offset+slope*x1],[x1,offset+band+slope*x1],[x0,offset+band+slope*x0]];
  for(const [edge,above]of [[y0,true],[y1,false]]){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=above?a[1]>=edge:a[1]<=edge,inb=above?b[1]>=edge:b[1]<=edge;if(ina)out.push(a);if(ina!==inb){const t=(edge-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,edge]);}}poly=out;}
  for(let i=1;i<poly.length-1;i++)for(const p of[poly[0],poly[i],poly[i+1]])vertices.push(p[0],p[1],z);
 }
 const geo=mesh.geometry;geo.setIndex(null);geo.deleteAttribute('normal');geo.deleteAttribute('uv');geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();geo.computeBoundingSphere();mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.material.side=T.DoubleSide;return mesh;
}
function vanModel(parent,kind,color,options={}){const g=new T.Group();parent.add(g);const compact=kind==='VLCG'||kind==='VLI'||kind==='SAMU',ambulance=kind.startsWith('VSAV'),civilian=kind==='VLCG'&&color!=='#bd292b',car=kind==='VLCG'&&!civilian&&options.serviceCar===true,red=kind==='SAMU'?'#eeeeda':ambulance?'#d32628':color,fluoro=kind==='SAMU'?'#258dcc':ambulance?'#eaf21d':'#dfec36',rubber='#20282b',glass='#263e48',silver=mat('#b7c0c0',.25,.7);const length=compact?4.45:6.25,width=compact?1.88:2.12,front=length/2,back=-length/2,w=width/2;const wheelR=compact?.37:.46,axleFront=compact?1.32:1.94,axleBack=compact?-1.35:-1.95;const wheels=[],headlights=[];
box(g,width-.15,.22,length-.15,rubber,0,.53,0);
const top=car?1.52:compact?1.97:2.65,hood=car?1.02:compact?1.17:1.38,windBase=compact?1.66:2.4,windTop=car?.78:compact?.91:1.59;
profile(g,car?[[back,.58],[front,.58],[front,.9],[front-.25,hood],[windBase,hood+.08],[windTop,top-.09],[windTop-.2,top],[-.7,top],[-1.6,1.03],[back,1.01]]:[[back,.65],[front,.65],[front,hood-.15],[front-.25,hood],[windBase,hood+.15],[windTop,top-.16],[windTop-.2,top],[ambulance?-.15:back+.18,top],[back,top-.14]],width,red);
if(ambulance){box(g,width+.1,2.05,3.85,red,0,1.75,back+1.925);box(g,width+.18,.12,3.98,'#f3f1e2',0,2.84,back+1.925);box(g,.85,.2,.85,'#edeedf',0,3.02,back+2.7);for(const side of[-1,1]){box(g,.035,.055,3.85,fluoro,side*(w+.07),2.7,back+1.925);box(g,.035,.045,3.85,fluoro,side*(w+.07),.8,back+1.925);box(g,.045,1.65,.04,silver,side*(w+.08),1.75,-.85);box(g,.045,1.65,.04,silver,side*(w+.08),1.75,-1.78);for(const yy of[.94,2.57])box(g,.045,.04,.97,silver,side*(w+.08),yy,-1.31);box(g,.06,.18,.07,rubber,side*(w+.11),1.53,-1.63);const text=sign(g,'SECOURS ET ASSISTANCE AUX VICTIMES',2.6,.42,side*(w+.1),2.04,-1.3,red,'#fff9e6');text.rotation.y=side*Math.PI/2;}}
const roofLength=car?1.27:ambulance?1.35:length-1.25;box(g,width-.06,car?.07:.13,roofLength,ambulance?'#f3f1e2':red,0,top+.02,car?-.055:ambulance?1.03:back+roofLength/2+.1);
// Pare-brise incliné, capot court et calandre abaissée : silhouette utilitaire.
panel(g,[[-w+.15,hood+(car?.09:.17),windBase+.02],[w-.15,hood+(car?.09:.17),windBase+.02],[w-.18,top-(car?.1:.19),windTop+.02],[-w+.18,top-(car?.1:.19),windTop+.02]],glass);
if(car)panel(g,[[-w+.15,1.05,-1.56],[w-.15,1.05,-1.56],[w-.16,top-.04,-.73],[-w+.16,top-.04,-.73]],glass);
for(const side of[-1,1]){const xx=side*(w+.016);panel(g,car?[[xx,1.1,windBase-.09],[xx,top-.1,windTop-.07],[xx,top-.1,.08],[xx,1.1,.08]]:[[xx,hood+.22,windBase-.08],[xx,top-.23,windTop-.08],[xx,top-.23,compact?.17:.56],[xx,hood+.22,compact?.09:.48]],glass);if(car){panel(g,[[xx,1.1,-.02],[xx,top-.1,-.02],[xx,top-.1,-.69],[xx,1.1,-1.38]],glass);box(g,.025,.46,.025,rubber,xx,.85,.02);}box(g,.06,.07,.27,rubber,xx,car?1.04:hood+.03,compact?-.5:-.3);if(car)box(g,.06,.05,.24,rubber,xx,1.04,.35);box(g,.045,car?.14:.35,compact?2.8:1.55,rubber,xx,car?.62:.87,compact?-.15:.63);box(g,.15,car?.15:.23,.29,rubber,side*(w+.16),hood+(car?.17:.35),windBase-.18);box(g,.15,.08,.35,rubber,side*(w+.06),hood+(car?.11:.26),windBase-.2);if(!civilian&&!car){box(g,.045,.07,ambulance?1.7:length-.35,fluoro,side*(w+.035),car?.93:1.18,ambulance?.86:0);if(compact){for(let i=0;i<12;i++)for(let row=0;row<2;row++)if((i+row)%2===0)box(g,.04,car?.11:.15,.27,fluoro,side*(w+.045),(car?.77:1.05)+row*(car?.12:.16),-1.85+i*.31);}const sig=sign(g,kind==='VTU'?'VTU • SAPEURS-POMPIERS':compact?(kind==='SAMU'?'SAMU 15':kind==='VLI'?'INFIRMIER • SAPEURS-POMPIERS':car?'SAPEURS-POMPIERS • VLCG':'SAPEURS-POMPIERS'):'SDIS 41',ambulance?1.15:car?2.1:compact?2.4:2.9,car?.13:compact?.2:.27,side*(w+.06),car?1.005:compact?1.57:ambulance?1.45:1.85,ambulance?.48:car?-.05:-.7,red,'#fff3d3');sig.rotation.y=side*Math.PI/2;}}
box(g,width,car?.34:.53,.22,car?red:civilian?rubber:fluoro,0,car?.66:.88,front+.025);profile(g,[[front-.43,hood-.02],[front,hood-.15],[front,hood-.03],[front-.43,hood+.1]],width-.03,red);box(g,width*.64,car?.24:.47,.045,rubber,0,car?.84:1.15,front+.02);for(let i=0;i<3;i++)box(g,width*.57,.033,.055,silver,0,(car?.76:1)+i*(car?.07:.12),front+.045);for(const side of[-1,1]){const lamp=box(g,car?.42:.39,car?.13:.21,.065,new T.MeshStandardMaterial({color:'#eeeccd',emissive:'#fff1b3',emissiveIntensity:0}),side*(w-.24),car?1:1.28,front+.025);headlights.push(lamp);lamp.rotation.z=side*.1;box(g,car?.28:.12,car?.12:.2,.065,'#de4a32',side*(w-.18),car?.91:1.42,back-.06);box(g,.16,.11,.06,'#dddac7',side*(w-.22),car?.59:.7,front+.16);}
box(g,.6,.13,.035,'#e4e8de',0,car?.6:.72,front+.16);if(!civilian&&!car){for(let i=-3;i<=3;i++){const chevron=box(g,.16,.022,.4,fluoro,i*.23,hood+.04,front-.36);chevron.rotation.y=i<0?-.35:.35;if(ambulance)chevron.visible=false;}for(let i=-3;i<=3;i++){const stripe=box(g,.18,car?.33:.8,.03,fluoro,i*.27,car?.75:1.26,back-.05);stripe.rotation.z=i<0?-.45:.45;if(ambulance)stripe.visible=false;}}
for(const side of[-1,1])for(const zz of[axleFront,axleBack]){const arch=new T.Mesh(new T.TorusGeometry(wheelR+.055,.08,5,18,Math.PI),mat(rubber));arch.position.set(side*(w+.035),wheelR+.12,zz);arch.rotation.y=Math.PI/2;g.add(arch);const wheel=cylinder(g,wheelR,wheelR,.22,rubber,side*(w+.035),wheelR+.13,zz,20);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,wheelR*.62,wheelR*.62,.24,silver,side*(w+.045),wheelR+.13,zz,16);hub.rotation.z=Math.PI/2;for(let j=0;j<6;j++){const a=j*Math.PI/3;const hole=cylinder(g,.033,.033,.253,rubber,side*(w+.05),wheelR+.13+Math.sin(a)*wheelR*.42,zz+Math.cos(a)*wheelR*.42,6);hole.rotation.z=Math.PI/2;}}
const beacons=[],commandAmber=[];
if(car){
 // A single magnetic beacon rests on the driver's side of the plain roof.
 const x=-.62,z=.2; cylinder(g,.23,.23,.06,rubber,x,top+.085,z,16);
 beacons.push(cylinder(g,.19,.21,.22,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#258aff',emissiveIntensity:.15,roughness:.22}),x,top+.225,z,16));
}else if((kind==='VLCG'||kind==='VLI')&&!civilian){const z=.2,y=top+.2;for(const x of[-.5,.5])box(g,.12,.12,.3,rubber,x,top+.08,z);box(g,1.62,.08,.46,rubber,0,y-.05,z);box(g,1.6,.045,.44,'#b9c9ce',0,y+.13,z);for(let i=0;i<8;i++){const x=-.665+i*.19;beacons.push(box(g,.17,.14,.2,new T.MeshStandardMaterial({color:'#66b5ed',emissive:'#168aff',emissiveIntensity:.15,roughness:.22}),x,y+.04,z+.1));commandAmber.push(box(g,.17,.14,.12,new T.MeshStandardMaterial({color:'#e5a230',emissive:'#ff9d16',emissiveIntensity:.03,roughness:.22}),x,y+.04,z-.16));}}else if(!civilian&&!ambulance){for(const z of compact?[.2]:[.75,back+.4]){cylinder(g,.22,.24,.06,rubber,0,top+.12,z,10);beacons.push(cylinder(g,.2,.21,.22,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#258aff',emissiveIntensity:.15}),0,top+.25,z,10));}}const penetrationLights=[];
if(ambulance){
 // Rampe basse à optiques claires et pavillon fluorescent, d’après la référence fournie.
 for(const b of beacons)g.remove(b);beacons.length=0;
 box(g,2.09,.16,1.42,fluoro,0,2.76,1.09);
 for(const side of[-1,1])profile(g,[[.38,2.67],[1.75,2.67],[1.59,2.84],[.58,2.94]],.12,fluoro).position.x=side*1.01;
 box(g,.975,.055,.36,rubber,0,2.91,1.12);
 box(g,.96,.035,.33,'#cbd6d6',0,3.06,1.12);
 const led=(w,h,d,x,y,z)=>{const lamp=box(g,w,h,d,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.15,roughness:.23,metalness:.15}),x,y,z);beacons.push(lamp);return lamp;};
 for(let i=0;i<8;i++)led(.1,.11,.32,-.4025+i*.115,2.99,1.12);
 for(const side of[-1,1]){
  box(g,.3,.14,.04,rubber,side*.55,1.17,front+.052);
  penetrationLights.push(led(.23,.09,.045,side*.55,1.17,front+.072));
  // Encadrement fluorescent de la cellule sanitaire, sur les deux côtés.
  for(const z of[back+.12,.62])box(g,.04,1.96,.065,fluoro,side*(w+.086),1.76,z);
  for(const yy of[.8,2.7])box(g,.04,.065,3.67,fluoro,side*(w+.086),yy,back+1.94);
  box(g,.06,.56,.87,'#2b434b',side*(w+.102),2.0,-1.31);
  box(g,.065,.07,.87,'#a8c0bd',side*(w+.11),1.73,-1.31);
  led(.075,.12,.39,side*(w+.12),2.76,back+.34);
 }
 // Chevrons plus larges et lisibles sur le capot court.
 for(let i=-3;i<=3;i++){const stripe=box(g,.16,.028,.55,fluoro,i*.26,hood+.085,front-.36);const side=i<0?-1:1;reflectiveBands(stripe,side<0?-1.02:0,side<0?0:1.02,front-.43,front-.015,side*.3,[front-.6+Math.abs(i)*.19],.095,0);const a=stripe.geometry.attributes.position;for(let j=0;j<a.count;j++){const z=a.getY(j);a.setXYZ(j,a.getX(j),hood+.104-(z-(front-.43))*.13/.43,z);}stripe.geometry.computeVertexNormals();stripe.geometry.computeBoundingSphere();}
}
const light=new T.PointLight('#408bff',0,15,2);light.visible=false;light.position.set(0,top+.5,1);g.add(light);const ring=new T.Mesh(new T.RingGeometry(length*.65,length*.65+.09,48),new T.MeshBasicMaterial({color:'#83d3e6',transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;g.add(ring);const rearAmber=car?[]:commandAmber.length?commandAmber:ambulance?vsavAmberBar(g,back):amberRear(g,top-.12,back-.1);const rearBlue=ambulance?vsavBlueBar(g,back):[];beacons.push(...rearBlue);g.userData={kind,headlights,wheels,beacons,penetrationLights,light,ring,length,rearAmber,rearBlue,penetrationY:car?.72:undefined,penetrationOffset:car?.155:undefined,playerVehicle:kind==='VLCG'&&!civilian?(car?'car':'van'):undefined,bodyStyle:car?'service-car':compact?'compact-utility':ambulance?'master-ambulance':'master-panel-van'};return g;}

function amberRear(g,y,z){return[-1,1].map(side=>{const m=box(g,.42,.12,.07,new T.MeshStandardMaterial({color:'#d78316',emissive:'#ff9d16',emissiveIntensity:.03}),side*.7,y,z);return m;});}
function fptsrSignals(g,front,back,round=false){
 const blue=()=>new T.MeshStandardMaterial({color:'#74acd0',emissive:'#1687ff',emissiveIntensity:.15,roughness:.22});
 const frontBlue=[],rearBlue=[];
 if(round){for(const [z,list]of [[front-.48,frontBlue],[back+.36,rearBlue]]){cylinder(g,.25,.25,.07,'#263439',0,3.29,z,16);list.push(cylinder(g,.22,.23,.25,blue(),0,3.45,z,20));}}
 else{
  for(const side of[-1,1])box(g,.2,.07,.32,'#303b3e',side*.68,3.27,front-.48);
  box(g,2.16,.07,.43,'#263439',0,3.33,front-.48);
  for(let i=0;i<8;i++)frontBlue.push(box(g,.245,.16,.4,blue(),-.91+i*.26,3.44,front-.48));
  box(g,2.16,.035,.43,'#becacb',0,3.535,front-.48);
  box(g,1.18,.07,.34,'#263439',0,3.27,back+.36);
  for(let i=0;i<4;i++)rearBlue.push(box(g,.25,.16,.31,blue(),-.42+i*.28,3.39,back+.36));
  box(g,1.18,.035,.34,'#becacb',0,3.485,back+.36);
 }
 box(g,2.14,.25,.15,'#263439',0,2.83,back-.15);
 box(g,2.16,.035,.17,'#b6c4c4',0,2.975,back-.15);
 const rearAmber=Array.from({length:8},(_,i)=>box(g,.215,.15,.05,new T.MeshStandardMaterial({color:'#ce8b20',emissive:'#ff9b12',emissiveIntensity:.03,roughness:.22}),-.91+i*.26,2.83,back-.25));
 return{frontBlue,rearBlue,rearAmber};
}
function truckModel(parent,kind,color,options={}){const g=new T.Group();parent.add(g);const tanker=kind==='CCGC',ccf=kind==='CCF',epa=kind==='EPA',length=options.lightPump?6.6:tanker?10.4:ccf?(options.longChassis?9.05:7.65):8.4,width=2.5,front=length/2,back=-length/2,cabBack=tanker?3:ccf?(options.longChassis?1.45:.75):epa?2:.5,raise=ccf?.38:0,tyre=ccf?.88:.69,rubber='#222b2d',yellow='#dfea35',silver=mat('#b9c1bc',.3,.7),glass='#2b434c',white='#e5e9df';const wheels=[],headlights=[];
box(g,2.05,.4,length-.3,rubber,0,.78+raise,0);
profile(g,[[cabBack,1.12+raise],[front,1.12+raise],[front,2.57+raise],[front-.26,3.05+raise],[cabBack,3.13+raise]],width,color);
box(g,2.58,.15,front-cabBack+.08,ccf?white:color,0,3.16+raise,(front+cabBack)/2);
panel(g,[[-1.08,2.02+raise,front+.012],[1.08,2.02+raise,front+.012],[1.06,2.89+raise,front+.03],[-1.06,2.89+raise,front+.03]],glass);
for(const side of[-1,1]){const x=side*1.27;panel(g,[[x,2.04+raise,front-.16],[x,2.92+raise,front-.33],[x,2.92+raise,front-1.28],[x,2.04+raise,front-1.28]],glass);if(!epa&&!tanker)panel(g,[[x,2.02+raise,front-1.55],[x,2.94+raise,front-1.55],[x,2.94+raise,cabBack+.2],[x,2.02+raise,cabBack+.2]],glass);box(g,.045,.09,front-cabBack+.03,yellow,x,1.94+raise,(front+cabBack)/2);box(g,.055,1.42,.025,'#8e2824',x,1.94+raise,front-1.43);for(const z of[front-1.14,cabBack+.48])box(g,.07,.06,.2,rubber,x+side*.02,1.82+raise,z);box(g,.17,.43,.33,rubber,side*1.47,2.65+raise,front-.37);box(g,.35,.08,.68,silver,side*1.3,.89+raise,cabBack+.5);box(g,.31,.08,.61,silver,side*1.3,1.09+raise,cabBack+.5);}
box(g,1.35,.45,.05,rubber,0,1.58+raise,front+.055);for(let i=0;i<3;i++)box(g,1.24,.025,.06,silver,0,1.42+raise+i*.12,front+.085);box(g,2.62,.44,.29,white,0,.99+raise,front+.15);for(const side of[-1,1]){headlights.push(box(g,.43,.25,.06,new T.MeshStandardMaterial({color:'#ecebdd',emissive:'#fff1b3',emissiveIntensity:0}),side*.91,1.1+raise,front+.32));box(g,.15,.13,.07,'#c3913c',side*1.13,1.1+raise,front+.32);}for(let i=-4;i<=4;i++){const chevron=box(g,.17,.15,.025,yellow,i*.25,1.9+raise,front+.025);chevron.rotation.z=i<0?-.42:.42;}
const bodyFront=cabBack-.18,bodyLength=bodyFront-back,bodyZ=(bodyFront+back)/2;
if(tanker){const tank=cylinder(g,1.16,1.16,bodyLength-.35,color,0,2.28,bodyZ,12);tank.rotation.x=Math.PI/2;for(const z of[bodyZ-1.8,bodyZ+1.8]){const strap=cylinder(g,1.18,1.18,.14,silver,0,2.28,z,12);strap.rotation.x=Math.PI/2;}cylinder(g,.4,.4,.15,silver,0,3.5,bodyZ,12);for(const side of[-1,1]){const label=sign(g,'CCGC • 12 000 L',4,.4,side*1.19,2.35,bodyZ,color,'#fff3d3');label.rotation.y=side*Math.PI/2;box(g,.05,.15,bodyLength-.2,yellow,side*1.2,1.65,bodyZ);}}else{box(g,2.4,ccf?1.65:epa?.85:2.0,bodyLength,color,0,(ccf?1.95:epa?1.48:2.04)+raise,bodyZ);box(g,2.55,.14,bodyLength+.1,silver,0,(ccf?2.85:epa?1.98:3.12)+raise,bodyZ);
for(const side of[-1,1]){const x=side*1.225;if(ccf){box(g,.12,.48,bodyLength-.35,yellow,x,1.5+raise,bodyZ);box(g,.08,1.1,bodyLength*.45,color,x,2.08+raise,bodyZ-.43);const plaque=sign(g,options.longChassis?'CCF 8000 • SAPEURS-POMPIERS':'SAPEURS-POMPIERS',bodyLength-.2,.25,x+side*.04,2.65+raise,bodyZ,color,'#f5f2dc');plaque.rotation.y=side*Math.PI/2;box(g,.07,.09,bodyLength,yellow,x,1.15+raise,bodyZ);box(g,.07,.09,bodyLength,yellow,x,2.68+raise,bodyZ);box(g,.06,1.14,.72,silver,x+side*.02,1.9+raise,bodyFront-.46);}else{for(let i=0;i<3;i++){const segment=bodyLength/3-.12,z=back+(i+.5)*bodyLength/3;box(g,.06,epa?.62:1.57,segment,silver,x,epa?1.51:2.1,z);for(let j=0;j<(epa?4:9);j++)box(g,.072,.012,segment-.02,'#8d9a99',x+side*.012,1.29+j*.17,z);box(g,.075,.05,.37,'#4f5b60',x+side*.02,1.4,z);}box(g,.07,.06,bodyLength,yellow,x+side*.02,1.17,bodyZ);box(g,.07,.06,bodyLength,yellow,x+side*.02,epa?1.86:3.02,bodyZ);}}
}
if(ccf){const rail=(a,b,r=.055)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av),m=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),8),mat(yellow));m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());m.castShadow=true;g.add(m);};for(const side of[-1,1]){const x=side*1.36;rail([x,1.2+raise,front+.58],[x,3.43+raise,front+.13],.068);rail([x,3.43+raise,front+.13],[x,3.43+raise,cabBack-.1],.068);rail([side*1.13,3.21+raise,back+.1],[side*1.13,3.21+raise,bodyFront-.1]);}rail([-1.36,3.43+raise,front+.13],[1.36,3.43+raise,front+.13]);for(const y of[.9,1.32,1.75])rail([-1.38,y+raise,front+.58],[1.38,y+raise,front+.58],.075);cylinder(g,.25,.25,.7,rubber,0,1.0+raise,front+.64,12).rotation.z=Math.PI/2;box(g,1.3,.28,1.2,color,0,3.03+raise,bodyZ);for(const side of[-1,1]){const reel=cylinder(g,.3,.3,.42,yellow,side*.72,1.65+raise,back-.24,10);reel.rotation.x=Math.PI/2;cylinder(g,.12,.12,.46,rubber,side*.72,1.65+raise,back-.24,10).rotation.x=Math.PI/2;}}
else if(epa){
 // Cabine courte, coffre haut derrière la cabine et plateforme arrière basse.
 box(g,2.4,1.9,1.05,color,0,2.02,1.22);
 for(const side of[-1,1]){box(g,.06,1.64,.84,silver,side*1.23,2.04,1.22);for(let j=0;j<10;j++)box(g,.075,.018,.82,'#8d9a99',side*1.24,1.3+j*.16,1.22);box(g,.07,.07,1.02,yellow,side*1.24,2.93,1.22);}
 cylinder(g,.94,.94,.22,color,0,2.16,-2.75,16);
 box(g,1.65,.55,1.85,color,0,2.49,-2.75);
 for(const side of[-1,1])box(g,.32,.95,1.2,color,side*.72,2.98,-2.85);
 box(g,.5,.52,.55,rubber,.88,2.81,-3.6);
 const turret=new T.Group();turret.position.set(0,3.6,-2.75);g.add(turret);
 const pivot=new T.Group();turret.add(pivot);const sections=[];
 const beam=(parent,a,b)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=box(parent,.065,.065,d.length(),silver);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());};
 for(let level=0;level<5;level++){const half=.63-level*.09,y=level*.06,len=7.05-level*.06,section=new T.Group();pivot.add(section);sections.push(section);
 for(const side of[-1,1]){for(const yy of[y,y+.43])box(section,.075,.075,len,silver,side*half,yy,len/2-.1);for(let i=0;i<9;i++){const z=-.1+i*len/9;beam(section,[side*half,y,z],[side*half,y+.43,z+len/18]);beam(section,[side*half,y+.43,z+len/18],[side*half,y,z+len/9]);}}
 for(let i=0;i<23;i++)box(section,half*2,.055,.065,silver,0,y,-.1+i*(len-.1)/22);}
 const basket=new T.Group();basket.position.set(0,-.15,6.85);pivot.add(basket);
 box(basket,1.55,.12,1.03,silver,0,0,0);box(basket,1.55,.74,.07,white,0,.4,.5);
 for(const side of[-1,1]){box(basket,.07,.74,1,white,side*.74,.4,0);box(basket,.08,.08,1.03,silver,side*.74,.83,0);}
 box(basket,1.55,.08,.07,silver,0,.83,.5);
 for(let i=-2;i<=2;i++){const stripe=box(basket,.15,.68,.02,yellow,i*.28,.4,.55);stripe.rotation.z=i<0?-.45:.45;}
 const stabilizers=[];for(const side of[-1,1])for(const z of[-3.25,.3]){const leg=new T.Group();g.add(leg);leg.position.set(side*.6,0,z);box(leg,1.4,.23,.32,silver,0,.85,0);box(leg,.2,.72,.2,silver,side*.65,.53,0);box(leg,.7,.1,.65,'#333d3e',side*.65,.12,0);stabilizers.push({leg,side});}
 g.userData.ladder=pivot;g.userData.aerialRig={turret,pivot,sections,basket,stabilizers};
 }else if(!tanker){for(const x of[-.49,.49])box(g,.055,.06,bodyLength-.3,silver,x,3.35,bodyZ);for(let j=0;j<15;j++)box(g,1.08,.06,.055,silver,0,3.35,back+.2+j*(bodyLength-.4)/15);box(g,.53,.15,bodyLength-.4,'#d1b471',.82,3.3,bodyZ);}
for(const side of[-1,1])for(const z of(tanker?[front-1.24,back+1.25,back+2.85]:[front-1.24,back+1.34])){const y=tyre+.14;const wheel=cylinder(g,tyre,tyre,.37,rubber,side*1.27,y,z,20);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,tyre*.52,tyre*.52,.395,silver,side*1.28,y,z,16);hub.rotation.z=Math.PI/2;if(ccf){for(let j=0;j<16;j++){const a=j*Math.PI/8;const tread=box(g,.41,.13,.18,'#293134',side*1.27,y+Math.sin(a)*tyre,z+Math.cos(a)*tyre);tread.rotation.x=a;}}const arch=new T.Mesh(new T.TorusGeometry(tyre+.09,.14,6,18,Math.PI),mat('#384244'));arch.position.set(side*1.27,y,z);arch.rotation.y=Math.PI/2;g.add(arch);}
box(g,2.45,.28,.18,white,0,.95+raise,back-.11);for(let i=-4;i<=4;i++){const stripe=box(g,.18,.47,.035,yellow,i*.25,1.32+raise,back-.04);stripe.rotation.z=i<0?-.5:.5;}
const signals=kind==='FPT'?fptsrSignals(g,front,back,!!options.lightPump):null;const beacons=signals?[...signals.frontBlue,...signals.rearBlue]:[];if(!signals)for(const side of[-1,1])beacons.push(box(g,.5,.17,.3,new T.MeshStandardMaterial({color:'#357bcc',emissive:'#258aff',emissiveIntensity:.15}),side*.74,3.37+raise,front-.48));const light=new T.PointLight('#408bff',0,15,2);light.visible=false;light.position.set(0,3.7+raise,front-.5);g.add(light);const ring=new T.Mesh(new T.RingGeometry(length*.65,length*.65+.09,48),new T.MeshBasicMaterial({color:'#83d3e6',transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;g.add(ring);const rearAmber=signals?.rearAmber||amberRear(g,(ccf?2.6:epa?1.78:2.9)+raise,back-.1);g.userData={...g.userData,kind,headlights,wheels,beacons,light,ring,length,rearAmber,frontBlue:signals?.frontBlue,rearBlue:signals?.rearBlue,bodyStyle:options.lightPump?'light-pumper':tanker?'single-cab-tanker':ccf?'off-road-cage':epa?'single-cab-aerial':'double-cab-pumper'};return g;}

function vsavAmberBar(g,back){box(g,1.94,.24,.15,'#273034',0,2.53,back-.16);box(g,1.97,.035,.16,'#8c9998',0,2.67,back-.16);return Array.from({length:8},(_,i)=>box(g,.195,.13,.045,new T.MeshStandardMaterial({color:'#dc971f',emissive:'#ffa415',emissiveIntensity:.03,roughness:.23}),-.805+i*.23,2.53,back-.26));}
function vsavBlueBar(g,back){box(g,1.98,.055,.32,'#273034',0,2.94,back+.02);box(g,1.96,.035,.3,'#d0d9d4',0,3.095,back+.02);return Array.from({length:8},(_,i)=>box(g,.205,.12,.29,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.15,roughness:.23}),-.805+i*.23,3.02,back+.02));}

export function dressMedicalResponder(g,enabled=true){
 let kit=g.userData.medicalUniform;
 if(!kit){
  if(!enabled)return;
  kit={original:g.children.slice(0,5).map(m=>m.material),parts:[]};g.userData.medicalUniform=kit;
  const add=(parent,w,h,d,color,x,y,z)=>{const part=box(parent,w,h,d,color,x,y,z);kit.parts.push(part);return part;};
  add(g.children[0],.535,.085,.32,'#bd4e45',0,.18,0);
  add(g.children[0],.535,.05,.325,'#c5d0cd',0,-.2,0);
  add(g.children[0],.14,.09,.018,'#d9e4df',-.15,.02,.162);
  for(const i of[1,2]){add(g.children[i],.215,.065,.245,'#bac9c7',0,-.14,0);add(g.children[i],.22,.15,.33,'#1c282f',0,-.28,.035);}
  for(const i of[3,4]){add(g.children[i],.155,.05,.195,'#b7cacb',0,-.14,0);add(g.children[i],.15,.15,.19,'#8bc9de',0,-.32,0);}
 }
 for(const part of kit.parts)part.visible=enabled;
 g.children.slice(0,5).forEach((m,i)=>m.material=enabled?mat(i===1||i===2?'#203349':'#29455e'):kit.original[i]);
 g.userData.uniform=enabled?'ssuap':'station';
}
export function setInterventionHelmet(g,enabled){
 if(!g.userData.interventionHelmet&&enabled){const h=new T.Group();h.name='Casque de secours';g.add(h);const shell=new T.Mesh(new T.SphereGeometry(.29,10,8,0,Math.PI*2,0,Math.PI*.62),mat('#eee9d6'));shell.position.y=1.7;h.add(shell);box(h,.49,.055,.12,'#3a4245',0,1.73,.2);box(h,.04,.19,.04,'#333c40',-.21,1.54,.05);box(h,.04,.19,.04,'#333c40',.21,1.54,.05);g.userData.interventionHelmet=h;}
 if(g.userData.interventionHelmet)g.userData.interventionHelmet.visible=!!enabled;
}
export function medicalResponder(parent,x=0,z=0){const g=person(parent,x,z,'#29455e');g.name='Sapeur-pompier · secours à personne';dressMedicalResponder(g);setInterventionHelmet(g,true);return g;}
export function captain(parent,x=0,z=0,profile=DEFAULT_PROFILE){const g=person(parent,x,z,'#25364f');g.userData.role='captain';dressCaptain(g,profile);return g;}
export function dressCaptain(g,profile=DEFAULT_PROFILE){
 const key=profile.outfit+':'+profile.grade;g.userData.playerName=profile.name;
 if(g.userData.uniformKey===key)return;
 disposeObject(g.userData.uniform);const uniform=new T.Group();g.add(uniform);g.userData.uniform=uniform;g.userData.uniformKey=key;g.userData.outfit=profile.outfit;g.userData.grade=profile.grade;
 const fire=profile.outfit==='fire',station=profile.outfit==='station';
 for(const i of[0,3,4])g.children[i].material=mat(fire?'#3e4645':'#25364f');
 if(!station){box(uniform,.56,.58,.34,fire?'#3e4645':'#d8e43e',0,1.12,0);box(uniform,.58,.07,.36,fire?'#dde581':'#e9eeee',0,1,0);const h=new T.Mesh(new T.SphereGeometry(.29,10,8,0,Math.PI*2,0,Math.PI*.65),mat('#f3f3ed'));h.position.y=1.7;uniform.add(h);if(fire){for(const side of[-1,1])box(uniform,.21,.09,.25,'#dde581',side*.15,.42,0);box(uniform,.46,.07,.02,'#dde581',0,1.3,.185);box(uniform,.47,.11,.035,'#60717a',0,1.69,.245);}}
 else {box(uniform,.53,.05,.015,'#c95143',0,1.2,.16);}
 const stripes=({lieutenant:2,captain:3,commandant:4,lieutenantColonel:5,colonel:5})[profile.grade]||3;
 box(uniform,.2,.2,.025,'#25364f',.13,1.31,.19);
 for(let i=0;i<stripes;i++)box(uniform,.14,.02,.018,profile.grade==='lieutenantColonel'&&i%2?'#d6dedc':'#efd27e',.13,1.37-i*.027,.212);
}

export function addPenetrationLights(model){if(model.userData.playerVehicle==='car'||model.userData.penetrationLights?.length)return;const truck=['FPT','CCF','EPA','CCGC'].includes(model.userData.kind),front=model.userData.length/2,y=model.userData.penetrationY??(truck?model.userData.headlights[0].position.y:1.17),base=model.userData.penetrationOffset??(truck?.30:.052);model.userData.penetrationLights=[-1,1].map(side=>{box(model,.28,.14,.04,'#20282b',side*.55,y,front+base);return box(model,.21,.09,.035,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.03,roughness:.23}),side*.55,y,front+base+.02);});}

export function addAmbulanceDoors(model){if(model.userData.kind!=='VSAV')return;const back=-model.userData.length/2;box(model,2.05,1.82,.025,'#14222a',0,1.7,back-.11);box(model,1.95,.08,.35,'#aeb9ba',0,.8,back-.22);model.userData.rearDoors=[-1,1].map(side=>{const pivot=new T.Group();pivot.position.set(side*1.04,1.7,back-.16);model.add(pivot);const x=-side*.515;box(pivot,1.02,1.78,.075,'#d32628',x,0,0);box(pivot,.78,.52,.035,'#263e48',x,.48,-.055);box(pivot,.92,.05,.025,'#eaf21d',x,.86,-.05);for(let i=0;i<3;i++){const stripe=box(pivot,.15,.68,.03,'#eaf21d',x-.29+i*.29,-.36,-.06);reflectiveBands(stripe,x-.495,x+.495,-.87,.87,-side,Array.from({length:9},(_,n)=>n-4).filter(n=>(n+4)%3===i).map(n=>n*.43-1.04),.215,-.041);stripe.name='Chevron réfléchissant porte';}box(pivot,.07,.22,.045,'#20282b',-side*.91,-.08,-.08);for(const y of[-.55,.55])box(pivot,.1,.2,.12,'#b7c0c0',0,y,-.02);return{pivot,side};});}
