import assert from 'node:assert/strict';
import './game-environment.mjs';
import {PLAYER_HOME,isHomeTime,personAtCis} from '../dist/player-home.js';
import {canEngage} from '../dist/operations.js';
import {footprint,overlaps} from '../dist/vehicle-spacing.js';

let seed=19;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
const {state,engines,tickEngines,homeLife,onCall,selectIncident,engageUnits,returnEngine,statusText,destinationText,applyPlayerProfile}=game;
state.schedule=[];state.calls=[];state.paused=true;state.shiftEnd=100000;state.minute=21*60+59;
const cg=engines.find(e=>e.kind==='VLCG'),player=state.roster.find(p=>p.role==='captain'),station=cg.home.slice();
assert(!isHomeTime(21*60+59));assert(isHomeTime(22*60));assert(isHomeTime(1440+6*60+59));assert(!isHomeTime(1440+7*60));
assert.equal(state.roster.filter(p=>personAtCis(p,engines)).length,13);
let maxWait=0;
function step(){
 const before=cg.model.position.clone();state.minute+=.25;tickEngines(.25);
 assert(cg.model.position.distanceTo(before)<4.1,'home routine must drive without teleporting');
 const models=game.vehicleObstacles().filter(m=>m.visible!==false);
 for(let i=0;i<models.length;i++)for(let j=i+1;j<models.length;j++)assert(!overlaps(footprint(models[i]),footprint(models[j])),'overlap during home routine');
 assert(!state.logs.some(l=>l.message.includes('repositionnement')),'home route must not need recovery');
 maxWait=Math.max(maxWait,cg.blockedSeconds||0);
}
function until(condition,label){for(let n=0;n<2400&&!condition();n++)step();assert(condition(),label+' '+JSON.stringify({status:cg.status,returnTo:cg.returnTo,at:cg.model.position,wait:cg.controlWaiting,minute:state.minute}));}
function frame(){globalThis.frame(performance.now());}

step();assert.equal(cg.status,'ready');
until(()=>cg.status==='departing','routine starts at 22:00');assert.equal(cg.commuteDestination,'home');assert(canEngage(cg));assert(!cg.beacons);
until(()=>cg.atResidence&&cg.status==='ready','arrive at home');
assert.deepEqual([cg.model.position.x,cg.model.position.z],PLAYER_HOME.parking);assert.deepEqual(cg.home,station);assert.equal(cg.model.rotation.y,Math.PI);
assert.equal(cg.crew,0);assert.equal(player.engine,null);assert(player.present&&player.atResidence);assert.equal(state.freeStaff,11);
assert.equal(state.roster.filter(p=>personAtCis(p,engines)).length,12);assert.match(statusText(cg),/domicile/);assert.match(destinationText(cg),/Domicile/);
for(let i=0;i<16;i++)step();frame();assert(homeLife.sleeper.visible);assert(!homeLife.roof.visible);assert(!cg.officer.visible);
assert(!cg.beacons&&!cg.siren&&!cg.amber);assert(cg.model.userData.headlights.every(l=>l.material.emissiveIntensity===0));
const stationOfficers=[];cg.model.parent.traverse(o=>{if(o.userData.role==='captain'&&o!==cg.officer)stationOfficers.push(o);});assert(stationOfficers.every(o=>!o.visible));

const c={id:901,type:'INC',name:'Feu de véhicule',requires:'FPT',at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);c.target=[140,-30];c.accessTarget=c.target;selectIncident(c.id);
assert.equal(engageUnits(['VLCG']),null);assert(cg.wasAtHome&&!cg.wasAtStation);assert.equal(cg.crew,1);assert.equal(state.freeStaff,11);assert.equal(player.engine,'VLCG');
assert(cg.departAt>state.minute+2);assert(!cg.path&&!cg.beacons);assert.deepEqual(cg.boarding[0].locker,PLAYER_HOME.door);assert.match(statusText(cg),/Réveil/);
frame();assert(homeLife.sleeper.visible);
returnEngine(cg);assert.equal(cg.status,'ready');assert(cg.atResidence);assert.equal(player.engine,null);frame();assert(homeLife.sleeper.visible);
assert.equal(engageUnits(['VLCG']),null);
until(()=>state.minute>=cg.alertAt+cg.boarding[0].delay+.15,'wake and equip');frame();assert(!homeLife.sleeper.visible);assert(cg.officer.visible);assert(cg.officer.position.x>5,'walk at home, not the station');assert(!cg.beacons);
until(()=>cg.status==='enroute','departure directly from home');assert(!cg.atResidence&&!player.atResidence);assert(cg.beacons);
assert(!cg.path.some(p=>p[0]<-44&&p[0]>-96&&p[1]>52&&p[1]<105),'home dispatch does not detour through CIS');
until(()=>cg.status==='scene','reach incident');const arrival=state.minute;for(let i=0;i<40;i++)step();assert.equal(cg.status,'scene','night routine never interrupts an intervention');
returnEngine(cg);until(()=>cg.atResidence&&cg.status==='ready','return home after the intervention');assert.equal(cg.returnTo,'home');
assert(applyPlayerProfile({...state.playerProfile,vehicle:'car'},false).pending);assert.equal(cg.model.userData.playerVehicle,'van');

// Morning preparation can be interrupted by dispatch, with one dedicated officer.
state.minute=1440+7*60;step();assert.equal(cg.commuteDestination,'cis');assert(canEngage(cg));assert.equal(cg.crew,1);assert.equal(destinationText(cg),'CIS Valmont');
selectIncident(c.id);assert.equal(engageUnits(['VLCG']),null);assert.equal(cg.commuteDestination,null);assert.equal(cg.crewIds.length,1);assert(cg.wasAtHome);assert.equal(state.freeStaff,11);
returnEngine(cg);assert(cg.atResidence);until(()=>!cg.atResidence&&cg.status==='ready','morning return to CIS');
assert.deepEqual([cg.model.position.x,cg.model.position.z],station);assert.equal(cg.model.userData.playerVehicle,'car');assert.equal(player.engine,null);assert(!player.atResidence);assert.equal(state.roster.filter(p=>personAtCis(p,engines)).length,13);
assert.equal(engines.length,14);assert.equal(state.roster.filter(p=>p.role==='captain').length,1);assert.equal(state.freeStaff,11);
console.log('PASS chief home: evening commute, sleeping cutaway, parked dark vehicle, on-call status, waking/boarding, cancellation, direct dispatch, night return and morning routine interruption', {maxWait});
