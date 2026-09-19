import {assignCrew,prepareCrew} from './crew.js';

export const PLAYER_HOME=Object.freeze({position:[25,125],parking:[10,125],entry:[2.1,140],approach:[10,132],exit:[2.1,114],door:[16.4,125],bed:[28,121],yaw:Math.PI,address:'Domicile · boulevard des Tilleuls'});
export const isHomeTime=minute=>{const h=(minute/60)%24;return h>=22||h<7;};
export const boardingAtBase=e=>e.status==='departing'&&(e.wasAtStation||e.wasAtHome);
export const returnPoint=e=>e.kind==='VLCG'&&e.returnTo==='home'?PLAYER_HOME.parking:e.home;
export const returnYaw=e=>e.kind==='VLCG'&&e.returnTo==='home'?PLAYER_HOME.yaw:e.home[0]<-70?Math.PI/2:-Math.PI/2;

export function alongHomeWalk(points,fraction){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,fraction));
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],f=lengths[i]?distance/lengths[i]:1;return {point:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],yaw:Math.atan2(b[0]-a[0],b[1]-a[1])};}distance-=lengths[i];}
 return {point:points[0],yaw:0};
}
export function prepareHomeDeparture(s,e,routine=false,random=Math.random){
 const p=s.roster.find(p=>p.role==='captain'),resting=s.minute>=(p.homeArrivedAt??-Infinity)+3;
 const from=resting?PLAYER_HOME.bed:alongHomeWalk([PLAYER_HOME.parking,PLAYER_HOME.door,PLAYER_HOME.bed],(s.minute-p.homeArrivedAt)/3).point;
 const wake=resting?(routine?.5+random():1+random()*2):0,equip=routine?.5:1.2+random()*1.4,delay=wake+equip;
 const path=[from,PLAYER_HOME.door,PLAYER_HOME.parking],walk=path.slice(1).reduce((n,a,i)=>n+Math.hypot(a[0]-path[i][0],a[1]-path[i][1]),0)/14;
 e.boarding=[{id:p.id,from,locker:PLAYER_HOME.door,path,delay,duration:delay+walk,home:true,resting}];return delay+walk;
}

// Routine travel never interrupts an intervention; the player stays dispatchable.
export function beginHomeRoutine(s,e){
 if(s.ended||e.kind!=='VLCG'||e.status!=='ready'||e.call)return null;
 const home=isHomeTime(s.minute);if(home===!!e.atResidence)return null;
 if(!assignCrew(s,e))return null;
 e.commuteDestination=home?'home':'cis';e.wasAtHome=!!e.atResidence;e.wasAtStation=!e.atResidence;e.alertAt=s.minute;
 e.departAt=s.minute+(e.wasAtHome?prepareHomeDeparture(s,e,true):prepareCrew(s,e));
 e.status='departing';e.beacons=false;e.siren=false;e.sirenHeld=false;e.amber=false;e.path=null;e.parking=null;
 return home?'Le chef de centre rentre à son domicile. Il reste disponible.':'Le chef de centre rejoint le CIS pour la journée.';
}
export function markHomeDeparture(s,e){if(e.kind!=='VLCG')return;e.atResidence=false;const p=s.roster.find(p=>p.role==='captain');if(p)p.atResidence=false;}
export function markHomeArrival(s,e){if(e.kind!=='VLCG')return;e.atResidence=e.returnTo==='home';e.commuteDestination=null;const p=s.roster.find(p=>p.role==='captain');if(p){p.atResidence=e.atResidence;p.homeArrivedAt=e.atResidence?s.minute:null;}}
export function personAtCis(p,engines){return p.present&&!p.atResidence&&(!p.engine||engines.some(e=>e.id===p.engine&&e.status==='departing'&&e.wasAtStation));}
