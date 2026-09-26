import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INCIDENTS,FAMILY_SHARES,familyFor,pickIncident,casualtyProfile,createPatients,inspectFire} from '../dist/incident-catalog.js';
import {createShift,setDensity} from '../dist/sim.js';
import {locateIncident} from '../dist/incident-location.js';
import {fleet} from '../dist/sim.js';
import {capability} from '../dist/operations.js';
import {roads} from '../dist/roads.js';

const ref=JSON.parse(readFileSync(new URL('../dist/data/departures-reference.json',import.meta.url)));
assert(ref.rows.length>0);assert.equal(new Set(ref.rows.map(r=>r.id)).size,ref.rows.length);
for(const row of ref.rows){assert(row.page>0);assert(ref.sources.some(s=>s.id===row.source));}
assert.equal(INCIDENTS.length,48);assert.equal(new Set(INCIDENTS.map(c=>c.id)).size,48);
for(const c of INCIDENTS){
 assert(c.sources.length>0);for(const id of c.sources)assert(ref.rows.some(r=>r.id===id),c.id+' source '+id);
 assert(c.duration>0&&c.setting&&c.scene);assert(fleet.some(e=>['resolve','waterRescue'].includes(capability(e,c))),c.name+' can be resolved by the fleet');
 for(const period of ['day','night'])assert(c.weight[period]>=0);
}
for(const period of ['day','night']){
 assert(Math.abs(Object.values(FAMILY_SHARES[period]).reduce((a,b)=>a+b,0)-1)<1e-9);
 for(const type of Object.keys(FAMILY_SHARES[period]))assert.equal(INCIDENTS.filter(c=>c.type===type).reduce((n,c)=>n+c.weight[period],0),100);
}
let seed=4917;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const [period,minute]of [['day',12*60],['night',2*60]]){
 const counts={SUAP:0,INC:0,AVP:0,OD:0};const sub={};
 for(let i=0;i<100000;i++){const type=familyFor(minute,random);counts[type]++;const c=pickIncident(type,minute,random);sub[c.id]=(sub[c.id]||0)+1;}
 for(const [type,share]of Object.entries(FAMILY_SHARES[period]))assert(Math.abs(counts[type]/100000-share)<.007,period+' '+type);
 assert((sub['avp-carambolage']||0)/counts.AVP<.03);assert((sub['sap-noyade']||0)/counts.SUAP<.03);assert((sub['od-branche']||0)/counts.OD<.08);
 if(period==='night'){assert(!sub['sap-blesse-stade']);assert(!sub['sap-malaise-sport']);}
 console.log(period,counts);
}
const state=createShift();assert.equal(state.density,8);assert.equal(state.schedule.filter(c=>!c.noDispatch).length,8);
for(const c of state.schedule.filter(c=>!c.noDispatch)){assert(INCIDENTS.some(t=>t.id===c.catalogId));assert(c.at>=state.shiftStart&&c.at<=state.shiftEnd);}
for(const n of[5,12,20]){setDensity(state,n);assert.equal(state.schedule.filter(c=>!c.noDispatch).length,n);}
for(const c of INCIDENTS.filter(c=>c.type==='SUAP'))for(let i=0;i<100;i++)assert.equal(casualtyProfile(c,random),1);
for(const id of['avp-cycliste','avp-pieton'])for(let i=0;i<100;i++)assert.equal(casualtyProfile(INCIDENTS.find(c=>c.id===id),random),1);
const lift={...INCIDENTS.find(c=>c.id==='sap-relevage'),victimCount:1};assert.equal(createPatients(lift,()=>.7)[0].transportRequired,false);assert.equal(createPatients(lift,()=>0)[0].transportRequired,true,'severe patient always transported');
for(const template of INCIDENTS){
 const c={...template,target:[35,30]};if(c.setting==='forest'){const r=roads.find(r=>r.trail);c.target=r.a.slice();}
 locateIncident(c,()=>.5);
 if(['home','tower','mall','office','shop'].includes(c.setting))assert.equal(c.site.kind,'building',c.name);
 if(['sidewalk','roadside','forest','stadium'].includes(c.setting))assert.equal(c.site.kind,c.setting,c.name);
 if(c.setting==='tower')assert.equal(c.site.style,'tower');
 if(c.setting==='mall')assert.equal(c.site.style,'mall');
 if(c.site?.kind==='building')assert.notDeepEqual(c.target,c.accessTarget);
}
const alarm={...INCIDENTS.find(c=>c.id==='inc-alarme'),fireConfirmed:null,finishBudget:100};
assert.equal(inspectFire(alarm,()=>.9),false);alarm.reconComplete=true;assert(inspectFire(alarm,()=>.9));assert.equal(alarm.fireConfirmed,false);assert.equal(alarm.duration,12);
const fire={...alarm,fireConfirmed:null};assert(inspectFire(fire,()=>.01));assert.equal(fire.fireConfirmed,true);assert.equal(fire.duration,70);assert.equal(fire.finishBudget,158);
console.log('PASS bibliographic references, sourced catalogue, 200,000 weighted draws, density, casualties and matching locations');
