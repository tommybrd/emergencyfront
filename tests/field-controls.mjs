import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {vehicle,medicalResponder} from '../dist/models.js';
import {remainingRouteDistance,smoothRoute} from '../dist/route3d.js';
import {sirenViewGain,sirenScheduleScale} from '../dist/audio.js';
import {formatRadio} from '../dist/radio-voice.js';
import {reserveParking} from '../dist/parking.js';
import {locateIncident} from '../dist/incident-location.js';
import {installAmberEffects,updateAmberEffects,installRotaryBeacons,installBlueLedEffects,updateBlueLedEffects} from '../dist/rotary-beacons.js';
import {setNozzle,nozzleLimit,tickWater,initWater,tickEquipment,stow} from '../dist/hydraulics.js';
import {dynamicTube} from '../dist/dynamic-tube.js';
import {supplyCrew} from '../dist/supply-crew.js';
import {recallButtonState,cancelVolunteer,volunteerPanel,requestVolunteers,tickVolunteers,volunteerPool} from '../dist/reinforcements.js';
import {createShift} from '../dist/sim.js';
import {createTrafficControl} from '../dist/traffic-control.js';
import {vehicleConsole} from '../dist/vehicle-console.js';
const world=new T.Scene(),model=vehicle(world,'FPT'),engine={id:'FPTSR',kind:'FPT',model,size:6,status:'scene'};
const parking=reserveParking(engine,{type:'INC',target:[250,160],accessTarget:[250,160],actionPoint:[250,169]},[engine]);assert(Math.hypot(parking.target[0]-250,parking.target[1]-169)<40,'Park near the incident, not at the start of a long road');assert(parking.target[1]>160,'Prefer the incident side of the road');
for(let i=0;i<12;i++){const c={id:i,type:'INC',name:'Feu',setting:'tower',target:[0,0]};locateIncident(c,()=>i/12);const slot=reserveParking(engine,c,[engine]);assert(Math.hypot(slot.target[0]-c.actionPoint[0],slot.target[1]-c.actionPoint[1])<75,'Building access remains close while leaving intersections clear');}
assert.equal(remainingRouteDistance([3,0],[[0,0],[10,0],[10,20]],1),27);assert.equal(remainingRouteDistance([10,12],[[0,0],[10,0],[10,20]],2),8);assert.equal(remainingRouteDistance([0,0],null),null);
assert.equal(sirenViewGain(30,{x:0,y:0,z:0}),1);assert(sirenViewGain(30,{x:1.3,y:0,z:0})<=.04);assert(sirenViewGain(30,{x:0,y:0,z:0},true)<.1);assert.equal(sirenViewGain(400,{x:0,y:0,z:0}),0);assert.equal(sirenScheduleScale(12*60),1);assert(sirenScheduleScale(23*60)<.5);assert(sirenScheduleScale(6*60)<.5);
assert.equal(formatRadio(12,'VSAV 1','Sur les lieux. Reconnaissance en cours.'),'Centre de secours, ici VSAV 1, intervention 12. Sur les lieux. Reconnaissance en cours.');
assert.equal(formatRadio(12,'VSAV 1','prend le départ — en route sur les lieux.'),'Centre de secours, ici VSAV 1, intervention 12. Départ, en route sur les lieux.');
const medic=medicalResponder(world);assert(!medic.userData.interventionHelmet?.visible,'SAP responder starts without a helmet');assert.equal(medic.userData.uniform,'ssuap');
const ambulance=vehicle(world,'VSAV');installBlueLedEffects(ambulance);updateBlueLedEffects(ambulance,true,20,true);assert(ambulance.userData.blueLedEffects.lamps.some(l=>l.glow.visible));assert(ambulance.userData.blueLedEffects.lamps.some(l=>!l.glow.visible),'LED modules alternate instead of one global flash');
const light=vehicle(world,'FPT',undefined,{lightPump:true});installRotaryBeacons(light);installAmberEffects(light);assert.equal(light.userData.rotaryBeacons.length,2);assert(light.userData.beacons.every(l=>l.geometry.type==='CylinderGeometry'));assert.equal(light.userData.rearAmber.length,8);
const amberConsole=vehicleConsole({kind:'FPT',status:'scene',model:light,capacity:2000,water:2000,crew:4,nozzles:{ldt:0,small:0,large:0}});assert(amberConsole.includes('data-amber-mode="off"'));assert(amberConsole.includes('>OFF</button>'));assert(!/data-amber(?:\s|=)/.test(amberConsole),'No redundant amber toggle above the pattern row');
updateAmberEffects(light,true,'alternate',1000,true);assert(light.userData.amberEffects.beam.visible);assert(light.userData.amberEffects.lamps.some(l=>l.glow.visible));updateAmberEffects(light,false,'alternate',1000,true);assert(!light.userData.amberEffects.beam.visible);assert(light.userData.amberEffects.lamps.every(l=>!l.glow.visible));
// Establishment and packing reuse their geometry, with an actual reel and crew
// travelling round the chassis to a hydrant in front of the truck.
model.position.set(260,.2,27);model.rotation.y=Math.PI/2;initWater(engine);engine.hydrant={position:new T.Vector3(271,0,34)};
const visuals=supplyCrew(world,[engine]),record=visuals.records[0],geometry=record.hose.geometry;const phases=new Set(),locations=[];
for(let i=0;i<40;i++){tickEquipment(engine,.5);visuals(i);phases.add(record.phase);if(record.crew[0].visible)locations.push(record.crew[0].position.clone());assert.equal(record.hose.geometry,geometry);assert([...geometry.attributes.position.array].every(Number.isFinite));}
assert(phases.has('unloading')&&phases.has('laying')&&phases.has('connecting')&&phases.has('returning'));assert(locations.some(p=>p.distanceTo(locations[0])>5));assert(record.reel.g.visible);assert(record.hose.visible);assert(record.crew.every(p=>!p.visible));
stow(engine);tickEquipment(engine,3);visuals(41);assert(record.crew.every(p=>p.visible));tickEquipment(engine,12);visuals(50);assert(!record.group.visible);
const shift=createShift();shift.minute=22*60;const menu=volunteerPanel(shift);assert.equal((menu.match(/data-recall-level=/g)||[]).length,2);assert(menu.includes('Équipe d’astreinte'));const first=requestVolunteers(shift,1,()=>0);assert.equal(first,10);assert.equal(requestVolunteers(shift,1),0);assert.equal(requestVolunteers(shift,2,()=>0),27);assert.equal(volunteerPool(shift).length+shift.roster.length,50);shift.minute+=30;tickVolunteers(shift,()=>{});assert.equal(shift.roster.filter(p=>p.kind==='SPV'&&p.present).length,37);
// Vehicles can enter the safety disc in a queue: the leader needs the grant,
// even if a following emergency vehicle appears first in the engine array.
const lead={model:vehicle(world,'VLCG'),path:[[-5,2.1],[70,2.1]],segment:1,status:'traffic'},follower={model:vehicle(world,'VSAV'),path:[[-16,2.1],[70,2.1]],segment:1,status:'enroute'};
lead.model.position.set(-5,0,2.1);follower.model.position.set(-16,0,2.1);lead.model.rotation.y=follower.model.rotation.y=Math.PI/2;
const control=createTrafficControl([[0,0]]);control.update([follower,lead],0);assert.equal(control.reason(lead,-4,2.1),null);assert(control.reason(follower,-15,2.1));lead.model.position.x=40;control.update([follower,lead],1);assert.equal(control.reason(follower,-15,2.1),null);
// A clear first metre must not authorize a turn that becomes blocked midway.
const turner={model:vehicle(world,'VLCG'),path:smoothRoute([[-22,2.1],[-2.1,2.1],[-2.1,60]]),segment:1,status:'traffic'},obstacle={model:vehicle(world,'VLCG'),path:null,status:'ready'};
turner.model.position.set(-22,0,2.1);turner.model.rotation.y=Math.PI/2;obstacle.model.position.set(-2.1,0,12);
const curvedControl=createTrafficControl([[0,0]]);curvedControl.update([turner,obstacle],0);assert(curvedControl.reason(turner,-21,2.1),'Wait outside a turn whose exit lane is obstructed');
obstacle.model.position.z=55;curvedControl.update([turner,obstacle],1);assert.equal(curvedControl.reason(turner,-21,2.1),null,'Grant the complete turn as soon as its path is clear');
const tube=dynamicTube(2,6);tube.points.forEach((p,i)=>p.set(0,0,i));tube.update(.1);const points=tube.geometry.attributes.position,normal=tube.geometry.attributes.normal,index=tube.geometry.index.array;const a=new T.Vector3().fromBufferAttribute(points,index[0]),b=new T.Vector3().fromBufferAttribute(points,index[1]),d=new T.Vector3().fromBufferAttribute(points,index[2]),out=new T.Vector3().fromBufferAttribute(normal,index[0]);assert(b.sub(a).cross(d.sub(a)).dot(out)>0,'Hoses have outward-facing triangles and remain visible from outside');
console.log('PASS nearby parking, remaining road distance, off-screen sirens, concise radio, helmets, FPTL and amber lamps, visible hose crew/reel, two recall groups and intersection queue leader');

