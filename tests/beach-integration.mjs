import assert from 'node:assert/strict';
import './game-environment.mjs';
import {BEACH,beachOpen,onBeach,inLake} from '../dist/beach-layout.js';
import {INCIDENTS,pickIncident} from '../dist/incident-catalog.js';
import {footprint,overlaps} from '../dist/vehicle-spacing.js';
let seed=507;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,updateNauticalVisuals,waterBoats,vehicleObstacles,district}=await import('../dist/scene.js');
state.schedule=[];state.minute=12*60;state.shiftEnd=100000;
assert(BEACH.spots.every(p=>onBeach(p)&&!inLake(p)));
assert(inLake(BEACH.swimmingVictim));
assert(!inLake(BEACH.handover));
assert.equal(beachOpen(8*60),false);assert.equal(beachOpen(12*60),true);assert.equal(beachOpen(20*60),false);
district.beach.update(1,12*60);assert(district.beach.visitors.visible);
district.beach.update(1,23*60);assert(!district.beach.visitors.visible);
for(const minute of[3*60,8*60,21*60])for(let i=0;i<1000;i++)assert(!pickIncident('SUAP',minute).beachHours);

let serial=0;
const make=id=>{const t=INCIDENTS.find(t=>t.id===id),c={...t,catalogId:id,id:++serial,at:state.minute,status:'waiting',progress:0,patients:[{severe:false,evacuated:false,assignedTo:null,transportRequired:true}]};state.calls.push(c);onCall(c);selectIncident(c.id);return c;};
const ambulance=engines.find(e=>e.id==='VSAV 1'),vpl=engines.find(e=>e.kind==='VPL'),nurse=engines.find(e=>e.kind==='VLI');
const responders=[ambulance,vpl,nurse];
const step=()=>{state.minute+=.25;tickEngines(.25);updateNauticalVisuals();for(const e of responders)for(const other of vehicleObstacles())if(other!==e.model&&other.visible!==false)assert(!overlaps(footprint(e.model),footprint(other)),e.id+' overlap');};
const until=(predicate,label)=>{for(let i=0;i<7000&&!predicate();i++)step();assert(predicate(),label+' '+JSON.stringify(responders.map(e=>({id:e.id,status:e.status,x:e.model.position.x,z:e.model.position.z,waiting:e.controlWaiting,blocked:e.trafficWaiting}))));};
const dry=make('sap-malaise-plage');assert.equal(dry.site.kind,'beach');assert(onBeach(dry.target));assert.deepEqual(dry.actionPoint,dry.target);assert.deepEqual(dry.accessTarget,BEACH.access);assert(!dry.nautical);
assert.equal(engageUnits([ambulance.id]),null);
until(()=>dry.status==='closed','malaise traité et victime déposée au CH');assert(dry.patients[0].deliveredAt!=null);
until(()=>ambulance.status==='ready','retour VSAV depuis la plage');
console.log('PASS beach location, daytime visitors, timed catalogue, on-sand care, CH handover and return');

const drowning=make('sap-noyade-plage');drowning.patients[0].severe=true;
assert.equal(drowning.site.kind,'water');assert(inLake(drowning.target));assert.deepEqual(drowning.nautical.victim,BEACH.swimmingVictim);assert(!drowning.victimsKnown);
assert.equal(engageUnits([ambulance.id,nurse.id]),null);
until(()=>ambulance.status==='scene'&&nurse.status==='scene','équipes sanitaires sur la berge');
for(let i=0;i<90;i++)step();assert(!ambulance.patientAssigned);assert(!drowning.patients[0].nursingComplete);assert(drowning.patients[0].trapped);
assert(drowning.reinforcementAlerts.some(a=>a.need==='divers'));
selectIncident(drowning.id);assert.equal(engageUnits([vpl.id]),null);
until(()=>drowning.nautical.phase===2,'bateau au contact');
const boat=waterBoats.get(drowning.id).boat;assert(Math.abs(boat.position.x-BEACH.swimmingVictim[0])<.01);assert(Math.abs(boat.position.z-BEACH.swimmingVictim[1])<.01);
assert.deepEqual(drowning.actionPoint,BEACH.handover);
until(()=>drowning.nautical.done,'victime ramenée sur la berge');assert(!drowning.patients[0].trapped);
until(()=>drowning.status==='closed','noyade prise en charge jusqu’au CH');assert(drowning.patients[0].deliveredAt!=null);assert(drowning.patients[0].nursingComplete);
until(()=>responders.every(e=>e.status==='ready'),'retour de tous les secours');
assert.equal(waterBoats.size,0);
console.log('PASS beach drowning: shore staging, divers request, boat and diver at victim, nurse/VSAV handover, hospital and collision-free returns');

for(const id of['sap-blessure-plage','sap-baignade-sortie']){const c=make(id);assert.equal(c.site.kind,'beach');assert(!c.nautical);assert(!c.patients[0].trapped);c.status='closed';}
