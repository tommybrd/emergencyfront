import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=17;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
const {requestVolunteers,tickVolunteers,cancelVolunteer,volunteerPool,volunteerActivity,availability}=await import('../dist/reinforcements.js');
const {dismissCrew}=await import('../dist/crew.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const {state,volunteerTravel,tickEngines,vehicleObstacles}=game;
state.schedule=[];state.next=0;state.shiftEnd=100000;state.minute=600;
const worker=volunteerPool(state).find(p=>p.worker&&p.canLeaveWork);
assert.equal(volunteerActivity(worker,600),'work');assert.equal(availability(worker,600),null);assert.equal(volunteerActivity(worker,23*60),'home');
const called=requestVolunteers(state,1);assert(called>0);const phases=new Set();let steps=0;
function step(){
 
 state.minute+=.25;tickEngines(.25);tickVolunteers(state,()=>{},volunteerTravel.ready);steps++;
 const models=vehicleObstacles().filter(m=>m.visible!==false);
 for(let i=0;i<models.length;i++)for(let j=i+1;j<models.length;j++)assert(!overlaps(footprint(models[i]),footprint(models[j])),'overlap '+models[i].userData.personId+' / '+models[j].userData.personId);
 for(const v of volunteerTravel.records.values()){
  phases.add(v.phase);
  if(['preparing','driving','parking','walking','changing'].includes(v.phase))assert(!state.roster.find(p=>p.id===v.personId)?.present,'available before reaching the station');
  assert.equal(v.beacons,false);assert.equal(v.model.userData.personalCar,true);
 }
}
function until(predicate,max,label){for(let i=0;i<max*4&&!predicate();i++)step();if(!predicate())console.log(JSON.stringify({records:[...volunteerTravel.records.values()].filter(v=>v.phase!=='away').map(v=>({id:v.personId,phase:v.phase,point:[v.model.position.x,v.model.position.z],origin:v.origin,segment:v.segment,wait:v.controlWaiting,path:v.path?.slice(v.segment,v.segment+8)})),zones:[...game.trafficControl.records.entries()].filter(([id,r])=>r.queue.size).map(([id,r])=>({id,owner:r.owner?.personId||r.owner?.id,point:r.owner&&[r.owner.model.position.x,r.owner.model.position.z],queue:[...r.queue.keys()].map(v=>({id:v.personId||v.id,point:[v.model.position.x,v.model.position.z],path:v.path?.slice(v.segment,v.segment+3)}))}))},null,2));assert(predicate(),label);}
step();assert.equal(state.freeStaff,11);assert(volunteerTravel.records.size>0);assert(state.recallRequests.some(r=>r.activity==='work'));assert(state.recallRequests.some(r=>r.activity==='home'));
until(()=>state.recallRequests.every(r=>r.status==='arrived'),700,'daytime volunteers physically arrive');
assert.equal(state.freeStaff,11+called);assert(phases.has('walking')&&phases.has('changing')&&phases.has('driving'));
for(const v of volunteerTravel.records.values()){assert(Math.hypot(v.model.position.x-v.bay[0],v.model.position.z-v.bay[1])<.1);assert(!v.driver.visible);}
assert.equal(dismissCrew(state),called);until(()=>[...volunteerTravel.records.values()].every(v=>v.phase==='away'),700,'dismissed volunteers walk to their cars and return');assert.equal(state.freeStaff,11);
requestVolunteers(state,2);step();const batch=state.recallBatches.at(-1).id;cancelVolunteer(state,batch);until(()=>![...volunteerTravel.records.values()].some(v=>v.request.batch===batch&&!['away'].includes(v.phase)),100,'cancelled recall does not add staff');assert.equal(state.freeStaff,11);
state.minute=22*60;const nightCount=requestVolunteers(state,3);assert(nightCount>20);step();
until(()=>state.recallRequests.every(r=>r.status!=='enroute'),1200,'general night recall arrives without blocking the CIS');assert.equal(state.freeStaff,11+nightCount);
assert.equal(dismissCrew(state),nightCount);until(()=>[...volunteerTravel.records.values()].every(v=>v.phase==='away'),1200,'general recall can all return home');
console.log('PASS SPV physical arrival, activity origins, parking, walking, availability gating, dismissal and cancellation; no collisions',{called,steps});