for(const kind of ['EPA','CCGC','CCF'])for(const signalStyle of ['standard','round','wide']){const m=vehicle(new T.Group(),kind,undefined,{signalStyle});assert(m.userData.beacons.every(b=>b.geometry.type==='CylinderGeometry'),kind+' must not have isolated square beacons');}
console.log('PASS standalone beacons round on EPA, tankers and all forest trucks, including legacy styles');

const recallShift=createShift();recallShift.minute=9*60;
assert(requestVolunteers(recallShift,1,()=>0)>0);
assert(recallButtonState(recallShift,1).active);
assert(recallButtonState(recallShift,1).disabled);
const batchCount=recallShift.recallBatches.length;
assert.equal(requestVolunteers(recallShift,1,()=>0),0);
assert.equal(recallShift.recallBatches.length,batchCount);
assert(!recallButtonState(recallShift,2).disabled,'General recall remains available after duty recall');
cancelVolunteer(recallShift,recallShift.recallBatches[0].id);
assert(!recallButtonState(recallShift,1).disabled,'Cancelled recall can be requested again');
requestVolunteers(recallShift,1,()=>0);recallShift.minute+=30;tickVolunteers(recallShift,()=>{});
assert(recallButtonState(recallShift,1).disabled,'Recall remains marked after crew arrival');
console.log('PASS recall feedback, duplicate prevention, escalation, cancellation and arrivals');

