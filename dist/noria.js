import * as T from 'three';
import {stow,equipmentBusy,waterMinutes} from './hydraulics.js';
import {findHydrantSupply,connectSupply,hydrantPresent,SUPPLY_REACH} from './water-supply.js';
import {reserveParking} from './parking.js';
import {forestResponder,hoseReel} from './models.js';
const distance=(a,b)=>Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
export function createNoria(world,{engines,hydrants,obstacles,travel,emit}){
 const lines=new Map();
 function cancel(e){if(!e.noria)return;stow(e);delete e.noria;}
 function toggle(e,c){if(e.noria){e.noria.stop=true;stow(e);return null;}if(e.kind!=='CCF'||e.status!=='scene'||c?.type!=='INC'||c.status==='closed'||c.fireContained)return 'Noria disponible avec un CCF sur un feu en cours.';if(!hydrants.some(h=>hydrantPresent(h,hydrants)))return 'Aucun poteau disponible.';if(!engines.some(t=>t!==e&&t.capacity&&t.call===e.call&&t.status==='scene'&&!t.noria))return 'Un engin à ravitailler doit être sur place.';stow(e);e.noria={phase:'prepare',siteParking:e.parking||e.sceneParking,stop:false,establish:0};return null;}
 function planRefill(e,n){const choices=hydrants.filter(h=>hydrantPresent(h,hydrants)&&!engines.some(v=>v!==e&&(v.hydrant===h||v.noria?.hydrant===h))).sort((a,b)=>distance(e.model,a)-distance(e.model,b));
  for(const h of choices){try{const at=[h.position.x,h.position.z],parking=reserveParking(e,{type:'OD',target:at,actionPoint:at,accessTarget:at},engines,obstacles());if(Math.hypot(parking.target[0]-at[0],parking.target[1]-at[1])>SUPPLY_REACH)continue;n.waiting=null;n.hydrant=h;n.phase='outbound';e.parking=parking;travel(e,parking.entry,'positioning');return true;}catch{}}
  n.waiting='Aucun poteau accessible';return false;
 }
 function update(s,minutes){for(const e of engines){const n=e.noria;if(!n)continue;const c=s.calls.find(c=>c.id===e.call);if(!c||c.status==='closed'||c.fireContained||e.status==='reconditioning'||e.status==='returning'){stow(e);delete e.noria;continue;}
  if(e.status!=='scene')continue;
  if(n.stop){if(e.hydrant)stow(e);if(equipmentBusy(e))continue;if(n.phase!=='supply'&&n.phase!=='prepare'&&n.siteParking){e.parking=n.siteParking;n.phase='returning';travel(e,e.parking.entry,'positioning');n.stop=false;n.stopAtSite=true;}else delete e.noria;continue;}
  if(n.phase==='prepare'){if(equipmentBusy(e))continue;n.phase='supply';}
  if(n.phase==='returning'){n.phase='supply';n.establish=0;if(n.stopAtSite){delete e.noria;continue;}}
  if(n.phase==='outbound'){const supply=findHydrantSupply(e,[n.hydrant],engines);if(!supply){n.phase='prepare';n.waiting='Poteau occupé · nouvelle recherche';planRefill(e,n);continue;}connectSupply(e,supply);n.phase='refill';}
  if(n.phase==='refill'){if(e.water<e.capacity-.01)continue;stow(e);n.phase='pack';}
  if(n.phase==='pack'){if(equipmentBusy(e))continue;e.parking=n.siteParking||reserveParking(e,c,engines,obstacles());n.phase='returning';travel(e,e.parking.entry,'positioning');continue;}
  if(n.phase!=='supply')continue;
  const targets=engines.filter(t=>t!==e&&t.capacity&&t.call===e.call&&t.status==='scene'&&!t.noria&&!t.hydrant&&distance(t.model,e.model)<=80&&t.water<t.capacity-.01);
  const target=targets.sort((a,b)=>a.water/a.capacity-b.water/b.capacity)[0]||null;if(target?.id!==n.target?.id)n.establish=0;n.target=target;
  if(e.water<=e.capacity*.1){n.target=null;n.establish=0;planRefill(e,n);continue;}
  if(!n.target){n.establish=0;continue;}n.establish=Math.min(1,n.establish+minutes/24);if(n.establish<1)continue;
  const amount=Math.min(e.water,1000*waterMinutes(minutes),n.target.capacity-n.target.water);e.water-=amount;n.target.water+=amount;n.target.suppliedBy=e.id;
 }}
 function visuals(){for(const e of engines){const n=e.noria;let record=lines.get(e);if(!record&&n){const group=new T.Group();world.add(group);const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#d4c18b'}));group.add(line);const crew=[forestResponder(group),forestResponder(group)],reel=hoseReel(group);record={group,line,crew,reel};lines.set(e,record);}if(!record)continue;const {group,line,crew,reel}=record,active=!!(n?.phase==='supply'&&n.target&&n.establish>0);group.visible=active;if(active){const a=e.model.position,b=n.target.model.position,positions=line.geometry.attributes.position,progress=n.establish,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1,x=a.x+dx*progress,z=a.z+dz*progress;positions.setXYZ(0,a.x,.42,a.z);positions.setXYZ(1,(a.x+x)/2,.16,(a.z+z)/2);positions.setXYZ(2,x,.42,z);positions.needsUpdate=true;line.geometry.computeBoundingSphere();for(const [i,p]of crew.entries()){p.visible=progress<1;p.position.set(x+dz/length*(i?.55:-.55),0,z-dx/length*(i?.55:-.55));p.rotation.y=Math.atan2(dx,dz);p.children[1].rotation.x=Math.sin(performance.now()*.008+i)*.35;p.children[2].rotation.x=-p.children[1].rotation.x;}reel.g.visible=progress<1;reel.g.position.set(x,0,z);reel.g.rotation.y=Math.atan2(dx,dz);reel.drum.rotation.x=progress*28;}}
  for(const [e,record]of lines)if(!engines.includes(e)){record.group.removeFromParent();record.group.traverse(o=>{o.geometry?.dispose?.();if(o.material&&!o.material.userData?.shared)o.material.dispose?.();});lines.delete(e);}}
 return {toggle,update,visuals,stop:cancel};
}
export function noriaStatus(e){const n=e.noria;if(!n)return '';if(n.stop)return 'Noria · arrêt et repli';if(n.waiting)return n.waiting;return {prepare:'Noria · rangement',supply:n.target?(n.establish<1?`Noria · établissement vers ${n.target.id} · ${Math.round(n.establish*100)} %`:'Noria → '+n.target.id):'Noria · attente de besoin',outbound:'Noria → poteau',refill:'Noria · remplissage',pack:'Noria · débranchement',returning:'Noria → engins'}[n.phase];}
