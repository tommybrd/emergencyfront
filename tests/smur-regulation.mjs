import assert from 'node:assert/strict';
import {createSmurRegulation,smurNotificationPanel,smurNeeded} from '../dist/smur-regulation.js';
import {encodeGuard,decodeGuard} from '../dist/guard-save.js';
const state={minute:480,calls:[]},smur={id:'SMUR 1',kind:'SAMU',status:'ready',call:null},engines=[smur],messages=[],departures=[],returns=[];
const regulation=createSmurRegulation({state,engines,dispatch:(unit,c)=>{departures.push(c.id);unit.status='departing';unit.call=c.id;return null;},release:unit=>{returns.push(unit.call);unit.status='returning';unit.call=null;},emit:(c,sender,message)=>messages.push({id:c.id,sender,message})});
const call=(id,extra={})=>{const c={id,type:'SUAP',name:'Chute dans un escalier',status:'waiting',victimCount:1,reconComplete:false,patients:[{severe:false}],...extra};state.calls.push(c);return c;};
const ordinary=call(1);assert(smurNotificationPanel(ordinary).includes('Notifier SMUR'));assert.equal(regulation.notify(ordinary),null);regulation.notify(ordinary);assert.equal(messages.length,1,'Notification is idempotent');regulation.tick();assert.equal(smur.status,'ready');state.minute++;regulation.tick();assert.equal(ordinary.smurRequest.phase,'declined');assert.deepEqual(departures,[],'Notification cannot force a non-indicated departure');
ordinary.reconComplete=true;ordinary.patients[0].severe=true;regulation.tick();assert.equal(ordinary.smurRequest.phase,'reviewing','New assessment reopens a declined decision');state.minute++;regulation.tick();assert.deepEqual(departures,[1]);assert.equal(ordinary.smurRequest.phase,'engaged');
const urgent=call(2,{name:'Personne inconsciente'});assert(smurNeeded(urgent));regulation.tick();state.minute++;regulation.tick();assert.equal(urgent.smurRequest.phase,'waiting','Busy SMUR does not teleport or preempt the current patient');assert.equal(smur.call,1);const n=messages.length;regulation.tick();assert.equal(messages.length,n,'Busy response is not repeated each frame');
ordinary.patients[0].medicalComplete=true;smur.status='scene';regulation.tick();assert.deepEqual(returns,[1],'Medical team decides its return after care');assert.equal(smur.status,'returning');regulation.tick();assert.equal(smur.call,null,'CH return must finish before a new departure');
smur.status='ready';regulation.tick();assert.equal(smur.call,2);assert.deepEqual(departures,[1,2]);
urgent.status='closed';regulation.tick();assert.deepEqual(returns,[1,2],'Closed calls release the SMUR');smur.status='ready';
const closed=call(3,{name:'Détresse vitale'});regulation.tick();closed.status='closed';state.minute++;regulation.tick();assert(!departures.includes(3),'Closed review cannot dispatch later');
const stale=call(4,{name:'Personne inconsciente'});regulation.tick();state.minute++;smur.status='doctorTransit';regulation.tick();assert.equal(stale.smurRequest.phase,'waiting');stale.reconComplete=true;stale.patients[0].severe=false;regulation.tick();assert.equal(stale.smurRequest.phase,'declined');smur.status='ready';regulation.tick();assert(!departures.includes(4),'Withdraw obsolete requests before availability');
const snapshot=decodeGuard(encodeGuard({state,engines}));assert.equal(snapshot.state.calls[0].smurRequest.phase,'finished','Regulation decisions survive guard serialization');
console.log('PASS SMUR notification, independent triage, reassessment, busy queue, no preemption/teleport, CH return, closure and save persistence');

// Deux équipes : renfort simultané, file commune et maintien pendant un transport.
{
 const state={minute:500,calls:[]},teams=[1,2].map(n=>({id:`SMUR ${n}`,kind:'SAMU',status:'ready',call:null})),sent=[],messages=[];
 const r=createSmurRegulation({state,engines:teams,dispatch:(e,c)=>{e.call=c.id;e.status='departing';sent.push([e.id,c.id]);},release:e=>{e.status='returning';e.call=null;},emit:(c,s,m)=>messages.push(m)});
 const c={id:1,type:'AVP',name:'Accident',status:'active',reconComplete:true,patients:[{severe:true},{severe:true}]};state.calls.push(c);r.tick();state.minute++;r.tick();assert.deepEqual(sent,[['SMUR 1',1],['SMUR 2',1]]);assert.deepEqual(c.smurRequest.unitIds,['SMUR 1','SMUR 2']);r.notify(c);r.tick();assert.equal(sent.length,2);
 const waiting={id:2,type:'SUAP',name:'Personne inconsciente',status:'waiting',patients:[{severe:true}]};state.calls.push(waiting);r.tick();state.minute++;r.tick();assert.equal(waiting.smurRequest.phase,'waiting');
 teams[1].status='transport';c.patients.forEach(p=>p.medicalComplete=true);r.tick();assert.equal(teams[0].status,'returning');assert.equal(teams[1].status,'transport');assert.equal(teams[1].call,1,'Transport cannot be interrupted for another emergency');r.tick();assert.equal(sent.length,2,'Returning team is not yet available');teams[0].status='ready';r.tick();assert.equal(teams[0].call,2);assert.equal(teams[1].call,1);assert.equal(sent.length,3);
 console.log('PASS simultaneous SMUR reinforcement, idempotent dispatch, common queue and no transport preemption');
}
