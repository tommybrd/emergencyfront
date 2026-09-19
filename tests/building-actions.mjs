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
assert(requestBuildingAction(c,'evacuate',engines,state.minute),'Orders wait for reconnaissance');
selectIncident(c.id);assert.equal(engageUnits(['FPTSR']),null);const pump=engines.find(e=>e.id==='FPTSR');
const step=()=>{state.minute+=.25;tickEngines(.25);};
for(let i=0;i<2400&&!c.reconComplete;i++)step();assert(c.reconComplete);assert.equal(pump.status,'scene');
const messages=[],emit=(sender,message)=>messages.push(message);
assert.equal(requestBuildingAction(c,'evacuate',engines,state.minute,emit),null);
assert.equal(requestBuildingAction(c,'utilities',engines,state.minute,emit),null);
assert.equal(requestBuildingAction(c,'evacuate',engines,state.minute,emit),null);assert.equal(messages.length,2,'Repeated clicks do not schedule extra tasks');
const victimCount=c.victimCount||0;
// Containment must not cancel a safety operation already ordered.
c.progress=1;finishCall(c,pump);assert(c.fireContained);assert.notEqual(c.status,'closed');
selectIncident(c.id);assert(els.get('incidentPanel').innerHTML.includes('data-building-action="evacuate"'));
for(let i=0;i<25;i++)step();const a=c.buildingActions.evacuate,progress=a.progress;assert(buildingActions.records.has(c.id));
pump.status='reconditioning';for(let i=0;i<4;i++){state.minute+=.25;buildingActions.update(state.calls,state.minute,.25);}assert.equal(a.progress,progress,'No imaginary crew advances the work');assert(a.waiting);
pump.status='scene';
let sawWalk=false,sawCitizens=false,sawMeter=false;
for(let i=0;i<2400&&c.status!=='closed';i++){
 step();const r=buildingActions.records.get(c.id);sawWalk||=r?.workers.some(w=>w.model.visible&&w.step>1);sawCitizens||=r?.residents.some(p=>p.model.visible);sawMeter||=!!r?.meters?.length;
 if(pump.buildingCrew)assert(pump.buildingCrew<=pump.crew,'Available crew constrains the work');
}
if(c.status!=='closed')console.log(JSON.stringify({actions:c.buildingActions,layout:buildingActions.records.get(c.id)?.layout,workers:buildingActions.records.get(c.id)?.workers.map(w=>({p:w.model.position,step:w.step,route:w.route,ret:w.returnRoute}))},null,2));
assert.equal(c.status,'closed');assert.equal(c.buildingActions.safe,c.buildingActions.residents);assert.equal(c.buildingActions.electricity,'off');assert.equal(c.buildingActions.gas,'off');
assert.equal(c.victimCount||0,victimCount,'Healthy evacuees never create fictitious VSAV patients');assert(!buildingActionsBusy(c));assert(sawWalk&&sawCitizens&&sawMeter,'Crews, evacuees and cut-off boxes are represented');
assert.equal(game.aftermath.records.get(c.id).residents.length,0,'No duplicate neighbours after a visible evacuation');
for(let i=0;i<2000&&(pump.status!=='ready'||perimeters.records.size||buildingActions.records.size);i++)step();
assert.equal(pump.status,'ready');assert.equal(buildingActions.records.size,0,'Temporary characters and meters are disposed');
console.log('PASS building-specific commands, safe assembly, physical crew, sequential operations, duplicate clicks, no phantom patients, containment gating and cleanup');
