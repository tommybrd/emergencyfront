import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=Number(process.env.TEST_SEED||12);Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,returnEngine,district}=game;
const {requestVolunteers,tickVolunteers}=await import('../dist/reinforcements.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
state.schedule=[];state.next=0;state.shiftEnd=100000;state.minute=22*60;requestVolunteers(state,3);state.minute+=30;tickVolunteers(state,()=>{});
const calls=[{id:1,type:'INC',name:'Feu dans un commerce',requires:'FPT',target:[220,30]},{id:2,type:'SUAP',name:'Malaise à domicile',requires:'VSAV',target:[140,110]}];
for(const c of calls){Object.assign(c,{at:state.minute,status:'waiting',duration:5000,progress:0,allowComplications:false});state.calls.push(c);const target=c.target.slice();onCall(c);c.target=target;c.accessTarget=target;c.actionPoint=target;c.duration=5000;}
selectIncident(1);assert.equal(engageUnits(['FPTSR','CCFM 1','CCFS 2','EPA']),null);
selectIncident(2);assert.equal(engageUnits(['VSAV 1','VSAV 2','VSAV 3','VSAV 4','VTU','VLCG']),null);
const checked=engines.filter(e=>!['VPL','VLI'].includes(e.kind)&&!['FPTL 1','CCFM 3'].includes(e.id));let ticks=0,maxWait=0;
function advance(){const previous=new Map(game.vehicleObstacles().filter(m=>m.visible!==false).map(m=>[m,m.position.clone()]));state.minute+=.25;tickEngines(.25);ticks++;
 const models=game.vehicleObstacles().filter(m=>m.visible!==false);
 for(let i=0;i<models.length;i++){const m=models[i],jumped=previous.has(m)&&m.position.distanceTo(previous.get(m))>=4.1,recovery=state.logs.slice(-2).some(l=>/recalage automatique|retour de sécurité au CIS/.test(l.message));if(jumped&&!recovery)console.log({ticks,before:previous.get(m),after:m.position,logs:state.logs.slice(-4),vehicles:checked.map(e=>({id:e.id,p:[e.model.position.x,e.model.position.z],seg:e.segment,status:e.status,wait:e.controlWaiting,blocked:e.blockedSeconds}))});assert(!previous.has(m)&&!engines.some(e=>e.model===m)||previous.has(m)&&(!jumped||recovery),'Unexpected repositioning '+(engines.find(e=>e.model===m)?.id||'civilian'));
 for(let j=i+1;j<models.length;j++)assert(!overlaps(footprint(m),footprint(models[j])),'Overlap '+(engines.find(e=>e.model===m)?.id||'civilian')+' / '+(engines.find(e=>e.model===models[j])?.id||'civilian'));}
 assert(!state.logs.some(l=>l.message.includes('repositionnement')), 'Recovery must not mask a traffic deadlock');
 maxWait=Math.max(maxWait,...checked.map(e=>e.blockedSeconds||0));
}
function until(predicate,seconds,label){for(let i=0;i<seconds*4&&!predicate();i++)advance();if(!predicate())console.log(checked.map(e=>({id:e.id,status:e.status,p:[e.model.position.x,e.model.position.z],segment:e.segment,wait:e.controlWaiting,blocked:e.blockedSeconds})));assert(predicate(),label);}
until(()=>checked.every(e=>e.status==='scene'),400,'All ten vehicles arrive without recovery');
// Mix arrivals at the station with a new dispatch from the first returned bay.
for(const e of checked)returnEngine(e);
until(()=>engines.find(e=>e.id==='CCFS 2').status==='ready',400,'CCF 8000 returns');
selectIncident(1);assert.equal(engageUnits(['CCFS 2']),null);
until(()=>checked.every(e=>e.id==='CCFS 2'?e.status==='scene':e.status==='ready'),500,'Concurrent return and departure clear the station');
returnEngine(engines.find(e=>e.id==='CCFS 2'));
until(()=>checked.every(e=>e.status==='ready'),400,'All bays restored');
selectIncident(1);assert.equal(engageUnits(['FPTSR','CCFM 1','CCFS 2','EPA']),null);
until(()=>checked.filter(e=>['FPT','CCF','EPA'].includes(e.kind)).every(e=>e.status==='scene'),400,'Second departure including EPA and CCF 8000');
console.log('PASS ten departures, mixed returns and redispatch, second heavy-vehicle departure; no overlaps or recovery', {ticks,maxWait});
for(const e of checked)returnEngine(e);
until(()=>checked.every(e=>e.status==='ready'),500,'Return before forest exercise');
const forest={id:3,type:'INC',name:'Feu de végétation',requires:'CCF',at:state.minute,status:'waiting',duration:120,progress:0};state.calls.push(forest);onCall(forest);selectIncident(3);assert.equal(engageUnits(['CCFM 1','CCFS 2']),null);
until(()=>checked.filter(e=>e.kind==='CCF').every(e=>e.status==='scene'),500,'Both CCFs reach the narrow forest track');
for(const e of checked.filter(e=>e.kind==='CCF'))returnEngine(e);
until(()=>engines.find(e=>e.id==='CCFS 2').path?.some(p=>p.gear===-1)&&engines.find(e=>e.id==='CCFS 2').reversing,500,'CCF 8000 starts reverse parking');
selectIncident(3);assert.equal(engageUnits(['CCFS 2']),null);
until(()=>engines.find(e=>e.id==='CCFS 2').status==='scene'&&engines.find(e=>e.id==='CCFM 1').status==='ready',500,'Redispatch during reverse parking');
console.log('PASS narrow-track alternation and redispatch during garage reverse maneuver');
