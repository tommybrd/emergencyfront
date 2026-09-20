import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=72;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const g=await import('../dist/scene.js');g.state.schedule=[];g.state.nextMaintenanceAt=Infinity;
const c={id:1,type:'INC',name:'Feu de végétation',scene:'forest',setting:'forest',requires:'CCF',at:g.state.minute,status:'waiting',duration:100000,progress:0,allowComplications:false};g.state.calls.push(c);g.onCall(c);g.selectIncident(1);assert.equal(g.engageUnits(['CCFM 1','CCFS 2']),null);
const [a,b]=['CCFM 1','CCFS 2'].map(id=>g.engines.find(e=>e.id===id));const step=()=>{g.state.minute+=.25;g.tickEngines(.25);};for(let i=0;i<4000&&!(a.status==='scene'&&b.status==='scene');i++)step();assert.equal(a.status,'scene');assert.equal(b.status,'scene');b.water=0;assert.equal(g.noria.toggle(a,c),null);let transferred=false,refilled=false,returned=false,sawHose=false;
for(let i=0;i<8000&&!returned;i++){step();transferred||=b.water>100;refilled||=a.noria?.phase==='refill';sawHose||=a.supplyProgress>0;returned=refilled&&a.noria?.phase==='supply';}
assert(transferred,'water reaches the other engine');assert(refilled,'CCF drives to a real hydrant');assert(sawHose,'hydrant establishment has a duration');assert(returned,'full CCF returns to the fire');assert(a.water>3000);g.noria.toggle(a,c);for(let i=0;i<200&&a.noria;i++)step();assert(!a.noria,'noria can stop safely');
console.log('PASS CCF noria: conserved transfer, physical hydrant trip, hose establishment, refill, return and cancellation');
