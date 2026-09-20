import assert from 'node:assert/strict';
import {createShift,requestNextCall,nextCallBlocked,tickShift} from '../dist/sim.js';
const state=createShift();state.minute=600;state.schedule=[{at:850,type:'SUAP',name:'Malaise'},{at:980,noDispatch:true}];state.next=0;
let phones=0,calls=0;
for(const status of ['waiting','active','transport']){
 state.calls=[{id:99,status}];assert(nextCallBlocked(state));assert(!requestNextCall(state));assert.equal(state.minute,600);assert.equal(state.next,0);
}
state.calls=[{id:99,status:'closed'}];
assert(requestNextCall(state,()=>phones++));assert.equal(phones,1);assert.equal(state.minute,850);assert.equal(state.next,1);assert.equal(state.incoming[0].at,850);assert.equal(state.schedule[1].at,980);
assert(!requestNextCall(state),'qualification blocks a second jump');
tickShift(state,6,()=>calls++);assert.equal(calls,1);assert(!requestNextCall(state),'new mission blocks jumping');
state.calls.forEach(c=>c.status='closed');state.paused=true;let advanced=0;
assert(requestNextCall(state,()=>phones++,seconds=>{advanced=seconds;tickShift(state,seconds,()=>calls++,()=>phones++);}));
assert(advanced>0);assert.equal(state.minute,980);assert.equal(state.paused,true);assert.equal(phones,2);assert.equal(state.incoming.length,1);
tickShift(state,10,()=>calls++);assert.equal(state.incoming.length,1,'qualification preserves pause');state.paused=false;tickShift(state,6,()=>calls++);assert.equal(state.shiftNoDispatch,1);assert(!requestNextCall(state));
state.schedule.push({at:state.shiftEnd});assert(!requestNextCall(state));state.ended=true;assert(!requestNextCall(state));
console.log('PASS next call: time jump to scheduled date, open missions and qualification blocked, simulation callback, pause, no-dispatch and guard limit');
const {els}=await import('./game-environment.mjs');
let seed=91;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
game.state.schedule=[{at:game.state.minute+45,noDispatch:true}];game.state.next=0;game.state.paused=true;
const target=game.state.schedule[0].at;
els.get('nextCall').onclick();
assert(Math.abs(game.state.minute-target)<1e-6);assert.equal(game.state.paused,true);assert.equal(game.state.incoming.length,1);assert.equal(els.get('nextCall').disabled,true);
const sameMinute=game.state.minute;els.get('nextCall').onclick();assert.equal(game.state.minute,sameMinute);
console.log('PASS actual next-call button advances the simulation and disables during qualification');
