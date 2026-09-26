import * as T from 'three';
import {disposeObject} from './dispose.js';
export function createIncidentFx(scene,building,scale=[1,1,1],forest=false){
 const g=new T.Group();g.position.copy(building.position);g.scale.set(...scale);g.visible=false;scene.add(g);
 const smoke=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#4e5555',transparent:true,opacity:.56,depthWrite:false}),34);
 smoke.instanceMatrix.setUsage(T.DynamicDrawUsage);g.add(smoke);
 const fire=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#ff9a21',transparent:true,opacity:.92}),25);
 fire.instanceMatrix.setUsage(T.DynamicDrawUsage);g.add(fire);
 const orange=new T.PointLight('#ff7722',150,25,2);orange.position.set(5,7,14);g.add(orange);
 const dummy=new T.Object3D(),color=new T.Color();for(let i=0;i<25;i++)fire.setColorAt(i,color.set(['#ffe780','#ff762b','#ffb631'][i%3]));
 let enabled=false,disposed=false,lastTime=-Infinity;
 return{setActive(v){enabled=v;g.visible=v&&!disposed;},update(t,intensity,spread=0,front=null){
  if(disposed||!enabled||intensity<=0){g.visible=false;return;}g.visible=true;
  if(t-lastTime<1/30)return;lastTime=t;
  for(let i=0;i<34;i++){const life=(t*.23+i*.119)%1;dummy.position.set(4+Math.sin(i*5)*3+life*5,9+life*26,11+Math.cos(i*7)*3+life*4);dummy.scale.setScalar((1.4+life*4.7)*Math.max(.2,intensity));dummy.rotation.set(life,i,life*.4);dummy.updateMatrix();smoke.setMatrixAt(i,dummy.matrix);}smoke.instanceMatrix.needsUpdate=true;
  for(let i=0;i<25;i++){const phase=(t*1.5+i*.18)%1;const width=forest?1+Math.max(0,spread)*2.5:1;const lateral=Math.cos(i*3)*(front?.flank||1.4*width),along=front?((Math.sin(i*13)+1)/2)*(front.downwind+front.upwind)-front.upwind:Math.sin(i*13)*5*width,angle=front?.direction||0;dummy.position.set(5+(along*Math.cos(angle)-lateral*Math.sin(angle))/(front?scale[0]:1),4+phase*7,13.8+(along*Math.sin(angle)+lateral*Math.cos(angle))/(front?scale[2]:1));dummy.scale.set((.4+Math.sin(t*8+i)*.2)*intensity,(1.3-phase*.8)*intensity,.45*intensity);dummy.updateMatrix();fire.setMatrixAt(i,dummy.matrix);}fire.instanceMatrix.needsUpdate=true;orange.intensity=intensity*(90+Math.sin(t*9)*30);
 },dispose(){if(disposed)return;disposed=true;disposeObject(g);}};
}
