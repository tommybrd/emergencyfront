import assert from 'node:assert/strict';
import {weatherEffects,trafficDensity} from '../dist/operational-environment.js';
import {linkScheduledEvents,evolveIncident} from '../dist/incident-evolution.js';
import {cityActivityLevels} from '../dist/city-activity.js';
import {cityDensity} from '../dist/real-neighborhood.js';
import {perimeterLayout} from '../dist/scene-perimeter.js';
import {roads} from '../dist/roads.js';
import {tickPatientHealth} from '../dist/patient-health.js';

assert(weatherEffects('rain').travel<1);
assert(weatherEffects('rain').fire<1);
assert(weatherEffects('wind').fire>weatherEffects('mild').fire);
assert(weatherEffects('hot').patient>1);
assert(trafficDensity(.8,'crowd')>.8);
assert(cityDensity(14*60,'crowd')>cityDensity(14*60,'mild'));
assert.equal(cityActivityLevels(15*60,'crowd').market,1);
assert.equal(cityActivityLevels(15*60,'crowd').stadium,1);
assert.equal(cityActivityLevels(15*60,'rain').promenade,0);

const schedule=[{type:'AVP',at:500},{type:'SUAP',at:900},{type:'OD',at:1100}];
linkScheduledEvents(schedule,'rain',()=>.5);
const linked=schedule.filter(c=>c.episode);
assert.equal(linked.length,2);
assert.equal(linked[0].episode,linked[1].episode);
assert(linked[1].at-linked[0].at<=36);

const fire={type:'INC',status:'waiting',at:480,spread:0};
assert.equal(evolveIncident(fire,487,'wind').length,0);assert.equal(fire.evolutionState,undefined);
for(const type of ['AVP','SUAP','OD']){const waiting={type,status:'waiting',at:480};assert.deepEqual(evolveIncident(waiting,495),[]);assert.equal(waiting.evolutionState,undefined);}
const legacy={type:'SUAP',status:'active',firstArrival:485,evolutionState:'Situation non stabilisée'};assert.deepEqual(evolveIncident(legacy,500),[]);assert.equal(legacy.evolutionState,null);
assert.equal(evolveIncident(fire,494,'wind').length,0,'fire spread before arrival stays silent');
assert(fire.spread>=.35);assert.equal(fire.evolutionImpact,true);assert.equal(fire.evolutionState,null,'no warning badge once the fire has spread');assert.equal(fire.spreadBeforeArrival,'wind');
assert.equal(evolveIncident(fire,520,'wind').length,0,'Evolution is reported once');
const misc={type:'OD',status:'waiting',at:480,duration:20};assert.deepEqual(evolveIncident(misc,501),[],'late OD stays silent');assert.equal(misc.duration,28);assert.equal(misc.evolutionState,null,'no extended-operation badge');
const legacyMisc={type:'OD',status:'active',firstArrival:490,evolutionState:'Opération étendue'};evolveIncident(legacyMisc,500);assert.equal(legacyMisc.evolutionState,null);

const accident={type:'AVP',status:'waiting',at:480};
evolveIncident(accident,496,'rain');assert(accident.trafficEscalated);
const road=roads.find(r=>!r.trail&&!r.name.includes('(simulation)'));
const point=[(road.a[0]+road.b[0])/2,(road.a[1]+road.b[1])/2];
const base=perimeterLayout({type:'AVP',target:point,actionPoint:point,site:{kind:'road'}});
const tactical=perimeterLayout({type:'AVP',target:point,actionPoint:point,site:{kind:'road'},trafficEscalated:true});
assert(tactical.length>base.length);assert(tactical.width>base.width);

const patient={severe:true,health:65},mild={type:'SUAP',status:'active',patients:[patient]},hot={type:'SUAP',status:'active',patients:[{...patient}]};
tickPatientHealth(mild,[],10,500,()=>{},1);tickPatientHealth(hot,[],10,500,()=>{},weatherEffects('hot').patient);
assert(hot.patients[0].health<mild.patients[0].health);
const medical={type:'SUAP',status:'waiting',at:480,patients:[{severe:false,health:76}]};
evolveIncident(medical,498,'hot');assert.equal(medical.evolutionState,'État de la victime aggravé');assert(medical.patients[0].severe);

// Missing-person search: the VSAV may leave in anticipation, but only VTU/FPT/CCF run the search.
{const {capability}=await import('../dist/operations.js'),search={type:'OD',searchPerson:true,searchDone:false,requires:'VTU'};
 assert.equal(capability({kind:'VSAV'},search),'resolve');assert.equal(capability({kind:'VTU'},search),'resolve');assert.equal(capability({kind:'VSAV'},{type:'OD',requires:'VTU'}),null,'Other OD calls still refuse a VSAV');}
