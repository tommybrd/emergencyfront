import assert from 'node:assert/strict';
import './game-environment.mjs';
import {POLICE_MISSIONS,planPoliceMissions,duePoliceMissions,tickSecurity,securityPending,securityStatus,OPJ_MINUTES} from '../dist/police-missions.js';
import {engagementError} from '../dist/operations.js';
import {incidentWorkload,nextCallBlocked} from '../dist/sim.js';

// Planning : quatre missions par garde, reproductible, sans toucher au hasard partagé.
{
 const s={citySeed:7,shiftStart:480,shiftEnd:1920,minute:480},before=Math.random;let draws=0;Math.random=()=>{draws++;return before();};
 const plan=planPoliceMissions(s);Math.random=before;
 assert.equal(plan.length,4);assert.deepEqual(plan,planPoliceMissions(s),'Same guard, same plan');assert.equal(draws,0);
 assert(plan.every(p=>p.at>=480&&p.at<1920&&POLICE_MISSIONS.some(m=>m.id===p.kind)));
 s.minute=plan[0].at;const due=duePoliceMissions(s);assert.equal(due.length,1);assert.equal(duePoliceMissions(s).length,0,'Each slot only once');
 assert(due[0].security&&due[0].security.secured===false);
}
// Mission police : pas de pompiers, pas de charge de dispatch ; escalade puis fin après la présence.
const unit=(id,force,call,status='scene',extra={})=>({id,force,call,status,...extra});
{
 const c={id:1,type:'OD',policeOnly:true,presence:6,at:600,status:'waiting',security:{force:'PM',escalate:'PN',escalateAfter:10,opj:false,secured:false}};
 assert.match(engagementError([{id:'FPT 1'}],c),/Mission de police/);assert.equal(incidentWorkload(c),0);assert.notEqual(nextCallBlocked({minute:600,shiftEnd:2000,calls:[c],incoming:[],schedule:[],next:0}),'Une intervention est encore en cours');
 const police=[];let out=tickSecurity(c,police,611,()=>({}));assert.equal(c.security.force,'PN','Unattended suspect escalates to national police');assert(out[0].urgent);
 const kept={id:9,type:'OD',policeOnly:true,at:600,status:'waiting',security:{force:'PN',escalate:'BAC',escalateAfter:8,secured:false}};tickSecurity(kept,[unit('Police 4','PN',9,'called')],612,()=>({}));assert.equal(kept.security.force,'PN','A force requested in time prevents escalation');
 police.push(unit('PM 1','PM',1));tickSecurity(c,police,612,()=>({}));tickSecurity(c,police,615,()=>({}));assert(securityPending(c),'Municipal police cannot cover a PN-level mission');
 police.push(unit('Police 3','PN',1));tickSecurity(c,police,615,()=>({}));out=tickSecurity(c,police,617,()=>({}));assert(!securityPending(c));assert.match(out[0].text,/maîtrisée/);
 tickSecurity(c,police,620,()=>({}));assert.notEqual(c.status,'closed');out=tickSecurity(c,police,623,()=>({}));assert.equal(c.status,'closed');assert(c.policeHandled);
 const ignored={id:2,type:'OD',policeOnly:true,presence:6,at:600,status:'waiting',security:{force:'PN',secured:false}};tickSecurity(ignored,[],626,()=>({}));assert.equal(ignored.status,'closed');assert(ignored.policeFailed);
}
// Secours sous protection : engagement d'office sans demande, BAC exigée, OPJ pour les constatations.
{
 const c={id:3,type:'SUAP',at:600,status:'waiting',security:{force:'BAC',opj:true,secured:false}},asked=[];
 const request=(force,options={})=>{asked.push([force,!!options.opj]);return {message:'ok'};};
 assert.match(securityStatus(c),/attente de sécurisation · BAC/);
 tickSecurity(c,[],605,request);assert.deepEqual(asked,[]);tickSecurity(c,[],608,request);assert.deepEqual(asked,[['BAC',false]],'CIC engages the force when nobody asked');
 const police=[unit('BAC 1','BAC',3)];tickSecurity(c,police,610,request);tickSecurity(c,police,612,request);assert(!securityPending(c));
 tickSecurity(c,police,612.5,request);assert.deepEqual(asked.at(-1),['PN',true]);assert.match(securityStatus(c),/OPJ/);
 police.push(unit('OPJ 1','PN',3,'scene',{opj:true}));tickSecurity(c,police,613,request);tickSecurity(c,police,613+OPJ_MINUTES,request);assert(c.security.opjDone);assert.equal(securityStatus(c),'Zone sécurisée');assert.notEqual(c.status,'closed','Medical calls close through care, not police');
}
console.log('PASS missions police : planning par garde, escalade, forces suffisantes, engagement d’office, OPJ et clôture');

