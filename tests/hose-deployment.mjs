import assert from 'node:assert/strict';
import {initWater,setNozzle,tickWater,tickEquipment,equipmentBusy,stow} from '../dist/hydraulics.js';
const e={kind:'FPT',status:'scene'};initWater(e);setNozzle(e,'small',1);assert.equal(tickWater(e,1),0);assert.equal(e.water,3000);tickEquipment(e,2);assert(equipmentBusy(e));assert.equal(tickWater(e,1),0);tickEquipment(e,18);assert.equal(tickWater(e,1),250);assert.equal(e.water,2750);setNozzle(e,'large',1);assert.equal(tickWater(e,1),250,'existing nozzle stays operational');tickEquipment(e,28);assert.equal(tickWater(e,1),750);stow(e);assert(equipmentBusy(e));assert.equal(tickWater(e,1),0);tickEquipment(e,7);assert(e.hoses.some(h=>h.progress>0));tickEquipment(e,8);assert(!equipmentBusy(e));assert(e.hoses.every(h=>h.progress===0));
setNozzle(e,'large',1);tickEquipment(e,1);setNozzle(e,'large',0);tickEquipment(e,15);assert(!equipmentBusy(e));console.log('PASS setup gates flow, existing lines remain active, shutdown is immediate, packing and interrupted setup finish');

const supplied={kind:'FPT',status:'scene',crew:6};initWater(supplied);
supplied.hydrant=supplied.supplyHydrant={};supplied.supplyProgress=.5;
assert(setNozzle(supplied,'small',1));assert(!setNozzle(supplied,'small',2),'Supply team is occupied while connecting');
tickEquipment(supplied,10);assert.equal(supplied.supplyProgress,1);
assert(setNozzle(supplied,'small',2),'Completed supply frees the second team immediately');
tickEquipment(supplied,20);assert.equal(tickWater(supplied,1),500,'Both small lines operate after supply is established');
console.log('PASS supply team released at completion and second hose fully operational');
