import {clearPlacement} from './vehicle-spacing.js';

const halfLength=v=>((v.model.userData.length||4.45)+.8)*(v.model.scale?.x||1)/2;
export const inStation=(x,z,pad=0)=>x>=-96-pad&&x<=-44+pad&&z>=52-pad&&z<=118+pad;
const point=v=>[v.model.position.x,v.model.position.z];
function* routeAhead(v,limit=75){let a=point(v),travelled=0;yield a;for(let i=v.segment||1;i<(v.path?.length||0)&&travelled<limit;i++){const b=v.path[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<.001){a=b;continue;}for(let step=Math.min(2,d);;step=Math.min(d,step+2)){if(travelled+step>limit)return;yield[a[0]+(b[0]-a[0])*step/d,a[1]+(b[1]-a[1])*step/d];if(step===d)break;}travelled+=d;a=b;}}

// One vehicle owns each conflict area until its rear has cleared it.
// Waiting is a normal traffic state, not a reason to teleport after 20 seconds.
export function createTrafficControl(crossings,roads=[]){
 const zones=[{id:'station',label:'Passage caserne',contains:inStation},...crossings.map((p,i)=>({id:'junction-'+i,label:'Priorité au carrefour',contains:(x,z,pad=0)=>Math.hypot(x-p[0],z-p[1])<20+pad}))];
 const trails=roads.filter(r=>r.trail),mouths=trails.flatMap(r=>[r.a,r.b]).filter((p,i,a)=>a.findIndex(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.01)===i&&roads.some(r=>!r.trail&&[r.a,r.b].some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.01)));
 for(const p of mouths){const i=zones.findIndex(z=>z.id==='junction-'+crossings.findIndex(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.01));if(i>=0)zones.splice(i,1);}
 if(trails.length)zones.push({id:'forest',label:'Passage alterné · piste',contains:(x,z,pad=0)=>mouths.some(p=>Math.hypot(x-p[0],z-p[1])<20+pad)||trails.some(r=>{const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((x-r.a[0])*dx+(z-r.a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-r.a[0]-t*dx,z-r.a[1]-t*dz)<1.3+pad;})});
 let serial=0;const records=new Map(zones.map(z=>[z.id,{owner:null,queue:new Map()}]));
 function update(vehicles,minute){
  const active=vehicles.filter(v=>v.path||v.status==='departing'&&(v.wasAtStation||inStation(...point(v)))&&minute>=v.departAt),obstacles=vehicles.map(v=>v.model);
  for(const zone of zones){const record=records.get(zone.id),wanted=new Set(),inside=[];
   for(const v of active){const pad=halfLength(v)+1,at=point(v),occupies=!!v.path&&zone.contains(...at,pad);
    if(occupies)inside.push(v);
    const departing=zone.id==='station'&&v.status==='departing'&&(v.wasAtStation||inStation(...point(v)))&&minute>=v.departAt;
    if(departing||occupies||[...routeAhead(v,25)].some(p=>zone.contains(...p,pad))){wanted.add(v);if(!record.queue.has(v))record.queue.set(v,++serial);}
   }
   for(const v of record.queue.keys())if(!wanted.has(v))record.queue.delete(v);
   if(record.owner&&(!wanted.has(record.owner)||(zone.id!=='station'&&!inside.includes(record.owner)&&!approachClear(record.owner,active))))record.owner=null;
   if(!record.owner){
    const candidates=inside.length?inside:[...record.queue.keys()].sort((a,b)=>record.queue.get(a)-record.queue.get(b));
    record.owner=candidates.find(v=>zone.id==='station'||inside.includes(v)||approachClear(v,active)&&exitClear(v,zone,obstacles))||null;
   }
  }
 }
 function approachClear(v,active){const a=point(v),b=v.path?.[v.segment||1];if(!b)return true;const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.001)return true;return !active.some(o=>{if(o===v||!o.path)return false;const x=o.model.position.x-a[0],z=o.model.position.z-a[1],ahead=(x*dx+z*dz)/len,side=Math.abs(x*dz-z*dx)/len;return ahead>0&&ahead<25&&side<3&&Math.cos(o.model.rotation.y-v.model.rotation.y)>.6;});}
 function exitClear(v,zone,obstacles){let entered=false,previous=null;for(const p of routeAhead(v)){const inside=zone.contains(...p,halfLength(v)+2);if(inside)entered=true;else if(entered&&previous){const yaw=Math.atan2(p[0]-previous[0],p[1]-previous[1]);return clearPlacement(v.model,p[0],p[1],yaw,obstacles);}previous=p;}return true;}
 function reason(v,x,z){for(const zone of zones){const pad=halfLength(v)+1;if(!zone.contains(x,z,pad))continue;const record=records.get(zone.id);if(record.owner===v)continue;
   return zone.label;
  }return null;}
 function stationGranted(v){return records.get('station').owner===v;}
 function release(v){for(const r of records.values()){r.queue.delete(v);if(r.owner===v)r.owner=null;}}
 return{update,reason,stationGranted,release,zones,records};
}
