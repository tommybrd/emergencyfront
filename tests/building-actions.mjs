import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {block} from '../dist/roads.js';
import {locateIncident} from '../dist/incident-location.js';
import {buildingLayout,initBuildingActions,requestBuildingAction,buildingActionsBusy} from '../dist/building-actions.js';
import {inLake} from '../dist/beach-layout.js';
let seed=Number(process.env.TEST_SEED||17);Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
for(const setting of['home','tower','shop','mall'])for(let i=0;i<24;i++){
 const c={id:i+1,type:'INC',scene:'house',name:'Feu',setting,target:[140,95]};locateIncident(c,()=>i/24);const layout=buildingLayout(c);
 assert(layout.assembly&&layout.path,`Safe assembly and walking route at ${c.address} / ${c.site.position}`);
 assert(!inLake(layout.assembly));assert(!block.buildings.some(b=>Math.abs(layout.assembly[0]-b.x)<b.w/2+2&&Math.abs(layout.assembly[1]-b.z)<b.d/2+2));
}
assert.equal(initBuildingActions({type:'INC',scene:'forest',site:{kind:'forest'}}),null);
assert.equal(initBuildingActions({type:'OD',scene:'elevator',site:{kind:'building'}}),null,'No power cut while people are trapped in a lift');
const flood={id:20,type:'OD',scene:'flood',site:{kind:'building'}};assert.equal(initBuildingActions(flood).gas,'absent');assert.equal(flood.buildingActions.evacuate,null);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,buildingActions,finishCall,perimeters}=game;
state.schedule=[];state.shiftEnd=100000;
const c={id:301,type:'INC',templateId:'inc-maison',name:'Feu de maison',requires:'FPT',at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);c.complicationPlan=null;
selectIncident(c.id);
assert(!els.get('incidentPanel').innerHTML.includes('data-building-action'));
assert(!els.get('incidentPanel').innerHTML.includes('objectiveChip'));
assert.equal(c.buildingActions,undefined,'Deferred building operations are not started by new calls');
assert.equal(engageUnits(['FPTSR']),null);const pump=engines.find(e=>e.id==='FPTSR');
const step=()=>{state.minute+=.25;tickEngines(.25);};
for(let i=0;i<2400&&!c.reconComplete;i++)step();assert(c.reconComplete);assert.equal(pump.status,'scene');
// Legacy action state must not gate completion or allocate a crew.
c.buildingActions={evacuate:{requested:true,phase:'queued'}};c.progress=1;finishCall(c,pump);
assert(c.fireContained);assert(!pump.buildingCrew);assert.equal(buildingActions.records.size,0);
console.log('PASS deferred building controls and deadline chips absent; legacy orders cannot allocate crews or gate containment');
