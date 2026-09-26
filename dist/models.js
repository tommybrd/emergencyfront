import * as T from 'three';
import {DEFAULT_PROFILE} from './player-profile.js';
import {disposeObject} from './dispose.js';
const mats=new Map();export const mat=(color,roughness=.75,metalness=0)=>{const key=color+':'+roughness+':'+metalness;if(!mats.has(key))mats.set(key,Object.assign(new T.MeshStandardMaterial({color,roughness,metalness}),{userData:{shared:true}}));return mats.get(key);};
export function box(parent,w,h,d,color,x=0,y=0,z=0){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='object'?color:mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function cylinder(parent,r1,r2,h,color,x=0,y=0,z=0,n=12){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,n),typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function textTexture(text,{background='#cf372a',color='#ffffff',size=64,width=512,height=128}={}){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');if(background){x.fillStyle=background;x.fillRect(0,0,width,height);}x.fillStyle=color;x.font=`bold ${size}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,width/2,height/2,width-16);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export function sign(parent,text,w,h,x,y,z,bg='#f0e7d3',fg='#32393a'){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(text,{background:bg,color:fg}),transparent:bg===null,depthWrite:bg!==null,side:T.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
export function tree(parent,x,z,size=1,type=0){const g=new T.Group();g.userData.treeClearance=1.15*size;g.position.set(x,0,z);g.scale.setScalar(size);size=1;parent.add(g);cylinder(g,.2*size,.32*size,3*size,'#6c5745',0,1.5*size,0,6);const palette=['#53754b','#718b50','#3e6b58','#89924c'];for(let i=0;i<3;i++){const m=new T.Mesh(new T.IcosahedronGeometry((1.65-i*.28)*size,1),mat(palette[type%4]));m.position.set(i===1?.65*size:i===2?-.55*size:0,(3.6+i*.6)*size,i===2?.5*size:0);m.scale.y=1.1;m.castShadow=true;g.add(m);}return g;}
export function person(parent,x,z,color='#394e66',firefighter=false){const g=new T.Group();g.position.set(x,0,z);parent.add(g);const body=box(g,.52,.73,.3,firefighter?'#323b39':color,0,1.06,0);box(g,.2,.63,.23,'#273039',-.15,.43,0);box(g,.2,.63,.23,'#273039',.15,.43,0);box(g,.14,.64,.18,firefighter?'#323b39':color,-.36,1.01,0);const arm=box(g,.14,.64,.18,firefighter?'#323b39':color,.36,1.01,0);const head=new T.Mesh(new T.SphereGeometry(.23,8,6),mat('#c99775'));head.position.y=1.65;g.add(head);if(firefighter){g.userData.interventionHelmet=helmetF1(g);box(g,.54,.09,.32,'#dad474',0,.98,0);box(g,.22,.11,.25,'#dbd77c',-.15,.43,0);box(g,.22,.11,.25,'#dbd77c',.15,.43,0);cylinder(g,.13,.13,.6,'#a6afb0',0,1.05,-.25,8);arm.rotation.x=-1;}return g;}
export function forestResponder(parent,x=0,z=0){
 const g=person(parent,x,z,'#c97932');g.name='Sapeur-pompier · feux de forêt';g.userData.uniform='forest';
 for(const side of[-1,1]){box(g,.22,.08,.25,'#e2dd8b',side*.15,.43,0);box(g,.16,.07,.2,'#e2dd8b',side*.36,1.02,0);}
 box(g,.54,.08,.32,'#e2dd8b',0,.99,0);box(g,.05,.51,.025,'#555046',0,1.12,.165);
 const helmet=new T.Group();helmet.name='Casque léger feux de forêt';g.add(helmet);g.userData.interventionHelmet=helmet;
 const shell=new T.Mesh(new T.SphereGeometry(.265,12,8,0,Math.PI*2,0,Math.PI*.57),mat('#e0c13b'));shell.position.y=1.76;helmet.add(shell);
 box(helmet,.51,.045,.35,'#e0c13b',0,1.76,.1);
 box(helmet,.41,.28,.035,'#827653',0,1.57,-.23);
 box(helmet,.4,.12,.035,'#293d44',0,1.83,.23);box(helmet,.32,.07,.045,'#93b0b1',0,1.83,.25);
 for(const side of[-1,1])box(helmet,.028,.2,.025,'#4d4d40',side*.18,1.6,.1);
 return g;
}
export function vehicle(parent,kind='FPT',color='#bd292b',options={}){
 const g=['PC','VPCE'].includes(kind)?supportTruck(parent,kind,color):kind==='VLCG'&&color==='#bd292b'&&!options.serviceCar?pickupModel(parent):kind==='VSAV'?(options.ambulanceModel==='man'?manAmbulance(parent,options):cellAmbulance(parent,options)):['FPT','CCF','EPA','CCGC','VSR','PC','VPCE'].includes(kind)?truckModel(parent,kind,color,options):vanModel(parent,kind,color,options);if(options.signalFront||options.signalRear||options.signalStyle==='round')configureBlueZones(g,kind,options);if(options.signalAmber&&options.signalAmber!=='standard')configureAmber(g,kind,options.signalAmber);if(!options.serviceCar&&kind!=='SAMU'&&(color==='#bd292b'||kind==='VSAV'))stationIdentity(g,kind);return g;
}
export function configureBlueZones(g,kind,options){
 const old=g.userData.blueLayout||(g.userData.blueLayout=(g.userData.beacons||[]).map(p=>({position:p.position.clone(),geometry:p.geometry}))),length=g.userData.length,front=old.filter(p=>p.position.z>=0),rear=old.filter(p=>p.position.z<0);
 const build=(zone,lamps)=>{
  const choice=options['signal'+zone]||options.signalStyle||'standard',technology=kind==='CCF'&&choice!=='none'?'round':choice;if(technology==='none')return [];
  const defaults=technology==='standard';if(defaults&&!lamps.length)return [];
  const round=technology==='round'||defaults&&lamps.length&&lamps.every(p=>p.geometry.type==='CylinderGeometry');
  let y=lamps.length?Math.max(...lamps.map(p=>p.position.y)):(old.length?Math.max(...old.map(p=>p.position.y)):2.8);
  let z=lamps.length?lamps.reduce((n,p)=>n+p.position.z,0)/lamps.length:zone==='Front'?length/2-.7:g.userData.playerVehicle==='car'||kind==='POLICE'?-.6:-length/2+.35;
  const car=g.userData.playerVehicle==='car'||kind==='POLICE';
  let mount=null;
  if(kind==='VSAV'){mount=g.userData.ambulanceModel==='man'?3.015:zone==='Front'?(g.userData.ambulanceModel==='master'?2.995:2.765):2.955;z=zone==='Front'?.85:-length/2+.28;}
  else if(car){mount=1.54;z=zone==='Front'?.3:-.5;}
  else if(kind==='VLI'||kind==='SAMU'){mount=1.99;z=zone==='Front'?.25:-length/2+.45;}
  else if(kind==='VLCG'){mount=2.205;z=zone==='Front'?.1:-1.45;}
  if(mount!==null)y=mount+(round?.155:.11);
  const rig=new T.Group();rig.name='Gyrophares '+(zone==='Front'?'avant':'arrière');g.add(rig);const lights=[];
  const material=()=>new T.MeshStandardMaterial({color:'#72a9cd',emissive:'#168aff',emissiveIntensity:0,roughness:.2});
  if(round){for(const x of defaults?lamps.map(l=>l.position.x):kind==='CCF'&&zone==='Rear'?[0]:[-.65,.65]){cylinder(rig,.20,.21,.05,'#263439',x,y-.13,z,16);lights.push(cylinder(rig,.17,.19,.22,material(),x,y,z,18));}}
  else{const width=technology==='short'?.95:technology==='wide'?(car||kind==='VLI'?1.7:1.95):1.65;box(rig,width,.045,.3,'#263439',0,y-.085,z);for(let i=0;i<8;i++)lights.push(box(rig,width/8-.025,.12,.28,material(),-width/2+width*(i+.5)/8,y,z));box(rig,width,.025,.3,'#b3c2c7',0,y+.075,z);}
  // Effect installers expect the lamp coordinates in the vehicle frame.
  for(const part of [...rig.children]){g.add(part);part.userData.configuredBlue=true;}g.remove(rig);
  return lights;
 };
 for(const part of [...g.children])if(part.userData.configuredBlue||(g.userData.blueParts||g.userData.beacons||[]).includes(part))g.remove(part);
 g.userData.frontBlue=build('Front',front);g.userData.rearBlue=build('Rear',rear);
 g.userData.beacons=[...g.userData.frontBlue,...g.userData.rearBlue];
 g.userData.signalFront=kind==='CCF'&&options.signalFront!=='none'?'round':options.signalFront||options.signalStyle||'standard';g.userData.signalRear=kind==='CCF'&&options.signalRear!=='none'?'round':options.signalRear||options.signalStyle||'standard';
}
function stationIdentity(g,kind){
 const heavy=['FPT','CCF','EPA','CCGC','VSR','PC','VPCE'].includes(kind),raise=kind==='CCF'?.38:0;
 const x=heavy?1.305:kind==='VSAV'?1.135:g.userData.bodyStyle==='service-car'?.99:['VLI','VLCG'].includes(kind)&&g.userData.bodyStyle!=='hilux-pickup'?.98:1.09,y=heavy?1.54+raise:kind==='VSAV'?1.15:.98,z=heavy?(['CCF','FPT','VSR'].includes(kind)?g.userData.length/2-2.15:g.userData.length/2-.65):kind==='VSAV'?1.05:.48;
 for(const side of[-1,1]){
  const badge=new T.Group();badge.name='Écusson CIS Valmont';badge.position.set(side*x,y,z);badge.rotation.y=side*Math.PI/2;g.add(badge);
  panel(badge,[[-.16,.2,0],[.16,.2,0],[.15,-.09,0],[0,-.22,0],[-.15,-.09,0]],'#edcc75');
  panel(badge,[[-.135,.17,.004],[.135,.17,.004],[.127,-.075,.004],[0,-.19,.004],[-.127,-.075,.004]],'#203e50');
  panel(badge,[[-.11,-.03,.008],[-.035,.055,.008],[.02,-.005,.008],[.075,.09,.008],[.11,-.03,.008]],'#d4dddb');
  panel(badge,[[0,-.13,.012],[.06,-.05,.012],[.025,.045,.012],[-.015,-.01,.012],[-.05,-.065,.012]],'#e45038');
  const name=sign(g,'CIS VALMONT',heavy?.95:.73,.12,side*(x+.006),y-.34,z,null,'#fff0d0');name.rotation.y=side*Math.PI/2;name.name='Inscription CIS Valmont';
 }
 g.userData.station='CIS Valmont';
}
function masterSide(g,side,red,yellow,black,silver,back){
 const x=side*1.115;
 for(const y of[1.27,2.72])box(g,.025,.065,3.67,yellow,x,y,-1.22);
 for(const z of[back+.16,.55])box(g,.025,1.49,.05,yellow,x,2,z);
 for(const [z,span]of[[-2.91,.34],[-.37,2.10]])box(g,.06,.23,span,black,x,.83,z);
 for(const z of[-1.4,.48])box(g,.025,1.35,.022,'#85252b',x,1.98,z).name='Joint porte coulissante';
 box(g,.045,.06,2.22,black,x+side*.01,1.62,-1.92).name='Rail porte coulissante';
 box(g,.07,.065,.24,black,x+side*.035,1.62,.25).name='Poignée porte coulissante';
 for(const z of[-.35,-1.42])for(const y of[1.03,2.34]){
  box(g,.035,.19,.39,'#68797b',x+side*.02,y,z).name='Grille sanitaire';
  for(let i=0;i<4;i++)box(g,.04,.012,.34,'#354a50',x+side*.026,y-.065+i*.043,z);
 }
 for(const [text,width,height,y,z]of[['SAPEURS-POMPIERS',2.7,.2,2.55,-1.19],['SECOURS ET ASSISTANCE AUX VICTIMES',3.3,.14,1.44,-1.19],['18 / 112',.65,.25,2.06,-2.2]]){
  const label=sign(g,text,width,height,x+side*.04,y,z,null,'#fff0d0');label.rotation.y=side*Math.PI/2;
 }
}
function profile(parent,points,width,color){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false});geometry.rotateY(-Math.PI/2);geometry.translate(width/2,0,0);const m=new T.Mesh(geometry,typeof color==='object'?color:mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function softenedProfile(parent,draw,width,color,bevel=.045){const shape=new T.Shape();draw(shape);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel});geometry.rotateY(-Math.PI/2);geometry.translate(width/2,0,0);const m=new T.Mesh(geometry,typeof color==='object'?color:mat(color,.54,.05));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
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
function pickupModel(parent){
 const g=new T.Group();parent.add(g);const red='#cb3030',yellow='#e7e83e',black='#263137',glass='#28414b',silver='#b9c4c4',front=2.6,back=-2.6;
 box(g,1.9,.28,5.1,black,0,.55,0);profile(g,[[-.85,.72],[front,.72],[front,1.18],[2.3,1.38],[1.3,1.45],[.7,2.08],[-.85,2.08]],1.96,red);
 panel(g,[[-.84,1.47,1.31],[.84,1.47,1.31],[.82,2.09,.7],[-.82,2.09,.7]],glass);box(g,1.9,.08,1.55,red,0,2.09,-.08);
 box(g,1.96,.75,1.72,red,0,1.08,-1.74);box(g,1.95,.57,1.7,yellow,0,1.73,-1.74);box(g,2,.08,1.78,yellow,0,2.05,-1.74);
 const wheels=[],headlights=[],beacons=[],rearAmber=[];
 for(const side of[-1,1]){const x=side*.99;for(const [a,b]of[[.68,.05],[-.04,-.78]])panel(g,[[x,1.45,a+.1],[x,2,a],[x,2,b],[x,1.45,b]],glass);box(g,.025,.9,.025,black,x,1.3,-.02);for(const z of[.15,-.61])box(g,.04,.06,.18,black,x,1.4,z);box(g,.16,.18,.25,black,side*1.1,1.58,1.05);box(g,.12,.07,2.8,silver,side*1.03,.61,-.1);box(g,.03,.085,4.7,yellow,x,1.12,-.15);const label=sign(g,'CHEF DE GARDE',1.55,.22,x+side*.02,1.27,-.06,red,'#f5ebdc');label.rotation.y=side*Math.PI/2;box(g,.03,.28,.95,glass,x,1.76,-1.7);
 for(const z of[1.64,-1.66]){const w=cylinder(g,.46,.46,.25,black,side*1.02,.56,z,16);w.rotation.z=Math.PI/2;wheels.push(w);cylinder(g,.27,.27,.27,silver,side*1.03,.56,z,12).rotation.z=Math.PI/2;const arch=new T.Mesh(new T.TorusGeometry(.5,.08,5,16,Math.PI),mat(black));arch.rotation.y=Math.PI/2;arch.position.set(side*1.02,.56,z);g.add(arch);}
 headlights.push(box(g,.4,.18,.04,new T.MeshStandardMaterial({color:'#eef0dd',emissive:'#fff1b3',emissiveIntensity:0}),side*.72,1.24,front+.04));box(g,.14,.42,.045,'#d34332',side*.86,1.15,back-.04);}
 frontBumper(g,1.96,.82,.36,front,yellow);box(g,.94,.26,.04,black,0,1.25,front+.045);for(const y of[1.16,1.25,1.34])box(g,.85,.025,.025,silver,0,y,front+.075);box(g,1.9,.18,.19,black,0,.72,back-.05);box(g,1.65,.4,.035,yellow,0,1.18,back-.04);box(g,.35,.04,.05,black,0,1.4,back-.08);
 const blueStart=g.children.length;box(g,1.52,.055,.38,black,0,2.17,.08);for(let i=0;i<8;i++){const x=-.665+i*.19;beacons.push(box(g,.17,.14,.25,new T.MeshStandardMaterial({color:'#75b1d5',emissive:'#168aff',emissiveIntensity:0}),x,2.26,.1));rearAmber.push(box(g,.16,.09,.04,new T.MeshStandardMaterial({color:'#dba441',emissive:'#ff9d16',emissiveIntensity:0}),x,1.95,back-.05));}
 const light=new T.PointLight('#408bff',0,15,2),ring=new T.Mesh(new T.RingGeometry(3.5,3.58,32),mat('#83d3e6'));light.position.set(0,2.5,.1);ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=light.visible=false;g.add(light,ring);g.userData={blueParts:g.children.slice(blueStart).filter(p=>p.geometry&&(beacons.includes(p)||p.position.y>2.1)),kind:'VLCG',bodyStyle:'hilux-pickup',playerVehicle:'van',length:5.2,wheels,headlights,beacons,rearAmber,light,ring};return g;
}
export function helmetF1(parent,color='#c5cece'){
 const h=new T.Group();h.name='Casque F1';parent.add(h);
 const shell=new T.Mesh(new T.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI*.67),mat(color,.28,.55));shell.position.set(0,1.73,-.035);shell.scale.set(1,1.04,1.08);h.add(shell);
 box(h,.12,.055,.38,color,0,2.015,-.04);box(h,.5,.065,.12,'#303b3e',0,1.79,.22);
 for(const side of[-1,1]){box(h,.09,.2,.23,color,side*.255,1.62,-.07);box(h,.06,.12,.07,'#262e33',side*.23,1.47,.03);}
 const visor=new T.Mesh(new T.SphereGeometry(.285,12,5,-.88,1.76,.75,.92),mat('#9a8751',.22,.6));visor.position.set(0,1.73,.005);h.add(visor);box(h,.42,.26,.055,'#555e5c',0,1.43,-.245);return h;
}
function frontBumper(g,width,y,height,front,color){
 const w=width/2,depth=.24,shape=new T.Shape();
 shape.moveTo(-w+.12,-height/2);shape.lineTo(w-.12,-height/2);shape.lineTo(w,-height*.22);shape.lineTo(w,height*.28);shape.lineTo(w-.12,height/2);shape.lineTo(-w+.12,height/2);shape.lineTo(-w,height*.28);shape.lineTo(-w,-height*.22);shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.025});
 const shell=new T.Mesh(geometry,mat(color));shell.position.set(0,y,front-.1);shell.castShadow=true;g.add(shell);
 box(g,width*.48,height*.28,.025,'#263136',0,y+.045,front+.17);
 box(g,width*.81,.055,.14,'#354044',0,y-height*.45,front+.045);
 for(const side of[-1,1]){box(g,width*.15,height*.45,.025,'#303b40',side*width*.37,y,front+.17);box(g,width*.09,height*.15,.025,'#e1e5dc',side*width*.37,y+.025,front+.187);}
 box(g,.49,.115,.026,'#e5e8dc',0,y-height*.27,front+.176);
}
function vanModel(parent,kind,color,options={}){const g=new T.Group();parent.add(g);const compact=kind==='VLCG'||kind==='VLI'||kind==='SAMU',ambulance=kind.startsWith('VSAV'),civilian=kind==='VLCG'&&color!=='#bd292b',car=kind==='VLCG'&&options.serviceCar===true,red=kind==='SAMU'?'#eeeeda':ambulance?'#d32628':color,fluoro=kind==='SAMU'?'#258dcc':ambulance?'#eaf21d':'#dfec36',rubber='#20282b',glass='#263e48',silver=mat('#b7c0c0',.25,.7);const length=compact?4.45:6.25,width=compact?1.88:2.12,front=length/2,back=-length/2,w=width/2;const wheelR=compact?.37:.46,axleFront=compact?1.32:1.94,axleBack=compact?-1.35:-1.95;const wheels=[],headlights=[];
box(g,width-.15,.22,length-.15,rubber,0,.53,0);
const top=car?1.52:compact?1.97:2.65,hood=car?1.02:compact?1.17:1.38,windBase=compact?1.66:2.4,windTop=car?.78:compact?.91:1.59;
profile(g,car?[[back,.58],[front,.58],[front,.9],[front-.25,hood],[windBase,hood+.08],[windTop,top-.09],[windTop-.2,top],[-.7,top],[-1.6,1.03],[back,1.01]]:[[back,.65],[front,.65],[front,hood-.15],[front-.25,hood],[windBase,hood+.15],[windTop,top-.16],[windTop-.2,top],[ambulance?-.15:back+.18,top],[back,top-.14]],width,red);
if(ambulance){
 // Renault cellule: cabine distincte et pavillon de cellule légèrement galbé,
 // avec un raccord incliné au lieu du parallélépipède posé sur le châssis.
 profile(g,[[back,.72],[.74,.72],[.74,2.48],[.54,2.73],[.32,2.82],[back+.18,2.82],[back,2.62]],width+.1,red);
 box(g,width+.02,.08,3.42,red,0,2.85,back+1.73);box(g,.85,.16,.85,'#edeedf',0,3.01,back+2.65);ambulanceSides(g,w,back,red,fluoro);
 const ambulanceLabel=sign(g,'AMBULANCE',1.62,.23,0,2.52,front-.33,red,fluoro);ambulanceLabel.rotation.x=-.36;
 const badge=box(g,.2,.2,.025,'#d8ded9',0,1.18,front+.085);badge.rotation.z=Math.PI/4;
}
const roofLength=car?1.27:ambulance?1.22:length-1.25;box(g,width-.06,car?.07:.13,roofLength,red,0,top+.02,car?-.055:ambulance?1.12:back+roofLength/2+.1);
// Pare-brise incliné, capot court et calandre abaissée : silhouette utilitaire.
panel(g,[[-w+.15,hood+(car?.09:.17),windBase+.02],[w-.15,hood+(car?.09:.17),windBase+.02],[w-.18,top-(car?.1:.19),windTop+.02],[-w+.18,top-(car?.1:.19),windTop+.02]],glass);
if(car)panel(g,[[-w+.15,1.05,-1.56],[w-.15,1.05,-1.56],[w-.16,top-.04,-.73],[-w+.16,top-.04,-.73]],glass);
for(const side of[-1,1]){const xx=side*(w+.016);panel(g,car?[[xx,1.1,windBase-.09],[xx,top-.1,windTop-.07],[xx,top-.1,.08],[xx,1.1,.08]]:[[xx,hood+.22,windBase-.08],[xx,top-.23,windTop-.08],[xx,top-.23,compact?.17:.56],[xx,hood+.22,compact?.09:.48]],glass);if(car){panel(g,[[xx,1.1,-.02],[xx,top-.1,-.02],[xx,top-.1,-.69],[xx,1.1,-1.38]],glass);box(g,.025,.46,.025,rubber,xx,.85,.02);}box(g,.06,.07,.27,rubber,xx,car?1.04:hood+.03,compact?-.5:-.3);if(car)box(g,.06,.05,.24,rubber,xx,1.04,.35);box(g,.045,car?.14:.35,compact?2.8:1.55,rubber,xx,car?.62:.87,compact?-.15:.63);box(g,.15,car?.15:.23,.29,rubber,side*(w+.16),hood+(car?.17:.35),windBase-.18);box(g,.15,.08,.35,rubber,side*(w+.06),hood+(car?.11:.26),windBase-.2);if(!civilian&&!car){box(g,.045,.07,ambulance?1.7:length-.35,fluoro,side*(w+.035),car?.93:1.18,ambulance?.86:0);if(compact){for(let i=0;i<12;i++)for(let row=0;row<2;row++)if((i+row)%2===0)box(g,.04,car?.11:.15,.27,fluoro,side*(w+.045),(car?.77:1.05)+row*(car?.12:.16),-1.85+i*.31);}const sig=sign(g,kind==='VTU'?'VTU • SAPEURS-POMPIERS':compact?(kind==='SAMU'?'SAMU 15':kind==='VLI'?'INFIRMIER • SAPEURS-POMPIERS':car?'SAPEURS-POMPIERS • VLCG':'SAPEURS-POMPIERS'):'CIS VALMONT',ambulance?1.15:car?2.1:compact?2.4:2.9,car?.13:compact?.2:.27,side*(w+.06),car?1.005:compact?1.57:ambulance?1.45:1.85,ambulance?.48:car?-.05:-.7,red,'#fff3d3');sig.rotation.y=side*Math.PI/2;if(ambulance)sig.visible=false;}}
frontBumper(g,width,car?.66:.88,car?.29:.43,front,car?red:civilian?rubber:fluoro);if(!ambulance)profile(g,[[front-.43,hood-.02],[front,hood-.15],[front,hood-.03],[front-.43,hood+.1]],width-.03,red);box(g,width*.64,car?.24:.47,.045,rubber,0,car?.84:1.15,front+.02);for(let i=0;i<3;i++)box(g,width*.57,.033,.055,silver,0,(car?.76:1)+i*(car?.07:.12),front+.045);for(const side of[-1,1]){const lamp=box(g,car?.42:.39,car?.13:.21,.065,new T.MeshStandardMaterial({color:'#eeeccd',emissive:'#fff1b3',emissiveIntensity:0}),side*(w-.24),car?1:1.28,front+.025);headlights.push(lamp);lamp.rotation.z=side*.1;if(kind!=='VTU')box(g,car?.28:.12,car?.12:.2,.065,'#de4a32',side*(w-.18),car?.91:1.42,back-.06);box(g,.16,.11,.06,'#dddac7',side*(w-.22),car?.59:.7,front+.16);}
box(g,.6,.13,.035,'#e4e8de',0,car?.6:.72,front+.16);if(!civilian&&!car){for(let i=-3;i<=3;i++){const chevron=box(g,.16,.022,.4,fluoro,i*.23,hood+.04,front-.36);chevron.rotation.y=i<0?-.35:.35;if(ambulance)chevron.visible=false;}for(let i=-3;i<=3;i++){const stripe=box(g,.18,car?.33:.8,.03,fluoro,i*.27,car?.75:1.26,back-.05);stripe.rotation.z=i<0?-.45:.45;if(ambulance||kind==='VTU')stripe.visible=false;}}
for(const side of[-1,1])for(const zz of[axleFront,axleBack]){const arch=new T.Mesh(new T.TorusGeometry(wheelR+.055,.08,5,18,Math.PI),mat(rubber));arch.position.set(side*(w+.035),wheelR+.12,zz);arch.rotation.y=Math.PI/2;g.add(arch);const wheel=cylinder(g,wheelR,wheelR,.22,rubber,side*(w+.035),wheelR+.13,zz,20);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,wheelR*.62,wheelR*.62,.24,silver,side*(w+.045),wheelR+.13,zz,16);hub.rotation.z=Math.PI/2;for(let j=0;j<6;j++){const a=j*Math.PI/3;const hole=cylinder(g,.033,.033,.253,rubber,side*(w+.05),wheelR+.13+Math.sin(a)*wheelR*.42,zz+Math.cos(a)*wheelR*.42,6);hole.rotation.z=Math.PI/2;}}
const blueStart=g.children.length,beacons=[],commandAmber=[];
if(car){
 // A single magnetic beacon rests on the driver's side of the plain roof.
 const x=-.62,z=.2; cylinder(g,.23,.23,.06,rubber,x,top+.085,z,16);
 beacons.push(cylinder(g,.19,.21,.22,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#258aff',emissiveIntensity:.15,roughness:.22}),x,top+.225,z,16));
}else if((kind==='VLCG'||kind==='VLI')&&!civilian){const z=.2,y=top+.2;for(const x of[-.5,.5])box(g,.12,.12,.3,rubber,x,top+.08,z);box(g,1.62,.08,.46,rubber,0,y-.05,z);box(g,1.6,.045,.44,'#b9c9ce',0,y+.13,z);for(let i=0;i<8;i++){const x=-.665+i*.19;beacons.push(box(g,.17,.14,.2,new T.MeshStandardMaterial({color:'#66b5ed',emissive:'#168aff',emissiveIntensity:.15,roughness:.22}),x,y+.04,z+.1));commandAmber.push(box(g,.17,.14,.12,new T.MeshStandardMaterial({color:'#e5a230',emissive:'#ff9d16',emissiveIntensity:.03,roughness:.22}),x,y+.04,z-.16));}}else if(!civilian&&!ambulance){for(const z of compact?[.2]:[.75,back+.4]){cylinder(g,.22,.24,.06,rubber,0,top+.12,z,10);beacons.push(cylinder(g,.2,.21,.22,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#258aff',emissiveIntensity:.15}),0,top+.25,z,10));}}const blueParts=g.children.slice(blueStart).filter(p=>!commandAmber.includes(p));const penetrationLights=[];
if(ambulance){
 // Rampe basse à optiques claires et pavillon fluorescent, d’après la référence fournie.
 for(const b of beacons)g.remove(b);beacons.length=0;
 box(g,2.09,.16,1.42,fluoro,0,2.76,1.09);
 for(const side of[-1,1])profile(g,[[.38,2.67],[1.75,2.67],[1.59,2.84],[.58,2.94]],.12,fluoro).position.x=side*1.01;
 const barWidth=options.signalStyle==='wide'?1.9:.975;
 if(options.signalStyle==='round'){for(const x of[-.7,.7]){cylinder(g,.23,.24,.055,rubber,x,2.91,1.12);beacons.push(cylinder(g,.2,.22,.23,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#168aff',emissiveIntensity:.15}),x,3.05,1.12));}}
 else{box(g,barWidth,.055,.36,rubber,0,2.91,1.12);box(g,barWidth-.015,.035,.33,'#cbd6d6',0,3.06,1.12);}
 const led=(w,h,d,x,y,z)=>{const lamp=box(g,w,h,d,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.15,roughness:.23,metalness:.15}),x,y,z);beacons.push(lamp);return lamp;};
 if(options.signalStyle!=='round')for(let i=0;i<8;i++)led(.1*barWidth/.975,.11,.32,(-.4025+i*.115)*barWidth/.975,2.99,1.12);
 for(const side of[-1,1]){
  box(g,.3,.14,.04,rubber,side*.55,1.17,front+.052);
  penetrationLights.push(led(.23,.09,.045,side*.55,1.17,front+.072));

 }
 // Symmetrical clipped chevrons follow both facets of the actual bonnet.
 const hoodY=z=>z<=front-.25?hood+.15-(z-windBase)*.15/(front-.25-windBase):hood-(z-(front-.25))*.15/.25;
 for(const side of[-1,1])for(const [z0,z1]of[[windBase+.035,front-.25],[front-.25,front-.025]]){
  const stripe=box(g,1,1,1,fluoro);stripe.name='Chevron réfléchissant capot';
  reflectiveBands(stripe,side<0?-w+.065:0,side<0?0:w-.065,z0,z1,side*.48,Array.from({length:10},(_,i)=>windBase-1+i*.29),.145,0);
  const a=stripe.geometry.attributes.position;for(let j=0;j<a.count;j++){const z=a.getY(j);a.setXYZ(j,a.getX(j),hoodY(z)+.006,z);}stripe.geometry.computeVertexNormals();stripe.geometry.computeBoundingSphere();
 }

}
if(kind==='VTU')utilityRear(g,back,red,fluoro);
const light=new T.PointLight('#408bff',0,15,2);light.visible=false;light.position.set(0,top+.5,1);g.add(light);const ring=new T.Mesh(new T.RingGeometry(length*.65,length*.65+.09,48),new T.MeshBasicMaterial({color:'#83d3e6',transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;g.add(ring);const rearAmber=car?[]:commandAmber.length?commandAmber:ambulance?vsavAmberBar(g,back):amberRear(g,top-.12,back-.1);const rearBlue=ambulance?(options.signalStyle==='round'?[-.7,.7].map(x=>cylinder(g,.2,.22,.23,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#168aff',emissiveIntensity:.15}),x,3.02,back+.02)):vsavBlueBar(g,back,options.signalStyle==='short'?.5:1)):[];beacons.push(...rearBlue);g.userData={blueParts,kind,headlights,wheels,beacons,penetrationLights,light,ring,length,rearAmber,rearBlue,penetrationY:car?.72:undefined,penetrationOffset:car?.155:undefined,playerVehicle:kind==='VLCG'&&!civilian?(car?'car':'van'):undefined,bodyStyle:car?'service-car':compact?'compact-utility':ambulance?'master-ambulance':'master-panel-van'};return g;}

function ambulanceSides(g,w,back,red,yellow){
 const black='#24343a',metal='#b7c4c5';
 for(const side of[-1,1]){
  const face=side*(w+.078),out=side*(w+.105);
  for(const y of[.82,2.7])box(g,.032,.055,3.72,yellow,face,y,back+1.94);
  for(const z of[back+.10,.65])box(g,.032,1.88,.045,yellow,face,1.76,z);
  // The access door is ahead of the rear axle, with a narrow flush surround.
  const door=.03;
  box(g,.034,1.71,.96,black,out,1.68,door);
  box(g,.037,1.65,.90,red,out+side*.022,1.68,door);
  for(const z of[door-.47,door+.47])box(g,.046,1.7,.026,metal,out+side*.025,1.68,z);
  for(const y of[.83,2.53])box(g,.046,.026,.96,metal,out+side*.025,y,door);
  box(g,.05,.58,.62,black,out+side*.034,2.04,door);
  box(g,.055,.48,.52,'#344e55',out+side*.038,2.04,door);
  box(g,.07,.055,.19,black,out+side*.053,1.37,door-.27);
  box(g,.15,.08,1.05,'#9ca8a7',out+side*.055,.74,door);
  // Protective sill follows the rear wheel instead of crossing the tyre.
  for(const [center,length]of[[-2.85,.45],[-1.12,.40],[.11,1.06]])box(g,.07,.17,length,black,face,.72,center);
  for(const z of[-2.52,-1.38])box(g,.07,.24,.07,black,face,.91,z);
  box(g,.075,.07,1.15,black,face,1.065,-1.95);
  for(const z of[back+.055,.69])box(g,.065,1.98,.045,metal,face+side*.006,1.76,z);
  box(g,.045,.055,3.74,metal,face,2.78,back+1.93);
  box(g,.055,.69,1.53,black,out+side*.028,1.92,-1.77);box(g,.06,.57,1.39,'#344e55',out+side*.034,1.92,-1.77);
  // Markings sit above and below the flush side window.
  for(const [text,y,height]of[['SAPEURS-POMPIERS',2.43,.23],['SECOURS À PERSONNE',1.34,.17]]){
   const label=sign(g,text,2.02,height,out+side*.055,y,-1.77,null,'#fff2d4');label.rotation.y=side*Math.PI/2;
  }
 }
}

function utilityRear(parent,back,red,yellow){
 const g=new T.Group();g.name='Portes arrière VTU';parent.add(g);const face=back-.055,black='#202b32',metal='#b8c3c4';
 box(g,1.88,1.83,.045,black,0,1.6,face);
 for(const side of[-1,1]){
  const x=side*.46;box(g,.9,1.76,.06,red,x,1.6,face-.035);
  const bands=box(g,1,1,1,yellow);bands.name='Chevrons VTU';reflectiveBands(bands,x-.435,x+.435,.735,2.465,-side,Array.from({length:13},(_,i)=>-2+i*.34),.17,face-.069);
  box(g,.64,.48,.025,black,x,2.08,face-.082);box(g,.55,.38,.02,'#314a53',x,2.09,face-.099);
  box(g,.07,.22,.045,black,side*.1,1.48,face-.105);
  for(const y of[1.04,2.24]){box(g,.12,.1,.09,metal,side*.89,y,face-.08);box(g,.035,.15,.1,metal,side*.935,y,face-.08);}
  box(g,.16,.77,.08,black,side*.99,1.17,face-.025);
  for(const [y,color]of[[1.43,'#d93b32'],[1.22,'#e89b36'],[1.02,'#ede9cf'],[.84,'#d93b32']])box(g,.115,.14,.035,color,side*.99,y,face-.08);
 }
 box(g,2.05,.17,.27,black,0,.63,back-.15);box(g,1.64,.065,.34,metal,0,.73,back-.28);
 for(let i=-5;i<=5;i++)box(g,.018,.008,.28,'#667779',i*.14,.767,back-.28);
 const plate=sign(g,'VALMONT',.47,.13,0,.95,face-.095,'#ecedde','#24323b');plate.rotation.y=Math.PI;
 box(g,.44,.055,.03,'#d73830',0,2.46,face-.082);
}
function amberRear(g,y,z){return[-1,1].map(side=>{const m=box(g,.42,.12,.07,new T.MeshStandardMaterial({color:'#d78316',emissive:'#ff9d16',emissiveIntensity:.03}),side*.7,y,z);return m;});}
function cellAmbulance(parent,options={}){
 const g=new T.Group();parent.add(g);
 const isVan=options.ambulanceModel==='master';
 const length=6.42,front=length/2,back=-length/2,w=1.07,red='#cf292d',yellow='#e9ed35',black='#202b30',glass='#243b44',silver='#b8c2c0';
 const wheels=[],headlights=[],beacons=[];
 // Base basse et silhouette Renault : capot court, pare-brise incliné et raccord propre avec la cellule.
 box(g,1.48,.18,length-.2,black,0,.49,0);
 const cab=softenedProfile(g,s=>{s.moveTo(.43,.67);s.lineTo(1.43,.67);s.lineTo(1.43,.59);s.absarc(2,.59,.57,Math.PI,0,true);s.lineTo(2.57,.67);s.lineTo(front-.08,.67);s.quadraticCurveTo(front+.18,.77,front+.10,1.19);s.lineTo(front+.08,1.51);s.lineTo(front-.12,1.52);s.lineTo(2.36,1.52);s.lineTo(1.57,2.47);s.quadraticCurveTo(1.44,2.63,1.22,2.66);s.lineTo(.43,2.66);},2.02,red,.025);cab.name='Cabine Renault profilée';
 // Original cross-section: shoulders narrow gradually toward the roof.
 const cabVertices=cab.geometry.attributes.position;
 for(let i=0;i<cabVertices.count;i++){const y=cabVertices.getY(i),t=Math.max(0,Math.min(1,(y-1.5)/1.16));cabVertices.setX(i,cabVertices.getX(i)*(1-.1*t));}
 cab.geometry.computeVertexNormals();cab.geometry.computeBoundingSphere();
 softenedProfile(g,s=>{s.moveTo(back+.02,.7);s.lineTo(-2.59,.7);s.lineTo(-2.59,.59);s.absarc(-2.02,.59,.57,Math.PI,0,true);s.lineTo(-1.45,.7);s.lineTo(.66,.7);s.lineTo(.66,2.68);s.quadraticCurveTo(.56,2.82,.38,2.87);s.lineTo(back+.2,2.87);s.quadraticCurveTo(back+.03,2.82,back+.02,2.69);},2.13,red,.04).name=isVan?'Fourgon sanitaire intégré':'Cellule sanitaire monobloc';
 box(g,2.02,.075,isVan?4.25:3.7,red,0,2.91,isVan?-.975:-1.25);
 if(isVan)softenedProfile(g,s=>{s.moveTo(.45,2.62);s.lineTo(1.55,2.47);s.quadraticCurveTo(1.42,2.9,1.02,2.95);s.lineTo(.45,2.95);},1.96,red,.04).name='Pavillon surélevé fourgon';
 box(g,.9,.13,.72,'#ecece2',0,3.015,-.72).name='Aérateur cellule';
 box(g,.38,.1,.38,'#d8dddd',0,3.01,-1.52).name='Extracteur cellule';
 // Pavillon jaune et bandeau frontal prolongent réellement le galbe de la cabine.
 softenedProfile(g,s=>{s.moveTo(.48,2.58);s.lineTo(1.39,2.58);s.quadraticCurveTo(1.34,2.7,1.18,2.73);s.lineTo(.48,2.73);},2.03,yellow,.025).name='Pavillon fluorescent';
 // Pare-brise panoramique, joints et essuie-glaces.
 panel(g,[[-.92,1.57,2.405],[.92,1.57,2.405],[.88,2.48,1.625],[-.88,2.48,1.625]],glass).name='Pare-brise panoramique';
 for(const side of[-1,1]){const wiper=box(g,.035,.025,.72,black,side*.37,1.68,2.37);wiper.rotation.z=side*.18;wiper.rotation.x=-.74;}
 box(g,1.86,.055,.055,black,0,2.5,1.625);
 for(const side of[-1,1]){
  const x=side*1.042;
  panel(g,[[x,1.57,2.27],[side*.947,2.45,1.51],[side*.947,2.45,.81],[x,1.57,.81]],glass).name='Vitre cabine';
  box(g,.03,.94,.025,'#8b2429',x,1.31,.72);box(g,.055,.06,.27,black,x+side*.02,1.48,.73).name='Poignée cabine';
  box(g,.15,.25,.3,black,side*1.16,1.86,2.08);box(g,.11,.07,.3,black,side*1.08,1.68,1.95);
  if(!isVan){
  // Encadrement de cellule continu et protections qui suivent la carrosserie.
  box(g,.03,.055,3.57,yellow,side*1.115,2.7,-1.18);
  for(const [z,span] of [[-2.88,.37],[-.44,2.02]])box(g,.03,.055,span,yellow,side*1.115,.9,z);
  box(g,.03,1.82,.055,yellow,side*1.075,1.8,.59);box(g,.03,1.82,.055,yellow,side*1.075,1.8,back+.15);
  for(const [z,span] of [[-2.9,.35],[-.43,2.02]])box(g,.04,.18,span,black,side*1.115,.76,z).name='Protection latérale';
  // Volet technique juste derrière la cabine, comme sur le véhicule de référence.
  box(g,.04,1.22,.42,yellow,side*1.1,1.75,.37).name='Volet technique';
  for(let i=0;i<9;i++)box(g,.045,.025,.36,'#b5b82f',side*1.106,1.23+i*.13,.37);
  if(side===1){
   const doorZ=-.43;box(g,.028,1.62,.028,'#8e2428',side*1.09,1.76,doorZ);
   for(const z of[doorZ-.45,doorZ+.45])box(g,.046,1.64,.025,silver,side*1.105,1.76,z);
   for(const y of[.94,2.57])box(g,.046,.025,.92,silver,side*1.105,y,doorZ);
   box(g,.045,.5,.68,glass,side*1.113,2.19,doorZ).name='Baie porte sanitaire';
   box(g,.065,.055,.2,black,side*1.125,1.54,doorZ-.26).name='Poignée porte sanitaire';
   box(g,.15,.075,.98,silver,side*1.13,.72,doorZ).name='Marchepied sanitaire';
  }else{
   for(const z of[-.45,-1.35]){box(g,.045,.24,.44,'#758486',side*1.105,2.16,z);for(let i=0;i<4;i++)box(g,.05,.018,.39,'#4e5d60',side*1.112,2.08+i*.055,z);}
  }
  const label=sign(g,'CIS VALMONT',1.4,.2,side*1.14,1.75,-2.08,null,'#f1eddc');label.rotation.y=side*Math.PI/2;
  const upper=sign(g,'SAPEURS-POMPIERS',2.2,.17,side*1.14,2.78,-1.4,null,'#f1d978');upper.rotation.y=side*Math.PI/2;
  }else{
   masterSide(g,side,red,yellow,black,silver,back);
  }
  for(const z of[2.0,-2.02]){const wheel=cylinder(g,.47,.47,.26,black,side*1.04,.58,z,20);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,.28,.28,.28,silver,side*1.055,.58,z,16);hub.rotation.z=Math.PI/2;const cap=cylinder(g,.105,.105,.3,black,side*1.06,.58,z,12);cap.rotation.z=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3,bolt=cylinder(g,.032,.032,.3,black,side*1.06,.58+Math.cos(a)*.205,z+Math.sin(a)*.205,6);bolt.rotation.z=Math.PI/2;}const arch=new T.Mesh(new T.TorusGeometry(.53,.055,5,16,Math.PI),mat(black));arch.position.set(side*1.075,.58,z);arch.rotation.y=Math.PI/2;g.add(arch);}
 }
 // Face avant Renault : grand bouclier fluorescent, calandre à lamelles et optiques effilées.
 softenedProfile(g,s=>{s.moveTo(front-.27,.65);s.lineTo(front+.08,.65);s.quadraticCurveTo(front+.22,.69,front+.22,.84);s.lineTo(front+.13,1.33);s.lineTo(front-.18,1.35);},2.02,yellow,.045).name='Bouclier Renault enveloppant';
 for(const side of[-1,1])panel(g,[[side*1.04,.72,front-.22],[side*1.04,1.28,front-.25],[side*1.04,1.33,2.75],[side*1.04,.75,2.65]],yellow);
 box(g,1.24,.085,.035,black,0,.72,front+.23);
 const plate=sign(g,'CIS VALMONT',.55,.12,0,.87,front+.235,'#edeedf',black);plate.name='Plaque de flotte';
 const grille=panel(g,[[-.52,.98,front+.24],[.52,.98,front+.24],[.73,1.44,front+.24],[-.73,1.44,front+.24]],black);grille.name='Calandre Renault';
 for(const y of[1.08,1.23,1.38])box(g,y<1.2?1.02:1.22,.024,.028,silver,0,y,front+.26);
 box(g,.2,.2,.035,silver,0,1.31,front+.28).rotation.z=Math.PI/4;
 for(const side of[-1,1]){
  const lamp=panel(g,[[side*.97,1.34,front+.18],[side*.42,1.36,front+.18],[side*.48,1.57,front+.18],[side*.9,1.53,front+.18]],'#e7e9dd');lamp.material=new T.MeshStandardMaterial({color:'#e7e9dd',emissive:'#fff1b3',emissiveIntensity:0,roughness:.2,side:T.DoubleSide});headlights.push(lamp);
  box(g,.12,.09,.04,'#d98b31',side*.92,1.3,front+.21);
  const recess=cylinder(g,.12,.12,.045,black,side*.8,.87,front+.22,12);recess.rotation.x=Math.PI/2;const fog=cylinder(g,.07,.07,.05,'#edf0dc',side*.8,.87,front+.25,12);fog.rotation.x=Math.PI/2;fog.name='Antibrouillard';
 }
 // Capot rouge continu et chevrons réellement plaqués sur sa pente.
 softenedProfile(g,s=>{s.moveTo(2.31,1.49);s.lineTo(front-.18,1.34);s.lineTo(front-.03,1.43);s.lineTo(2.38,1.58);},1.84,red,.025).name='Capot';
 const hoodY=z=>1.58-(z-2.38)*.15/(front-.03-2.38)+.025;
 for(const side of[-1,1]){
  const stripe=box(g,1,1,1,yellow);stripe.name='Chevrons réfléchissants capot';
  reflectiveBands(stripe,side<0?-.92:0,side<0?0:.92,2.39,front-.08,side*.45,Array.from({length:9},(_,i)=>1.45+i*.25),.13,0);
  const a=stripe.geometry.attributes.position;for(let j=0;j<a.count;j++){const z=a.getY(j);a.setXYZ(j,a.getX(j),hoodY(z)+.014,z);}stripe.geometry.computeVertexNormals();stripe.geometry.computeBoundingSphere();
 }
 const ambulance=sign(g,'AMBULANCE',1.42,.19,0,2.54,1.48,yellow,red);ambulance.rotation.x=-.73;
 // Rampes compactes avant/arrière et bande orange arrière. Aucun flash latéral.
 const blueStart=g.children.length;let frontBlue,rearBlue;
 if(options.signalStyle==='round'){
  frontBlue=[-.63,.63].map(x=>cylinder(g,.17,.19,.2,new T.MeshStandardMaterial({color:'#3982cc',emissive:'#168aff',emissiveIntensity:.15}),x,2.99,.96,18));
  rearBlue=[-.63,.63].map(x=>cylinder(g,.17,.19,.2,new T.MeshStandardMaterial({color:'#3982cc',emissive:'#168aff',emissiveIntensity:.15}),x,2.99,back+.12,18));
 }else{frontBlue=vsavBlueBar(g,.95,options.signalStyle==='short'?.5:.78);rearBlue=vsavBlueBar(g,back+.08,options.signalStyle==='short'?.5:.78);}
 beacons.push(...frontBlue,...rearBlue);const blueParts=g.children.slice(blueStart);
 const rearAmber=vsavAmberBar(g,back),light=new T.PointLight('#408bff',0,15,2),ring=new T.Mesh(new T.RingGeometry(4,4.08,32),new T.MeshBasicMaterial({color:'#83d3e6',transparent:true,opacity:.65}));
 light.position.set(0,3.25,.8);ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=light.visible=false;g.add(light,ring);
 g.userData={blueParts,kind:'VSAV',modelOrigin:'original-procedural',headlights,wheels,beacons,penetrationLights:[],light,ring,length,rearAmber,rearBlue,frontBlue,bodyStyle:isVan?'renault-master-van':'renault-cell-ambulance',ambulanceModel:isVan?'master':'cell'};
 return g;
}
function manAmbulance(parent,options={}){
 const g=new T.Group();parent.add(g);const length=6.25,front=length/2,back=-length/2,red='#d32628',yellow='#eaf21d',black='#243137',w=1.04;
 profile(g,[[back,.6],[front,.6],[front,1.23],[front-.22,1.48],[2.35,1.62],[1.48,2.52],[1.14,2.94],[-2.95,2.94],[back,2.78]],2.08,red);
 box(g,2.0,.1,4.15,red,0,2.96,-.92);box(g,.8,.13,.65,'#edece2',0,3.06,-.55);
 panel(g,[[-.91,1.65,2.365],[.91,1.65,2.365],[.9,2.52,1.5],[-.9,2.52,1.5]],'#20363e');
 const headlights=[],wheels=[],beacons=[];
 frontBumper(g,2.08,.9,.43,front,yellow);box(g,1.4,.33,.05,black,0,1.3,front+.028);for(const y of[1.21,1.3,1.39])box(g,1.29,.018,.03,'#667276',0,y,front+.06);sign(g,'MAN',.42,.12,0,1.31,front+.082,black,'#e2e5dd');
 box(g,.65,.14,.035,'#edf0dd',0,.77,front+.13);box(g,1.3,.12,.035,black,0,.98,front+.13);
 for(const side of[-1,1]){
  panel(g,[[side*1.048,1.65,2.26],[side*1.048,2.51,1.43],[side*1.048,2.6,.83],[side*1.048,1.65,.83]],'#263e48');
  box(g,.13,.27,.3,black,side*1.15,1.88,2.13);box(g,.05,.07,.24,black,side*1.068,1.52,.75);
  box(g,.035,.24,4.7,black,side*1.06,.7,-.61);box(g,.028,.065,5.35,yellow,side*1.068,1.31,-.2);box(g,.028,.065,4.2,yellow,side*1.068,2.78,-.85);for(const z of[1.24,-2.94])box(g,.028,1.46,.065,yellow,side*1.069,2.045,z);
  box(g,.025,1.43,.025,'#8e2729',side*1.074,1.97,-1.55);box(g,.05,.06,.23,black,side*1.084,1.67,-1.36);
  const label=sign(g,'SECOURS ET ASSISTANCE AUX VICTIMES',3.45,.2,side*1.085,1.56,-.92,red,'#f0f0df');label.rotation.y=side*Math.PI/2;
  for(const z of[1.92,-1.98]){const wheel=cylinder(g,.46,.46,.27,black,side*1.04,.59,z,18);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,.28,.28,.29,'#9ca9a7',side*1.055,.59,z,12);hub.rotation.z=Math.PI/2;const arch=new T.Mesh(new T.TorusGeometry(.53,.07,6,18,Math.PI),mat(black));arch.position.set(side*1.07,.59,z);arch.rotation.y=Math.PI/2;g.add(arch);}
  headlights.push(box(g,.33,.2,.06,new T.MeshStandardMaterial({color:'#f0ebd8',emissive:'#fff1b3',emissiveIntensity:0}),side*.85,1.4,front+.025));box(g,.12,.54,.08,'#bc302a',side*.94,1.0,back-.055);
  for(const [z0,z1]of[[2.4,2.905],[2.905,3.1]]){const band=box(g,1,1,1,yellow);reflectiveBands(band,side<0?-.99:0,side<0?0:.99,z0,z1,side*.4,[2.05,2.35,2.65,2.95,3.25,3.55],.15,0);const a=band.geometry.attributes.position;for(let j=0;j<a.count;j++){const z=a.getY(j);a.setXYZ(j,a.getX(j),(z<=2.905?1.62-(z-2.35)*.14/.555:1.48-(z-2.905)*.25/.22)+.006,z);}band.geometry.computeVertexNormals();band.geometry.computeBoundingSphere();}
 }
 const blueStart=g.children.length;let frontBlue,rearBlue;if(options.signalStyle==='round'){frontBlue=[-.65,.65].map(x=>cylinder(g,.2,.22,.25,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#168aff',emissiveIntensity:0}),x,3.15,1.06));rearBlue=[-.65,.65].map(x=>cylinder(g,.2,.22,.25,new T.MeshStandardMaterial({color:'#317fe1',emissive:'#168aff',emissiveIntensity:0}),x,3.15,back+.2));}else{frontBlue=vsavBlueBar(g,1.02,options.signalStyle==='short'?.5:1);rearBlue=vsavBlueBar(g,back,options.signalStyle==='short'?.5:1);}
 beacons.push(...frontBlue,...rearBlue);const blueParts=g.children.slice(blueStart);const rearAmber=vsavAmberBar(g,back),light=new T.PointLight('#408bff',0,15,2),ring=new T.Mesh(new T.RingGeometry(4,4.08,32),new T.MeshBasicMaterial({color:'#83d3e6'}));ring.rotation.x=-Math.PI/2;ring.visible=light.visible=false;light.position.y=3.4;g.add(light,ring);
 g.userData={blueParts,kind:'VSAV',headlights,wheels,beacons,light,ring,length,rearAmber,rearBlue,bodyStyle:'man-tge-van',ambulanceModel:'man'};return g;
}
function fptsrSignals(g,front,back,round=false){
 const blueStart=g.children.length;
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
 const blueParts=g.children.slice(blueStart);
 const amberStart=g.children.length;
 box(g,2.14,.25,.15,'#263439',0,2.83,back-.15);
 box(g,2.16,.035,.17,'#b6c4c4',0,2.975,back-.15);
 const rearAmber=Array.from({length:8},(_,i)=>box(g,.215,.15,.05,new T.MeshStandardMaterial({color:'#ce8b20',emissive:'#ff9b12',emissiveIntensity:.03,roughness:.22}),-.91+i*.26,2.83,back-.25));
 for(const part of g.children.slice(amberStart))part.userData.amberPart=true;
 return{frontBlue,rearBlue,rearAmber,blueParts};
}
function truckModel(parent,kind,color,options={}){if(kind==='CCF')options={...options,signalStyle:'round'};const g=new T.Group();parent.add(g);const tanker=kind==='CCGC',ccf=kind==='CCF',epa=kind==='EPA',rescue=kind==='VSR',length=options.lightPump?6.6:rescue?7.4:tanker?10.4:ccf?(options.lightForest?6.2:options.longChassis?9.05:7.65):8.4,width=2.5,front=length/2,back=-length/2,cabBack=tanker?3:ccf?(options.longChassis?1.45:.75):epa?2:rescue?1.05:.5,raise=ccf?.38:0,tyre=ccf?.88:.69,rubber='#222b2d',yellow='#dfea35',silver=mat('#b9c1bc',.3,.7),glass='#2b434c',white='#e5e9df';const wheels=[],headlights=[];
box(g,2.05,.4,length-.3,rubber,0,.78+raise,0);
profile(g,[[cabBack,1.12+raise],[front,1.12+raise],[front,2.57+raise],[front-.26,3.05+raise],[cabBack,3.13+raise]],width,color);
box(g,2.58,.15,front-cabBack+.08,ccf?white:color,0,3.16+raise,(front+cabBack)/2);
panel(g,[[-1.08,2.02+raise,front+.012],[1.08,2.02+raise,front+.012],[1.06,2.89+raise,front+.03],[-1.06,2.89+raise,front+.03]],glass);
for(const side of[-1,1]){const x=side*1.27;panel(g,[[x,2.04+raise,front-.16],[x,2.92+raise,front-.33],[x,2.92+raise,front-1.28],[x,2.04+raise,front-1.28]],glass);if(!epa&&!tanker)panel(g,[[x,2.02+raise,front-1.55],[x,2.94+raise,front-1.55],[x,2.94+raise,cabBack+.2],[x,2.02+raise,cabBack+.2]],glass);box(g,.045,.09,front-cabBack+.03,yellow,x,1.94+raise,(front+cabBack)/2);box(g,.055,1.42,.025,'#8e2824',x,1.94+raise,front-1.43);for(const z of[front-1.14,cabBack+.48])box(g,.07,.06,.2,rubber,x+side*.02,1.82+raise,z);box(g,.17,.43,.33,rubber,side*1.47,2.65+raise,front-.37);box(g,.35,.08,.68,silver,side*1.3,.89+raise,cabBack+.5);box(g,.31,.08,.61,silver,side*1.3,1.09+raise,cabBack+.5);}
box(g,1.35,.45,.05,rubber,0,1.58+raise,front+.055);for(let i=0;i<3;i++)box(g,1.24,.025,.06,silver,0,1.42+raise+i*.12,front+.085);frontBumper(g,2.48,.99+raise,.36,front+.1,ccf?rubber:'#d4dad7');for(const side of[-1,1]){headlights.push(box(g,.43,.25,.06,new T.MeshStandardMaterial({color:'#ecebdd',emissive:'#fff1b3',emissiveIntensity:0}),side*.91,1.1+raise,front+.32));box(g,.15,.13,.07,'#c3913c',side*1.13,1.1+raise,front+.32);}for(let i=-4;i<=4;i++){const chevron=box(g,.17,.15,.025,yellow,i*.25,1.9+raise,front+.025);chevron.rotation.z=i<0?-.42:.42;}
const bodyFront=cabBack-.18,bodyLength=bodyFront-back,bodyZ=(bodyFront+back)/2;
if(tanker){const tank=cylinder(g,1.16,1.16,bodyLength-.35,color,0,2.28,bodyZ,12);tank.rotation.x=Math.PI/2;for(const z of[bodyZ-1.8,bodyZ+1.8]){const strap=cylinder(g,1.18,1.18,.14,silver,0,2.28,z,12);strap.rotation.x=Math.PI/2;}cylinder(g,.4,.4,.15,silver,0,3.5,bodyZ,12);for(const side of[-1,1]){const label=sign(g,'CCGC • 12 000 L',4,.4,side*1.19,2.35,bodyZ,color,'#fff3d3');label.rotation.y=side*Math.PI/2;box(g,.05,.15,bodyLength-.2,yellow,side*1.2,1.65,bodyZ);}}else{box(g,2.4,ccf?1.65:epa?.85:2.0,bodyLength,color,0,(ccf?1.95:epa?1.48:2.04)+raise,bodyZ);box(g,2.55,.14,bodyLength+.1,silver,0,(ccf?2.85:epa?1.98:3.12)+raise,bodyZ);
for(const side of[-1,1]){const x=side*1.225;if(ccf){box(g,.12,.48,bodyLength-.35,yellow,x,1.5+raise,bodyZ);box(g,.08,1.1,bodyLength*.45,color,x,2.08+raise,bodyZ-.43);const plaque=sign(g,options.longChassis?'CCFS • SAPEURS-POMPIERS':'SAPEURS-POMPIERS',bodyLength-.2,.25,x+side*.04,2.65+raise,bodyZ,color,'#f5f2dc');plaque.rotation.y=side*Math.PI/2;box(g,.07,.09,bodyLength,yellow,x,1.15+raise,bodyZ);box(g,.07,.09,bodyLength,yellow,x,2.68+raise,bodyZ);box(g,.06,1.14,.72,silver,x+side*.02,1.9+raise,bodyFront-.46);}else{for(let i=0;i<3;i++){const segment=bodyLength/3-.12,z=back+(i+.5)*bodyLength/3;box(g,.06,epa?.62:1.57,segment,rescue?yellow:silver,x,epa?1.51:2.1,z);for(let j=0;j<(epa?4:9);j++)box(g,.072,.012,segment-.02,rescue?'#b5ad28':'#8d9a99',x+side*.012,1.29+j*.17,z);box(g,.075,.05,.37,'#4f5b60',x+side*.02,1.4,z);}box(g,.07,.06,bodyLength,yellow,x+side*.02,1.17,bodyZ);box(g,.07,.06,bodyLength,yellow,x+side*.02,epa?1.86:3.02,bodyZ);if(rescue){const plaque=sign(g,'SECOURS ROUTIER',bodyLength-.3,.24,x+side*.045,2.83,bodyZ,color,'#f5edb7');plaque.rotation.y=side*Math.PI/2;}}}
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
if(kind==='FPT')pumpRear(g,back,color,options.lightPump);else if(rescue)vsrRear(g,back,color,yellow);
box(g,2.45,.28,.18,white,0,.95+raise,back-.11);for(let i=-4;i<=4;i++){const stripe=box(g,.18,.47,.035,yellow,i*.25,1.32+raise,back-.04);stripe.rotation.z=i<0?-.5:.5;if(kind==='FPT')stripe.visible=false;}
const blueStart=g.children.length;const signals=['FPT','VSR'].includes(kind)?fptsrSignals(g,front,back,options.signalStyle==='round'||(kind==='FPT'&&options.signalStyle!=='wide'&&!!options.lightPump)):null;const beacons=signals?[...signals.frontBlue,...signals.rearBlue]:[];if(!signals)for(const side of[-1,1]){const material=new T.MeshStandardMaterial({color:'#357bcc',emissive:'#258aff',emissiveIntensity:.15});cylinder(g,.22,.23,.055,rubber,side*.74,3.25+raise,front-.48,16);beacons.push(cylinder(g,.2,.22,.24,material,side*.74,3.4+raise,front-.48,20));}if(ccf){const blue=new T.MeshStandardMaterial({color:'#357bcc',emissive:'#258aff',emissiveIntensity:.15});cylinder(g,.16,.17,.045,rubber,0,3.02+raise,back+.3,16);beacons.push(cylinder(g,.145,.16,.19,blue,0,3.135+raise,back+.3,20));}const blueParts=signals?.blueParts||g.children.slice(blueStart);const light=new T.PointLight('#408bff',0,15,2);light.visible=false;light.position.set(0,3.7+raise,front-.5);g.add(light);const ring=new T.Mesh(new T.RingGeometry(length*.65,length*.65+.09,48),new T.MeshBasicMaterial({color:'#83d3e6',transparent:true,opacity:.65,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;g.add(ring);const rearAmber=signals?.rearAmber||amberRear(g,(ccf?2.6:epa?1.78:2.9)+raise,back-.1);g.userData={...g.userData,blueParts,kind,headlights,wheels,beacons,light,ring,length,rearAmber,frontBlue:signals?.frontBlue,rearBlue:signals?.rearBlue,bodyStyle:rescue?'road-rescue':options.lightPump?'light-pumper':tanker?'single-cab-tanker':ccf?'off-road-cage':epa?'single-cab-aerial':'double-cab-pumper'};return g;}

export function hoseReel(parent){
 const g=new T.Group();parent.add(g);const black='#253033',red='#c63830',yellow='#e5dd53';
 for(const x of[-.5,.5]){box(g,.065,.68,1.14,red,x,.54,0);box(g,.065,.07,1.35,red,x,.86,.36);const wheel=cylinder(g,.36,.36,.1,black,x,.36,0,16);wheel.rotation.z=Math.PI/2;const hub=cylinder(g,.07,.07,.12,yellow,x,.36,0,10);hub.rotation.z=Math.PI/2;for(let i=0;i<3;i++){const spoke=box(g,.12,.045,.52,yellow,x,.36,0);spoke.rotation.x=i*Math.PI/3;}}
 box(g,1.08,.07,.07,red,0,.88,1.0);const drum=new T.Group();g.add(drum);drum.position.y=.76;const coil=cylinder(drum,.43,.43,.8,'#c7b680',0,0,0,16);coil.rotation.z=Math.PI/2;
 for(const x of[-.44,.44]){const rim=cylinder(drum,.48,.48,.035,red,x,0,0,16);rim.rotation.z=Math.PI/2;}
 return {g,drum,coil};
}

function vsrRear(g,back,color,yellow){
 const face=back-.055,black='#253137',metal='#b8c3c4';box(g,2.34,2.03,.045,color,0,2.02,face);
 for(const side of[-1,1]){const stripe=box(g,1,1,1,yellow);reflectiveBands(stripe,side<0?-1.15:0,side<0?0:1.15,.98,3.03,-side,Array.from({length:14},(_,i)=>-1.7+i*.34),.17,face-.035);for(const [y,c]of[[2.62,'#d83129'],[2.43,'#e0a336'],[2.24,'#e4eadc']])box(g,.16,.14,.04,c,side*1.02,y,face-.08);}
 box(g,1.25,.76,.035,yellow,0,1.72,face-.07);for(let i=0;i<6;i++)box(g,1.18,.012,.02,'#b5ad28',0,1.44+i*.11,face-.1);box(g,.11,.32,.055,black,0,1.7,face-.13);box(g,2.42,.11,.45,metal,0,.91,back-.22);g.userData.rearOverhang=.55;
}
function pumpRear(g,back,color,lightPump){
 const group=new T.Group();group.name='Pompe et dévidoirs arrière';g.add(group);const face=back-.045,yellow='#e5ed38',metal='#b7c0c0',black='#253137';
 box(group,2.32,2.0,.035,color,0,2.02,face);
 for(const side of[-1,1]){const stripe=box(group,1,1,1,yellow);reflectiveBands(stripe,side<0?-1.15:.84,side<0?-.84:1.15,1.05,3.0,-side,Array.from({length:15},(_,i)=>i*.32-1.8),.16,face-.023);box(group,.27,.43,.065,black,side*1.02,2.52,face-.045);for(const [y,c]of[[2.63,'#d83129'],[2.51,'#e0a336'],[2.39,'#e4eadc']])box(group,.22,.095,.035,c,side*1.02,y,face-.09);}
 box(group,1.6,1.12,.05,metal,0,2.36,face-.04);for(let i=0;i<12;i++)box(group,1.54,.012,.012,'#849392',0,1.86+i*.087,face-.073);box(group,.48,.045,.04,black,0,1.88,face-.09);
 box(group,1.65,.64,.06,black,0,1.44,face-.047);
 for(const x of[-.5,0,.5]){const outlet=cylinder(group,x===0?.14:.1,x===0?.14:.1,.16,metal,x,1.43,face-.15,12);outlet.rotation.x=Math.PI/2;const cap=cylinder(group,.075,.075,.035,black,x,1.43,face-.25,12);cap.rotation.x=Math.PI/2;box(group,.2,.035,.05,'#c83930',x,1.66,face-.17);}
 box(group,2.38,.09,.48,metal,0,.98,back-.22);const reels=[];
 for(const x of(lightPump?[0]:[-.62,.62])){box(group,.13,.45,.57,'#798b8c',x,.82,back-.25);const r=hoseReel(group);r.g.position.set(x,.65,back-.38);r.g.rotation.y=Math.PI/2;r.g.scale.setScalar(.72);reels.push(r.g);}
 g.userData.carriedHoseReels=reels;g.userData.rearOverhang=.9;
}

function vsavAmberBar(g,back){const start=g.children.length;box(g,1.94,.24,.15,'#273034',0,2.53,back-.16);box(g,1.97,.035,.16,'#8c9998',0,2.67,back-.16);const lamps=Array.from({length:8},(_,i)=>box(g,.195,.13,.045,new T.MeshStandardMaterial({color:'#dc971f',emissive:'#ffa415',emissiveIntensity:.03,roughness:.23}),-.805+i*.23,2.53,back-.26));for(const part of g.children.slice(start))part.userData.amberPart=true;return lamps;}
function vsavBlueBar(g,back,factor=1){box(g,1.98*factor,.055,.32,'#273034',0,2.94,back+.02);box(g,1.96*factor,.035,.3,'#d0d9d4',0,3.095,back+.02);return Array.from({length:8},(_,i)=>box(g,.205*factor,.12,.29,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.15,roughness:.23}),(-.805+i*.23)*factor,3.02,back+.02));}

export function dressMedicalResponder(g,enabled=true){
 let kit=g.userData.medicalUniform;
 if(!kit){
  kit={original:g.children.slice(0,5).map(m=>m.material),parts:[],stationParts:[]};g.userData.medicalUniform=kit;
  const add=(parent,w,h,d,color,x,y,z)=>{const part=box(parent,w,h,d,color,x,y,z);kit.parts.push(part);return part;},station=(parent,w,h,d,color,x,y,z)=>{const part=box(parent,w,h,d,color,x,y,z);kit.stationParts.push(part);return part;};
  add(g.children[0],.535,.085,.32,'#bd4e45',0,.18,0);
  add(g.children[0],.535,.05,.325,'#c5d0cd',0,-.2,0);
  add(g.children[0],.14,.09,.018,'#d9e4df',-.15,.02,.162);
  for(const i of[1,2]){add(g.children[i],.215,.065,.245,'#bac9c7',0,-.14,0);add(g.children[i],.22,.15,.33,'#1c282f',0,-.28,.035);}
  for(const i of[3,4]){add(g.children[i],.155,.05,.195,'#b7cacb',0,-.14,0);add(g.children[i],.15,.15,.19,'#8bc9de',0,-.32,0);}
  // Tenue légère du CIS : tee-shirt bleu nuit à liseré rouge et bandes claires au bas du pantalon.
  station(g.children[0],.535,.035,.325,'#c84a43',0,.2,0);
  station(g.children[0],.16,.035,.018,'#d8e0dd',-.14,.02,.162);
  for(const i of[1,2])for(const y of[-.08,-.18])station(g.children[i],.215,.045,.245,'#d7dfdc',0,y,0);
 }
 for(const part of kit.parts)part.visible=enabled;
 for(const part of kit.stationParts)part.visible=!enabled;
 g.children.slice(0,5).forEach((m,i)=>m.material=enabled?mat(i===1||i===2?'#203349':'#29455e'):mat(i===1||i===2?'#1d2b36':'#263b4e'));
 g.userData.uniform=enabled?'ssuap':'station';
}
export function setInterventionHelmet(g,enabled){
 if(!g.userData.interventionHelmet&&enabled)g.userData.interventionHelmet=helmetF1(g,'#e9e8dc');
 if(g.userData.interventionHelmet)g.userData.interventionHelmet.visible=!!enabled;
}
export function medicalResponder(parent,x=0,z=0){const g=person(parent,x,z,'#29455e');g.name='Sapeur-pompier · secours à personne';dressMedicalResponder(g);return g;}
export function captain(parent,x=0,z=0,profile=DEFAULT_PROFILE){const g=person(parent,x,z,'#25364f');g.userData.role='captain';dressCaptain(g,profile);return g;}
export function dressCaptain(g,profile=DEFAULT_PROFILE){
 const key=profile.outfit+':'+profile.grade;g.userData.playerName=profile.name;
 if(g.userData.uniformKey===key)return;
 disposeObject(g.userData.uniform);const uniform=new T.Group();g.add(uniform);g.userData.uniform=uniform;g.userData.uniformKey=key;g.userData.outfit=profile.outfit;g.userData.grade=profile.grade;
 const fire=profile.outfit==='fire',station=profile.outfit==='station';
 for(const i of[0,3,4])g.children[i].material=mat(fire?'#3e4645':'#25364f');
 if(!station){box(uniform,.56,.58,.34,fire?'#3e4645':'#d8e43e',0,1.12,0);box(uniform,.58,.07,.36,fire?'#dde581':'#e9eeee',0,1,0);helmetF1(uniform,'#e9e8dc');if(fire){for(const side of[-1,1])box(uniform,.21,.09,.25,'#dde581',side*.15,.42,0);box(uniform,.46,.07,.02,'#dde581',0,1.3,.185);box(uniform,.47,.11,.035,'#60717a',0,1.69,.245);}}
 else {box(uniform,.53,.05,.015,'#c95143',0,1.2,.16);}
 const stripes=({lieutenant:2,captain:3,commandant:4,lieutenantColonel:5,colonel:5})[profile.grade]||3;
 box(uniform,.2,.2,.025,'#25364f',.13,1.31,.19);
 for(let i=0;i<stripes;i++)box(uniform,.14,.02,.018,profile.grade==='lieutenantColonel'&&i%2?'#d6dedc':'#efd27e',.13,1.37-i*.027,.212);
}

export function addPenetrationLights(model){if(model.userData.playerVehicle==='car'||model.userData.penetrationLights?.length)return;const truck=['FPT','VSR','CCF','EPA','CCGC'].includes(model.userData.kind),front=model.userData.length/2,y=model.userData.penetrationY??(model.userData.kind==='CCF'?1.58:truck?model.userData.headlights[0].position.y:1.17),base=model.userData.penetrationOffset??(model.userData.kind==='CCF'?.72:truck?.30:.052);model.userData.penetrationLights=[-1,1].map(side=>{box(model,.28,.14,.04,'#20282b',side*.55,y,front+base);return box(model,.21,.09,.035,new T.MeshStandardMaterial({color:'#91bdd0',emissive:'#1787ff',emissiveIntensity:.03,roughness:.23}),side*.55,y,front+base+.02);});}

export function addAmbulanceDoors(model){if(model.userData.kind!=='VSAV')return;const back=-model.userData.length/2;box(model,2.05,1.82,.025,'#14222a',0,1.7,back-.11);box(model,1.95,.08,.35,'#aeb9ba',0,.8,back-.22);model.userData.rearDoors=[-1,1].map(side=>{const pivot=new T.Group();pivot.position.set(side*1.04,1.7,back-.16);model.add(pivot);const x=-side*.515;box(pivot,1.02,1.78,.075,'#d32628',x,0,0);box(pivot,.78,.52,.035,'#263e48',x,.48,-.055);box(pivot,.92,.05,.025,'#eaf21d',x,.86,-.05);for(let i=0;i<3;i++){const stripe=box(pivot,.15,.68,.03,'#eaf21d',x-.29+i*.29,-.36,-.06);reflectiveBands(stripe,x-.495,x+.495,-.87,.87,-side,Array.from({length:9},(_,n)=>n-4).filter(n=>(n+4)%3===i).map(n=>n*.43-1.04),.215,-.041);stripe.name='Chevron réfléchissant porte';}box(pivot,.07,.22,.045,'#20282b',-side*.91,-.08,-.08);for(const y of[-.55,.55])box(pivot,.1,.2,.12,'#b7c0c0',0,y,-.02);return{pivot,side};});}

function supportTruck(parent,kind,color){
 const g=new T.Group();parent.add(g);g.name=kind==='PC'?'Poste de commandement':'Porteur avec berce alimentation';
 const black='#243037',yellow='#e7df42',metal='#b4bdbd',glass='#294754',length=8.6,front=4.3,back=-4.3;
 box(g,2.1,.35,8.1,black,0,.77,0);
 profile(g,[[2,1],[front,1],[front,2.5],[4,3.05],[2,3.05]],2.5,color);
 box(g,2.1,.78,.045,glass,0,2.43,front+.015);
 const headlights=[],wheels=[];for(const side of[-1,1]){
 box(g,.045,.79,1.46,glass,side*1.27,2.43,3.1);box(g,.13,.42,.28,black,side*1.43,2.45,3.9);
 box(g,.045,.09,2.15,yellow,side*1.28,1.86,3.13);box(g,.045,.06,.3,metal,side*1.29,1.75,2.36);
 headlights.push(box(g,.44,.24,.08,new T.MeshStandardMaterial({color:'#eeeaca',emissive:'#fff1b3',emissiveIntensity:0}),side*.88,1.22,front+.08));
 for(const z of[3,-2.35,-3.65]){const wheel=cylinder(g,.65,.65,.35,black,side*1.16,.66,z,16);wheel.rotation.z=Math.PI/2;wheels.push(wheel);const hub=cylinder(g,.34,.34,.37,metal,side*1.18,.66,z,12);hub.rotation.z=Math.PI/2;}
 }
 frontBumper(g,2.5,.92,.3,front+.1,metal);box(g,1.25,.43,.05,black,0,1.51,front+.03);for(let i=0;i<3;i++)box(g,1.17,.025,.06,metal,0,1.37+i*.12,front+.07);for(let i=-4;i<=4;i++){const stripe=box(g,.15,.23,.026,yellow,i*.23,1.89,front+.025);stripe.rotation.z=i<0?-.45:.45;}
 for(const side of[-1,1]){box(g,.07,.18,6,black,side*1.25,1,-1.2);for(const z of[3,-2.35,-3.65])for(let i=0;i<6;i++)box(g,.012,.065,.065,black,side*1.37,.66+Math.sin(i*Math.PI/3)*.25,z+Math.cos(i*Math.PI/3)*.25);}
 if(kind==='PC'){
 box(g,2.45,2.25,6,color,0,2.13,-1.15);box(g,2.53,.13,6.08,'#e6e8df',0,3.31,-1.15);
 for(const side of[-1,1]){for(const z of[-2.6,-.2]){box(g,.06,.83,1.38,metal,side*1.25,2.43,z);box(g,.065,.7,1.25,glass,side*1.26,2.43,z);}box(g,.07,.09,5.75,yellow,side*1.25,1.35,-1.15);const label=sign(g,'POSTE DE COMMANDEMENT',4.9,.24,side*1.28,3,-1.1,null,'#fff1cb');label.rotation.y=side*Math.PI/2;}
 box(g,.07,1.65,.72,metal,1.25,1.88,1.19);box(g,.36,.12,.9,black,1.42,1,1.19);
 for(const z of[-2.9,.7])cylinder(g,.026,.026,1.6,black,.8,4.08,z,6);
 const dish=new T.Mesh(new T.SphereGeometry(.46,12,6,0,Math.PI*2,0,Math.PI/2),mat('#dddeda'));dish.rotation.x=.6;dish.position.set(-.55,3.43,-1.5);g.add(dish);
 }else{
 box(g,2.4,.18,5.75,metal,0,1.19,-1.32);for(const side of[-1,1]){box(g,.1,1.58,5.75,color,side*1.19,2.01,-1.32);box(g,.13,.1,5.8,yellow,side*1.19,2.72,-1.32);for(const z of[-3.9,-2.45,-1,.65])box(g,.15,1.65,.1,metal,side*1.2,2,z);const label=sign(g,'BERCE ALIMENTATION',4.8,.24,side*1.28,2.36,-1.4,null,'#fff1cb');label.rotation.y=side*Math.PI/2;}
 for(let i=0;i<12;i++)box(g,2.06,.14,.37,i%2?'#c5b89c':'#e4d7ba',0,2.42+(i%3)*.07,-3.77+i*.43);
 for(const x of[-.75,.75])box(g,.13,.16,5.8,black,x,1.06,-1.32);
 const hook=box(g,.18,1.78,.19,black,0,1.93,1.43);hook.rotation.x=-.18;box(g,.2,.16,.55,black,0,2.82,1.38);
 for(const side of[-1,1]){const roller=cylinder(g,.2,.2,.26,black,side*.85,1.15,back,12);roller.rotation.z=Math.PI/2;}
 }
 const beacons=[],blueParts=[];for(const z of[3.45,-3.9])for(const side of[-1,1]){const y=z>0?3.13:kind==='PC'?3.4:2.82;blueParts.push(cylinder(g,.16,.17,.045,black,side*.83,y,z,12));const lamp=cylinder(g,.15,.17,.19,new T.MeshStandardMaterial({color:'#357bcc',emissive:'#258aff',emissiveIntensity:.15}),side*.83,y+.12,z,16);beacons.push(lamp);blueParts.push(lamp);}
 const light=new T.PointLight('#408bff',0,15,2);light.visible=false;g.add(light);const ring=new T.Mesh(new T.RingGeometry(5.5,5.6,40),new T.MeshBasicMaterial({color:'#83d3e6',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.07;ring.visible=false;g.add(ring);
 g.userData={kind,length,headlights,wheels,beacons,blueParts,light,ring,rearAmber:amberRear(g,1.4,back-.06),frontBlue:beacons.slice(0,2),rearBlue:beacons.slice(2),bodyStyle:kind==='PC'?'command-truck':'hose-container'};return g;
}

export function configureAmber(g,kind,technology){
 const old=g.userData.rearAmber||[],startParts=new Set(g.children),y=kind==='VLI'?1.8:g.userData.playerVehicle==='car'||kind==='POLICE'?.92:kind==='VLCG'?1.95:kind==='EPA'?1.78:(g.userData.amberMountY??=(old.length?Math.max(...old.map(l=>l.position.y)):2.6)),z=-g.userData.length/2-.12;
 for(const part of [...g.children])if(part.userData.amberPart||part.userData.configuredAmber||old.includes(part))g.remove(part);
 const lamps=[];g.userData.rearAmber=lamps;g.userData.signalAmber=technology;
 if(technology==='none')return;
 const material=()=>new T.MeshStandardMaterial({color:'#da901c',emissive:'#ff9d16',emissiveIntensity:.03,roughness:.25});
 if(technology==='round'){
  const top=g.userData.playerVehicle==='car'||kind==='POLICE'?1.72:kind==='VLCG'?2.24:kind==='EPA'?2.12:kind==='CCF'?3.4:['PC','VPCE','FPT','VSR'].includes(kind)?kind==='VPCE'?2.84:3.35:kind==='VSAV'?3.08:2.82;
  for(const x of[-.85,.85]){cylinder(g,.17,.18,.045,'#273238',x,top,g.userData.playerVehicle==='car'||kind==='POLICE'?-.7:z+.48,14);lamps.push(cylinder(g,.145,.16,.19,material(),x,top+.12,g.userData.playerVehicle==='car'||kind==='POLICE'?-.7:z+.48,16));}
 }else{const width=technology==='short'?1.05:2.05;box(g,width,.21,.13,'#273238',0,y,z);for(let i=0;i<8;i++)lamps.push(box(g,width/8-.027,.12,.05,material(),-width/2+width*(i+.5)/8,y,z-.08));}
 for(const p of g.children)if(!startParts.has(p))p.userData.configuredAmber=true;
}
