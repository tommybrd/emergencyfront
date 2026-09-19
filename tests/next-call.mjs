import assert from 'node:assert/strict';
import {createShift,requestNextCall,tickShift} from '../dist/sim.js';
const state=createShift();state.minute=600;state.schedule=[{at:850,type:'SUAP',name:'Malaise'},{at:980,noDispatch:true}];state.next=0;
state.calls=[{id:99,status:'active'}];let phones=0,calls=0;
assert(requestNextCall(state,()=>phones++));assert.equal(phones,1);assert.equal(state.minute,600);assert.equal(state.next,1);assert.equal(state.incoming.length,1);assert.equal(state.schedule[1].at,980);
assert.equal(state.incoming[0].at,600);tickShift(state,6,()=>calls++);assert.equal(calls,1);assert.equal(state.calls.length,2,'active missions do not block the next call');
state.paused=true;const minute=state.minute;assert(requestNextCall(state,()=>phones++));assert.equal(state.minute,minute);assert.equal(phones,2);assert.equal(state.incoming.length,1);assert(!requestNextCall(state));
tickShift(state,10,()=>calls++);assert.equal(state.incoming.length,1,'qualification respects pause');state.paused=false;tickShift(state,6,()=>calls++);assert.equal(state.shiftNoDispatch,1);
state.ended=true;assert(!requestNextCall(state));console.log('PASS manual next call: overlaps, no clock jump, one scheduled call consumed, pause, no-dispatch calls and guard limit');
