import assert from 'node:assert/strict';
import {assessMeans,meansPanel} from '../dist/means-assessment.js';
import {crewIdentity,engineCrew,crewPanel} from '../dist/crew-identity.js';
import {initCrew,assignCrew,releaseCrew} from '../dist/crew.js';
import {reportMeans,situationWithMeans} from '../dist/command.js';
const c={id:1,type:'SUAP',patients:[{transportRequired:true}],status:'active'};
const e={id:'VSAV 1',kind:'VSAV',status:'scene',call:1,size:3};
assert.equal(assessMeans(c,[e]).key,'pending');c.reconComplete=true;
assert.equal(assessMeans(c,[]).key,'insufficient');assert.equal(assessMeans(c,[e]).key,'sufficient');
e.status='enroute';assert.equal(assessMeans(c,[e]).key,'enroute');e.status='scene';
c.patients.push({transportRequired:true});assert.equal(assessMeans(c,[e]).key,'insufficient');c.patients[1].evacuated=true;assert.equal(assessMeans(c,[e]).key,'sufficient');
c.extrication={progress:0};assert.match(assessMeans(c,[e]).detail,/VSR \/ FPTSR/);assert.equal(assessMeans(c,[e,{kind:'FPT',lightPump:true,call:1,status:'scene'}]).key,'insufficient');assert.equal(assessMeans(c,[e,{kind:'VSR',call:1,status:'scene'}]).key,'sufficient');delete c.extrication;
const state={calls:[c],minute:600};initCrew(state);assert(assignCrew(state,e));const crew=engineCrew(e,state);assert.equal(crew.length,3);assert.equal(new Set(crew.map(p=>p.name)).size,3);assert(crew.every(p=>p.grade));assert(crewPanel(e,state).includes('Chef d’agrès'));assert.equal(crewIdentity(state.roster[0]).name,crew[0].name);
let logs=0;reportMeans(state,[e],()=>logs++);reportMeans(state,[e],()=>logs++);assert.equal(logs,1);assert(c.radio[0].message.includes('Moyens suffisants'));assert(meansPanel(c,[e]).includes('Bilan du chef'));
c.victimCount=2;c.evacuated=1;const combined=situationWithMeans(c,[e]);assert(combined.message.includes('victime(s)'));assert(combined.message.includes('Moyens suffisants'));
releaseCrew(state,e);assert.equal(engineCrew(e,state).length,0);assert.equal(crewPanel(e,state),'');
console.log('PASS reconnaissance-only means assessment, pending reinforcements, specific capabilities, stable crew identities, release and concise deduplicated radio');

const T=await import('../dist/vendor/three.module.js');
const {setInsigniaState,applyPersonInsignia,applyEngineInsignia}=await import('../dist/crew-insignia.js');
setInsigniaState(state);const avatar=new T.Group();
applyPersonInsignia(avatar,{id:1,role:'captain'},{grade:'Capitaine'});
assert.equal(avatar.userData.personGrade,'Capitaine');assert.equal(avatar.userData.rankPatch.userData.grade,'Capitaine');
assert(avatar.userData.rankPatch.geometry.attributes.position.count>6);
const patch=avatar.userData.rankPatch;applyPersonInsignia(avatar,{id:2,role:'nurse'});
assert.equal(avatar.userData.rankPatch,patch);assert.equal(avatar.userData.personGrade,'Infirmier');
applyEngineInsignia(avatar,{crewIds:[]});assert.equal(patch.visible,false,'no invented identity without assigned crew');
const volunteer={id:202,kind:'SPV',slot:2};applyEngineInsignia(avatar,{localVolunteer:true,crewIds:[202],localCrew:[volunteer]});assert.equal(avatar.userData.personId,202);assert(patch.visible);
console.log('PASS body rank follows actual identity, officer/nurse changes reuse the patch, missing crew hides it and local SPV resolve correctly');

const {setHighVisibility}=await import('../dist/crew-insignia.js');
setHighVisibility(avatar,true,'orange');assert(avatar.userData.highVisibility.visible);assert(avatar.userData.rankPatch.position.z>.22);setHighVisibility(avatar,false);assert(!avatar.userData.highVisibility.visible);
applyPersonInsignia(avatar,{id:2,grade:'Adjudant'});assert.equal(avatar.userData.personGrade,'Adjudant');
setInsigniaState({calls:[{id:12,type:'AVP',status:'active'}],roster:[{id:42,grade:'Caporal'}]});applyEngineInsignia(avatar,{kind:'VSR',call:12,crewIds:[42]},0);assert.equal(avatar.userData.personGrade,'Caporal');assert(avatar.userData.highVisibility.visible);
console.log('PASS explicit roster grade, readable chest patch and automatic accident vest');
// Role colours follow the actual crew leader, independent of vehicle or call type.
const roleState={calls:[{id:15,type:'INC',status:'active'}],roster:[{id:71,grade:'Sapeur'},{id:72,grade:'Adjudant'},{id:73,role:'captain'}]};
setInsigniaState(roleState);
for(const kind of ['FPT','CCF','EPA','VSR','VSAV','PC','VPCE']){
 const unit={kind,call:15,crewIds:[71,72]},chief=new T.Group(),member=new T.Group();
 applyEngineInsignia(chief,unit,0);applyEngineInsignia(member,unit,1);
 assert.equal(chief.userData.personId,72);assert.equal(chief.userData.highVisibility.userData.color,'yellow');
 assert.equal(member.userData.personId,71);assert.equal(member.userData.highVisibility.userData.color,'orange');
 assert(chief.userData.highVisibility.visible&&member.userData.highVisibility.visible);
 roleState.calls[0].status='closed';applyEngineInsignia(chief,unit,0);assert(!chief.userData.highVisibility.visible);roleState.calls[0].status='active';
}
applyEngineInsignia(avatar,{kind:'VLCG',call:15,crewIds:[73]},0);assert.equal(avatar.userData.highVisibility.userData.color,'white');
assert.equal(avatar.userData.highVisibility.userData.body.material.color.getHexString(),'f0f1e9');
const reusedVest=avatar.userData.highVisibility;setHighVisibility(avatar,true,'orange');assert.equal(avatar.userData.highVisibility,reusedVest);
setInsigniaState(null);
console.log('PASS white command, yellow actual chief and orange crew on fires and other interventions; reuse and removal');

const {pcSituation}=await import('../dist/support-console.js');
const incident={id:50,type:'SUAP',name:'Test PC',status:'active',reconComplete:true,victimCount:2,patients:[{transportRequired:true},{transportRequired:true}]};
const dispatched=[{id:'VSAV 1',kind:'VSAV',status:'scene',call:50},{id:'VSAV 2',kind:'VSAV',status:'departing',call:50}];
assert.deepEqual(assessMeans(incident,dispatched).requirements,[{label:'VSAV',required:2,present:1,enroute:1,missing:0}]);
assert(pcSituation(incident,dispatched).includes('Bilan de l’intervention'));assert(pcSituation(incident,dispatched).includes('VSAV 2'));assert(!pcSituation({...incident,reconComplete:false},dispatched).includes('<table>'));
console.log('PASS PC situation report with required, present, mobilized and missing means after reconnaissance');
