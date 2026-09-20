import {disposeObject} from './dispose.js';
import * as T from 'three';
import {forestResponder,person,box,cylinder,hoseReel} from './models.js';
import {nearestRoad} from './roads.js';
import {dynamicTube} from './dynamic-tube.js';
import {supplyPath} from './water-supply.js';
const clamp=n=>Math.max(0,Math.min(1,n));
function along(path,fraction){const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));let rest=lengths.reduce((a,b)=>a+b,0)*clamp(fraction);for(let i=0;i<lengths.length;i++){if(rest<=lengths[i]||i===lengths.length-1){const k=lengths[i]?rest/lengths[i]:1,a=path[i],b=path[i+1];return{x:a[0]+(b[0]-a[0])*k,z:a[1]+(b[1]-a[1])*k,yaw:Math.atan2(b[0]-a[0],b[1]-a[1])};}rest-=lengths[i];}return{x:path[0][0],z:path[0][1],yaw:0};}
export function supplyCrew(world,engines){
 const records=[];function add(e){if(!e.capacity)return;const group=new T.Group();group.name='Alimentation · '+e.id;world.add(group);const tube=dynamicTube(48,7),hose=new T.Mesh(tube.geometry,new T.MeshStandardMaterial({color:'#c7b680',roughness:.95}));group.add(hose);const crew=Array.from({length:2},()=>e.kind==='CCF'?forestResponder(group):person(group,0,0,'',true)),reel=hoseReel(group),coupling=cylinder(group,.18,.18,.25,'#b6c0ba',0,.4,0,10);records.push({e,group,crew,reel,tube,hose,coupling,key:'',lastProgress:-1,path:null});}engines.forEach(add);
 const update=time=>{for(const r of records){
  const {e,group,crew,reel,tube,hose,coupling}=r,progress=e.supplyProgress||0;e.model.userData.carriedHoseReels?.forEach((reel,i)=>reel.visible=i>0||progress===0);group.visible=['scene','reconditioning'].includes(e.status)&&progress>0&&!!e.supplyAnchor;if(!group.visible)continue;
  const pos=e.model.position,yaw=e.model.rotation.y,length=e.model.userData.length||7,back={x:pos.x-Math.sin(yaw)*(length/2+1),z:pos.z-Math.cos(yaw)*(length/2+1)},anchor=e.supplyAnchor;
  const key=[pos.x,pos.z,yaw,anchor.x,anchor.z].join(':');if(r.key!==key){r.key=key;r.path=e.supplyRoute||supplyPath(e,anchor);r.lastProgress=-1;}
  if(!r.path){group.visible=false;continue;}
  const lake=e.supplyHydrant?.userData?.supplyKind==='lake';hose.material.color.set(lake?'#455555':'#c7b680');
  const setting=!!e.hydrant,walkingOut=setting?clamp((progress-.12)/.5):clamp((1-progress)/.18),laid=clamp((progress-.12)/.5),returning=setting?clamp((progress-.82)/.18):0;
  const at=along(r.path,setting?(progress>.82?1-returning:walkingOut):progress>.82?walkingOut:laid),cart=along(r.path,laid),busy=progress<1,connecting=setting?progress>=.62&&progress<.82:progress>=.62&&progress<=.82;
  r.phase=progress>=1?'established':connecting?(setting?'connecting':'disconnecting'):setting?(progress<.12?'unloading':progress>.82?'returning':'laying'):(progress>.82?'approaching':progress<.12?'stowing':'packing');
  for(const [i,p]of crew.entries()){p.visible=busy;if(!busy)continue;const side=i?-.72:.72;p.position.set(at.x+Math.cos(at.yaw)*side,0,at.z-Math.sin(at.yaw)*side);p.rotation.set(0,at.yaw+(returning||!setting&&progress<.62?Math.PI:0),connecting?.14:0);const walking=['laying','returning','approaching','packing'].includes(r.phase);p.children[1].rotation.x=walking?Math.sin(time*7+i)*.45:0;p.children[2].rotation.x=-p.children[1].rotation.x;p.children[3].rotation.x=connecting?-1.2+Math.sin(time*5)*.15:-.8;p.children[4].rotation.x=-.8;}
  reel.g.visible=!lake;reel.g.position.set(cart.x,0,cart.z);reel.g.rotation.y=cart.yaw;reel.drum.rotation.x=laid*25;reel.coil.scale.set(1,.7+.3*(1-laid),.7+.3*(1-laid));
  coupling.position.set(anchor.x,anchor.y||.8,anchor.z);coupling.visible=progress>=.72;coupling.scale.setScalar(lake?2.5:1);
  hose.visible=laid>0;
  if(progress!==r.lastProgress){r.lastProgress=progress;tube.points.forEach((point,i)=>{const t=i/(tube.points.length-1),q=along(r.path,t*laid);const distance=nearestRoad([q.x,q.z]).distance;point.set(q.x,(distance<4.55?.235:distance<6.6?.12:.06)+.115,q.z);point.x+=Math.cos(q.yaw)*Math.sin(t*Math.PI)*.35;point.z-=Math.sin(q.yaw)*Math.sin(t*Math.PI)*.35;if(laid===1&&i===tube.points.length-1)point.y=anchor.y||.8;});tube.update(lake?.18:.115);}
 }};
 update.records=records;update.add=add;update.remove=e=>{const i=records.findIndex(r=>r.e===e);if(i>=0){disposeObject(records[i].group);records.splice(i,1);}};return update;
}
