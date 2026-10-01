import * as T from 'three';
import {person} from './models.js';
import {disposeObject} from './dispose.js';
import {buildingLayout,walkRoute} from './building-actions.js';
import {alongHomeWalk} from './player-home.js';
import {roads,projectRoad} from './roads.js';
import {block} from './city-layout.js';
import {inRiver} from './river-layout.js';
import {inLake} from './beach-layout.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// People here are uninjured occupants and witnesses. The existing patient
// system remains the single source of truth for trapped/injured victims.
export function createIncidentLife(world){
 const records=new Map();
 function remove(id){const r=records.get(id);if(r)disposeObject(r.root);records.delete(id);}
 function create(c,minute){
  if(!c.target||c.site?.kind==='forest'||c.nautical)return null;
  const root=new T.Group();root.name='Habitants et témoin · I'+c.id;world.add(root);
  const p=c.actionPoint||c.target,road=roads.filter(r=>!r.trail).map(r=>({r,q:projectRoad(p,r)})).sort((a,b)=>Math.hypot(a.q[0]-p[0],a.q[1]-p[1])-Math.hypot(b.q[0]-p[0],b.q[1]-p[1]))[0];
  if(!road){disposeObject(root);return null;}
  const dx=road.r.b[0]-road.r.a[0],dz=road.r.b[1]-road.r.a[1],len=Math.hypot(dx,dz),normal=[dz/len,-dx/len],side=(p[0]-road.q[0])*normal[0]+(p[1]-road.q[1])*normal[1]<0?-1:1;
  let wait=null;
  for(const offset of[8,6.2,10])for(const along of[9,-9,0]){
   const q=[road.q[0]+normal[0]*side*offset+dx/len*along,road.q[1]+normal[1]*side*offset+dz/len*along];
   if(!wait&&!inRiver(q,.6)&&!inLake(q)&&!block.buildings.some(b=>Math.abs(q[0]-b.x)<b.w/2+.5&&Math.abs(q[1]-b.z)<b.d/2+.5))wait=q;
  }
  if(!wait){disposeObject(root);return null;}
  const witness=person(root,wait[0],wait[1],'#b49162');witness.name='Témoin · accueil des secours';witness.userData.incidentActor='witness';
  const r={root,witness,wait,residents:[],createdAt:minute,arrival:null,route:null,unit:null};
  if(c.type==='INC'&&c.site?.kind==='building'&&(!c.inspection||c.fireConfirmed===true)){
   const layout=buildingLayout(c);if(layout.path)for(let i=0;i<2;i++){const m=person(root,...layout.exit,i?'#688599':'#a87769');m.name='Occupant sortant du bâtiment';m.userData.incidentActor='resident';r.residents.push({model:m,route:layout.path,delay:i*1.1});}
  }
  records.set(c.id,r);return r;
 }
 return{records,update(state,engines,t){
  const active=state.calls.filter(c=>c.status!=='closed'&&c.siteCompletedAt==null);
  const ids=new Set(active.map(c=>c.id));for(const id of records.keys())if(!ids.has(id))remove(id);
  for(const c of active.slice(0,10)){
   // A false alarm has a witness, but no invented evacuation.
   let r=records.get(c.id);if(!r)r=create(c,state.minute);if(!r)continue;
   if(c.type==='INC'&&c.inspection&&c.fireConfirmed===true&&!r.confirmed){remove(c.id);r=create(c,state.minute);r.confirmed=true;}
   const unit=engines.find(e=>e.call===c.id&&e.status==='scene'&&Math.hypot(e.model.position.x-r.wait[0],e.model.position.z-r.wait[1])<40);
   if(unit&&r.unit!==unit.id){const yaw=unit.model.rotation.y,end=[unit.model.position.x+Math.cos(yaw)*3.4,unit.model.position.z-Math.sin(yaw)*3.4];r.route=walkRoute([r.witness.position.x,r.witness.position.z],end);r.arrival=state.minute;r.unit=unit.id;}
   const phase=unit&&r.route?clamp((state.minute-r.arrival)/2.8):0,pose=alongHomeWalk(r.route||[r.wait,r.wait],phase),w=r.witness;
   w.position.set(pose.point[0],0,pose.point[1]);w.rotation.y=phase<1?pose.yaw:Math.atan2((c.actionPoint||c.target)[0]-w.position.x,(c.actionPoint||c.target)[1]-w.position.z);
   w.children[1].rotation.x=unit&&phase<1?Math.sin(t*6)*.4:0;w.children[2].rotation.x=-w.children[1].rotation.x;
   w.children[4].rotation.x=unit?(phase>=1?-1.15:-.3):-1.8+Math.sin(t*3)*.2;w.children[4].rotation.z=unit?-.2:-.65;
   for(const resident of r.residents){const f=clamp((state.minute-r.createdAt-resident.delay)/5),pose=alongHomeWalk(resident.route,f),m=resident.model;m.visible=state.minute>=r.createdAt+resident.delay;m.position.set(pose.point[0]+(f===1?resident.delay*.6:0),0,pose.point[1]);m.rotation.y=pose.yaw;m.children[1].rotation.x=f<1?Math.sin(t*6+resident.delay)*.4:0;m.children[2].rotation.x=-m.children[1].rotation.x;}
  }
 },clear(){for(const id of records.keys())remove(id);}};
}
