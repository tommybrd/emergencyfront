import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {fleet} from '../dist/sim.js';
import {defaultComposition,normalizeComposition,compositionErrors,saveComposition,loadComposition,composedFleet} from '../dist/station-config.js';
import {vehiclePace,travelMultiplier} from '../dist/roads.js';
import {vehicle} from '../dist/models.js';
import {initFoam} from '../dist/foam.js';
import {installSceneLighting} from '../dist/scene-lighting.js';
import {fireLevel,fireBar} from '../dist/fire-status.js';
import {capability} from '../dist/operations.js';
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
const rows=defaultComposition(fleet);assert.equal(rows.length,13);assert.deepEqual(compositionErrors(rows),[]);assert.equal(loadComposition(fleet,storage),null);
const slot=rows.findIndex(r=>r.type==='FPTL');rows[slot]={type:'CCF8000',signal:'round',foam:false,lighting:false};assert(!saveComposition(rows,fleet,storage).error);
const specs=composedFleet(fleet,loadComposition(fleet,storage));assert.equal(new Set(specs.map(e=>e.id)).size,specs.length);assert.equal(specs.filter(e=>e.kind==='VLCG').length,1);assert(specs.filter(e=>e.kind==='VSAV'||e.kind==='VLI').every(e=>e.home[0]===-56));assert(specs.some(e=>e.tankCapacity===8000&&e.foamEnabled===false));
const rescueRows=defaultComposition(fleet),rescueSlot=rescueRows.findIndex(r=>r.type==='FPTL');rescueRows[rescueSlot]={type:'VSR',signal:'standard',foam:false,lighting:false};const rescueSpec=composedFleet(fleet,rescueRows).find(e=>e.kind==='VSR');assert(rescueSpec);assert.equal(rescueSpec.id,'VSR');assert.equal(rescueSpec.tankCapacity,0);assert.equal(capability(rescueSpec,{type:'AVP'}),'roadRescue');assert.equal(capability(rescueSpec,{type:'INC'}),null);
const bad=rows.map(r=>({...r,type:''}));assert(compositionErrors(bad).length);assert(saveComposition(bad,fleet,storage).error);assert.equal(loadComposition(fleet,{getItem:()=>'{bad'}),null);assert.equal(normalizeComposition([{type:'FPTSR'}],fleet)[0].type,'VLI');
const world=new T.Scene();for(const type of['VSAV','FPT','CCF','EPA','VSR']){const model=vehicle(world,type,undefined,{signalStyle:'round'});assert(model.userData.beacons.some(b=>b.geometry.type==='CylinderGeometry'));}
const vsr=vehicle(world,'VSR');assert.equal(vsr.userData.bodyStyle,'road-rescue');assert(vsr.userData.rearOverhang>0);assert(vsr.userData.length>7);
const short=vehicle(world,'VSAV',undefined,{signalStyle:'short'}),wide=vehicle(world,'VSAV',undefined,{signalStyle:'wide'});assert(short.userData.rearBlue[0].geometry.parameters.width<wide.userData.rearBlue[0].geometry.parameters.width);
assert.equal(short.userData.bodyStyle,'renault-cell-ambulance');assert.equal(short.userData.penetrationLights.length,0);assert(short.userData.wheels.length===4);assert(short.userData.frontBlue.length>0);
const e={kind:'FPT',foamEnabled:false,lightingEnabled:false,model:vehicle(world,'FPT')};initFoam(e);installSceneLighting(world,e);assert.equal(e.foamCapacity,0);assert(!e.zoneLightRig);
assert(vehiclePace({kind:'VLI'})>vehiclePace({kind:'FPT'}));assert(vehiclePace({kind:'CCF',tankCapacity:8000})<vehiclePace({kind:'CCF',tankCapacity:4000}));assert.equal(travelMultiplier({status:'transport',beacons:true}),.7);assert.equal(travelMultiplier({beacons:true}),1.3);
const fire={type:'INC',progress:0,spread:1.2};assert.equal(fireLevel(fire),3);fire.progress=.5;assert.equal(fireLevel(fire),1);assert(fireBar(fire,[]).includes('N1'));fire.fireContained=true;assert.equal(fireLevel(fire),0);
console.log('PASS station persistence, slots, coverage, identity, actual signal models/equipment, vehicle pace and dynamic fire levels');
// A large tanker can actually leave and return to a former light-pump bay.
globalThis.localStorage=storage;
let seed=91;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const tanker=game.engines.find(e=>e.tankCapacity===8000&&e.foamEnabled===false);
assert(tanker);assert.deepEqual(tanker.home,fleet.filter(e=>e.kind!=='VLCG')[slot].home);
game.state.schedule=[];game.state.shiftEnd=100000;
const call={id:1,type:'INC',name:'Feu de végétation',requires:'CCF',at:game.state.minute,status:'waiting',duration:5000,progress:0,allowComplications:false};
game.state.calls.push(call);game.onCall(call);game.selectIncident(1);assert.equal(game.engageUnits([tanker.id]),null);
function until(predicate,label){for(let i=0;i<2400&&!predicate();i++){game.state.minute+=.25;game.tickEngines(.25);for(const other of game.vehicleObstacles())if(other!==tanker.model&&other.visible!==false)assert(!overlaps(footprint(tanker.model),footprint(other)),'Configured tanker collision');}assert(predicate(),label);}
until(()=>tanker.status==='scene','Configured tanker reaches the fire');game.returnEngine(tanker);until(()=>tanker.status==='ready','Configured tanker returns to its chosen bay');
console.log('PASS configured CCF 8000 leaves a former FPTL bay, reaches a fire and returns without collision');
