import assert from 'node:assert/strict';
import './game-environment.mjs';
import {canEngage} from '../dist/operations.js';
import {beginStationRefill,tickStationRefill,updateStationRefillVisual} from '../dist/station-refill.js';
import {composedFleet,defaultComposition,modelKey} from '../dist/station-config.js';
import {fleet} from '../dist/sim.js';
const g=await import('../dist/scene.js');g.state.schedule=[];g.state.nextMaintenanceAt=Infinity;
const e=g.engines.find(e=>e.id==='CCFM 1');e.water=0;e.status='returning';assert(!canEngage(e));e.water=400;assert(canEngage(e));e.water=0;
assert(beginStationRefill(e));let ready=0;tickStationRefill(e,2,()=>ready++);assert.equal(e.water,0);tickStationRefill(e,6,()=>ready++);assert.equal(e.water,1000);assert(!canEngage(e));updateStationRefillVisual(e);assert(e.stationRefillVisual.visible);
tickStationRefill(e,18,()=>ready++);assert.equal(e.water,4000);assert.equal(e.status,'refilling');tickStationRefill(e,2,()=>ready++);assert.equal(ready,1);assert(canEngage(e));updateStationRefillVisual(e);assert(!e.stationRefillVisual.visible);
const rows=defaultComposition(fleet);rows.find(r=>r.type==='CCF').type='CCFL';const units=composedFleet(fleet,rows);assert(units.some(v=>v.id.startsWith('CCFL')&&v.tankCapacity===2000&&v.size===3));assert(units.some(v=>v.id.startsWith('CCFM')));assert(units.some(v=>v.id.startsWith('CCFS')&&v.tankCapacity===8000));assert.equal(modelKey(units.find(v=>v.lightForest)),'CCFL');
// Exercise actual arrival: a returned empty tanker must pass through refill, not become ready.
e.water=0;e.status='idle';e.model.position.set(e.home[0]+20,.2,e.home[1]);g.returnEngine(e);for(let i=0;i<4000&&e.status!=='refilling';i++){g.state.minute+=.25;g.tickEngines(.25);}assert.equal(e.status,'refilling');assert(e.water<e.capacity);for(let i=0;i<200&&e.status!=='ready';i++){g.state.minute+=.25;g.tickEngines(.25);}assert.equal(e.status,'ready');assert.equal(e.water,e.capacity);
console.log('PASS empty return unavailable, finite CIS refill, visible equipment, completion and three forest classes');
