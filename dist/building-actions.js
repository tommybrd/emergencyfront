import * as T from 'three';
import {person,box,cylinder} from './models.js';
import {block,roads,projectRoad} from './roads.js';
import {inLake} from './beach-layout.js';
import {disposeObject} from './dispose.js';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const point=m=>[m.position.x,m.position.z];
const working=a=>a?.requested&&a.phase!=='done';
const labels={evacuate:'Évacuation',utilities:'Coupure des énergies'};
export function initBuildingActions(c){
 if(c.buildingActions)return c.buildingActions;
 if(c.site?.kind!=='building'||!(c.type==='INC'||c.type==='OD'&&['flood','flood-garage'].includes(c.scene)))return null;
 const residents=c.type==='INC'?(['tower','mall'].includes(c.site.style)?5+c.id%4:2+c.id%3):0;
 return c.buildingActions={residents,safe:0,electricity:'on',gas:c.type==='INC'&&c.scene!=='chimney'?'on':'absent',
  evacuate:residents?{phase:'idle',requested:false,progress:0}:null,utilities:{phase:'idle',requested:false,progress:0}};
}
export const buildingActionsBusy=c=>!!c.buildingActions&&['evacuate','utilities'].some(k=>working(c.buildingActions[k]));
function teamFor(c,engines){return engines.filter(e=>e.call===c.id&&e.status==='scene'&&['FPT','CCF','VTU','EPA'].includes(e.kind)&&
 !(c.complication?.status==='active'&&c.complication.unitId===e.id)&&!(e.supplyProgress>0&&e.supplyProgress<1)&&
 (e.crew||e.size||0)-(e.perimeterCrew||0)>=2).sort((a,b)=>(a.kind==='VTU'?-1:0)-(b.kind==='VTU'?-1:0))[0];}
export function requestBuildingAction(c,kind,engines,minute,emit=()=>{}){
 const actions=initBuildingActions(c),action=actions?.[kind];
 if(!['evacuate','utilities'].includes(kind)||!action||c.status==='closed'||c.siteCompletedAt!=null)return 'Action indisponible sur cette intervention.';
 if(action.requested)return null;
 if(!c.reconComplete||c.inspection&&c.fireConfirmed!==true)return 'Attendez la reconnaissance et la confirmation du feu.';
 if(!teamFor(c,engines))return 'Un fourgon, un VTU ou une EPA doit être opérationnel sur place.';
 Object.assign(action,{requested:true,phase:'queued',orderedAt:minute,progress:0});
 emit('Centre',kind==='evacuate'?'Évacuation préventive demandée. Regroupement des occupants hors de la zone menacée.':'Mise en sécurité demandée : '+(actions.gas==='absent'?'électricité.':'gaz et électricité.'));
 return null;
}
export function buildingActionsPanel(c,engines){
 const actions=initBuildingActions(c);if(!actions||c.siteCompletedAt!=null||c.inspection&&c.fireConfirmed===false)return '';
 const ready=c.reconComplete&&(!c.inspection||c.fireConfirmed===true)&&!!teamFor(c,engines);
 const button=(kind,icon,label)=>{const a=actions[kind];if(!a)return '';const detail=a.phase==='done'?(kind==='evacuate'?`${actions.safe}/${actions.residents} à l’abri`:'Coupées'):a.requested?(a.waiting||a.phase==='queued'?'En attente':`${Math.floor(a.progress*100)} %`):label;
  return `<button data-building-action="${kind}" class="${a.phase==='done'?'done':a.requested?'working':''}" ${!ready||a.requested?'disabled':''} aria-label="${label} · ${detail}" title="${a.waiting||(!ready&&!a.requested?'Reconnaissance et équipe sur place nécessaires':labels[kind]+' · '+detail)}"><span aria-hidden="true">${icon}</span> ${detail}</button>`;};
 return `<div class="buildingActions" aria-label="Mise en sécurité du bâtiment">${button('evacuate','↗','Évacuer')}${button('utilities','ϟ',actions.gas==='absent'?'Électricité':'Gaz / élec.')}</div>`;
}

