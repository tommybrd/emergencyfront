import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=21;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const g=await import('../dist/scene.js');
const {canEngage}=await import('../dist/operations.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
g.state.schedule=[];g.state.nextMaintenanceAt=Infinity;g.state.shiftEnd=100000;
const units=g.engines.filter(e=>e.localVolunteer);assert.equal(units.length,3);assert.deepEqual(units.map(e=>e.kind),['VSAV','FPT','CCF']);
const staff=g.state.freeStaff,c={id:96,type:'SUAP',name:'Malaise',at:g.state.minute,status:'waiting',duration:24,progress:0,victimCount:1,patients:[{severe:false,evacuated:false,assignedTo:null,transportRequired:true}]};g.state.calls.push(c);g.onCall(c);g.selectIncident(c.id);const e=units[0];assert.equal(g.engageUnits([e.id]),null);assert.equal(g.state.freeStaff,staff);assert.equal(e.crew,0);assert.equal(e.localCrew.length,3);
const called=g.state.minute;function step(){g.state.minute+=.25;g.tickEngines(.25);for(const u of units)for(const o of units)if(u!==o)assert(!overlaps(footprint(u.model),footprint(o.model)),'local bay collision');}
for(let i=0;i<12;i++)step();assert.equal(e.status,'departing');assert.equal(e.crew,0);
let sawScene=false,sawHomebound=false;for(let i=0;i<7000;i++){step();if(e.status==='scene'){sawScene=true;assert.equal(e.crew,3);}if(e.localReturning){sawHomebound=true;assert(!canEngage(e));}if(sawHomebound&&!e.localReturning&&e.status==='ready')break;}
if(!sawHomebound)console.log({status:e.status,point:[e.model.position.x,e.model.position.z],crew:e.crew,call:e.call,local:e.localReturning,path:e.path?.slice(e.segment,e.segment+5),logs:g.state.logs.slice(-6)});assert(sawScene,'local VSAV reaches scene');assert(sawHomebound,'local crew goes home');assert.equal(e.status,'ready');assert(!e.localReturning);assert.equal(e.localCrew.length,0);assert.equal(g.state.freeStaff,staff);assert(e.model.position.distanceTo({x:e.home[0],y:.2,z:e.home[1]})<.1);assert.equal(e.model.rotation.y,Math.PI);
console.log('PASS Jardins SPV delayed muster, independent staffing, mission, CH, own-station return and crew demobilization');

const fireUnits=units.slice(1),od={id:97,type:'OD',name:'Arbre tombé',requires:'VTU',at:g.state.minute,status:'waiting',duration:20,progress:0};g.state.calls.push(od);g.onCall(od);g.selectIncident(od.id);assert.equal(g.engageUnits(fireUnits.map(e=>e.id)),null);
const drained=new Set(),refilled=new Set(),released=new Set();for(let i=0;i<8000;i++){step();for(const u of fireUnits){if(u.status==='scene'&&!drained.has(u.id)){u.water=u.capacity/2;drained.add(u.id);}if(u.status==='refilling'){refilled.add(u.id);assert(!u.localReturning,'crew stays for tank refill');}if(u.localReturning)released.add(u.id);}if(released.size===2&&fireUnits.every(e=>e.status==='ready'&&!e.localReturning))break;}
assert.equal(drained.size,2);assert.equal(refilled.size,2);assert.equal(released.size,2);assert(fireUnits.every(e=>e.water===e.capacity&&e.status==='ready'&&!e.localReturning));assert.equal(g.state.freeStaff,staff);
console.log('PASS simultaneous local FPTL/CCFM departures, own-bay returns, refill before volunteer release');
const {saveGuard,readGuard,restoreGuard}=await import('../dist/guard-save.js');const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};
assert.equal(saveGuard(g.state,g.engines.filter(e=>!e.localVolunteer),g.district.hydrants,g.camera,g.controls,storage),null);
restoreGuard(readGuard(storage),g.state,g.engines,g.district.hydrants,g.camera,g.controls,()=>{});assert.equal(g.engines.filter(e=>e.localVolunteer).length,3);
console.log('PASS old guard snapshots retain their fleet and accept the new voluntary centre');
