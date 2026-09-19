import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import * as T from 'three';
import {block} from '../dist/roads.js';
import {initWater,setNozzle,tickEquipment,tickWater} from '../dist/hydraulics.js';
import {findHydrantSupply,connectSupply,validateSupply,SUPPLY_REACH} from '../dist/water-supply.js';
import {vehicleConsole} from '../dist/vehicle-console.js';

const world=new T.Group(),h=new T.Group();world.add(h);h.position.set(550,0,220);
const e={kind:'FPT',status:'scene',model:{position:new T.Vector3(530,0,220),rotation:{y:0},userData:{length:7}}};initWater(e);
assert.equal(findHydrantSupply(e,[]),null);h.visible=false;assert.equal(findHydrantSupply(e,[h]),null);h.visible=true;
world.visible=false;assert.equal(findHydrantSupply(e,[h]),null);world.visible=true;
assert.equal(findHydrantSupply(e,[h],[{hydrant:h}]),null);
assert.equal(findHydrantSupply(e,[h],[{supplyHydrant:h,supplyProgress:.5}]),null,'The hydrant remains occupied while the hose is packed');
const supply=findHydrantSupply(e,[h]);assert(supply&&supply.distance<80);assert(supply.route.length>2,'Hose travels around the vehicle');
assert(vehicleConsole(e,{supply}).match(/data-hydrant[^>]*Alimenter sur poteau/));
assert(vehicleConsole(e).match(/data-hydrant[^>]*disabled/));
assert(connectSupply(e,supply));assert.equal(e.supplyHydrant,h);assert(e.supplyAnchor.distanceTo(h.position)<1);
setNozzle(e,'small',1);e.hoses.find(h=>h.key==='small').progress=1;e.water=0;
tickEquipment(e,e.supplyDuration-.5);assert.equal(tickWater(e,1),0,'No water before physical establishment');
tickEquipment(e,.6);assert.equal(tickWater(e,1),250);
world.remove(h);assert.equal(validateSupply(e,[h]),false);e.water=0;assert.equal(tickWater(e,1),0,'A detached or absent hydrant cannot generate water');
world.add(h);initWater(e);assert(connectSupply(e,findHydrantSupply(e,[h])));e.model.position.x+=3;assert.equal(validateSupply(e,[h]),false,'No connection from a relocated truck');
initWater(e);e.model.position.set(530,0,220);h.position.set(620,0,220);assert.equal(findHydrantSupply(e,[h]),null);
h.position.set(550,0,220);block.buildings.push({x:540,z:220,w:6,d:190});
assert.equal(findHydrantSupply(e,[h]),null,'A short straight distance cannot connect through a building or with excessive hose');block.buildings.pop();

let seed=45;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const game=await import('../dist/scene.js');const {state,engines,district,onCall,toggleHydrant}=game;
state.schedule=[];const c={id:1,type:'INC',name:'Feu d’appartement',at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);
const pump=engines.find(e=>e.id==='FPTSR');pump.status='scene';pump.call=1;pump.model.rotation.y=0;
let actual=null;for(const hydrant of district.hydrants){pump.model.position.set(hydrant.position.x-10,.2,hydrant.position.z+4);actual=findHydrantSupply(pump,district.hydrants,engines);if(actual)break;}
assert(actual);els.get('fleet').onclick({target:{closest:s=>s==='[data-engine]'?{dataset:{engine:pump.id}}:null}});
els.get('vehiclePanel').onclick({target:{closest:s=>s==='[data-hydrant]'?{}:null}});
assert(district.hydrants.includes(pump.hydrant));assert(pump.supplyRoute?.length);assert(pump.supplyLength<=SUPPLY_REACH);
assert(toggleHydrant(pump));assert.equal(pump.hydrant,null);assert(state.logs.at(-1).message.includes('rangement'));
pump.supplyProgress=0;const saved=district.hydrants.splice(0);assert.equal(toggleHydrant(pump),false);assert.equal(pump.hydrant,null);district.hydrants.push(...saved);
console.log('PASS real visible hydrants only, access and hose length, reservation, absent/remote/blocked refusal, disconnect, physical delay and actual console button');
