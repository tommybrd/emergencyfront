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
const html=shiftBriefHtml(state);
assert(html.includes('Tendance du jour'));
assert(html.includes('Forte sollicitation'));
assert(!html.includes('Journée chaude et sèche'));
assert(html.includes('briefTrendIcon'));
assert(!html.includes('<h2>'));
assert(!html.includes('Conditions ordinaires'));
assert(html.includes('data-brief-start'));
for(const gone of ['data-brief-minus','data-brief-fleet','data-day-options','Capitaine et infirmier inclus','briefFeedback'])assert(!html.includes(gone),`brief must only show the trend: ${gone}`);
assert(!html.includes('Ambiance actuelle'));
assert(!html.includes('Densité annoncée'));
assert(!html.includes('Part d’inattendu'));
assert(!html.includes('550'));
console.log('PASS captain shift briefing, hidden schedule, atmosphere and trend-only brief');
