import assert from 'node:assert/strict';
import {weatherEffects,trafficDensity} from '../dist/operational-environment.js';
import {linkScheduledEvents,evolveIncident,episodeLabel} from '../dist/incident-evolution.js';
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
assert.match(episodeLabel(linked[1]),/2\/2/);

const fire={type:'INC',status:'waiting',at:480,spread:0};
assert.equal(evolveIncident(fire,487,'wind').length,1);
assert.equal(evolveIncident(fire,494,'wind').length,1);
assert(fire.spread>=.35);assert.equal(fire.evolutionImpact,true);
assert.equal(evolveIncident(fire,520,'wind').length,0,'Evolution is reported once');

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

console.log('PASS evolving incidents, linked weather episodes, tactical road closures, real weather effects and richer district rhythms');
