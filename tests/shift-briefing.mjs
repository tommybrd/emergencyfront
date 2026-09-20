import assert from 'node:assert/strict';
import {momentAtmosphere,shiftBrief,fleetBrief,shiftBriefHtml} from '../dist/shift-briefing.js';

const state={minute:480,shiftStart:480,shiftEnd:1920,next:0,density:12,schedule:[
 {type:'INC',at:550},{type:'INC',at:620},{type:'AVP',at:900},{type:'SUAP',at:960},{type:'INC',at:1100},{type:'OD',at:1400},{noDispatch:true,at:700}
]};
const brief=shiftBrief(state);
assert.equal(brief.label,'Garde soutenue');
assert.match(brief.atmosphere,/ville s’éveille/);
assert.match(brief.focus,/incendie/);
assert.match(brief.surprise,/incomplet/);
assert(!JSON.stringify(brief).includes('550'),'The briefing must not reveal exact scheduled calls');
assert.match(momentAtmosphere(23*60),/ville ralentit/);

const engines=[
 {kind:'VSAV',status:'ready'},{kind:'VLI',status:'ready'},{kind:'FPT',status:'ready'},
 {kind:'VSR',status:'maintenance'},{kind:'EPA',status:'ready'},{kind:'VLCG',status:'ready'},
 {kind:'SAMU',external:true,status:'ready'}
];
assert.deepEqual(fleetBrief(engines),{total:5,medical:2,fire:2,support:1,unavailable:1});
const html=shiftBriefHtml(state,engines,13);
assert(html.includes('PRISE DE GARDE · ACTION CAPITAINE'));
assert(html.includes('Configurer les moyens'));
assert(html.includes('Appliquer l’effectif'));
assert(!html.includes('550'));
console.log('PASS captain shift briefing, hidden schedule, atmosphere, staffing and fleet summary');
