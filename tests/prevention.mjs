import assert from 'node:assert/strict';
import './game-environment.mjs';
import {duePrevention,settlePrevention} from '../dist/prevention.js';
import {canEngage,capability} from '../dist/operations.js';
import {amberDefault} from '../dist/signalling.js';
import {incidentWorkload,nextCallBlocked} from '../dist/sim.js';

const s={minute:9*60,shiftStart:8*60};assert.equal(duePrevention(s).length,0);
s.minute=9*60+31;const [visit]=duePrevention(s);assert(visit.prevention);assert.equal(duePrevention(s).length,0,'Once per slot');
s.minute=17*60+5;assert.equal(duePrevention(s).length,0,'No visit after the end of the day');
assert.equal(capability({kind:'VTU'},visit),'resolve');assert.equal(capability({kind:'FPT'},visit),'resolve');assert.equal(capability({kind:'VSAV'},visit),null);
assert.equal(incidentWorkload({...visit,status:'active'}),0);
assert.equal(nextCallBlocked({minute:600,shiftEnd:2000,calls:[{...visit,status:'active'}],incoming:[],schedule:[{at:700}],next:0}),'','A visit does not block the next call');
assert(canEngage({kind:'VTU',status:'scene',onPrevention:true}),'Interruptible');assert(!canEngage({kind:'VTU',status:'scene'}));
assert.equal(amberDefault({status:'scene',onPrevention:true}),false);
const c={...visit,id:5,status:'active'};assert.equal(settlePrevention(c,[{call:5}],600),null);assert.match(settlePrevention(c,[],601),/interrompue/);assert.equal(c.status,'closed');
const late={...visit,id:6,status:'waiting'};assert.equal(settlePrevention(late,[],16*60),null);assert.match(settlePrevention(late,[],17*60),/reportée/);

// In the game: the visit appears at 9:30, the VTU goes without blue lights, then leaves for an emergency with them.
let seed=13;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.next=0;game.state.nextMaintenanceAt=Infinity;game.state.paused=false;game.state.minute=9*60+29;game.state.speed=60;
for(let i=0;i<12&&!game.state.calls.some(c=>c.prevention);i++)game.advanceSimulation(.25);
const p=game.state.calls.find(c=>c.prevention);assert(p,'Visit created at 9:30');assert(p.address);
assert.equal(game.engageUnits.length>=0,true);game.selectIncident(p.id);assert.equal(game.engageUnits(['VTU']),null);
const vtu=game.engines.find(e=>e.id==='VTU');
assert(game.state.logs.some(l=>/VTU engagé.*Sélectif non urgent/.test(l.message)),'Non-urgent pager for prevention');
for(let i=0;i<4000&&vtu.status!=='scene';i++)game.advanceSimulation(.25);
assert.equal(vtu.status,'scene');assert.equal(vtu.beacons,false);assert.equal(vtu.siren,false);assert(canEngage(vtu));
const urgent={id:++game.state.received,type:'OD',name:'Branche sur la chaussée',catalogId:'od-branche',setting:'road',at:game.state.minute,status:'waiting',progress:0,allowComplications:false};game.state.calls.push(urgent);game.onCall(urgent);
game.selectIncident(urgent.id);assert.equal(game.engageUnits(['VTU']),null,'Prevention crew answers the emergency');
game.advanceSimulation(.25);
assert.equal(vtu.call,urgent.id);assert.equal(vtu.beacons,true);assert.equal(p.status,'closed');assert(p.interrupted);
console.log('PASS prévention : visites de journée, sans gyrophares, sans charge de dispatch, interruptibles par un départ, reportées faute de moyens');
