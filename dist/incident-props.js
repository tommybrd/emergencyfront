import * as T from 'three';
import {rescueWreck} from './extrication-visuals.js';
import {box,cylinder,vehicle} from './models.js';

function civilCar(parent,x,z,yaw,burned=false){
 const car=vehicle(parent,'VLCG',burned?'#514b46':'#82918b');
 car.position.set(x,0,z);car.rotation.y=yaw;
 for(const key of ['beacons','rearAmber','penetrationLights'])car.userData[key]?.forEach(light=>light.visible=false);
 car.userData.light.visible=false;
 return car;
}

function bike(parent,bicycle=false){
 const g=new T.Group();parent.add(g);g.rotation.set(0,.6,1.1);g.position.y=.45;
 for(const z of[-.85,.85]){const w=new T.Mesh(new T.TorusGeometry(.38,bicycle?.045:.11,6,12),new T.MeshStandardMaterial({color:'#24292c'}));w.rotation.y=Math.PI/2;w.position.set(0,.42,z);g.add(w);}
 const frame=cylinder(g,bicycle?.055:.14,bicycle?.055:.14,1.6,bicycle?'#4e98b0':'#be3f32',0,.7,0,8);frame.rotation.x=Math.PI/2;
 box(g,bicycle?.22:.48,.12,.55,'#24292c',0,.88,-.25);
 const fork=cylinder(g,.045,.045,.9,'#b7bdba',0,.8,.8,6);fork.rotation.x=-.25;
 const bar=cylinder(g,.035,.035,.8,'#b7bdba',0,1.18,.7,6);bar.rotation.z=Math.PI/2;
 return g;
}

function refuseBin(parent,x=0,z=0){
 box(parent,.95,1.1,.8,'#3e5448',x,.55,z);box(parent,1.04,.12,.87,'#263c32',x,1.14,z);
 for(const side of[-1,1]){const w=cylinder(parent,.14,.14,.1,'#24282b',x+side*.44,.15,z+.3,8);w.rotation.z=Math.PI/2;}
}

export function incidentProps(world,c){
 const h=new T.Group();world.add(h);h.name='Incident '+c.id+' · '+c.scene;h.userData.incidentScene=c.scene;
 const p=c.actionPoint||c.target;h.position.set(p[0],.15,p[1]);
 const style=c.scene;
 if(c.type==='AVP'){
  if(['motorcycle','bicycle'].includes(style))bike(h,style==='bicycle');
  else {const count=style==='pileup'?4:['single-car','pedestrian'].includes(style)?1:2;for(let i=0;i<count;i++)(c.extrication&&i===0?rescueWreck:civilCar)(h,(i%2)*4-2,Math.floor(i/2)*6+(i%2?2:-1),i%2?1.5:.3);h.userData.vehicleCount=count;}
 }else if(c.type==='INC'){
  if(style==='vehicle')civilCar(h,0,0,c.site?.yaw||0,true);
  if(style==='motorcycle')bike(h);
  if(style==='bin')refuseBin(h);
  if(['bin-room','garage'].includes(style)){
   h.rotation.y=c.site?.yaw||0;
   box(h,style==='garage'?5:3.2,2.3,2.4,'#b0b1a3',0,1.15,0);
   box(h,style==='garage'?4:2.4,1.9,.08,'#444c49',0,1,1.23);
   box(h,style==='garage'?5.3:3.5,.2,2.7,'#6e7872',0,2.4,0);
   if(style==='bin-room')refuseBin(h,1.8,1.8);
  }
  if(style==='chimney'){
   h.position.set(c.target[0],c.site.height+1,c.target[1]);
   box(h,.85,1.8,.85,'#9a735f',0,.9,0);box(h,1.1,.18,1.1,'#495254',0,1.8,0);
  }
 }else if(c.type==='OD'){
  if(style==='branch'){const log=cylinder(h,.35,.48,7,'#74634f',0,.65,0,8);log.rotation.z=Math.PI/2;for(let i=0;i<3;i++){const twig=cylinder(h,.10,.16,2.7,'#74634f',i*2-2,.8,-1,6);twig.rotation.x=1.2;}}
  if(style==='debris')for(let i=0;i<7;i++){const part=box(h,.7+(i%2),.22,.6,'#8c857b',Math.sin(i*3)*2,.17,Math.cos(i*2)*1.6);part.rotation.y=i;}
  if(['flood','flood-garage'].includes(style)){
   h.rotation.y=c.site?.yaw||0;
   // Water emerges through the cellar/garage opening at the building facade.
   box(h,style==='flood'?1.7:3.6,.75,.10,'#263b3e',0,.35,-.65);
   box(h,style==='flood'?2:4,.05,1.5,new T.MeshStandardMaterial({color:'#438caa',transparent:true,opacity:.72}),0,.05,0);
  }
  if(style==='elevator'){
   h.rotation.y=c.site?.yaw||0;
   box(h,1.9,2.5,.14,'#7f8e8d',0,1.25,0);box(h,.92,2.22,.10,'#435356',-.48,1.14,.1);box(h,.92,2.22,.10,'#435356',.48,1.14,.1);
   box(h,.12,.3,.12,'#eea351',1.14,1.25,.05);
  }
  if(style==='roof'){
   h.position.set(c.target[0],c.site.height+1,c.target[1]);
   for(let i=0;i<7;i++){const tile=box(h,.65,.13,.45,'#9e6652',(i%3)*.72,0,Math.floor(i/3)*.55);tile.rotation.z=i%2?.3:-.2;}
   box(h,2.8,.03,2,'#cba863',.7,-.05,.5);
  }
  if(style==='animal'){
   box(h,.75,.38,.35,'#aa9174',0,.46,0);box(h,.28,.3,.3,'#aa9174',.45,.59,0);
   for(const x of[-.24,.24])for(const z of[-.12,.12])box(h,.09,.3,.09,'#6c5c4d',x,.19,z);
   box(h,.13,.6,.12,'#647769',-.8,.3,.55);box(h,1.6,.12,.12,'#647769',0,.65,.55);
  }
  if(style==='fuel'){civilCar(h,0,0,c.site?.yaw||0);box(h,2,.02,1.6,new T.MeshStandardMaterial({color:'#665c43',transparent:true,opacity:.65}),1.9,.02,-1.2);}
 }
 return h;
}

export function fireAnchor(c){
 const style=c.scene||'house';
 const scales={vehicle:[.35,.24,.45],motorcycle:[.2,.2,.2],bin:[.15,.18,.15],'bin-room':[.32,.35,.3],garage:[.45,.4,.35],chimney:[.15,.18,.15],kitchen:[.42,.45,.4],apartment:[.6,.65,.5],shop:[.9,.8,.7],house:[.8,.9,.7],vegetation:[.7,.45,.7],forest:[1,.7,1]};
 const scale=scales[style]||[.8,.7,.7];
 c.fireTarget=(c.actionPoint||c.target).slice();
 c.fireHeight=['bin','motorcycle'].includes(style)?1:style==='vehicle'?1.2:3;
 let base=0;
 if(style==='chimney'){c.fireTarget=c.target.slice();base=(c.site?.height||6)+2;c.fireHeight=base+.6;}
 if(style==='apartment'){base=3;c.fireHeight=6;}
 const anchor=new T.Group();anchor.position.set(c.fireTarget[0]-5*scale[0],base,c.fireTarget[1]-13*scale[2]);
 return{anchor,scale};
}
