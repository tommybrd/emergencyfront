import assert from 'node:assert/strict';
import {initWater,pumpCapacity,tickWater,stow} from '../dist/hydraulics.js';
function engine(lightPump){const e={kind:'FPT',lightPump,crew:lightPump?4:6,status:'scene'};initWater(e);e.nozzles.large=1;e.hoses.find(h=>h.key==='large').progress=1;return e;}
const light=engine(true),full=engine(false);assert.equal(pumpCapacity(light),1000);assert.equal(pumpCapacity(full),2000);
for(const e of[light,full]){e.aerialDemand=1000;tickWater(e,1);assert(Math.abs(e.water-(3000-e.pumpFlow))<1e-6);assert(Math.abs(e.pumpFlow-e.flow-e.externalFlow)<1e-6);}
assert.equal(light.pumpFlow,1000);assert.equal(full.pumpFlow,1500);assert(light.pumpLimited);assert(!full.pumpLimited);assert(Math.abs(light.flow/500-light.externalFlow/1000)<1e-6,'shared pump output prorated');
full.aerialDemand=2500;full.water=3000;tickWater(full,.1);assert.equal(full.pumpFlow,2000);assert(full.pumpLimited);
light.water=0;tickWater(light,1);assert.equal(light.pumpFlow,0);assert(!light.pumpLimited);stow(full);assert(!full.pumpLimited);
console.log('PASS FPTL/FPT distinct pump ceilings, ground/EPA shared output, conserved water, dry cutoff and reset');
