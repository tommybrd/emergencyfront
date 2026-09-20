import * as T from 'three';
import {box,cylinder,person} from './models.js';
import {disposeObject} from './dispose.js';
const lerp=(a,b,f)=>a.clone().lerp(b,Math.max(0,Math.min(1,f)));

export function rescueWreck(parent,x,z,yaw){
 const g=new T.Group();parent.add(g);g.position.set(x,0,z);g.rotation.y=yaw;
 box(g,2,.55,4.1,'#82918b',0,.65,0);box(g,1.85,.25,1.1,'#64776f',0,.98,1.35);
 box(g,1.82,.65,.08,'#293c43',0,1.34,1);box(g,1.82,.65,.08,'#293c43',0,1.34,-1.12);
 box(g,1.98,.12,2.25,'#82918b',0,1.75,-.06);box(g,.1,.78,2.16,'#82918b',.98,1.3,0);
 box(g,.1,.8,.82,'#82918b',-.98,1.27,-.7);
 const door=new T.Group();g.add(door);door.position.set(-1,1.06,.99);
 box(door,.09,.42,1.15,'#82918b',0,0,-.58);box(door,.075,.5,1.1,'#354b53',0,.47,-.58);
 for(const side of[-1,1])for(const zz of[-1.3,1.3]){const wheel=cylinder(g,.43,.43,.22,'#263030',side,.45,zz,10);wheel.rotation.z=Math.PI/2;}
 box(g,1.8,.16,.15,'#424e4b',0,.5,2.08);g.userData.extricationDoor=door;return g;
}
export function createExtricationVisuals(world){
 const records=new Map();
 return {records,update(calls,engines,hazards,victims,time){
  const active=new Set();
  for(const c of calls){const r=c.extrication,car=hazards.get(c.id)?.children.find(o=>o.userData.extricationDoor);if(!r||!car)continue;
   car.userData.extricationDoor.rotation.y=1.5*Math.max(0,Math.min(1,(r.progress-.2)/.65));
   const victim=victims.get(c.id)?.model;
   if(victim&&c.patients[r.patient].trapped){victim.rotation.set(0,car.rotation.y,0);victim.scale.setScalar(.7);victim.position.copy(car.localToWorld(new T.Vector3(-.35,.35,.2)));}
   else if(victim&&victim.scale.x===.7){victim.scale.setScalar(1);victim.rotation.set(0,0,Math.PI/2);victim.position.set((c.actionPoint||c.target)[0]+2,.6,(c.actionPoint||c.target)[1]-2);}
   const e=engines.find(e=>e.id===r.unitId&&e.call===c.id&&e.status==='scene');if(r.done||!e||!c.reconComplete)continue;active.add(c.id);
   let record=records.get(c.id);
   if(!record){const g=new T.Group();world.add(g);g.name='Équipe désincarcération';const crew=[person(g,0,0,'',true),person(g,0,0,'',true)],tool=new T.Group();g.add(tool);box(tool,.18,.2,.48,'#d95436');const jaws=[-1,1].map(side=>{const jaw=box(tool,.08,.12,.4,'#b3bdb9',side*.1,0,.35);return jaw;});const kit=box(g,.65,.35,.5,'#dc793a');record={g,crew,tool,jaws,kit};records.set(c.id,record);}
   const target=car.localToWorld(new T.Vector3(-1.95,0,.35)),from=e.model.localToWorld(new T.Vector3(-1.8,0,-2));from.y=target.y=0;
   const moving=r.approach<1||r.progress>=1,f=r.progress>=1?1-r.packing:r.approach,where=lerp(from,target,f);
   record.crew.forEach((p,i)=>{p.position.copy(where);p.position.z+=i?1.35:0;p.rotation.set(0,Math.atan2(car.getWorldPosition(new T.Vector3()).x-p.position.x,car.getWorldPosition(new T.Vector3()).z-p.position.z),0);p.children[1].rotation.x=moving?Math.sin(time*7+i)*.4:0;p.children[2].rotation.x=-p.children[1].rotation.x;p.children[4].rotation.x=-1.2;});
   record.tool.position.copy(where);record.tool.position.y=1.15;record.tool.rotation.y=record.crew[0].rotation.y;
   record.jaws.forEach((jaw,i)=>jaw.rotation.y=(i?1:-1)*(.2+(!moving?(.5+.5*Math.sin(time*4))*.35:0)));
   record.kit.position.copy(record.crew[1].position);record.kit.position.y=moving?.8:.2;
  }
  for(const[id,r]of records)if(!active.has(id)){disposeObject(r.g);records.delete(id);}
 }};
}
