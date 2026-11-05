import assert from 'node:assert/strict';
import './game-environment.mjs';
import {planSurveillance,dueSurveillance,tickSurveillance,surveillanceStatus,EVENTS} from '../dist/surveillance.js';
import {dueHydrantRounds,completeRound,tickRepairs,revealFault,REPAIR_MINUTES,ROUND_RADIUS} from '../dist/hydrant-care.js';
import {validateSupply,hydrantPresent} from '../dist/water-supply.js';
import {planSpecialist,dueSpecialist,SPECIALIST_MISSIONS,TEAMS,holdVictims,specialtyStatus} from '../dist/specialists.js';
import {capability} from '../dist/operations.js';

// Surveillance : plan stable sans hasard partagé, préavis, incidents, score de présence.
{
 const s={citySeed:5,shiftStart:480,shiftEnd:1920,minute:480},before=Math.random;let draws=0;Math.random=()=>{draws++;return before();};
 const plan=planSurveillance(s);Math.random=before;assert.equal(draws,0);assert.deepEqual(plan,planSurveillance(s));assert(plan.length>=1&&plan.length<=2);
 assert(plan.every(p=>p.noticeAt<p.from&&p.incidents.every(t=>t>p.from&&t<p.to)));
 s.minute=plan[0].noticeAt;const [c]=dueSurveillance(s);assert(c.prevention&&c.surveillance);assert.equal(dueSurveillance(s).length,0,'Announced once');
 assert.equal(capability({kind:'VSAV'},c),'resolve');assert.equal(capability({kind:'CCF'},c),null);
 Object.assign(c,{id:1,status:'waiting'});
 const e={call:1,status:'scene'};let minute=c.surveillance.from,incidents=0,finished=false;
 assert.match(surveillanceStatus(c,minute-5),/prépositionner/);
 assert.match(tickSurveillance(c,[e],minute,0).messages[0].text,/en place/);
 for(;minute<=c.surveillance.to+1&&!finished;minute++){const r=tickSurveillance(c,[e],minute,1);incidents+=r.incidents.length;finished=r.finished;}
 assert(finished);assert.equal(incidents,plan[0].incidents.length);assert(c.surveillance.share>.95);
 const empty={id:2,status:'waiting',surveillance:{from:600,to:700,incidents:[],held:0}};
 assert.match(tickSurveillance(empty,[],600,1).messages[0].text,/sans moyens/);assert.match(tickSurveillance(empty,[],631,1).messages[0].text,/non tenu/);assert.equal(empty.status,'closed');
 assert(EVENTS.some(e=>e.slot==='day')&&EVENTS.some(e=>e.slot==='evening'));
}
// Poteaux : défaut invisible, découvert au raccordement ou en tournée, réparé ensuite.
{
 const mark={visible:false},bad={position:{x:10,z:0},parent:{},visible:true,userData:{hiddenFault:true,faultMarks:[mark]}},good={position:{x:20,z:0},parent:{},visible:true,userData:{}},far={position:{x:ROUND_RADIUS+50,z:0},parent:{},visible:true,userData:{hiddenFault:true}},list=[bad,good,far];
 assert(hydrantPresent(bad,list),'A hidden fault looks fine from the road');
 const e={hydrant:bad,supplyProgress:.2,model:{position:{x:10,z:0},rotation:{y:0}}};assert(validateSupply(e,list));
 e.supplyProgress=.5;assert.equal(validateSupply(e,list),false);assert(e.dryHydrant);assert.equal(e.hydrant,null);assert(!hydrantPresent(bad,list));assert(mark.visible);
 tickRepairs(list,10000);assert(!hydrantPresent(bad,list),'No repair before the crew reports it');
 const out=completeRound({hydrantRound:{center:[0,0]}},list,600);assert.match(out,/2 poteaux contrôlés/);assert.match(out,/1 hors service/);assert(far.userData.hiddenFault,'Outside the sector stays unknown');
 assert.equal(tickRepairs(list,600+REPAIR_MINUTES-1),0);assert.equal(tickRepairs(list,600+REPAIR_MINUTES),1);assert(hydrantPresent(bad,list));assert.equal(mark.visible,false);
 const s={campaign:true,shiftStart:480,citySeed:1,minute:11*60};assert.equal(dueHydrantRounds(s).length,1);assert.equal(dueHydrantRounds(s).length,0);assert.equal(dueHydrantRounds({shiftStart:480,minute:660}).length,0);
}
// Spécialités : une mission par garde, une équipe pour chaque risque.
{
 const s={citySeed:3,shiftStart:480,shiftEnd:1920,minute:480};const plan=planSpecialist(s);assert(plan.at>=600&&plan.at<1320);
 assert.deepEqual(Object.keys(TEAMS).sort(),[...new Set(SPECIALIST_MISSIONS.map(m=>m.team))].sort());
 assert.equal(dueSpecialist(s).length,0);s.minute=plan.at;assert.equal(dueSpecialist(s).length,1);assert.equal(dueSpecialist(s).length,0);
 const c={patients:[{evacuated:false}],specialty:{team:'SD'}};holdVictims(c);assert(c.patients[0].trapped);assert.match(specialtyStatus(c),/demandez SDE/);
}
console.log('PASS surveillance, poteaux et plans de spécialités');

