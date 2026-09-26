import assert from 'node:assert/strict';
import {createShift,tickShift,dispatchPacing,incidentWorkload} from '../dist/sim.js';
const forest={type:'INC',requires:'CCF',status:'active',at:480},fire={type:'INC',status:'active',at:480},accident={type:'AVP',status:'active',at:480},medical={type:'SUAP',status:'active',at:480},misc={type:'OD',status:'active',at:480};
const pending={type:'SUAP'};
function state(calls=[]){return {...createShift(),minute:600,shiftEnd:1920,calls:structuredClone(calls),incoming:[],schedule:[],next:0,lastDispatchAt:480};}
assert.equal(incidentWorkload({...forest,siteCompletedAt:590}),0);
assert.equal(incidentWorkload({...forest,fireContained:true}),1);
assert.equal(dispatchPacing({...state([forest]),minute:500},pending,()=>0),70);
assert.equal(dispatchPacing(state([forest]),pending,()=>.1),0,'Rare overlap remains possible');
assert.equal(dispatchPacing(state([forest]),pending,()=>.2),30);
assert.equal(dispatchPacing(state([fire]),pending,()=>.2),0);
assert.equal(dispatchPacing(state([accident]),pending,()=>.8),15);
assert(dispatchPacing(state([forest,medical]),pending,()=>0)>0);
assert(dispatchPacing(state([fire]),fire,()=>0)>0,'Do not stack major incidents');
assert.equal(dispatchPacing(state([medical,misc]),pending,()=>.99),0);
assert.equal(dispatchPacing(state([medical,misc,medical]),pending,()=>.99),0);
assert(dispatchPacing(state([medical,misc,medical,misc]),pending,()=>0)>0);
assert.equal(dispatchPacing(state([forest]),{noDispatch:true},()=>.99),0);
// Admission proportions reflect the workload, with the same sampled draws.
for(const [call,expected]of [[forest,12],[fire,35],[accident,35],[medical,100],[misc,100]]){let admitted=0;for(let i=0;i<100;i++)admitted+=dispatchPacing(state([call]),pending,()=>i/100)===0;assert.equal(admitted,expected);}
// Due calls are postponed and sorted, not deleted or emitted as a burst.
const s=state([forest]);s.minute=500;s.lastDispatchAt=480;s.schedule=[{type:'INC',at:490,name:'Second feu'},{type:'SUAP',at:490,name:'Malaise'},{noDispatch:true,at:495}];
let calls=0,phones=0;tickShift(s,0,()=>calls++,()=>phones++);assert.equal(phones,1);assert.equal(s.next,1);assert.equal(s.schedule.filter(c=>!c.noDispatch).length,2);assert(s.schedule.slice(s.next).every(c=>c.at>=570));
s.calls[0].status='closed';s.minute=570;tickShift(s,0,()=>calls++,()=>phones++);assert.equal(s.incoming.filter(c=>!c.noDispatch).length,1,'Qualification already counts against the workload');
const postponed=s.schedule.slice(s.next).filter(c=>!c.noDispatch);assert.equal(postponed.length,1);assert(postponed[0].at>s.minute);assert.equal(calls,0);
for(let i=0;i<100;i++)tickShift(s,0,()=>calls++,()=>phones++);assert.equal(phones,2,'No per-frame admission lottery');
// A completed site no longer throttles the game during transport to hospital.
assert.equal(dispatchPacing(state([{...forest,siteCompletedAt:590}]),pending,()=>.99),0);
console.log('PASS workload pacing: rare forest overlap, fewer fire/AVP overlaps, up to four SAP/OD, no major stacking, pending calls counted, no bursts or lost calls, recovery after site completion');
