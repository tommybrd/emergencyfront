import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
const {state,engines,onCall,tickEngines,selectIncident,engageUnits,returnEngine,updateNauticalVisuals,waterBoats}=await import('../dist/scene.js');
const {capability}=await import('../dist/operations.js');
state.schedule=[];state.shiftEnd=100000;
const c={id:1,type:'SUAP',name:'Personne en difficulté dans le lac',requires:'VPL',waterRescue:true,at:state.minute,status:'waiting',duration:24,progress:0};state.calls.push(c);onCall(c);selectIncident(1);
const vpl=engines.find(e=>e.kind==='VPL'),vsav=engines.find(e=>e.id==='VSAV 1');
assert.equal(state.roster.length,13);assert.equal(c.victimCount,1);assert.equal(c.victimsKnown,false);assert(c.patients[0].trapped);assert.equal(capability(vpl,{type:'OD'}),null);
assert.equal(engageUnits([vsav.id]),null);
const step=()=>{state.minute+=.25;tickEngines(.25);updateNauticalVisuals();};
for(let i=0;i<4000&&vsav.status!=='scene';i++)step();assert.equal(vsav.status,'scene');for(let i=0;i<160;i++)step();assert.equal(vsav.patientAssigned,false);assert.equal(c.evacuated,0);assert.notEqual(c.status,'closed');
selectIncident(1);assert.equal(engageUnits([vpl.id]),null);
for(let i=0;i<4000&&!c.nautical.unitId;i++)step();assert.equal(vpl.status,'scene');assert.equal(c.nautical.unitId,vpl.id);assert.equal(vpl.model.position.x,120);assert.equal(vpl.model.position.z,-161.1);returnEngine(vpl);assert.equal(vpl.status,'scene');
const phases=new Set();for(let i=0;i<4000&&!c.nautical.done;i++){step();phases.add(c.nautical.phase);assert.equal(c.evacuated,0);const boat=waterBoats.get(1).boat;if(boat.visible){assert(boat.position.x>=72&&boat.position.x<=104);assert(boat.position.z>=-158&&boat.position.z<=-155);}}
assert(c.nautical.done);assert.equal(c.patients[0].trapped,false);assert(phases.has(2)&&phases.has(3));assert(vpl.model.userData.carriedBoat.visible);
for(let i=0;i<4000&&c.status!=='closed';i++)step();assert.equal(c.evacuated,1);assert.equal(vsav.status,'returning');assert(c.patients[0].deliveredAt!=null);assert.equal(waterBoats.size,0);
for(let i=0;i<4000&&vpl.status!=='ready';i++)step();assert.equal(vpl.status,'ready');assert.equal(vpl.crew,0);assert.equal(vpl.model.position.z,52);
console.log('PASS VPL dispatch, boat/divers animation, trapped patient, VSAV handover, hospital transport and station return');

const next={...c,id:2,status:'waiting',progress:0,siteCompletedAt:undefined,closedAt:undefined,patients:undefined,victimCount:1};state.calls.push(next);onCall(next);selectIncident(2);assert.equal(engageUnits([vpl.id]),null);returnEngine(vpl);assert.equal(vpl.status,'ready');assert.equal(vpl.crew,0);assert.equal(next.nautical.unitId,null);console.log('PASS cancellation before departure releases the crew');