function outsideBuildings(p,pad=.3){return !inLake(p)&&!block.buildings.some(b=>Math.abs(p[0]-b.x)<b.w/2+pad&&Math.abs(p[1]-b.z)<b.d/2+pad);}
function clearSegment(a,b){const steps=Math.max(1,Math.ceil(distance(a,b)/.6));for(let i=0;i<=steps;i++)if(!outsideBuildings([a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps]))return false;return true;}
// A small local visibility graph keeps crews outside the batched city buildings.
export function walkRoute(a,b){
 if(clearSegment(a,b))return [a,b];
 const corners=block.buildings.filter(v=>Math.min(distance(a,[v.x,v.z]),distance(b,[v.x,v.z]))<Math.max(v.w,v.d)+45).flatMap(v=>[-1,1].flatMap(x=>[-1,1].map(z=>[v.x+x*(v.w/2+.9),v.z+z*(v.d/2+.9)]))).filter(p=>outsideBuildings(p));
 const nodes=[a,b,...corners],cost=nodes.map(()=>Infinity),prev=[],open=new Set(nodes.map((_,i)=>i));cost[0]=0;
 while(open.size){let i=-1;for(const j of open)if(i<0||cost[j]<cost[i])i=j;if(!Number.isFinite(cost[i])||i===1)break;open.delete(i);
  for(const j of open){const n=cost[i]+distance(nodes[i],nodes[j]);if(n<cost[j]&&clearSegment(nodes[i],nodes[j])){cost[j]=n;prev[j]=i;}}
 }
 if(!Number.isFinite(cost[1]))return null;const route=[];for(let i=1;i!=null;i=prev[i])route.unshift(nodes[i]);return route;
}
export function buildingLayout(c){
 const site=c.site,center=site.position||c.target,p=c.actionPoint||c.target,dx=p[0]-center[0],dz=p[1]-center[1],xFace=Math.abs(dx)/(site.width/2)>Math.abs(dz)/(site.depth/2),normal=xFace?[Math.sign(dx),0]:[0,Math.sign(dz)],tangent=[normal[1],-normal[0]],half=(xFace?site.depth:site.width)/2;
 const face=[center[0]+normal[0]*((xFace?site.width:site.depth)/2+1),center[1]+normal[1]*((xFace?site.width:site.depth)/2+1)];
 const exit=[face[0]+tangent[0]*Math.max(1,half*.55),face[1]+tangent[1]*Math.max(1,half*.55)],meter=[face[0]-tangent[0]*Math.max(1,half*.5),face[1]-tangent[1]*Math.max(1,half*.5)];
 // Assembly stays on the same side of the street, beyond the fire frontage.
 let assembly=null,path=null;
 for(const along of[half+12,-half-12,half+20,-half-20])for(const away of[1,3,6,10]){
  const q=[face[0]+tangent[0]*along+normal[0]*away,face[1]+tangent[1]*along+normal[1]*away];
  if(!outsideBuildings(q,2.5)||roads.some(r=>distance(q,projectRoad(q,r))<(r.express?11:r.trail?3:6)))continue;
  const candidate=walkRoute(exit,q);if(candidate&&(!path||candidate.length<path.length)){assembly=q;path=candidate;}
 }
 return {exit,meter,normal,tangent,assembly,path};
}
function walk(actor,route,minutes,clock,speed=4){
 if(!route?.length)return false;actor.step??=1;let remaining=minutes*speed;
 while(remaining>0&&actor.step<route.length){const target=route[actor.step],p=actor.model.position,dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),n=Math.min(remaining,d);if(d>.01){p.x+=dx/d*n;p.z+=dz/d*n;actor.model.rotation.y=Math.atan2(dx,dz);}remaining-=n;if(d<=n+.01)actor.step++;}
 const moving=actor.step<route.length;actor.model.children[1].rotation.x=moving?Math.sin(clock*6)*.4:0;actor.model.children[2].rotation.x=-actor.model.children[1].rotation.x;return !moving;
}
export function createBuildingActions(world,{engines,emit=()=>{}}){
 const records=new Map();
 function create(c){const group=new T.Group();group.name='Mise en sécurité '+c.id;world.add(group);const r={group,layout:buildingLayout(c),workers:[],residents:[],active:null,closedAt:null};records.set(c.id,r);return r;}
 function remove(id){const r=records.get(id);if(r)disposeObject(r.group);records.delete(id);}
 function update(calls,minute,minutes){
  for(const e of engines){e.buildingCrew=0;e.buildingTask=null;}
  for(const c of calls){const actions=c.buildingActions;if(!actions||!Object.values(actions).some(a=>a?.requested))continue;
   let r=records.get(c.id);if(!r){if(c.status==='closed')continue;r=create(c);}
   if(c.status==='closed'){r.closedAt??=minute;for(const w of r.workers)w.model.visible=false;if(minute-r.closedAt>60)remove(c.id);continue;}
   const kind=r.active&&working(actions[r.active])?r.active:['evacuate','utilities'].find(k=>working(actions[k]));if(!kind)continue;
   const a=actions[kind],unit=teamFor(c,engines);r.active=kind;
   if(!unit){a.waiting='Équipe nécessaire sur place';r.workers.forEach(w=>w.model.visible=false);continue;}
   if(kind==='evacuate'&&!r.layout.path){a.waiting='Accès au point de regroupement indisponible';continue;}
   a.waiting=null;unit.buildingCrew=kind==='evacuate'?2:1;unit.buildingTask=labels[kind];
   if(a.unitId!==unit.id||a.phase==='queued'){
    r.workers.forEach(w=>disposeObject(w.model));r.workers=[];
    const start=[unit.model.position.x+Math.cos(unit.model.rotation.y)*2.4,unit.model.position.z-Math.sin(unit.model.rotation.y)*2.4],target=r.layout[kind==='evacuate'?'exit':'meter'],route=walkRoute(start,target);
    if(!route){a.waiting='Accès piéton à dégager';unit.buildingCrew=0;unit.buildingTask=null;continue;}
    for(let i=0;i<unit.buildingCrew;i++){const model=person(r.group,...start,'',true);r.workers.push({model,step:1,route});}
    a.unitId=unit.id;a.resumePhase=a.phase==='queued'?'work':a.phase;a.phase='approach';a.work??=0;
    if(kind==='utilities'&&!r.meters){r.meters=[];for(let i=0;i<(actions.gas==='absent'?1:2);i++){const q=r.layout.meter,normal=r.layout.normal,tangent=r.layout.tangent,g=new T.Group();r.group.add(g);g.position.set(q[0]-normal[0]*.7+tangent[0]*i,0,q[1]-normal[1]*.7+tangent[1]*i);g.rotation.y=Math.atan2(...normal);box(g,.6,.85,.22,'#90998f',0,1,0);const lever=box(g,.1,.3,.08,i?'#d9b54f':'#c55a49',0,1,.16);r.meters.push(lever);}}
   }
   r.workers.forEach(w=>w.model.visible=true);
   if(a.phase==='approach'){
    let arrived=true;for(const [i,w]of r.workers.entries()){arrived=walk(w,w.route,minutes,minute+i)&&arrived;w.model.position.x+=r.layout.tangent[0]*i*.015;w.model.position.z+=r.layout.tangent[1]*i*.015;}
    if(arrived){a.phase=a.resumePhase==='approach'?'work':a.resumePhase;a.resumePhase=null;}
   }else if(a.phase==='work'){
    a.work+=minutes;const duration=kind==='evacuate'?6:actions.gas==='absent'?8:18;
    a.progress=Math.min(.4,a.work/duration*.4);for(const w of r.workers)w.model.children[3].rotation.x=-.6+Math.sin(minute*4)*.2;
    if(kind==='utilities'&&a.work>=8){actions.electricity='off';if(r.meters?.[0])r.meters[0].rotation.z=Math.PI/2;}
    if(a.work>=duration){
     if(kind==='evacuate'){
      a.phase='escort';if(!r.residents.length)for(let i=0;i<actions.residents;i++){const model=person(r.group,...r.layout.exit,['#658a8a','#ba8968','#596b97','#9c737b'][i%4]);model.visible=false;r.residents.push({model,step:1,releaseAt:minute+i*1.4,safe:false});}
     }else{if(actions.gas!=='absent'){actions.gas='off';r.meters[1].rotation.z=Math.PI/2;}a.phase='return';a.progress=.85;emit(c,unit.id,'Mise en sécurité effectuée : '+(actions.gas==='absent'?'électricité coupée.':'gaz et électricité coupés.'));}
    }
   }else if(a.phase==='escort'){
    for(const resident of r.residents){if(resident.safe||minute<resident.releaseAt)continue;resident.model.visible=true;if(walk(resident,r.layout.path,minutes,minute,3.2)){resident.safe=true;actions.safe++;const i=r.residents.indexOf(resident);resident.model.position.x+=r.layout.tangent[0]*(i%3-1)*1.2;resident.model.position.z+=r.layout.tangent[1]*(i%3-1)*1.2;resident.model.position.x+=r.layout.normal[0]*Math.floor(i/3)*1.3;resident.model.position.z+=r.layout.normal[1]*Math.floor(i/3)*1.3;}}
    const visible=r.residents.filter(p=>p.model.visible&&!p.safe);if(visible.length){const first=visible[0].model.position;r.workers[0].model.position.set(first.x+r.layout.normal[0]*1.4,0,first.z+r.layout.normal[1]*1.4);}
    a.progress=.4+.45*actions.safe/actions.residents;
    if(actions.safe===actions.residents){a.phase='return';emit(c,unit.id,`${actions.safe} occupants regroupés à l’abri. Aucune victime supplémentaire.`);}
   }else if(a.phase==='return'){
    let arrived=true;for(const w of r.workers){if(!w.returnRoute){w.returnRoute=walkRoute(point(w.model),[unit.model.position.x+Math.cos(unit.model.rotation.y)*2.4,unit.model.position.z-Math.sin(unit.model.rotation.y)*2.4]);w.step=1;}arrived=walk(w,w.returnRoute,minutes,minute)&&arrived;}
    if(arrived){a.phase='done';a.progress=1;a.completedAt=minute;r.workers.forEach(w=>w.model.visible=false);r.active=null;unit.buildingCrew=0;unit.buildingTask=null;}
   }
  }
 }
 return {records,update,clear(){for(const id of records.keys())remove(id);}};
}
