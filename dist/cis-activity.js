import {CIS_YARD_PARKING} from './station-layout.js';
import {smoothRoute} from './route3d.js';
import {assignCrew,prepareCrew,releaseCrew} from './crew.js';
import {isHomeTime} from './player-home.js';
// Activité locale : même véhicule et vrai conducteur, aucun nouvel engin.
export function createCisActivity({state,engines}){
 function start(e){
  if(!e||e.status!=='ready'||e.atResidence||e.call!=null||e.path||e.crew||!assignCrew(state,e))return false;
  const parking=!e.cisParked,target=parking?CIS_YARD_PARKING.point:e.home;
  e.yardRoutine={parking,target:[...target]};e.wasAtStation=true;e.wasAtHome=false;e.commuteDestination=null;e.alertAt=state.minute;
  // La manœuvre de cour ne consomme pas l'aléatoire des interventions.
  e.departAt=state.minute+prepareCrew(state,e,()=>.5,engines);e.status='departing';e.path=null;return true;
 }
 function tick(){
  const e=engines.find(e=>e.kind==='VLCG');
  if(!e||state.ended||isHomeTime(state.minute)||e.atResidence||e.status!=='ready')return;
  e.nextYardMoveAt??=state.minute+60;
  if(state.minute<e.nextYardMoveAt||state.incoming?.length||state.calls.some(c=>c.status!=='closed'))return;
  if(!start(e))e.nextYardMoveAt=state.minute+5;
 }
 function depart(e){
  const r=e.yardRoutine;if(!r)return false;
  const start=[e.model.position.x,e.model.position.z];
  if(r.parking)e.path=smoothRoute([start,[e.home[0],86],[-44,89],[-34.2,91],r.target]);
  else{const approach=smoothRoute([start,[-34.2,100],[-44,100],[-48,89],[e.home[0],83]]),reverse=smoothRoute([[e.home[0],83],e.home]);reverse.forEach(p=>p.gear=-1);e.path=[...approach,...reverse.slice(1)];}
  e.segment=1;e.status='yardMoving';e.siren=false;return true;
 }
 function arrive(e){
  const r=e.yardRoutine;if(!r)return false;
  e.cisParked=r.parking;e.basePoint=[...r.target];e.model.position.set(r.target[0],.2,r.target[1]);e.model.rotation.y=r.parking?CIS_YARD_PARKING.yaw:e.baseYaw??0;
  e.path=null;e.status='ready';e.yardRoutine=null;e.nextYardMoveAt=state.minute+90;releaseCrew(state,e);return true;
 }
 return {tick,start,depart,arrive};
}
