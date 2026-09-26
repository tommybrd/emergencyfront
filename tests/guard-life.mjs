import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {dayActivity} from '../dist/day-summary.js';
import {tickMaintenance} from '../dist/fleet-maintenance.js';
import {crewPosition,prepareCrew,sportPosition,duty} from '../dist/crew.js';
import {capability,canEngage} from '../dist/operations.js';
import {fireResistance} from '../dist/fire-status.js';
const s={minute:960,shiftStart:480,calls:Array.from({length:8},(_,i)=>({at:480+i}))};assert.equal(dayActivity(s).count,8);assert.equal(dayActivity({...s,calls:[]}).score,0);
const fleet=[{id:'F1',kind:'FPT',status:'ready'},{id:'F2',kind:'FPT',status:'scene'},{id:'V1',kind:'VSAV',status:'ready'}],m={minute:700,nextMaintenanceAt:600};tickMaintenance(m,fleet,()=>{},()=>0);assert.equal(fleet[0].status,'maintenance');assert(!canEngage(fleet[0]));assert.equal(fleet[1].status,'scene');assert.equal(fleet[2].status,'ready');m.minute=731;tickMaintenance(m,fleet,()=>{},()=>1);assert.equal(fleet[0].status,'ready');
assert.equal(duty(510),'briefing');assert.equal(duty(525),'equipment');
const p={id:1,slot:0,present:true};assert(sportPosition(p,650)[0]>300);assert.equal(sportPosition(p,720),null);const e={crewIds:[1],home:[-50,70]};prepareCrew({roster:[p],minute:650},e,()=>0);assert.deepEqual(e.boarding[0].from,crewPosition(p,650));assert(e.boarding[0].duration>5);assert.equal(capability({kind:'VSAV'},{type:'INC',victimsKnown:false}),'resolve');
const fire={type:'INC',site:{kind:'building'},spread:1,progress:.1};const developed=fireResistance(fire);fire.spread=.1;assert.equal(fireResistance(fire),developed);assert(developed>fireResistance({type:'INC',site:{kind:'building'},spread:0}));
let seed=57;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);const game=await import('../dist/scene.js');game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;
const c={id:40,type:'AVP',name:'Collision',setting:'road',at:game.state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false};game.state.calls.push(c);game.onCall(c);
for(let i=0;i<3000&&c.policeStatus!=='Sur place';i++){game.state.minute+=.25;game.tickEngines(.25);}assert.equal(c.policeStatus,'Sur place','autonomous patrol reaches the accident');assert(game.police.units.some(v=>v.call===c.id&&v.officers.every(p=>p.visible)));assert(!game.engines.some(e=>e.kind==='POLICE'));
c.status='closed';game.tickEngines(.25);assert(!game.police.units.some(v=>v.call===c.id));
console.log('PASS guard scoring, occasional maintenance, no interruption of active units, sports recall from actual position, preventive VSAV, persistent developed-fire resistance and autonomous police arrival/release');
const fireCall={id:41,type:'INC',name:'Feu de cheminée',setting:'home',at:game.state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false};game.state.calls.push(fireCall);game.onCall(fireCall);
for(let i=0;i<3000&&fireCall.policeStatus!=='Sur place';i++){game.state.minute+=.25;game.tickEngines(.25);}
assert.equal(fireCall.policeStatus,'Sur place','police also reaches a fire');
assert.equal(game.police.units.filter(v=>v.call===fireCall.id).length,1,'one autonomous patrol per incident');
const police=game.police.units.find(v=>v.call===fireCall.id);assert(police.officers.every(p=>p.visible));
assert(Math.hypot(police.model.position.x-fireCall.actionPoint[0],police.model.position.z-fireCall.actionPoint[1])>=18,'police stays clear of the fire');
const accidents=[42,43].map(id=>({id,type:'AVP',name:'Collision',setting:'road',at:game.state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false}));
for(const accident of accidents){game.state.calls.push(accident);game.onCall(accident);}
game.tickEngines(.25);
for(const accident of accidents)assert(game.police.units.some(v=>v.call===accident.id),'accident receives police even with other incidents active');
const recovering=game.police.units.find(v=>v.call===accidents[0].id);
recovering.model.visible=false;recovering.path=null;recovering.respawnAt=game.state.minute;
game.tickEngines(.25);
assert.equal(recovering.call,accidents[0].id,'repositioning retains the original accident assignment');
for(let i=0;i<3000&&accidents.some(c=>c.policeStatus!=='Sur place');i++){game.state.minute+=.25;game.tickEngines(.25);}
for(const accident of accidents){assert.equal(accident.policeStatus,'Sur place');assert(game.police.units.some(v=>v.call===accident.id&&v.model.visible&&v.officers.every(p=>p.visible)));}
for(const accident of accidents)accident.status='closed';
console.log('PASS concurrent fire and two accidents receive visible autonomous patrols');
fireCall.siteCompletedAt=game.state.minute;game.tickEngines(.25);assert(!game.police.units.some(v=>v.call===fireCall.id));
console.log('PASS autonomous fire police dispatch, safe standoff, visible officers and release');
const first=game.engines[0],other=game.engines[1];game.state.selected=first.id;
for(const mode of ['night','day','auto']){
 els.get('vehiclePanel').onclick({target:{closest:selector=>selector==='[data-siren-mode]'?{dataset:{sirenMode:mode}}:null}});
 assert.equal(first.sirenMode,mode,'actual vehicle console updates selected engine');
 assert.equal(other.sirenMode,undefined,'other engine retains its own automatic setting');
}
console.log('PASS actual siren-mode click handler and independent vehicle preferences');
