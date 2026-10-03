import {block} from './roads.js';
import {walkRoute} from './building-actions.js';
import {alongHomeWalk} from './player-home.js';
import {volunteerPerson} from './volunteer-models.js';
import {applyPersonInsignia} from './crew-insignia.js';
import * as T from 'three';
import {box,sign,person,dressMedicalResponder} from './models.js';
import {batchStatic} from './batching.js';
import {createBayDoor,updateGarageDoors} from './garage.js';
export const LOCAL_STATION={name:'CIS Sud',entry:[235,183],gate:[240,205]};
export const LOCAL_RECALL_DELAY=1,LOCAL_WALK_SPEED=16;
export const volunteerFleet=[
 {id:'VSAV Sud',kind:'VSAV',size:3,home:[230,220],ambulanceModel:'cell'},
 {id:'FPTL Sud',kind:'FPT',size:4,home:[240,220],lightPump:true,tankCapacity:2000},
 {id:'CCFM Sud',kind:'CCF',size:4,home:[250,220],tankCapacity:4000,signalFront:'round',signalRear:'round'}
].map((e,i)=>({...e,name:e.id+' · centre volontaire',external:true,mutualAid:true,localVolunteer:true,base:LOCAL_STATION.name,baseYaw:Math.PI,mobilization:12,localIndex:i}));
const locker=[262,224],length=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
function localOrigin(id,minute){
 const work=minute%1440>=8*60&&minute%1440<18*60&&id%3!==0;
 const choices=block.buildings.filter(b=>work?['mall','civic','tower'].includes(b.style):['house','town'].includes(b.style)).sort((a,b)=>Math.hypot(a.x-locker[0],a.z-locker[1])-Math.hypot(b.x-locker[0],b.z-locker[1]));
 for(let i=0;i<choices.length;i++){const b=choices[(i+id%3)%choices.length],dx=locker[0]-b.x,dz=locker[1]-b.z,xFace=Math.abs(dx)/b.w>Math.abs(dz)/b.d;
  const door=xFace?[b.x+Math.sign(dx)*(b.w/2+1),b.z]:[b.x,b.z+Math.sign(dz)*(b.d/2+1)],route=walkRoute(door,locker);if(route)return{origin:door,route,activity:work?'Travail':'Domicile'};
 }
 throw Error('Aucun accès piéton au CIS Sud');
}
export function mobilizeLocalCrew(e,minute){
 if(!e.localVolunteer)return;
 // An already mobilised team stays together on a new assignment.
 if(e.localCrew?.length&&!e.localReturning&&e.crew===e.size){e.mobilization=0;return;}
 const returning=e.localReturning?new Map((e.localCrew||[]).map(p=>{const homeward=[...(p.boardingRoute||[locker,e.home])].reverse().concat([...(p.route||[p.origin,locker])].reverse().slice(1)),f=(minute-e.localReleaseAt)/Math.max(6,length(homeward)/14+2),origin=alongHomeWalk(homeward,f).point;return [p.id,{origin,route:walkRoute(origin,locker)||[origin,locker],activity:'Rappel pendant le retour'}];})):null;
 e.localReturning=false;e.localReleaseAt=null;
 e.localCrew=Array.from({length:e.size},(_,i)=>{const id=200+e.localIndex*10+i,origin=returning?.get(id)||localOrigin(id,minute),departAt=minute+(returning?.has(id)?0:LOCAL_RECALL_DELAY+i*.3),stationAt=departAt+length(origin.route)/LOCAL_WALK_SPEED,changedAt=stationAt+2,boardingRoute=[locker,[262,207],[e.home[0],207],e.home],arrivalAt=changedAt+length(boardingRoute)/14;return{id,kind:'SPV',engine:e.id,calledAt:minute,...origin,departAt,stationAt,changedAt,arrivalAt,boardingRoute,phase:'preparing'};});
 e.crew=0;e.crewIds=e.localCrew.map(p=>p.id);e.mobilization=Math.max(...e.localCrew.map(p=>p.arrivalAt))-minute;
}
export function tickLocalCrew(e,minute){
 if(!e.localVolunteer)return;
 if(e.localReturning){const duration=Math.max(6,...(e.localCrew||[]).map(p=>2+(length(p.route||[p.origin,e.home])+length(p.boardingRoute||[e.home,locker]))/14));if(minute-e.localReleaseAt>=duration){e.localCrew=[];e.localReturning=false;e.crew=0;e.crewIds=[];}return;}
 if(e.status==='departing'&&e.localCrew?.length){for(const p of e.localCrew)p.phase=minute<p.departAt?'preparing':minute<p.stationAt?'walking':minute<p.changedAt?'changing':minute<p.arrivalAt?'boarding':'ready';e.crew=e.localCrew.filter(p=>minute>=p.arrivalAt).length;}
}
export function createVolunteerStation(world){
 const root=new T.Group();root.name='CIS Sud · 100 % volontaires';world.add(root);
 box(root,38,.16,36,'#9baba1',240,.1,220);
 const access=box(root,8,.06,23,'#707f76',237.5,.2,194);access.rotation.y=Math.atan2(5,22);
 for(const x of[223,257])box(root,.45,5.8,24,'#c0cbc0',x,3,223);
 box(root,34,5.8,.45,'#c0cbc0',240,3,235);
 for(const x of[224,235,245,256])box(root,.5,5.5,.6,'#aabcb6',x,2.9,211);
 box(root,34,.9,1,'#ae3830',240,5.6,211);
 sign(root,'CIS SUD · VOLONTAIRES',31,.65,240,6.65,210.4,'#ae3830').rotation.y=Math.PI;
 const doors=[];for(const e of volunteerFleet){const x=e.home[0];box(root,8,.03,21,'#687e78',x,.2,221);doors.push(createBayDoor(root,{home:e.home,front:[x,210.6],width:8.5,height:4.75,yaw:Math.PI,color:'#263f42',headerY:5.6}));for(const side of[-1,1])box(root,.12,.04,21,'#eee3b3',x+side*4,.24,221);}
 box(root,7,3.6,8,'#aebeb4',262,1.95,229);box(root,7.5,.22,8.5,'#687c75',262,3.85,229);sign(root,'VESTIAIRES',6,.6,262,3,224.8).rotation.y=Math.PI;
 // Open roof over the three bays keeps stored vehicles readable from above.
 for(const x of[224,235,245,256])box(root,.24,.35,24,'#637c76',x,5.9,223);
 box(root,34,.2,8,'#6e847e',240,6.05,231);
 batchStatic(root,doors.map(d=>d.root));
 const people=new Map();
 return {root,doors,updateDoors(engines,seconds){updateGarageDoors(doors,engines,seconds);},update(engines,minute){
  for(const m of people.values())m.visible=false;
  for(const e of engines.filter(e=>e.localVolunteer))for(const p of e.localCrew||[]){
   let m=people.get(p.id);if(!m){m=volunteerPerson(world,p.id);m.name='SPV du CIS Sud';people.set(p.id,m);}
   let route,f,uniform=false;
   if(e.localReturning){route=[...(p.boardingRoute||[locker,e.home])].reverse().concat([...(p.route||[p.origin,locker])].reverse().slice(1));f=(minute-e.localReleaseAt)/Math.max(6,length(route)/14+2);}
   else if(e.status!=='departing'||minute>=p.arrivalAt)continue;
   else if(minute<(p.departAt??p.calledAt)){route=[p.origin,p.origin];f=0;}
   else if(minute<(p.stationAt??p.arrivalAt)){route=p.route||[p.origin,locker];f=(minute-(p.departAt??p.calledAt))/Math.max(.1,(p.stationAt??p.arrivalAt)-(p.departAt??p.calledAt));}
   else if(minute<p.changedAt){route=[locker,locker];f=0;uniform=minute>p.stationAt+1;}
   else{route=p.boardingRoute||[locker,e.home];f=(minute-p.changedAt)/Math.max(.1,p.arrivalAt-p.changedAt);uniform=true;}
   dressMedicalResponder(m,uniform);if(uniform)applyPersonInsignia(m,p);const pose=alongHomeWalk(route,Math.max(0,Math.min(1,f)));m.visible=f<1;m.position.set(pose.point[0],.25,pose.point[1]);m.rotation.y=pose.yaw;m.children[1].rotation.x=route.length>1&&route[0]!==route[1]?Math.sin(minute*6+p.id)*.4:0;m.children[2].rotation.x=-m.children[1].rotation.x;
  }
 }};
}
export function localStationPanel(engines){return `<section class="localStationSummary"><b>CIS Sud · 11 SPV</b><p>Moyens configurables dans Composer. Départ sur rappel depuis l’intervention. Retour des SPV chez eux après la mission.</p>${engines.filter(e=>e.localVolunteer).map(e=>`<div>${e.id} · ${e.localReturning?'Retour des SPV au domicile':e.status==='ready'?'SPV à rappeler':e.status==='departing'?e.crew+'/'+e.size+' arrivés au centre':'Équipage mobilisé'}</div>`).join('')}</section>`;}
