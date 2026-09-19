import * as T from 'three';
import {box,cylinder,sign,mat,person} from './models.js';
import {BEACH,lakeEdge,beachOpen} from './beach-layout.js';

export function createBeach(root){
 const ground=new T.Group();ground.name='Plage de l’Étang';root.add(ground);
 const shape=new T.Shape(),outline=[];
 for(let i=0;i<=28;i++)outline.push(lakeEdge(-.6+i/28*2.35,1.01));
 for(let i=28;i>=0;i--)outline.push(lakeEdge(-.6+i/28*2.35,1.42));
 outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const sand=new T.Mesh(new T.ShapeGeometry(shape),mat('#d8c593'));sand.rotation.x=-Math.PI/2;sand.position.y=.12;sand.receiveShadow=true;ground.add(sand);
 // A clear rescue apron connects the existing lake access to the dry beach.
 box(ground,21,.08,5,'#b2aa8b',120,.20,-155);
 box(ground,12,.09,22,'#a5a58b',123,.16,-141);
 for(const p of BEACH.parking)for(const side of[-1,1])box(ground,8,.025,.11,'#e6dcc1',p.target[0],.23,p.target[1]+side*2.4);
 sign(ground,'ACCÈS SECOURS',9,.7,128,1.8,-132,'#416769','#f8eed3');
 sign(ground,'PLAGE DE L’ÉTANG',13,1.3,113,2.1,-122,'#376e78','#f8eed3');
 for(let i=0;i<15;i++)box(ground,3,.08,.34,'#b5a181',109+i*.6,.21,-128-i*.5);
 const umbrellaPoints=[lakeEdge(.64,1.28),lakeEdge(1.12,1.28),lakeEdge(-.42,1.29)];
 for(const [i,[x,z]]of umbrellaPoints.entries()){
  cylinder(ground,.065,.075,2.7,'#d8d0b5',x,1.48,z,8);
  const canopy=new T.Mesh(new T.ConeGeometry(2.2,.7,8),mat(['#dcac62','#678f98','#b56b59'][i]));canopy.position.set(x,2.9,z);canopy.castShadow=true;ground.add(canopy);
  const towel=box(ground,1.4,.03,2.6,['#6695a1','#d18b63','#e3dbb5'][i],x+1,.17,z+2.6);towel.rotation.y=.2+i*.6;
 }
 for(const x of[97,102]){box(ground,2.8,.15,.7,'#8e7657',x,.7,-119);box(ground,2.8,.6,.13,'#8e7657',x,1.05,-119.3);for(const side of[-1,1])box(ground,.13,.6,.55,'#546860',x+side,.35,-119);}
 cylinder(ground,.38,.38,.9,'#506c63',106,.6,-120,8);
 cylinder(ground,.07,.09,4,'#ddd6bd',110,2,-126,8);box(ground,1.4,.75,.035,'#63989c',110.7,3.7,-126);
 const buoy=new T.Mesh(new T.TorusGeometry(.46,.12,6,16),mat('#df7d40'));buoy.position.set(110,1.5,-126);ground.add(buoy);
 // Buoys mark the swimming area; leave the northern launch corridor open.
 for(let i=0;i<=12;i++){const [x,z]=lakeEdge(.22+i/12*1.2,.73);cylinder(ground,.19,.23,.22,i%2?'#eee5bb':'#dba33c',x,.3,z,8);}
 const visitors=new T.Group();visitors.name='Baigneurs et promeneurs';root.add(visitors);
 const walkers=[];
 for(const [i,point]of [lakeEdge(.45,1.26),lakeEdge(.82,1.25),lakeEdge(1.3,1.24)].entries()){
  const model=person(visitors,...point,['#729cab','#c68563','#a7ab78'][i]);
  walkers.push({model,point,phase:i*2});
 }
 const swimmers=[];
 for(const [i,a]of [.4,.85,1.1].entries()){
  const point=lakeEdge(a,.83),model=person(visitors,...point,['#889caa','#c59568','#a0afa0'][i]);
  model.position.y=-1.15;swimmers.push({model,point,phase:i*2});
 }
 return{ground,visitors,update(elapsed,minute){
  visitors.visible=beachOpen(minute);if(!visitors.visible)return;
  for(const {model,point,phase}of walkers){const t=Math.sin(elapsed*.18+phase);model.position.set(point[0]+t*.7,0,point[1]+Math.cos(elapsed*.18+phase)*.6);model.rotation.y=elapsed*.18+phase;model.children[1].rotation.x=Math.sin(elapsed*3+phase)*.22;model.children[2].rotation.x=-Math.sin(elapsed*3+phase)*.22;}
  for(const {model,point,phase}of swimmers){model.position.set(point[0]+Math.sin(elapsed*.3+phase)*.45,-1.15+Math.sin(elapsed*1.8+phase)*.05,point[1]);model.rotation.y=phase;}
 }};
}
