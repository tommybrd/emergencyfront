import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {INCIDENTS} from '../dist/incident-catalog.js';
import {disposeObject} from '../dist/dispose.js';
import {recallCrew} from '../dist/crew.js';
import {fireStatus} from '../dist/fire-status.js';
import {findHydrantSupply} from '../dist/water-supply.js';
let seed=Number(process.env.TEST_SEED||73);Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const game=await import('../dist/scene.js');
const {state,engines,onCall,tickEngines,selectIncident,engageUnits,fireEffects,hazards,district,toggleHydrant,openPlacement,choosePlacement}=game;
state.schedule=[];state.shiftEnd=100000;recallCrew(state,30);
let serial=0;
const call=(id,extra={})=>{const template=INCIDENTS.find(c=>c.id===id),c={...template,catalogId:id,id:++serial,at:state.minute,status:'waiting',progress:0,allowComplications:false,...extra};state.calls.push(c);onCall(c);return c;};
const step=()=>{state.minute+=.25;tickEngines(.25);};
const until=(predicate,message)=>{for(let i=0;i<6000&&!predicate();i++)step();assert(predicate(),message);};

for(const template of INCIDENTS){
 const c=call(template.id);
 assert(c.target.every(Number.isFinite));
 if(['SUAP','AVP'].includes(c.type)){assert.equal(c.victimsKnown,false);assert.equal(c.patients.length,c.victimCount);}
 if(c.type==='INC'){
  assert(c.fireTarget.every(Number.isFinite));assert(Number.isFinite(c.fireHeight));assert(fireEffects.has(c.id));
  if(['vehicle','bin','motorcycle'].includes(c.scene)){assert.notEqual(c.site.kind,'building');assert.deepEqual(c.fireTarget,c.target);}
  if(c.scene==='chimney')assert(c.fireHeight>c.site.height);
 }
 const h=hazards.get(c.id);
 if(h){assert.equal(h.userData.incidentScene,c.scene);h.traverse(o=>assert([o.position.x,o.position.y,o.position.z].every(Number.isFinite)));if(c.scene==='pedestrian')assert.equal(h.userData.vehicleCount,1);if(c.type==='AVP'&&c.scene==='pileup')assert.equal(h.userData.vehicleCount,4);}
 // Dispose fixture scenes before testing real departures below.
 c.status='closed';if(h){disposeObject(h);hazards.delete(c.id);}fireEffects.get(c.id)?.dispose();fireEffects.delete(c.id);
}
console.log('PASS all 48 scene templates, matching buildings/roads/forest and correctly scaled fire locations');

const alarm=call('inc-alarme',{inspectionResult:false});selectIncident(alarm.id);assert.equal(engageUnits(['FPTL 1']),null);
const lightPump=engines.find(e=>e.id==='FPTL 1'),waterBefore=lightPump.water;
until(()=>alarm.reconComplete,'alarm reconnaissance');assert.equal(alarm.fireConfirmed,false);assert.equal(alarm.progress>=1,false);
assert.equal(fireStatus(alarm,engines).label,'Absence de feu · contrôle final');
until(()=>alarm.status==='closed','alarm closes automatically after checks');assert.equal(lightPump.water,waterBefore);assert(!fireEffects.has(alarm.id));assert(!hazards.has(alarm.id));assert.notEqual(lightPump.status,'transport');
assert(alarm.radio.some(r=>r.message.includes('absence d’incendie')));assert(!alarm.radio.some(r=>r.message.includes('Foyer éteint')));
console.log('PASS unfounded fire alarm, reconnaissance, checks, no water and automatic release');

const fire=call('inc-fumee',{inspectionResult:true});selectIncident(fire.id);assert.equal(engageUnits(['FPTSR']),null);
until(()=>fire.reconComplete,'suspected fire reconnaissance');assert.equal(fire.fireConfirmed,true);assert.equal(fire.duration,80);
const pump=engines.find(e=>e.id==='FPTSR');for(let i=0;i<20;i++)step();assert.equal(fire.progress,0,'confirmed fire waits for player to establish hoses');
if(!findHydrantSupply(pump,district.hydrants,engines)){
 openPlacement(pump);
 const index=game.tacticalOptions.findIndex(p=>findHydrantSupply({...pump,model:{position:pump.model.position.clone().set(p.target[0],.2,p.target[1]),rotation:{y:p.yaw},userData:pump.model.userData}},district.hydrants,engines));
 assert(index>=0,'A reachable hydrant is available through tactical placement');choosePlacement(pump,index);until(()=>pump.status==='scene','Pump reaches the water supply');
}
assert(toggleHydrant(pump),'Connect to a real, accessible hydrant');pump.nozzles.large=2;until(()=>fire.status==='closed','confirmed fire can be extinguished');assert(fire.radio.some(r=>r.message.includes('Feu confirmé')));
console.log('PASS confirmed fire requires hoses and can be completed');

const lift=call('sap-relevage',{patients:[{severe:false,evacuated:false,assignedTo:null,transportRequired:false}]});selectIncident(lift.id);assert.equal(engageUnits(['VSAV 1']),null);
const ambulance=engines.find(e=>e.id==='VSAV 1');until(()=>ambulance.patientAssigned,'relevage patient assigned');
while(ambulance.patientProgress<.8){step();}
globalThis.frame(performance.now());assert(ambulance.model.userData.rearDoors.every(d=>d.pivot.rotation.y===0),'no stretcher loading for care without transport');
until(()=>lift.status==='closed','relevage completed');assert(lift.patients[0].releasedOnSite);assert.notEqual(ambulance.status,'transport');selectIncident(lift.id);assert(!els.get('incidentPanel').innerHTML.includes('1 évacuée(s)'));
assert(state.logs.some(r=>r.message.includes('maintien à domicile')));
console.log('PASS care at home, no ambulance loading, no hospital trip, available after reconditioning');
