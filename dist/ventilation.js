import * as T from 'three';
import {person,box,cylinder} from './models.js';
import {buildingLayout,walkRoute} from './building-actions.js';
import {disposeObject} from './dispose.js';
export const ventilationNeeded=c=>c.type==='INC'&&c.site?.kind==='building'&&c.fireConfirmed!==false;
export const ventilationBusy=c=>!!c.ventilation&&!c.ventilation.done;
export function startVentilation(c){if(ventilationNeeded(c))c.ventilation??={phase:'waiting',progress:0,done:false};}
const clamp=n=>Math.max(0,Math.min(1,n));
function along(path,t){const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));let remaining=lengths.reduce((a,b)=>a+b,0)*clamp(t);for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const f=lengths[i]?remaining/lengths[i]:1,a=path[i],b=path[i+1];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}remaining-=lengths[i];}return path[0];}
export function createVentilation(world,engines,emit=()=>{}){
 const records=new Map();
 function update(calls,minutes,clock){
  for(const e of engines)e.ventilationCrew=0;
  for(const c of calls){const a=c.ventilation;if(!a||a.done)continue;
   if(c.status==='closed'){a.done=true;continue;}
   let r=records.get(c.id),unit=engines.find(e=>e.id===a.unitId&&e.call===c.id&&e.status==='scene');
   if(!unit){unit=engines.find(e=>e.call===c.id&&e.status==='scene'&&['FPT','CCF','VTU'].includes(e.kind)&&!e.buildingCrew&&!e.perimeterCrew&&!e.aerial?.mode&&!e.hoses?.some(h=>h.progress>0)&&!e.supplyProgress);if(!unit){a.phase='waiting';continue;}a.unitId=unit.id;a.phase='install';a.elapsed=0;}
   if(!r){const group=new T.Group();world.add(group);const fan=new T.Group();group.add(fan);box(fan,.85,.08,.6,'#354447',0,.08,0);const ring=cylinder(fan,.42,.42,.3,'#d85832',0,.52,0,16);ring.rotation.x=Math.PI/2;const blades=new T.Group();fan.add(blades);blades.position.set(0,.52,.17);for(let i=0;i<4;i++){const b=box(blades,.12,.58,.035,'#c9ceca',0,0,0);b.rotation.z=i*Math.PI/4;}const crew=[person(group,0,0,'',true),person(group,0,0,'',true)],smoke=new T.Group();group.add(smoke);for(let i=0;i<8;i++){const puff=new T.Mesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#a1a7a4',transparent:true,opacity:.35,depthWrite:false}));smoke.add(puff);}r={group,fan,blades,crew,smoke};records.set(c.id,r);}
   const entrance=buildingLayout(c).exit,start=[unit.model.position.x+2.5,unit.model.position.z],key=[unit.id,...start,...entrance].join(','),route=r.routeKey===key?r.route:walkRoute(start,entrance);r.routeKey=key;r.route=route;
   if(!route){a.phase='waiting';r.group.visible=false;continue;}r.group.visible=true;unit.ventilationCrew=2;
   a.elapsed=(a.elapsed||0)+minutes;const travel=Math.max(4,route.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0)/4),install=travel+4,vent=18;
   const phase=a.elapsed<install?'install':a.elapsed<install+vent?'ventilate':'pack';
   if(a.phase!=='ventilate'&&phase==='ventilate')emit(c,unit.id,'Ventilation engagée, dissipation des fumées.');a.phase=phase;a.progress=clamp((a.elapsed-install)/vent);
   const walking=phase==='install'?clamp(a.elapsed/travel):phase==='pack'?1-clamp((a.elapsed-install-vent-3)/travel):1,at=along(route,walking);
   r.fan.position.set(at[0],0,at[1]);r.fan.rotation.y=Math.atan2(c.site.position[0]-entrance[0],c.site.position[1]-entrance[1]);
   r.crew.forEach((p,i)=>{p.position.set(at[0]+(i?-.7:.7),0,at[1]+1);p.children[1].rotation.x=phase==='ventilate'?0:Math.sin(clock*6+i)*.35;p.children[2].rotation.x=-p.children[1].rotation.x;});r.blades.rotation.z=phase==='ventilate'?clock*12:0;
   r.smoke.children.forEach((p,i)=>{const life=(clock*.12+i*.13)%1;p.position.set(entrance[0]+Math.sin(i*2)*2,1+life*6,entrance[1]+life*3);p.scale.setScalar((.6+life*1.6)*(1-a.progress));p.material.opacity=.35*(1-a.progress);});
   if(a.elapsed>=install+vent+3+travel){a.done=true;a.phase='done';unit.ventilationCrew=0;emit(c,unit.id,'Ventilation terminée, matériel rangé.');disposeObject(r.group);records.delete(c.id);}
  }
  for(const[id,r]of records)if(!calls.some(c=>c.id===id&&c.status!=='closed'&&!c.ventilation?.done)){disposeObject(r.group);records.delete(id);}
 }
 return{records,update};
}
