import * as T from 'three';
import {person,box,cylinder} from './models.js';
import {nearestRoad} from './roads.js';
import {dynamicTube} from './dynamic-tube.js';
import {walkRoute} from './building-actions.js';
const clamp=n=>Math.max(0,Math.min(1,n));
function along(path,fraction){const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));let rest=lengths.reduce((a,b)=>a+b,0)*clamp(fraction);for(let i=0;i<lengths.length;i++){if(rest<=lengths[i]||i===lengths.length-1){const k=lengths[i]?rest/lengths[i]:1,a=path[i],b=path[i+1];return{x:a[0]+(b[0]-a[0])*k,z:a[1]+(b[1]-a[1])*k,yaw:Math.atan2(b[0]-a[0],b[1]-a[1])};}rest-=lengths[i];}return{x:path[0][0],z:path[0][1],yaw:0};}
function supplyPath(e,back,anchor){
 const p=e.model.position,yaw=e.model.rotation.y,length=e.model.userData.length||7,dx=anchor.x-p.x,dz=anchor.z-p.z,localX=Math.cos(yaw)*dx-Math.sin(yaw)*dz,localZ=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
 const toWorld=(x,z)=>[p.x+Math.cos(yaw)*x+Math.sin(yaw)*z,p.z-Math.sin(yaw)*x+Math.cos(yaw)*z];
 const side=(localX<0?-1:1)*3.2,behind=-length/2-1,points=[[back.x,back.z]];
 if(localZ>behind){points.push(toWorld(side,behind));points.push(toWorld(side,Math.abs(localX)<2.5?length/2+1.8:localZ));}
 points.push([anchor.x,anchor.z]);const route=[points[0]];for(let i=1;i<points.length;i++){const leg=walkRoute(points[i-1],points[i]);route.push(...(leg||[points[i-1],points[i]]).slice(1));}return route;
}
function reelCart(parent){const g=new T.Group();parent.add(g);for(const x of[-.55,.55]){box(g,.07,.65,1.3,'#bfc7c4',x,.5,0);box(g,.07,.07,1.5,'#bfc7c4',x,.86,.5);const wheel=cylinder(g,.35,.35,.12,'#252e30',x,.35,0,12);wheel.rotation.z=Math.PI/2;}box(g,1.15,.08,.1,'#cf3231',0,.86,1.2);const drum=new T.Group();g.add(drum);drum.position.y=.78;const coil=cylinder(drum,.46,.46,.84,'#c7b680',0,0,0,14);coil.rotation.z=Math.PI/2;for(const x of[-.47,.47]){const side=cylinder(drum,.53,.53,.04,'#c23932',x,0,0,12);side.rotation.z=Math.PI/2;}return{g,drum,coil};}
export function supplyCrew(world,engines){
 const records=engines.filter(e=>e.capacity).map(e=>{const group=new T.Group();group.name='Alimentation · '+e.id;world.add(group);const tube=dynamicTube(48,7),hose=new T.Mesh(tube.geometry,new T.MeshStandardMaterial({color:'#c7b680',roughness:.95}));group.add(hose);const crew=[person(group,0,0,'',true),person(group,0,0,'',true)],reel=reelCart(group),coupling=cylinder(group,.18,.18,.25,'#b6c0ba',0,.4,0,10);return{e,group,crew,reel,tube,hose,coupling,key:'',lastProgress:-1,path:null};});
 const update=time=>{for(const r of records){
  const {e,group,crew,reel,tube,hose,coupling}=r,progress=e.supplyProgress||0;group.visible=['scene','reconditioning'].includes(e.status)&&progress>0&&!!e.supplyAnchor;if(!group.visible)continue;
  const pos=e.model.position,yaw=e.model.rotation.y,length=e.model.userData.length||7,back={x:pos.x-Math.sin(yaw)*(length/2+1),z:pos.z-Math.cos(yaw)*(length/2+1)},anchor=e.supplyAnchor;
  const key=[pos.x,pos.z,yaw,anchor.x,anchor.z].join(':');if(r.key!==key){r.key=key;r.path=supplyPath(e,back,anchor);r.lastProgress=-1;}
  const setting=!!e.hydrant,walkingOut=setting?clamp((progress-.12)/.5):clamp((1-progress)/.18),laid=clamp((progress-.12)/.5),returning=setting?clamp((progress-.82)/.18):0;
  const at=along(r.path,setting?(progress>.82?1-returning:walkingOut):progress>.82?walkingOut:laid),cart=along(r.path,laid),busy=progress<1,connecting=setting?progress>=.62&&progress<.82:progress>=.62&&progress<=.82;
  r.phase=progress>=1?'established':connecting?(setting?'connecting':'disconnecting'):setting?(progress<.12?'unloading':progress>.82?'returning':'laying'):(progress>.82?'approaching':progress<.12?'stowing':'packing');
  for(const [i,p]of crew.entries()){p.visible=busy;if(!busy)continue;const side=i?-.72:.72;p.position.set(at.x+Math.cos(at.yaw)*side,0,at.z-Math.sin(at.yaw)*side);p.rotation.set(0,at.yaw+(returning||!setting&&progress<.62?Math.PI:0),connecting?.14:0);const walking=['laying','returning','approaching','packing'].includes(r.phase);p.children[1].rotation.x=walking?Math.sin(time*7+i)*.45:0;p.children[2].rotation.x=-p.children[1].rotation.x;p.children[3].rotation.x=connecting?-1.2+Math.sin(time*5)*.15:-.8;p.children[4].rotation.x=-.8;}
  reel.g.visible=true;reel.g.position.set(cart.x,0,cart.z);reel.g.rotation.y=cart.yaw;reel.drum.rotation.x=laid*25;reel.coil.scale.set(1,.7+.3*(1-laid),.7+.3*(1-laid));
  coupling.position.set(anchor.x,.48,anchor.z);coupling.visible=progress>=.72;
  hose.visible=laid>0;
  if(progress!==r.lastProgress){r.lastProgress=progress;tube.points.forEach((point,i)=>{const t=i/(tube.points.length-1),q=along(r.path,t*laid);const distance=nearestRoad([q.x,q.z]).distance;point.set(q.x,(distance<4.55?.235:distance<6.6?.12:.06)+.115,q.z);point.x+=Math.cos(q.yaw)*Math.sin(t*Math.PI)*.35;point.z-=Math.sin(q.yaw)*Math.sin(t*Math.PI)*.35;});tube.update(.115);}
 }};
 update.records=records;return update;
}
