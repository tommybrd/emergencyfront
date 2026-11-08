import assert from 'node:assert/strict';
import {HOSPITALS,CHU_EXIT,isChild,patientNeed,advisedDestination,destinationFor,orientationPanel} from '../dist/hospital-choice.js';
import {roads} from '../dist/roads.js';
assert(roads.some(r=>!r.name.includes('(simulation)')&&[r.a,r.b].some(p=>p[0]===CHU_EXIT[0]&&p[1]===CHU_EXIT[1])),'The CHU exit sits on the real road network');
const avp={id:3,type:'AVP',name:'Collision entre deux voitures',patients:[{severe:true},{severe:false}]};
assert.equal(patientNeed(avp,avp.patients[0]),'trauma');assert.equal(patientNeed(avp,avp.patients[1]),null,'Light victims stay at the CH');
assert.equal(advisedDestination(avp,[avp.patients[0]]),'chu');assert.equal(advisedDestination(avp,[avp.patients[1]]),'ch');
assert.equal(destinationFor(avp,[avp.patients[0]]),'chu');avp.orientation='ch';assert.equal(destinationFor(avp,[avp.patients[0]]),'ch','The player may keep the victim in town');
const malaise={id:4,type:'SUAP',name:'Malaise',patients:[{severe:true}]};assert.equal(patientNeed(malaise,malaise.patients[0]),isChild(malaise,0)?'pediatrie':null);
// About one SUAP call in eight has a child victim, deterministically.
const children=Array.from({length:400},(_,id)=>isChild({id,type:'SUAP'},0)).filter(Boolean).length;assert(children>25&&children<80,`children ${children}`);
assert.equal(isChild({id:7,type:'SUAP'},0),isChild({id:7,type:'SUAP'},0));
assert.match(orientationPanel({...avp,orientation:null}),/data-orientation="chu" aria-pressed="true"/);assert.equal(orientationPanel({...avp,patients:[{severe:false}]}),'');
assert.equal(HOSPITALS.chu.short,'CHU');
console.log('PASS orientation des victimes : CHU conseillé pour un polytraumatisé ou un enfant grave, choix du joueur, sortie de ville par la rocade');