// Intégration : le VSAV attend la sécurisation, le commissariat envoie la BAC, puis les soins démarrent.
let seed=17;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;game.state.minute=14*60;game.state.policePlan=[];
const c={id:70,type:'SUAP',catalogId:'pol-arme-blanche',name:'Personne blessée par arme blanche',setting:'sidewalk',scene:'patient',requires:'VSAV',casualties:'single',severity:0,at:game.state.minute,status:'waiting',duration:20,progress:0,allowComplications:false,security:{force:'BAC',opj:false,secured:false}};
game.state.calls.push(c);game.onCall(c);
const vsav=game.engines.find(e=>e.kind==='VSAV'&&e.status==='ready');game.selectIncident(c.id);assert(!game.engageUnits([vsav.id]));
const step=()=>{game.state.minute+=.25;game.tickEngines(.25);};
for(let i=0;i<4000&&vsav.status!=='scene';i++)step();assert.equal(vsav.status,'scene');
for(let i=0;i<40;i++)step();assert.equal(c.progress,0,'No care before the zone is secured');assert(!c.patients[0].assignedTo);
const bac=game.police.request(game.state,c,'BAC');assert.match(bac.message,/commissariat/);
const officer=game.police.units.find(v=>v.call===c.id&&v.force==='BAC');
for(let i=0;i<8000&&officer.status!=='scene';i++)step();assert.equal(officer.status,'scene');assert(officer.fromStation);
for(let i=0;i<8000&&securityPending(c);i++){step();for(const m of tickSecurity(c,game.police.units,game.state.minute,()=>({})))void m;}
assert(!securityPending(c));for(let i=0;i<400&&!c.patients[0].assignedTo;i++)step();assert.equal(c.patients[0].assignedTo,vsav.id,'Care starts once secured');
console.log('PASS secours sous protection : VSAV en attente, BAC partie du commissariat, soins après sécurisation');

// Mission police seule créée par la garde : fiche sans pompiers, PN depuis le commissariat, clôture et retour.
{
 game.state.minute=15*60;game.state.policePlan=[{at:game.state.minute,kind:'pol-rassemblement',key:'test'}];
 const [m]=duePoliceMissions(game.state);Object.assign(m,{id:++game.state.received,status:'waiting',progress:0,engine:null});game.state.calls.push(m);game.onCall(m);
 assert(m.target&&m.address);game.selectIncident(m.id);assert.match(game.engageUnits([game.engines.find(e=>e.kind==='FPT').id]),/Mission de police/);
 assert.match(game.police.request(game.state,m,'PN').message,/commissariat/);
 const pn=game.police.units.find(v=>v.call===m.id);
 for(let i=0;i<12000&&m.status!=='closed';i++){game.state.minute+=.25;game.tickEngines(.25);tickSecurity(m,game.police.units,game.state.minute,()=>({error:'none'}));}
 assert.equal(m.status,'closed');assert(m.policeHandled);
 for(let i=0;i<8000&&!pn.retired;i++){game.state.minute+=.25;game.tickEngines(.25);}assert(pn.retired,'Crew returns to the commissariat');
 console.log('PASS mission police seule : fiche sans pompiers, PN du commissariat, maîtrise, clôture et retour');
}
