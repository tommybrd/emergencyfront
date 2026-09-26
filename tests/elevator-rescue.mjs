import assert from 'node:assert/strict';
import './game-environment.mjs';
import {initElevator,revealElevator} from '../dist/elevator-rescue.js';
import {assessMeans} from '../dist/means-assessment.js';
import {capability} from '../dist/operations.js';
for(const [random,count]of[[.199,1],[.2,0],[.8,0]]){
 const c={scene:'elevator',type:'OD',finishBudget:50};initElevator(c);revealElevator(c,()=>random);assert.equal(c.victimCount,0,'No spoiler at dispatch');
 c.reconComplete=true;revealElevator(c,()=>random);assert.equal(c.victimCount,count);revealElevator(c,()=>0);assert.equal(c.victimCount,count,'Only one assessment');
}
let seed=12;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines}=game;
state.schedule=[];state.shiftEnd=100000;
const vtu=engines.find(e=>e.kind==='VTU'),vsav=engines.find(e=>e.id==='VSAV 1');
const step=()=>{state.minute+=.25;tickEngines(.25);};
const until=(p,label)=>{for(let i=0;i<6000&&!p();i++)step();assert(p(),label);};
for(const medicalChance of[1,0]){
 const c={id:state.calls.length+1,type:'OD',name:'Ascenseur bloqué',medicalChance,at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);
 assert(c.elevator);assert.equal(c.victimCount,0);assert(capability(vsav,c));selectIncident(c.id);assert.equal(engageUnits([vsav.id]),null);until(()=>vsav.status==='scene'&&c.reconComplete,'Preventive VSAV on scene');for(let i=0;i<30;i++)step();assert.equal(c.progress,0,'VSAV cannot open elevator by itself');assert.equal(assessMeans(c,engines).key,'insufficient');assert(!vsav.patientAssigned,'Wait for release');selectIncident(c.id);assert.equal(engageUnits([vtu.id]),null);
 until(()=>c.reconComplete,'Initial reconnaissance');
 if(medicalChance){
  assert.equal(c.victimCount,1);assert(c.victimsKnown&&c.patients[0].trapped);assert(capability(vsav,c));
  assert(!c.reinforcementAlerts.some(a=>a.need==='vsav'),'No duplicate request with preventive VSAV already on scene');
  while(!c.elevator.released){assert(!vsav.patientAssigned,'No loading while the person is trapped');step();}
  assert(!c.patients[0].trapped);assert.notEqual(c.status,'closed');
  until(()=>vsav.status==='transport','VSAV starts transport');assert.notEqual(c.status,'closed');
  until(()=>c.status==='closed','Medical elevator mission closes at CH');assert(c.patients[0].deliveredAt!=null);
 }else{
  assert.equal(c.victimCount,0);assert(capability(vsav,c));assert(!c.reinforcementAlerts.some(a=>a.need==='vsav'));
  until(()=>c.status==='closed','Simple elevator rescue closes without VSAV');assert(c.elevator.released);
 }
 until(()=>vtu.status==='ready'&&vsav.status==='ready','Crews return');
}
assert.equal(state.completed,2);
console.log('PASS occasional elevator casualty, no dispatch spoiler, reconnaissance, preventive VSAV dispatch and no duplicate request, release before loading, CH closure and uncomplicated rescue');
