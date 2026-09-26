import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
// Keep dispatch locations and civilian traffic reproducible for this rescue scenario.
let rescueSeed=2026;Math.random=()=>((rescueSeed=(Math.imul(rescueSeed,1664525)+1013904223)>>>0)/4294967296);
const {state,engines,onCall,tickEngines,selectIncident,engageUnits,district,aftermath,perimeters}=await import('../dist/scene.js');
const {chooseRescue}=await import('../dist/incident-events.js');
const {recallCrew}=await import('../dist/crew.js');recallCrew(state,1); // Restore 12 operational crew alongside the dedicated nurse.
state.schedule=[];state.shiftEnd=100000;
const c={id:1,type:'INC',name:'Feu de cuisine',requires:'FPT',at:state.minute,status:'waiting',duration:50,progress:0};state.calls.push(c);onCall(c);c.complicationPlan={delay:0};
selectIncident(1);assert.equal(engageUnits(['FPTSR']),null);
const pump=engines.find(e=>e.id==='FPTSR');
const step=()=>{state.minute+=.25;tickEngines(.25);};
for(let i=0;i<2000&&!c.complication;i++)step();assert(c.complication);assert(c.reconComplete);assert.equal(c.victimCount,1);assert(c.patients[0].trapped);globalThis.frame(performance.now());
selectIncident(1);assert(els.get('incidentPanel').innerHTML.includes('data-rescue="interior"'));assert.equal(engageUnits(['VSAV 1']),null);
const vsav=engines.find(e=>e.id==='VSAV 1');
for(let i=0;i<2000&&vsav.status!=='scene';i++)step();assert.equal(vsav.status,'scene');assert.equal(vsav.patientAssigned,false,'VSAV cannot transport a trapped person');assert.equal(c.evacuated,0);
assert.equal(chooseRescue(c,'protect',engines,state.minute,()=>{}),null);pump.nozzles.large=2;c.progress=.999;
for(let i=0;i<720&&!c.fireContained;i++)step();assert(c.fireContained);assert.notEqual(c.status,'closed','Extinction must wait for rescue and transport');assert.equal(c.progress,1);
for(let i=0;i<2000&&c.status!=='closed';i++)step();assert.equal(c.complication.status,'resolved');assert.equal(c.evacuated,1);assert.equal(c.status,'closed');assert.equal(state.completed,1);assert.equal(vsav.status,'returning');assert(c.patients[0].deliveredAt!=null);assert.equal(c.progress,1);
assert(aftermath.records.has(c.id),'Finished fire leaves a localized trace');
console.log('PASS real dispatch, reconnaissance, VSAV waits for rescue, extinction and evacuation finish independently');

for(let i=0;i<2000&&pump.status!=='ready';i++)step();assert.equal(pump.status,'ready');assert(!perimeters.records.has(c.id),'Cordon removed after the crews leave');
const other={id:2,type:'INC',name:'Feu de cuisine',requires:'FPT',at:state.minute,status:'waiting',duration:50,progress:0};state.calls.push(other);onCall(other);other.complicationPlan={delay:0};selectIncident(2);assert.equal(engageUnits(['FPTSR']),null);
for(let i=0;i<2000&&!other.complication;i++)step();assert(other.complication);assert.equal(chooseRescue(other,'interior',engines,state.minute,()=>{}),null);assert.equal(engageUnits(['VSAV 2']),null);
for(let i=0;i<2000&&other.evacuated<1;i++)step();assert.equal(other.evacuated,1);assert.notEqual(other.status,'closed');assert.equal(other.progress,0,'Evacuation must not replace fire progress');
pump.nozzles.large=2;other.progress=.999;for(let i=0;i<4000&&other.status!=='closed';i++)step();assert.equal(other.status,'closed');assert(other.patients[0].deliveredAt!=null);assert.equal(state.completed,2);console.log('PASS evacuation before extinction also preserves the mission');