// SPV reach follows the working day and stays reproducible for a given guard seed.
{const {volunteerReach,localShortage}=await import('../dist/volunteer-availability.js');
 for(let seed=1;seed<40;seed++){assert(volunteerReach(10*60,seed).count<=5);assert(volunteerReach(2*60,seed).count>=9);assert.deepEqual(volunteerReach(15*60,seed),volunteerReach(15*60,seed));}
 const sud=[{id:'VSAV Sud',localVolunteer:true,status:'ready',size:3},{id:'FPTL Sud',localVolunteer:true,status:'ready',size:4},{id:'CCFM Sud',localVolunteer:true,status:'ready',size:4}];
 assert.equal(localShortage([sud[0]],sud,10*60,7),null,'One VSAV can still leave by day');assert.match(localShortage(sud.slice(1),sud,10*60,7),/insuffisant/);
 assert.equal(localShortage(sud.slice(1),sud,2*60,7),null,'At night FPTL and CCFM leave together');
 const busy=[{...sud[0],status:'enroute'},sud[1],sud[2]];assert.match(localShortage([sud[1]],busy,10*60,7),/insuffisant/,'Engaged SPV are counted against parallel departures');assert.equal(localShortage([sud[1]],busy,2*60,7),null);}
// Départ type par motif, ajouts du bilan, part manquante et réglage du joueur.
{const {departureKinds,missingKinds,saveDepartureOverride,loadDepartureOverrides}=await import('../dist/departure-types.js');
 const flat={type:'INC',catalogId:'inc-appartement',requires:'FPT',name:'Feu d’appartement'};assert.deepEqual(departureKinds(flat,{}),['FPT','EPA','VSAV','VLCG']);
 assert.deepEqual(departureKinds({type:'OD',catalogId:'surveillance',requires:'VSAV'},{}),['VSAV'],'Mayor security posts default to a VSAV, not the generic VTU');
 assert.deepEqual(departureKinds({type:'INC',catalogId:'inc-garage',requires:'FPT',site:{height:12},victimsKnown:true,victimCount:1},{}),['FPT','EPA','VSAV'],'Height and victims add EPA and VSAV');
 assert.deepEqual(departureKinds({type:'SUAP',name:'Malaise à domicile'},{}),['VSAV'],'Name fallback and family default');
 const engaged=[{call:7,status:'enroute',kind:'FPT'},{call:7,status:'scene',kind:'VSAV'},{call:7,status:'returning',kind:'EPA'}];assert.deepEqual(missingKinds({...flat,id:7},engaged,['FPT','EPA','VSAV','VLCG']),['EPA','VLCG'],'Only the missing part, released units do not count');
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};saveDepartureOverride('inc-appartement',['FPT','FPT','EPA'],storage);assert.deepEqual(departureKinds(flat,loadDepartureOverrides(storage)),['FPT','FPT','EPA']);saveDepartureOverride('inc-appartement',null,storage);assert.deepEqual(loadDepartureOverrides(storage),{});
 store.set('valmont.departureTypes','{"x":["NOPE"],"inc-maison":["FPT"]}');assert.deepEqual(loadDepartureOverrides(storage),{'inc-maison':['FPT']},'Invalid saved kinds are ignored');}
// Coefficient de propagation R : 1 stable, au-dessus le feu se propage, en dessous il régresse, 0 éteint.
{const {propagationIndex,propagationCoefficient,updatePropagationCoefficient}=await import('../dist/fire-status.js');
 assert.equal(propagationIndex({type:'SUAP'}),null);
 const fire={type:'INC',spread:.9,progress:.1,scene:'apartment'};assert.equal(propagationCoefficient(fire),1,'Flat before any measure');
 updatePropagationCoefficient(fire,600);for(let m=1;m<=20;m++){fire.spread+=.02;updatePropagationCoefficient(fire,600+m);}
 const growing=propagationIndex(fire);assert(growing.r>1.1,'Growth gives R above 1');assert.equal(growing.trend,'up');assert.equal(growing.exposure,'Menace sur les voisins');
 for(let m=21;m<=50;m++){fire.progress+=.02;updatePropagationCoefficient(fire,600+m);}
 const falling=propagationIndex(fire);assert(falling.r<.9,'Attack brings R below 1');assert.equal(falling.trend,'down');
 for(let m=51;m<=62;m++){fire.progress=Math.min(.999,fire.progress+.04);updatePropagationCoefficient(fire,600+m);}
 assert(propagationCoefficient(fire)<falling.r,'Close to extinction R heads to 0');
 assert.equal(propagationCoefficient({...fire,fireContained:true}),0);assert.equal(propagationIndex({...fire,neighborProtected:true}).exposure,'Voisins protégés');}
console.log('PASS evolving incidents, linked weather episodes, tactical road closures, real weather effects, richer district rhythms, VSAV on searches, SPV daily reach, departure types and propagation coefficient R');
