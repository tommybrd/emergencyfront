import assert from 'node:assert/strict';
import './game-environment.mjs';
import {canGroupTransport,groupPartner,ambulancesNeeded} from '../dist/group-transport.js';
import {useKits,tickRestock,kitsLeft,outOfKits,kitsStatus,KIT_CAPACITY,RESTOCK_MINUTES} from '../dist/vsav-supplies.js';
import {engagementError} from '../dist/operations.js';
import {tickAccidentPolice,accidentPoliceStatus,onlookersFactor} from '../dist/police-accident.js';

// Transport groupé : deux légers seulement, sur décision, jamais avec un cas grave ou incarcéré.
{
 const a={severe:false,evacuated:false,assignedTo:'VSAV 1',transportRequired:true,health:95},b={severe:false,evacuated:false,assignedTo:null,transportRequired:true,health:95},grave={severe:true,evacuated:false,assignedTo:null,transportRequired:true,health:90};
 const c={status:'active',victimsKnown:true,patients:[a,b,grave]},e={id:'VSAV 1',kind:'VSAV'};
 assert(canGroupTransport(c));assert.equal(groupPartner(c,a,e),null,'Not without a decision');
 c.groupTransport=true;assert.equal(groupPartner(c,a,e),b);assert.equal(groupPartner(c,grave,e),null,'Never with a serious casualty');
 assert.equal(groupPartner(c,a,{id:'SMUR',kind:'SAMU'}),null);assert.equal(ambulancesNeeded(c,[a,b,grave]),2);
 b.trapped=true;assert.equal(groupPartner(c,a,e),null,'A trapped casualty cannot board');
}
// Matériel : un lot par victime, refus de départ à zéro, recomplètement au CIS sans immobiliser.
{
 const e={id:'VSAV 1',kind:'VSAV',size:3,crew:3,status:'ready',call:null},msgs=[];
 assert.equal(kitsLeft(e),KIT_CAPACITY);useKits(e,2,m=>msgs.push(m));assert.match(msgs[0],/plus qu’un lot/);assert.match(kitsStatus(e),/1\/3/);
 useKits(e,1,m=>msgs.push(m));assert(outOfKits(e));assert.match(msgs[1],/épuisé/);
 assert.match(engagementError([e],{status:'waiting',type:'SUAP'},10,[]),/matériel épuisé/);
 e.status='returning';tickRestock(e,60);assert.equal(kitsLeft(e),0,'Restock only at the station');
 e.status='ready';tickRestock(e,RESTOCK_MINUTES);assert.equal(kitsLeft(e),1);assert.equal(engagementError([e],{status:'waiting',type:'SUAP'},10,[]),null);
 tickRestock(e,RESTOCK_MINUTES*5);assert.equal(kitsLeft(e),KIT_CAPACITY);assert.equal(kitsStatus(e),'');
 assert.equal(kitsLeft({kind:'FPT'}),Infinity);assert.equal(outOfKits({kind:'VSAV',external:true,kits:0}),false);
}
// Police sur accident : curieux, dépistage, et levée de doute avant l'engagement des secours.
{
 const c={id:4,type:'AVP',status:'waiting',casualties:'solo',victimCount:1,doubtful:false},unit={id:'Police 1',call:4,status:'scene'};
 assert.equal(onlookersFactor(c),.85);
 tickAccidentPolice(c,[unit],[],600);let out=tickAccidentPolice(c,[unit],[],603).messages;assert.match(out[0].text,/curieux/);assert.equal(onlookersFactor(c),1);
 out=tickAccidentPolice(c,[unit],[],606).messages;assert.match(out[0].text,/alcoolémie/);assert.match(accidentPoliceStatus(c),/Alcoolémie/);
 const seen=new Set();
 for(let id=1;id<80;id++){const d={id,seed:id*13,type:'AVP',status:'waiting',casualties:'solo',victimCount:1,doubtful:true};tickAccidentPolice(d,[{id:'Police 1',call:id,status:'scene'}],[],600);const r=tickAccidentPolice(d,[{id:'Police 1',call:id,status:'scene'}],[],602);seen.add(r.falseAlarm?'false':'confirmed');}
 assert.deepEqual([...seen].sort(),['confirmed','false']);
 const engaged={id:9,type:'AVP',status:'waiting',casualties:'solo',victimCount:1,doubtful:true};
 tickAccidentPolice(engaged,[{id:'Police 1',call:9,status:'scene'}],[{call:9,status:'enroute'}],600);assert(!tickAccidentPolice(engaged,[{id:'Police 1',call:9,status:'scene'}],[{call:9,status:'enroute'}],602).falseAlarm,'Engaged crews are never recalled by a false alarm');
}
console.log('PASS transport groupé, lots de matériel VSAV, police sur accidents');

// Intégration : deux légers partent dans un seul VSAV, remise allongée, matériel débité.
let seed=23;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;game.state.minute=10*60;game.state.policePlan=[];game.state.surveillancePlan=[];game.state.specialistPlan={at:Infinity,key:'x'};game.state.shiftEnd=100000;
const c={id:80,type:'SUAP',name:'Deux personnes légèrement blessées',setting:'sidewalk',scene:'patient',requires:'VSAV',at:game.state.minute,status:'waiting',duration:12,progress:0,victimCount:2,allowComplications:false,patients:[0,1].map(()=>({severe:false,evacuated:false,assignedTo:null,transportRequired:true}))};
game.state.calls.push(c);game.onCall(c);c.groupTransport=true;
const vsav=game.engines.find(e=>e.kind==='VSAV'&&e.status==='ready');game.selectIncident(c.id);assert(!game.engageUnits([vsav.id]));
const step=()=>{game.state.minute+=.25;game.tickEngines(.25);};
for(let i=0;i<12000&&vsav.status!=='hospital';i++)step();
assert.equal(vsav.status,'hospital');assert(c.patients.every(p=>p.evacuated&&p.assignedTo===vsav.id));assert.equal(c.evacuated,2);assert.equal(vsav.kits,1);assert.equal(vsav.transportAt-vsav.hospitalArrivedAt,20);
for(let i=0;i<6000&&c.status!=='closed';i++)step();assert.equal(c.status,'closed');assert(c.patients.every(p=>p.deliveredAt!=null));
console.log('PASS transport groupé joué : un seul VSAV pour deux légers, remise allongée');
