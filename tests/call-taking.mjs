import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {callQuestions,callerAnswer,motifChoices,qualifyCall,displayName,revealQualification,QUESTION_MINUTES} from '../dist/call-taking.js';
import {departureKinds,motifOf} from '../dist/departure-types.js';
import {INCIDENTS,tickShift} from '../dist/sim.js';

const template=id=>({...INCIDENTS.find(t=>t.id===id),catalogId:id,id:undefined});
// Questions follow the family; the truth is always among the choices, with neighbours from the same family.
const fire={...template('inc-appartement'),phoneId:7,answerAt:600};
assert(callQuestions(fire).some(q=>q.key==='fire'));assert(!callQuestions(fire).some(q=>q.key==='trapped'));
const choices=motifChoices(fire);
assert(choices.some(m=>m.id==='inc-appartement'));assert.equal(choices.at(-1).id,'none');
assert(choices.filter(m=>m.id!=='none').every(m=>INCIDENTS.find(t=>t.id===m.id).type==='INC'));
assert(choices.some(m=>m.id==='inc-local-poubelles'||m.id==='inc-fumee'),'Same building motifs are proposed');
assert.deepEqual(motifChoices(fire),choices,'Stable for one call');
assert.equal(callerAnswer({...template('sap-inconscient'),phoneId:1},'state').includes('ne répond plus'),true);
assert(callerAnswer({...template('sap-chute-rue'),phoneId:1},'state').includes('parle'));
const vague=[...Array(40)].map((_,i)=>callerAnswer({...template('avp-collision'),phoneId:i,limitedInfo:true},'story'));
assert(vague.some(a=>a.includes('de passage'))&&vague.some(a=>!a.includes('de passage')),'Night callers sometimes know little');

// A wrong motif drives the departure until reconnaissance.
const wrong={...fire};assert.equal(qualifyCall(wrong,'inc-local-poubelles',600,2),null);
assert.equal(wrong.answerAt,600+2*QUESTION_MINUTES);assert.equal(motifOf(wrong),'inc-local-poubelles');assert.equal(displayName(wrong),'Feu de local poubelles');
assert(!departureKinds(wrong).includes('EPA'));
wrong.id=3;assert.equal(revealQualification(wrong),null);wrong.firstArrival=610;
assert.match(revealQualification(wrong),/Feu d’appartement/);assert.equal(motifOf(wrong),'inc-appartement');assert.equal(revealQualification(wrong),null);
const right={...fire};qualifyCall(right,'inc-appartement',600,0);assert.equal(right.declaredId,undefined);assert.equal(right.answerAt,600);
// No departure on a real call: the caller rings back later; a false call stays without departure.
const dismissed={...fire};assert.match(qualifyCall(dismissed,'none',600),/rappellera/);assert.equal(dismissed.answerAt,603);
const info={noDispatch:true,phoneId:9,at:600};assert(motifChoices(info).some(m=>m.id==='none'));assert.match(qualifyCall(info,'sap-malaise-rue',600),/aucun besoin/);

// The operator still qualifies calls left alone; a qualified call is created on time.
const s={paused:false,ended:false,minute:600,speed:60,shiftEnd:2000,schedule:[],next:0,calls:[],incoming:[{...fire,phoneId:4,answerAt:Infinity}],received:0,noDispatch:0,shiftNoDispatch:0};
let created=[];tickShift(s,0,c=>created.push(c));assert.equal(created.length,0,'Waits while the player is on the line');
qualifyCall(s.incoming[0],'inc-fumee',600,1);tickShift(s,1,c=>created.push(c));assert.equal(created.length,1);assert.equal(created[0].declaredId,'inc-fumee');

// In the game: the incoming card offers to answer, the modal shows the exchange and pauses the guard.
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.next=0;game.state.paused=false;
const call={...template('avp-collision'),phoneId:41,at:game.state.minute,answerAt:game.state.minute+3};game.state.incoming.push(call);
game.advanceSimulation?.(0);
game.openCallTaking(41);
assert.equal(game.state.paused,true);assert.equal(call.answerAt,Infinity);
const content=els.get('modalContent').innerHTML;
assert.match(content,/Prise d’appel/);assert.match(content,/data-question="trapped"/);assert.match(content,/data-motif="avp-collision"/);
qualifyCall(call,'avp-sortie',game.state.minute,0);game.state.paused=false;
tickShift(game.state,0,game.onCall);
const made=game.state.calls.find(c=>c.phoneId===41);assert(made,'Qualified call becomes an intervention');
assert.equal(displayName(made),'Sortie de route');assert.equal(made.name,'Collision entre deux voitures');
console.log('PASS prise d’appel CTA : questions par famille, choix de motifs voisins, erreur révélée à la reconnaissance, rappel, opérateur par défaut');
