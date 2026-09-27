import {applyPersonInsignia} from './crew-insignia.js';
import * as T from 'three';
import {box,sign,person,dressMedicalResponder} from './models.js';
import {batchStatic} from './batching.js';
export const LOCAL_STATION={name:'CIS des Jardins',entry:[235,183],gate:[240,205]};
export const volunteerFleet=[
 {id:'VSAV Jardins',kind:'VSAV',size:3,home:[230,220],ambulanceModel:'cell'},
 {id:'FPTL Jardins',kind:'FPT',size:4,home:[240,220],lightPump:true,tankCapacity:2000},
 {id:'CCFM Jardins',kind:'CCF',size:4,home:[250,220],tankCapacity:4000,signalFront:'round',signalRear:'round'}
].map((e,i)=>({...e,name:e.id+' · centre volontaire',external:true,mutualAid:true,localVolunteer:true,base:LOCAL_STATION.name,baseYaw:Math.PI,mobilization:12,localIndex:i}));
export function mobilizeLocalCrew(e,minute){
 if(!e.localVolunteer)return;
 e.localReturning=false;e.localReleaseAt=null;
 e.localCrew=Array.from({length:e.size},(_,i)=>({id:200+e.localIndex*10+i,kind:'SPV',engine:e.id,calledAt:minute,arrivalAt:minute+5+i*1.7,origin:[218+i*5,186+e.localIndex*3]}));
 e.crew=0;e.crewIds=e.localCrew.map(p=>p.id);e.mobilization=Math.max(...e.localCrew.map(p=>p.arrivalAt))-minute+2;
}
export function tickLocalCrew(e,minute){
 if(!e.localVolunteer)return;
 if(e.localReturning){if(minute-e.localReleaseAt>=6){e.localCrew=[];e.localReturning=false;e.crew=0;e.crewIds=[];}return;}
 if(e.status==='departing'&&e.localCrew?.length)e.crew=e.localCrew.filter(p=>minute>=p.arrivalAt).length;
}
export function createVolunteerStation(world){
 const root=new T.Group();root.name='CIS des Jardins · 100 % volontaires';world.add(root);
 box(root,38,.16,36,'#9baba1',240,.1,220);
 const access=box(root,8,.06,23,'#707f76',237.5,.2,194);access.rotation.y=Math.atan2(5,22);
 for(const x of[223,257])box(root,.45,5.8,24,'#c0cbc0',x,3,223);
 box(root,34,5.8,.45,'#c0cbc0',240,3,235);
 for(const x of[224,235,245,256])box(root,.5,5.5,.6,'#aabcb6',x,2.9,211);
 box(root,34,.9,1,'#ae3830',240,5.6,211);
 sign(root,'CIS DES JARDINS · VOLONTAIRES',31,.65,240,5.65,210.4,'#ae3830').rotation.y=Math.PI;
 for(const [i,e]of volunteerFleet.entries()){const x=e.home[0];box(root,8,.03,21,'#687e78',x,.2,221);sign(root,['VSAV','FPTL','CCFM'][i],5,.7,x,4.7,210.3,'#263f42').rotation.y=Math.PI;for(const side of[-1,1])box(root,.12,.04,21,'#eee3b3',x+side*4,.24,221);}
 box(root,7,3.6,8,'#aebeb4',262,1.95,229);box(root,7.5,.22,8.5,'#687c75',262,3.85,229);sign(root,'VESTIAIRES',6,.6,262,3,224.8).rotation.y=Math.PI;
 // Open roof over the three bays keeps stored vehicles readable from above.
 for(const x of[224,235,245,256])box(root,.24,.35,24,'#637c76',x,5.9,223);
 box(root,34,.2,8,'#6e847e',240,6.05,231);
 batchStatic(root);
 const people=new Map();
 return {root,update(engines,minute){for(const m of people.values())m.visible=false;for(const e of engines.filter(e=>e.localVolunteer))for(const p of e.localCrew||[]){let m=people.get(p.id);if(!m){m=person(world,0,0);m.name='SPV des Jardins';people.set(p.id,m);}dressMedicalResponder(m,false);applyPersonInsignia(m,p);const returning=e.localReturning,t=returning?Math.min(1,(minute-e.localReleaseAt)/6):Math.max(0,Math.min(1,(minute-p.calledAt)/(p.arrivalAt-p.calledAt))),from=returning?e.home:p.origin,to=returning?p.origin:e.home;m.visible=returning?t<1:e.status==='departing'&&minute<p.arrivalAt+1;m.position.set(from[0]+(to[0]-from[0])*t,.25,from[1]+(to[1]-from[1])*t);m.rotation.y=Math.atan2(to[0]-from[0],to[1]-from[1]);m.children[1].rotation.x=Math.sin(minute*6+p.id)*.4;m.children[2].rotation.x=-m.children[1].rotation.x;}}};
}
export function localStationPanel(engines){return `<section class="localStationSummary"><b>CIS des Jardins · 11 SPV</b><p>VSAV · FPTL · CCFM. Départ sur rappel depuis l’intervention. Retour des SPV chez eux après la mission.</p>${engines.filter(e=>e.localVolunteer).map(e=>`<div>${e.id} · ${e.localReturning?'Retour des SPV au domicile':e.status==='ready'?'SPV à rappeler':e.status==='departing'?e.crew+'/'+e.size+' arrivés au centre':'Équipage mobilisé'}</div>`).join('')}</section>`;}
