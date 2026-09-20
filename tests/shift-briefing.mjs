import assert from 'node:assert/strict';
import {momentAtmosphere,shiftBrief,fleetBrief,shiftBriefHtml} from '../dist/shift-briefing.js';
import {newShiftConditions} from '../dist/sim.js';

const state={minute:480,shiftStart:480,shiftEnd:1920,next:0,density:12,conditions:{key:'hot',label:'Journée chaude et sèche',detail:'Les sols et la végétation sont secs.',risk:'Risque accru de départ et de propagation des feux de végétation.'},schedule:[
 {type:'INC',at:550},{type:'INC',at:620},{type:'AVP',at:900},{type:'SUAP',at:960},{type:'INC',at:1100},{type:'OD',at:1400},{noDispatch:true,at:700}
]};
const brief=shiftBrief(state);
assert.equal(brief.label,'Forte sollicitation');
assert.match(brief.atmosphere,/ville s’éveille/);
assert.match(brief.condition,/chaude/);
assert.match(brief.risk,/feux de végétation/);
assert.match(brief.surprise,/inattendus/);
assert(!JSON.stringify(brief).includes('550'),'The briefing must not reveal exact scheduled calls');
assert.match(momentAtmosphere(23*60),/ville ralentit/);
assert.equal(newShiftConditions(()=>0).key,'hot');

const engines=[
 {kind:'VSAV',status:'ready'},{kind:'VLI',status:'ready'},{kind:'FPT',status:'ready'},
 {kind:'VSR',status:'maintenance'},{kind:'EPA',status:'ready'},{kind:'VLCG',status:'ready'},
 {kind:'SAMU',external:true,status:'ready'}
];
assert.deepEqual(fleetBrief(engines),{total:5,medical:2,fire:2,support:1,unavailable:1});
const html=shiftBriefHtml(state,engines,13);
assert(html.includes('PRISE DE GARDE · ACTION CAPITAINE'));
assert(html.includes('Ajouter, retirer ou remplacer un moyen'));
assert(html.includes('Capitaine et infirmier inclus'));
assert(html.includes('data-brief-minus'));
assert(!html.includes('550'));
console.log('PASS captain shift briefing, hidden schedule, atmosphere, staffing and fleet summary');