let seed=41;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');const {state,engines}=game;
state.schedule=[];state.nextMaintenanceAt=Infinity;state.minute=9*60;state.policePlan=[];state.surveillancePlan=[];state.specialistPlan={at:Infinity,key:'x'};state.shiftEnd=100000;
const step=()=>{state.minute+=.25;game.tickEngines(.25);};
// Mission RCH : le fourgon balise, l'équipe vient de loin, la mission se termine et elle repart.
{
 const m={type:'OD',catalogId:'spe-fuite',name:'Fuite de produit chimique dans un atelier',setting:'shop',requires:'FPT',duration:20,victimCount:0,at:state.minute,allowComplications:false,specialty:{team:'RCH',done:false,progress:0},id:90,status:'waiting',progress:0,engine:null};
 state.calls.push(m);game.onCall(m);const fpt=engines.find(e=>e.kind==='FPT'&&e.status==='ready');game.selectIncident(m.id);assert(!game.engageUnits([fpt.id]));
 for(let i=0;i<8000&&fpt.status!=='scene';i++)step();assert.equal(fpt.status,'scene');
 for(let i=0;i<200;i++)step();assert.equal(m.progress,0,'No work before the team');
 assert.match(game.specialists.request(state,m).message,/arrivée dans 16 min/);assert.match(game.specialists.request(state,m).error,/déjà/);
 const team=game.specialists.units[0];
 for(let i=0;i<16000&&team.status!=='scene';i++)step();assert.equal(team.status,'scene');
 for(let i=0;i<4000&&!m.specialty.done;i++){step();const r=game.specialists.tick(m,engines,.25);if(r&&r.finished)game.finishCall(m,{id:'Centre',kind:'VLCG'});}
 assert(m.specialty.done);assert.equal(m.status,'closed');
 for(let i=0;i<16000&&!team.retired;i++)step();assert(team.retired,'Team leaves the city');
 console.log('PASS mission RCH jouée : balisage, équipe, fin, repli');
}
// Dispositif joué : VSAV prépositionné sur la plage, incident sur place, fin et remise en condition.
{
 state.minute=20*60;const from=state.minute+120,to=from+40;
 state.surveillancePlan=[{kind:'surv-feu',from,to,noticeAt:state.minute,key:'test',incidents:[from+10]}];state.surveillanceDone=[];
 state.paused=false;state.ended=false;state.speed=60;
 const run=(n=1)=>game.advanceSimulation(n);
 run(.25);
 const d=state.calls.find(c=>c.surveillance);assert(d,'Mayor request received');assert.equal(d.site?.kind,'beach');assert(state.logs.some(l=>l.message.includes('Demande du maire')));
 const vsav=engines.find(e=>e.kind==='VSAV'&&e.status==='ready');game.selectIncident(d.id);assert(!game.engageUnits([vsav.id]));
 for(let i=0;i<4000&&!state.calls.some(c=>c.fromSurveillance===d.id);i++)run(.25);
 const spawned=state.calls.find(c=>c.fromSurveillance===d.id);assert(spawned,'Incident on the event');assert.equal(vsav.status,'scene','VSAV was in place when it happened');assert(d.surveillance.staffed);
 for(let i=0;i<4000&&d.status!=='closed';i++)run(.25);assert.equal(d.status,'closed');assert(d.surveillance.share>.5,String(d.surveillance.share));assert.equal(vsav.call,null);
 console.log('PASS dispositif joué : demande du maire, prépositionnement, incident, fin');
}
// Effondrement : victime inaccessible jusqu'au SDE, puis VSAV.
{
 state.speed=60;state.minute=(Math.floor(state.minute/1440)+1)*1440+600;state.specialistPlan={at:state.minute,kind:'spe-effondrement',key:'sd'};state.specialistDone=[];state.surveillancePlan=[];
 const run=()=>game.advanceSimulation(.25);run();
 const m=state.calls.find(c=>c.specialty?.team==='SD');assert(m);assert(m.patients.every(p=>p.trapped));
 game.selectIncident(m.id);assert(!game.specialists.request(state,m).error);
 const vsav=engines.find(e=>e.kind==='VSAV'&&e.status==='ready');assert(!game.engageUnits([vsav.id]));
 for(let i=0;i<20000&&!m.specialty.done;i++)run();assert(m.specialty.done,JSON.stringify(m.specialty));assert(m.patients.every(p=>!p.trapped));
 for(let i=0;i<20000&&m.status!=='closed';i++)run();assert.equal(m.status,'closed');assert(m.patients.every(p=>p.deliveredAt!=null||p.deceased));
 console.log('PASS effondrement joué : SDE puis VSAV');
}
// Fausse alerte levée par la patrouille : aucun engin parti, appel clos sans épave.
{
 const before=state.completed;let id=0,c;
 for(id=700;id<1400;id++){c={id,seed:id,type:'AVP',casualties:'solo',status:'waiting'};const {tickAccidentPolice}=await import('../dist/police-accident.js');const r=(tickAccidentPolice({...c,victimCount:1,doubtful:true},[{id:'Police 1',call:id,status:'scene'}],[],600),tickAccidentPolice({...c,victimCount:1,doubtful:true,policeAccident:{since:590}},[{id:'Police 1',call:id,status:'scene'}],[],600));if(r.falseAlarm)break;}
 const a={id,seed:id,type:'AVP',catalogId:'avp-sortie',name:'Sortie de route',scene:'single-car',setting:'road',requires:'VSAV',casualties:'solo',duration:30,severity:.3,at:state.minute,status:'waiting',progress:0,allowComplications:false,doubtful:true};
 state.calls.push(a);game.onCall(a);a.doubtful=true;
 const patrol=game.police.units.find(v=>!v.retired&&!v.requested&&!v.call);
 for(let i=0;i<20000&&a.status!=='closed';i++)game.advanceSimulation(.25);
 assert.equal(a.status,'closed');assert(a.policeFalseAlarm);assert.equal(a.victimCount,0);assert(state.completed>before);
 console.log('PASS fausse alerte : levée de doute par la patrouille',patrol?.id??'');
}
