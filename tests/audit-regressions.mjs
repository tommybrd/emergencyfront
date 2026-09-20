import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {createShift,setDensity,tickShift,continueShift,fleet} from '../dist/sim.js';
import {initWater,tickWater,setNozzle,tickEquipment,stow,equipmentBusy} from '../dist/hydraulics.js';
import {vehicle,addAmbulanceDoors,person} from '../dist/models.js';
import {updateLoading} from '../dist/ambulance-loading.js';
import {createIncidentFx} from '../dist/effects.js';
import {responseVisuals} from '../dist/response-visuals.js';
import {fireStatus} from '../dist/fire-status.js';
import {initIncident,tickCommand,reinforcementPanel} from '../dist/command.js';
import {streetRoute} from '../dist/roads.js';
import {installSceneLighting,updateSceneLighting} from '../dist/scene-lighting.js';
import {installRotaryBeacons,updateRotaryBeacons} from '../dist/rotary-beacons.js';
const s=createShift();s.schedule=[];for(let i=0;i<1440;i++)tickShift(s,1,()=>{});assert.equal(s.minute,1920);assert(s.ended);continueShift(s);assert(!s.ended);assert.equal(s.shiftEnd,3360);
s.calls=Array.from({length:5},(_,i)=>({id:i,at:s.shiftStart+i}));s.minute+=40;setDensity(s,8);assert.equal(s.schedule.filter(c=>!c.noDispatch).length,3);setDensity(s,5);assert.equal(s.schedule.filter(c=>!c.noDispatch).length,0);
assert.equal(fleet.length,14);assert.equal(fleet.filter(e=>e.kind==='VSAV').length,4);assert.equal(fleet.filter(e=>e.kind==='CCF').length,3);assert(!fleet.some(e=>['SAMU','CCGC'].includes(e.kind)));
const world=new T.Scene(),e={id:'FPTSR',kind:'FPT',size:6,status:'scene',call:1,model:vehicle(world,'FPT')};initWater(e);setNozzle(e,'large',1);tickEquipment(e,28);e.hydrant={position:new T.Vector3(10,0,10)};e.water=0;tickEquipment(e,5);assert.equal(tickWater(e,1),0,'hydrant cannot supply in five seconds');tickEquipment(e,15);assert.equal(tickWater(e,1),500);stow(e);assert(equipmentBusy(e));tickEquipment(e,15);assert(!equipmentBusy(e));
const vsav={kind:'VSAV',model:vehicle(world,'VSAV'),status:'scene',patientAssigned:true,patientProgress:.8};addAmbulanceDoors(vsav.model);const stretcher=new T.Group(),team=[person(world,0,0),person(world,0,0)];updateLoading(vsav,stretcher,team,new T.Vector3(0,0,-20));assert(vsav.model.userData.rearDoors.every(d=>Math.abs(d.pivot.rotation.y)>1));vsav.status='transport';updateLoading(vsav,stretcher,team,new T.Vector3());assert(vsav.model.userData.rearDoors.every(d=>d.pivot.rotation.y===0));vsav.status='hospital';vsav.hospitalArrivedAt=100;updateLoading(vsav,stretcher,team,new T.Vector3(),105);assert(vsav.model.userData.rearDoors.every(d=>Math.abs(d.pivot.rotation.y)>1));assert(stretcher.visible);updateLoading(vsav,stretcher,team,new T.Vector3(),115);assert(!stretcher.visible);assert(vsav.model.userData.rearDoors.every(d=>d.pivot.rotation.y===0));
installSceneLighting(world,e);e.zoneLighting=true;updateSceneLighting(e,2);assert(e.zoneLightRig.lights.every(l=>l.light.visible));e.status='reconditioning';e.zoneLighting=false;updateSceneLighting(e,1);assert(e.zoneLightRig.extension>0&&e.zoneLightRig.extension<1);updateSceneLighting(e,1);assert.equal(e.zoneLightRig.extension,0);assert(e.zoneLightRig.lights.every(l=>!l.light.visible));
const vtu=vehicle(world,'VTU');installRotaryBeacons(vtu);updateRotaryBeacons(vtu,true,1,new T.Vector3(0,20,20));const angles=vtu.userData.rotaryBeacons.map(b=>b.rotor.rotation.y);updateRotaryBeacons(vtu,false,20,new T.Vector3());assert.deepEqual(vtu.userData.rotaryBeacons.map(b=>b.rotor.rotation.y),angles);assert(vtu.userData.rotaryBeacons.every(b=>!b.beam.visible&&b.leds.every(l=>l.material.emissiveIntensity===0)));
const fire={id:1,type:'INC',progress:.85};assert.match(fireStatus(fire,[]).label,/eau coupée/);assert.equal(fireStatus(fire,[{call:1,status:'scene',flow:250}]).stage,3);
const c={id:2,type:'SUAP',victimCount:2,evacuated:0,patients:[{},{severe:true}],finishBudget:60};initIncident(c);c.reconComplete=true;const state={calls:[c],speed:60,minute:500};tickCommand(state,[{kind:'VSAV',call:2,status:'scene'}],.25,()=>{});assert(reinforcementPanel(c).includes('VSAV supplémentaires'));tickCommand(state,[{kind:'VSAV',call:2,status:'scene'},{kind:'VSAV',call:2,status:'enroute'},{kind:'VLI',call:2,status:'departing'}],.25,()=>{});assert.equal(c.reinforcementAlerts.length,0,'mobilized reinforcements cover the request');
// No diagonal across the opposing lane when a parked engine returns west.
const path=streetRoute([168,32.1],[-70,105],{startYaw:Math.PI/2});assert(path.some(p=>p[0]>275),'continue east to a junction instead of turning across the road');
// Closed effects release GPU resources; a long guard must not accumulate fires.
const base=world.children.length;for(let i=0;i<30;i++){const fx=createIncidentFx(world,new T.Group());fx.setActive(true);fx.update(1,1);fx.dispose();fx.dispose();}assert.equal(world.children.length,base);
e.status='scene';e.nozzles={ldt:1,small:2,large:2};e.hoses.forEach(h=>h.progress=1);e.flow=1650;const visual=responseVisuals(world,[e]),call={id:1,type:'INC',fireTarget:[20,20],target:[20,20],reconComplete:true};const ids=new Set();for(let i=0;i<120;i++){visual.update(i/60,{calls:[call],minute:510});e.hoseVisuals.forEach(h=>{ids.add(h.hose.geometry.id).add(h.jet.geometry.id);assert([...h.jet.geometry.attributes.position.array].every(Number.isFinite));});}assert.equal(ids.size,10,'animated hoses reuse their buffers');
console.log('PASS audit: shift, density, fleet, hydrant delay, VSAV doors at CH, lighting, fire status, reinforcement coverage, right lane and effect lifetime');
