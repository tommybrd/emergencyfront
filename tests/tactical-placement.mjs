import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=42;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,openPlacement,choosePlacement,returnEngine}=game;
const {placementError,tacticalChoices}=await import('../dist/tactical-placement.js');
const {setNozzle,stow}=await import('../dist/hydraulics.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const {incidentState}=await import('../dist/incident-state.js');
state.schedule=[];state.next=0;state.shiftEnd=100000;
const c={id:1,type:'INC',templateId:'inc-commerce',name:'Feu dans un commerce',requires:'FPT',at:state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false};
state.calls.push(c);onCall(c);Object.assign(c,{target:[206,88],actionPoint:[206,64.5],accessTarget:[206,30],duration:10000,allowComplications:false});
selectIncident(1);assert.equal(engageUnits(['FPTSR','EPA']),null);
const fpt=engines.find(e=>e.id==='FPTSR'),epa=engines.find(e=>e.kind==='EPA');
openPlacement(fpt);assert(game.tacticalOptions.length>=2);const first=game.tacticalOptions[0];assert(choosePlacement(fpt,0));
assert.equal(fpt.status,'departing','choosing a position never skips boarding');
assert.equal(fpt.parking.target,first.target);
openPlacement(epa);assert(game.tacticalOptions.length>=2);assert(game.tacticalOptions.every(p=>Math.hypot(p.target[0]-first.target[0],p.target[1]-first.target[1])>=18));assert(choosePlacement(epa,0));
const checked=[fpt,epa];let ticks=0;
function advance(){const before=new Map(game.vehicleObstacles().map(m=>[m,m.position.clone()]));state.minute+=.25;tickEngines(.25);ticks++;
 const models=game.vehicleObstacles().filter(m=>m.visible!==false);
 for(let i=0;i<models.length;i++){assert(models[i].position.distanceTo(before.get(models[i]))<4.1,'No instant repositioning');for(let j=i+1;j<models.length;j++)assert(!overlaps(footprint(models[i]),footprint(models[j])),'Vehicles stay separate');}
 assert(!state.logs.some(l=>l.message.includes('repositionnement')),'Recovery cannot mask a placement error');
}
function until(test,seconds,label){for(let i=0;i<seconds*4&&!test();i++)advance();if(!test())console.log(checked.map(e=>({id:e.id,status:e.status,wait:e.controlWaiting,position:e.model.position,parking:e.parking})));assert(test(),label);}
until(()=>checked.every(e=>e.status==='scene'),450,'FPTSR and EPA reach their chosen positions');
setNozzle(fpt,'small',1);advance();assert.match(placementError(fpt,c),/Repliez/);assert.equal(tacticalChoices(fpt,c,engines).length,0);
stow(fpt);until(()=>!placementError(fpt,c),30,'Repositioning only after hose recovery');
const progress=c.progress,firstArrival=c.firstArrival;
openPlacement(fpt);assert(game.tacticalOptions.length);assert(choosePlacement(fpt,game.tacticalOptions.length-1));assert.equal(fpt.status,'positioning');assert.equal(incidentState(c,engines).key,'onsite');
until(()=>fpt.status==='scene',450,'Physical on-site repositioning');assert.equal(c.firstArrival,firstArrival);assert.equal(c.progress,progress,'Changing position does not restart or accelerate the fire');
epa.ladderDeployed=true;assert.match(placementError(epa,c),/échelle/);epa.ladderDeployed=false;
const vsav=engines.find(e=>e.kind==='VSAV');const medical={id:2,type:'SUAP',status:'active'};vsav.call=2;vsav.status='scene';vsav.patientAssigned=true;assert.match(placementError(vsav,medical),/Prise en charge/);vsav.call=null;vsav.status='ready';vsav.patientAssigned=false;
for(const e of checked)returnEngine(e);
until(()=>checked.every(e=>e.status==='ready'),500,'Return from tactical positions');
console.log('PASS guided placement, reservations, boarding, real routes, on-site move, work interlocks and return without overlap',{ticks});
