import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=72;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const g=await import('../dist/scene.js');g.state.schedule=[];g.state.nextMaintenanceAt=Infinity;
const c={id:1,type:'INC',name:'Feu de végétation',scene:'forest',setting:'forest',requires:'CCF',at:g.state.minute,status:'waiting',duration:100000,progress:0,allowComplications:false};g.state.calls.push(c);g.onCall(c);g.selectIncident(1);assert.equal(g.engageUnits(['CCFM 1','CCFS 2']),null);
const [a,b]=['CCFM 1','CCFS 2'].map(id=>g.engines.find(e=>e.id===id));const step=()=>{g.state.minute+=.25;g.tickEngines(.25);};for(let i=0;i<4000&&!(a.status==='scene'&&b.status==='scene');i++)step();assert.equal(a.status,'scene');assert.equal(b.status,'scene');b.water=0;assert.equal(g.noria.toggle(a,c),null);let transferred=false,refilled=false,returned=false,sawHose=false;
for(let i=0;i<8000&&!returned;i++){step();transferred||=b.water>100;refilled||=a.noria?.phase==='refill';sawHose||=a.supplyProgress>0;returned=refilled&&a.noria?.phase==='supply';}
assert(transferred,'water reaches the other engine');assert(refilled,'CCF drives to a real hydrant');assert(sawHose,'hydrant establishment has a duration');assert(returned,'full CCF returns to the fire');assert(a.water>3000);g.noria.toggle(a,c);for(let i=0;i<200&&a.noria;i++)step();assert(!a.noria,'noria can stop safely');
console.log('PASS CCF noria: conserved transfer, physical hydrant trip, hose establishment, refill, return and cancellation');

// FPT : même noria que le CCF, pour ravitailler un autre engin sur un feu urbain.
{
 c.status='closed';for(const e of[a,b]){g.noria.stop(e);g.returnEngine(e);}for(let i=0;i<12000&&!(a.status==='ready'&&b.status==='ready');i++)step();assert.equal(a.status,'ready','CCF crews back at the CIS');
 const f={id:2,type:'INC',name:'Feu de local',scene:'house',at:g.state.minute,status:'waiting',duration:100000,progress:0,allowComplications:false};g.state.calls.push(f);g.onCall(f);g.selectIncident(2);assert.equal(g.engageUnits(['FPTL 1','FPTSR']),null);
 const [pump,attack]=['FPTL 1','FPTSR'].map(id=>g.engines.find(e=>e.id===id));for(let i=0;i<4000&&!(pump.status==='scene'&&attack.status==='scene'&&f.reconComplete);i++)step();
 assert.equal(pump.status,'scene');attack.water=0;assert.equal(g.noria.toggle(pump,f),null,'FPT can start a noria');
 let fed=false,refilled=false;for(let i=0;i<8000&&!(fed&&refilled);i++){step();fed||=attack.water>100;refilled||=pump.noria?.phase==='refill';}
 assert(fed,'FPT noria feeds the other engine');assert(refilled,'FPT refills at a real hydrant');
 g.noria.toggle(pump,f);for(let i=0;i<400&&pump.noria;i++)step();assert(!pump.noria);
 console.log('PASS FPT noria: transfer and hydrant refill');
}
