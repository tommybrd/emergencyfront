import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {vehicle} from '../dist/models.js';
import {initAerial,initElevatedRescue,requestAerial,tickAerial,transferAerialFlow,aerialBusy,aerialActionError,aerialReturnError,stopAerialFor,elevatedStatus,AERIAL} from '../dist/aerial-operations.js';
import {initWater,tickWater} from '../dist/hydraulics.js';
import {createAerialVisuals} from '../dist/aerial-visuals.js';
import {chooseRescue} from '../dist/incident-events.js';
import {vehicleConsole} from '../dist/vehicle-console.js';
import {capability} from '../dist/operations.js';
import {requestBuildingAction} from '../dist/building-actions.js';
const world=new T.Group(),epa={id:'EPA',kind:'EPA',call:1,status:'scene',model:vehicle(world,'EPA')},pump={id:'FPTSR',kind:'FPT',call:1,status:'scene',model:vehicle(world,'FPT')};
epa.model.position.set(0,.2,0);pump.model.position.set(0,.2,-20);initAerial(epa);initWater(pump);
const fire={id:1,type:'INC',status:'active',site:{kind:'building',height:12,yaw:-Math.PI/2},target:[20,0],actionPoint:[20,0],fireTarget:[20,0],fireHeight:6,progress:0,reconComplete:true};
const engines=[epa,pump],events=[],emit=(...args)=>events.push(args),visuals=createAerialVisuals(world,engines),state={calls:[fire]},advance=(minutes,c=fire)=>{tickAerial(engines,[c],minutes,emit);tickWater(pump,minutes/6);transferAerialFlow(engines);};
assert.match(requestAerial(epa,fire,'attack',engines),/poteau/);
pump.hydrant={position:new T.Vector3(0,0,-25)};pump.supplyProgress=.5;
assert.match(requestAerial(epa,fire,'attack',engines),/poteau/,'Incomplete hydrant supply cannot feed the ladder');
pump.supplyProgress=1;pump.call=2;assert.match(requestAerial(epa,fire,'attack',engines),/poteau/);pump.call=1;
epa.model.position.x=-80;assert(aerialActionError(epa,fire,'attack',engines));epa.model.position.x=0;
assert.equal(requestAerial(epa,fire,'attack',engines,emit),null);
assert.match(requestBuildingAction(fire,'utilities',[epa],0),/opérationnel/,'EPA crew cannot leave an active aerial operation for another task');
for(let t=0;t<37;t++){advance(1);assert.equal(epa.flow,0,'No stream before stabilizing, coupling and raising');}
advance(1);advance(1);assert.equal(epa.flow,500);assert.equal(pump.flow,0,'External stream is not counted as a ground nozzle');assert.equal(pump.pumpFlow,500);
visuals.update(state,1,new Map());const record=visuals.records.get(epa);assert(record.feed.mesh.visible&&record.jet.mesh.visible);assert(epa.model.userData.aerialRig.sections[4].position.z>5);assert.equal(epa.model.userData.aerialRig.basket.rotation.x,-epa.model.userData.ladder.rotation.x,'Basket remains horizontal');
assert.match(vehicleConsole(epa,{incident:fire,engines}),/500 L\/min/);
// A limited water supply must be shared; the aerial stream cannot create free water.
pump.nozzles.large=2;pump.hoses.filter(h=>h.key==='large').forEach(h=>h.progress=1);pump.water=0;advance(1);
assert(Math.abs(pump.flow+epa.flow-1000)<1e-6);assert(Math.abs(epa.flow-1000/3)<1e-6);assert.equal(pump.water,0);
pump.hydrant=null;advance(1);assert.equal(epa.flow,0);visuals.update(state,2,new Map());assert(!record.jet.mesh.visible);assert.match(epa.aerial.waiting,/interrompue/);
pump.hydrant={};advance(1);assert(epa.flow>0,'Supply resumes without an extra order');
fire.complication={status:'decision'};assert.match(chooseRescue(fire,'aerial',engines,1,()=>{}),/Repliez/,'One basket cannot attack and rescue at once');
stopAerialFor(pump,engines);assert(aerialBusy(epa));for(let i=0;i<20;i++)advance(1);assert(!aerialBusy(epa));visuals.update(state,3,new Map());assert(!record.feed.mesh.visible);assert.equal(epa.model.userData.aerialRig.sections[4].position.z,0);
console.log('PASS aerial fire setup, source requirements, shared water conservation, interrupted supply, retraction and visible equipment');

const c={id:2,type:'SUAP',status:'active',site:{kind:'building',height:9,yaw:-Math.PI/2},actionPoint:[18,0],patients:[{transportRequired:true,evacuated:false}],aerialEvacuationChance:1,finishBudget:50,reconComplete:false};
initElevatedRescue(c,()=>0);assert(c.patients[0].trapped);assert.equal(elevatedStatus(c),'');assert.equal(capability(epa,c),null,'No EPA spoiler during the phone call');
epa.call=2;state.calls=[c];c.reconComplete=true;assert.equal(capability(epa,c),'aerial');advance(1,c);assert(c.elevatedRescue.announced);assert.equal(c.finishBudget,140);const eventCount=events.length;advance(1,c);assert.equal(events.length,eventCount,'Single reinforcement request');
assert.equal(requestAerial(epa,c,'rescue',engines,emit),null);assert(aerialReturnError(epa));
assert(aerialActionError(epa,c,'attack',engines),'Cannot switch to fire attack with a patient in the basket');
for(let i=0;i<46;i++){advance(1,c);visuals.update(state,4+i,new Map());assert(c.patients[0].trapped);}
assert.equal(epa.aerial.phase,'handover');assert(record.patient.visible);assert(record.rig.basket.getWorldPosition(new T.Vector3()).y<1,'The actual basket reaches the ground');
advance(1,c);assert(c.elevatedRescue.done);assert(!c.patients[0].trapped);assert.equal(aerialReturnError(epa),null);assert.deepEqual(c.actionPoint,[epa.aerial.lower[0],epa.aerial.lower[2]]);
for(let i=0;i<20;i++)advance(1,c);assert(!aerialBusy(epa));visuals.update(state,100,new Map());assert(!record.stretcher.visible);assert(!record.patient.visible);
for(const candidate of [{...c,site:{kind:'road',height:0}},{...c,aerialEvacuationChance:0},{...c,patients:[{transportRequired:false}]}]){delete candidate.elevatedRescue;initElevatedRescue(candidate,()=>0);assert(!candidate.elevatedRescue);}
console.log('PASS rare upper-floor calls, hidden until reconnaissance, one radio alert, occupied EPA interlock, visible descent and ground handover');