const smallCrew={kind:'CCF',status:'scene',crew:3};initWater(smallCrew);
assert(setNozzle(smallCrew,'small',1));assert(!setNozzle(smallCrew,'large',1),'One pair cannot operate two different nozzles');
assert(!setNozzle(smallCrew,'small',2));tickEquipment(smallCrew,30);tickWater(smallCrew,1);assert.equal(smallCrew.flow,250);
smallCrew.buildingCrew=2;tickWater(smallCrew,1);assert.equal(smallCrew.flow,0,'Busy crew cannot keep firing unattended');
smallCrew.buildingCrew=0;assert.equal(nozzleLimit(smallCrew),1);assert(setNozzle(smallCrew,'small',0));
smallCrew.crew=6;assert(setNozzle(smallCrew,'large',2));smallCrew.hydrant={};smallCrew.supplyProgress=.5;assert.equal(nozzleLimit(smallCrew),2);assert(!setNozzle(smallCrew,'ldt',1));
console.log('PASS one pair per nozzle across types, concurrent duties and staffing-dependent water flow');
for(const [minute,expected] of [[7*60,1],[21*60,.42],[6*60+59,.42],[20*60+59,1]]){
 assert.equal(sirenScheduleScale(minute),expected);
 assert.equal(sirenScheduleScale(minute,'night'),.42);
 assert.equal(sirenScheduleScale(minute,'day'),1);
}
const nightConsole=vehicleConsole({kind:'VSAV',status:'ready',model:ambulance,sirenMode:'night'});
assert.match(nightConsole,/data-siren-mode="night" aria-pressed="true"/);
assert.match(nightConsole,/data-siren-mode="auto" aria-pressed="false"/);
console.log('PASS per-vehicle siren Auto/Day/Night controls and 21:00–07:00 boundaries');
