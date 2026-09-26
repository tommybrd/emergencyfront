import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {createShift,fleet} from '../dist/sim.js';
import {prepareDay,recommendDeparture,EXTRA_MISSIONS} from '../dist/guard-campaign.js';
import {encodeGuard,decodeGuard,saveGuard,readGuard,restoreGuard} from '../dist/guard-save.js';
import {vehicle} from '../dist/models.js';
import {defaultComposition,normalizeComposition,composedFleet,saveComposition,loadComposition} from '../dist/station-config.js';
const rows=defaultComposition(fleet),index=rows.findIndex(r=>r.type==='VSAV');rows[index]={...rows[index],signalFront:'round',signalRear:'wide'};
const configured=composedFleet(fleet,normalizeComposition(rows,fleet)).find(e=>e.id==='VSAV 1'),model=vehicle(new T.Scene(),configured.kind,undefined,configured);
assert(model.userData.frontBlue.every(m=>m.geometry.type==='CylinderGeometry'));
assert(model.userData.rearBlue.every(m=>m.geometry.type==='BoxGeometry'));
const inverse=vehicle(new T.Scene(),'VSAV',undefined,{signalFront:'short',signalRear:'round'});
assert(inverse.userData.frontBlue.every(m=>m.geometry.type==='BoxGeometry'));assert(inverse.userData.rearBlue.every(m=>m.geometry.type==='CylinderGeometry'));
const ccf=vehicle(new T.Scene(),'CCF',undefined,{signalFront:'wide',signalRear:'short'});assert(ccf.userData.beacons.every(m=>m.geometry.type==='CylinderGeometry'));
const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};assert(!saveComposition(rows,fleet,storage).error);assert.equal(loadComposition(fleet,storage)[index].signalRear,'wide');
const plan={seed:713,weather:'hot',profile:'fire',mode:'guard'},a=createShift(),b=createShift();prepareDay(a,plan);prepareDay(b,plan);assert.deepEqual(a.schedule,b.schedule,'same seed produces same day');const training=createShift();prepareDay(training,{...plan,mode:'training',mission:'search'});assert.equal(training.schedule.length,1);assert(training.schedule[0].searchPerson);
const original={value:Infinity,position:new T.Vector3(1,2,3)};original.self=original;const restored=decodeGuard(encodeGuard(original));assert.equal(restored.self,restored);assert(restored.position.isVector3);assert.equal(restored.value,Infinity);
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;game.state.shiftEnd=100000;
const engine=game.engines.find(e=>e.kind==='VSAV'),call={id:80,type:'SUAP',name:'Malaise à domicile',at:game.state.minute,status:'waiting',progress:0};game.state.calls.push(call);game.onCall(call);game.selectIncident(80);const suggested=recommendDeparture(call,game.engines,game.state);assert(suggested.some(id=>id.startsWith('VSAV')));assert.equal(game.engageUnits([engine.id]),null);
for(let i=0;i<30;i++){game.state.minute+=.25;game.tickEngines(.25)}
const before={minute:game.state.minute,position:engine.model.position.clone(),status:engine.status,call:engine.call};assert.equal(saveGuard(game.state,game.engines,game.district.hydrants,game.camera,game.controls,storage),null);
game.state.minute+=500;engine.model.position.x+=50;restoreGuard(readGuard(storage),game.state,game.engines,game.district.hydrants,game.camera,game.controls,()=>{});assert.equal(game.state.minute,before.minute);assert.equal(engine.status,before.status);assert.equal(engine.call,before.call);assert(engine.model.position.equals(before.position));assert(game.state.paused);
const closed={id:81,...EXTRA_MISSIONS[0],id:81,target:[-100,-120],actionPoint:[-100,-120],status:'active',at:game.state.minute,patients:[],reconComplete:true};game.state.calls.push(closed);const vtu=game.engines.find(e=>e.kind==='VTU');vtu.call=81;vtu.status='scene';vtu.crew=2;game.state.campaign=true;game.extraFeatures.action(closed,'search');assert(game.extraFeatures.gates(closed,vtu));game.state.minute+=20;game.extraFeatures.tick(20);assert(closed.searchDone);assert.equal(closed.type,'SUAP');assert.equal(closed.patients.length,1);assert(vtu.support);
const animal={...EXTRA_MISSIONS[1],id:82,target:[5,5],actionPoint:[5,5],status:'active',at:game.state.minute,reconComplete:true};game.state.calls.push(animal);vtu.call=82;game.extraFeatures.action(animal,'animal');game.state.minute+=13;game.extraFeatures.tick(13);assert(animal.animalDone);assert.equal(animal.progress,1);
console.log('PASS independent front/rear technology, CCF constraint, configuration persistence, deterministic days, training, cyclic snapshot, active mission restore, search and animal rescue');

const {initWater,tickEquipment,tickWater,setNozzle}=await import('../dist/hydraulics.js');
const {beginLongSupply,tickSupportVehicles,stopLongSupply}=await import('../dist/support-vehicles.js');
const {findHydrantSupply,validateSupply}=await import('../dist/water-supply.js');
const supportRows=defaultComposition(fleet),fireSlots=supportRows.map((r,i)=>i).filter(i=>fleet.filter(e=>e.kind!=='VLCG')[i].home[0]<-70);supportRows[fireSlots[0]].type='PC';supportRows[fireSlots[1]].type='VPCE';
const supportFleet=composedFleet(fleet,supportRows);assert(supportFleet.some(e=>e.kind==='PC'));assert(supportFleet.some(e=>e.kind==='VPCE'));
for(const kind of ['PC','VPCE']){const model=vehicle(new T.Scene(),kind);assert.equal(model.userData.kind,kind);assert.equal(model.userData.wheels.length,6);assert.equal(model.userData.beacons.length,4);}
const ws=new T.Group(),h=new T.Group();ws.add(h);h.position.set(700,0,220);
const pump={id:'pump',kind:'FPT',crew:6,call:1,status:'scene',model:vehicle(ws,'FPT')};pump.model.position.set(530,0,220);initWater(pump);
const carrier={id:'VPCE',kind:'VPCE',crew:2,call:1,status:'scene',model:vehicle(ws,'VPCE')};carrier.model.position.set(535,0,220);const units=[pump,carrier];
assert.equal(findHydrantSupply(pump,[h],units),null);assert(beginLongSupply(carrier,pump.id,units,[h]));assert(pump.supplyLength>80);assert(validateSupply(pump,[h],units));setNozzle(pump,'small',1);pump.hoses.find(h=>h.key==='small').progress=1;pump.water=0;
tickEquipment(pump,pump.supplyDuration-.1);assert.equal(tickWater(pump,1),0);tickEquipment(pump,.2);assert(tickWater(pump,1)>0);stopLongSupply(carrier,units);tickSupportVehicles(units);assert(carrier.longSupplyTarget);tickEquipment(pump,pump.supplyPackDuration+1);tickSupportVehicles(units);assert(!carrier.longSupplyTarget);assert(!pump.longSupplyProvider);
console.log('PASS PC and VPCE composition, dedicated 3D bodies, long-distance supply, water only after establishment, packing before release');
