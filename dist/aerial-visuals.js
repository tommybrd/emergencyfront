import * as T from 'three';
import {box,cylinder,person,medicalResponder} from './models.js';
import {dynamicTube} from './dynamic-tube.js';
import {aerialTarget,AERIAL} from './aerial-operations.js';
const up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1),clamp=x=>Math.max(0,Math.min(1,x));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function createAerialVisuals(world,engines){
 const records=new Map(),origin=new T.Vector3(),target=new T.Vector3(),local=new T.Vector3(),tip=new T.Vector3(),aim=new T.Vector3(),feedStart=new T.Vector3(),feedEnd=new T.Vector3(),direction=new T.Vector3();
 for(const e of engines.filter(e=>e.kind==='EPA')){
  const rig=e.model.userData.aerialRig,g=new T.Group();world.add(g);
  const tube=(color,radius,water=false)=>{const shape=dynamicTube(24,6),mesh=new T.Mesh(shape.geometry,water?new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false}):new T.MeshStandardMaterial({color}));g.add(mesh);return{shape,mesh,radius};};
  const feed=tube('#d6c5a1',.115),riser=tube('#d6c5a1',.09),jet=tube('#c6f4ff',.18,true);
  const nozzle=cylinder(rig.basket,.1,.085,.7,'#343e44',0,1,.5,8);nozzle.visible=false;
  const operator=person(rig.basket,0,0,'',true);operator.scale.setScalar(.8);
  const medic=medicalResponder(rig.basket);medic.scale.setScalar(.8);
  const worker=person(g,0,0,'',true),reel=new T.Mesh(new T.TorusGeometry(.38,.1,6,12),new T.MeshStandardMaterial({color:'#d6c5a1'}));g.add(reel);
  const stretcher=new T.Group();rig.basket.add(stretcher);stretcher.position.set(1.06,.38,0);
  box(stretcher,.76,.12,2,'#e6a441',0,0,0);box(stretcher,.65,.08,1.8,'#597d81',0,.1,0);
  for(const x of[-.4,.4])box(stretcher,.035,.2,2.1,'#d2d5ca',x,.12,0);
  for(const z of[-.75,.75])box(stretcher,1,.07,.07,'#d2d5ca',-.35,-.16,z);
  const patient=person(stretcher,0,0,'#a47863');patient.scale.setScalar(.7);patient.rotation.x=-Math.PI/2;patient.position.set(0,.23,.6);
  records.set(e,{g,rig,feed,riser,jet,nozzle,operator,medic,worker,reel,stretcher,patient,lastGeometry:-Infinity});
 }
 function curve(tube,points,radius=tube.radius){tube.shape.points.forEach((p,i)=>{const u=i/(tube.shape.points.length-1)*(points.length-1),j=Math.min(points.length-2,Math.floor(u));p.copy(points[j]).lerp(points[j+1],u-j);});tube.shape.update(radius);}
 return {records,update(state,t,victims){
  for(const c of state.calls){const victim=victims?.get(c.id)?.model;if(victim&&c.elevatedRescue&&!c.elevatedRescue.done){victim.position.set(...c.elevatedRescue.upper);victim.position.y+=.35;}}
  for(const [e,r]of records){
   const a=e.aerial,c=state.calls.find(c=>c.id===(e.call??e.lastCall)),rescue=a?.mode==='rescue',active=!!a?.mode,legacy=!active&&e.status==='scene'&&e.ladderDeployed;
   const {rig,feed,riser,jet,nozzle,operator,medic,worker,reel,stretcher,patient}=r;
   const deployed=active?a.stabilizers:legacy?1:0;
   rig.stabilizers.forEach(({leg,side})=>{leg.visible=deployed>0;leg.position.x=side*(.6+deployed*1.45);});
   const p=e.model.position,yaw=e.model.rotation.y;
   origin.set(0,3.6,-2.75).applyAxisAngle(up,yaw).add(p);
   let fraction=active?a.extension:legacy?1:0;
   const goal=active?a.target:legacy?(c?.elevatedRescue&&!c.elevatedRescue.done?aerialTarget(c,'rescue'):aerialTarget(c)):null;
   if(goal){
    target.set(...goal);
    if(rescue&&['lower','handover','pack'].includes(a.phase))target.lerp(new T.Vector3(...a.lower),a.phase==='lower'?a.progress:1);
    direction.subVectors(target,origin);
    const length=Math.max(6.85,Math.min(AERIAL.reach,direction.length())),elevation=Math.atan2(direction.y,Math.hypot(direction.x,direction.z));
    rig.turret.rotation.y=angle(Math.atan2(direction.x,direction.z)-yaw)*fraction;
    rig.pivot.rotation.x=-elevation*fraction;
    const extension=(length-6.85)*fraction;rig.sections.forEach((s,i)=>s.position.z=extension*i/4);
    rig.basket.position.set(0,0,6.85+extension);rig.basket.rotation.x=-rig.pivot.rotation.x;
   }else{rig.turret.rotation.y=0;rig.pivot.rotation.x=0;rig.sections.forEach(s=>s.position.z=0);rig.basket.position.set(0,-.15,6.85);rig.basket.rotation.x=0;}
   e.model.updateMatrixWorld(true);rig.basket.getWorldPosition(tip);
   operator.visible=active&&!rescue&&a.extension>0||legacy;medic.visible=rescue&&a.extension>0;
   stretcher.visible=rescue&&['load','lower','handover'].includes(a.phase);
   patient.visible=stretcher.visible&&(a.phase!=='load'||a.progress>=.5);
   const victim=victims?.get(c?.id)?.model;
   if(c?.elevatedRescue&&!c.elevatedRescue.done&&victim){
    victim.position.set(...c.elevatedRescue.upper);victim.position.y+=.35;
    victim.visible=!(rescue&&(a.phase==='load'&&a.progress>=.5||['lower','handover'].includes(a.phase)));
   }else if(c?.elevatedRescue?.done&&victim){victim.position.set(c.actionPoint[0],.6,c.actionPoint[1]);}
   // One operator on the basket and one at the base / connecting the supply.
   worker.visible=active;reel.visible=active&&a.connection>0&&a.connection<1;operator.position.set(-.2,0,0);medic.position.set(-.25,0,0);
   worker.position.set(2.3,0,-2.6).applyAxisAngle(up,yaw).add(p);worker.position.y=.1;
   feed.mesh.visible=active&&a.connection>0;riser.mesh.visible=active&&!rescue&&a.connection>0;
   nozzle.visible=active&&!rescue&&a.extension>0;jet.mesh.visible=active&&a.flow>0;
   const source=engines.find(p=>p.id===a?.sourceId);
   if(source&&a.connection>0){
    feedStart.set(.9,.4,-source.model.userData.length/2).applyAxisAngle(up,source.model.rotation.y).add(source.model.position);
    feedEnd.set(.9,.4,-e.model.userData.length/2).applyAxisAngle(up,yaw).add(p);
    if(a.phase==='connect'||a.phase==='pack'){worker.position.copy(feedStart).lerp(feedEnd,a.connection);worker.position.y=.1;worker.lookAt(feedEnd);worker.children[1].rotation.x=Math.sin(t*7)*.4;worker.children[2].rotation.x=-worker.children[1].rotation.x;}
    else {worker.children[1].rotation.x=worker.children[2].rotation.x=0;}
    reel.position.copy(worker.position).add(local.set(.4,.7,0));reel.rotation.x=t*3;
   }
   if(t-r.lastGeometry<1/30)continue;r.lastGeometry=t;
   if(feed.mesh.visible&&source){
    local.copy(feedStart).lerp(feedEnd,a.connection);
    direction.subVectors(local,feedStart);
    feed.shape.points.forEach((pt,i)=>{const k=i/(feed.shape.points.length-1);pt.copy(feedStart).lerp(local,k);pt.y=.3+Math.sin(k*Math.PI)*.04;pt.x+=Math.sin(k*Math.PI)*direction.z*.025;pt.z-=Math.sin(k*Math.PI)*direction.x*.025;});feed.shape.update(feed.radius);
    if(riser.mesh.visible)curve(riser,[feedEnd,origin,tip.clone().add(new T.Vector3(0,1,0))]);
   }
   if(nozzle.visible&&c){
    aim.set(c.fireTarget?.[0]??c.actionPoint[0],c.fireHeight||3,c.fireTarget?.[1]??c.actionPoint[1]);
    const nozzleWorld=rig.basket.localToWorld(new T.Vector3(0,1,.5));
    local.copy(aim);rig.basket.worldToLocal(local);direction.subVectors(local,nozzle.position).normalize();nozzle.quaternion.setFromUnitVectors(up,direction);
    if(jet.mesh.visible){jet.shape.points.forEach((pt,i)=>{const k=i/(jet.shape.points.length-1);pt.copy(nozzleWorld).lerp(aim,k);pt.y+=Math.sin(k*Math.PI)*1.5+Math.sin(t*22+i)*.02;});jet.shape.update(.18*Math.sqrt(a.flow/500));}
   }
  }
 }};
}
