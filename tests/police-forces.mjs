import assert from 'node:assert/strict';
import './game-environment.mjs';
import {FORCES,concoursDelay} from '../dist/police.js';

assert.deepEqual(Object.keys(FORCES),['PM','PN','BAC']);
assert.equal(concoursDelay('PM',10*60),4);assert.equal(concoursDelay('PM',23*60),null,'No municipal police at night');
assert(concoursDelay('BAC',23*60)<concoursDelay('BAC',14*60),'BAC is quicker at night');assert.equal(concoursDelay('PN',600,2),12,'Busy units lengthen the delay');

let seed=91;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;game.state.minute=14*60;
// A medical call gets no automatic patrol; the player asks for BAC protection and the municipal police for traffic.
const c={id:60,type:'SUAP',name:'Malaise sur la voie publique',setting:'sidewalk',at:game.state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false};game.state.calls.push(c);game.onCall(c);
for(let i=0;i<40;i++){game.state.minute+=.25;game.tickEngines(.25);}
assert(!game.police.units.some(v=>v.call===c.id),'No autonomous patrol on SUAP');
const bac=game.police.request(game.state,c,'BAC');assert.match(bac.message,/Brigade anti-criminalité.*9 min/);
assert.match(game.police.request(game.state,c,'BAC').error,/déjà engagée/);
assert.match(game.police.request(game.state,c,'PM').message,/Police municipale/);
assert.match(c.policeForces.BAC,/Demandée/);
const unit=game.police.units.find(v=>v.force==='BAC'&&v.call===c.id);assert(unit.requested);assert.equal(unit.model.visible,false);assert.equal(unit.model.userData.beacons.length,1,'Unmarked car with one magnetic beacon');
const pm=game.police.units.find(v=>v.force==='PM');assert.equal(pm.id,'PM 1');assert.equal(pm.model.name,'Police municipale');
for(let i=0;i<8000&&c.policeForces.BAC!=='Sur place';i++){game.state.minute+=.25;game.tickEngines(.25);}
assert.equal(c.policeForces.BAC,'Sur place','Requested BAC reaches the scene');assert(unit.officers.every(p=>p.visible));
assert(game.state.minute-14*60>=9,'Not before the announced delay');
// Closing the call retires the requested units, autonomous patrols stay in the pool.
c.status='closed';game.tickEngines(.25);
assert(unit.retired&&!unit.model.visible);assert(!game.police.units.some(v=>!v.retired&&v.call===c.id));
assert(game.police.units.filter(v=>v.force==='PN'&&!v.retired).length>=2);
// Night: municipal police cannot be requested.
const n={id:61,type:'AVP',name:'Collision entre deux voitures',setting:'road',at:game.state.minute,status:'waiting',duration:10000,progress:0,allowComplications:false};game.state.minute=23*60;game.state.calls.push(n);game.onCall(n);
assert.match(game.police.request(game.state,n,'PM').error,/indisponible la nuit/);
console.log('PASS forces de l’ordre : PM, PN et BAC distinctes, concours depuis la fiche, délais selon l’heure et la charge, retrait après l’intervention');
