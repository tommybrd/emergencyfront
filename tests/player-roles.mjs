import {smurNotificationPanel} from '../dist/smur-regulation.js';
import assert from 'node:assert/strict';
import './game-environment.mjs';
import {ROLES,handles,ownEngine,engageRefusal,roleRefusal,chooseRole,loadRole,saveRole,playerRuns,agresChoices,rolePicker,ANY_ENGINE} from '../dist/player-role.js';
import {reinforcementKinds,AI_DISPATCH_SECONDS,PLAYER_SCENE_SECONDS} from '../dist/role-ai.js';
import {agresPhase,agresPose,agresPanel} from '../dist/agres-view.js';
import {shiftBriefHtml} from '../dist/shift-briefing.js';
import {crewLeader} from '../dist/crew-identity.js';

// Répartition des postes : sans rôle, le joueur garde tout ; chaque rôle ne garde que son périmètre.
{
 assert.deepEqual(Object.keys(ROLES),['salle','caserne','agres']);
 assert(['qualify','dispatch','recall','scene','police','smur'].every(job=>handles({role:null},job)),'Old guards keep every control');
 assert(handles({role:'salle'},'qualify')&&handles({role:'salle'},'police')&&!handles({role:'salle'},'scene')&&!handles({role:'salle'},'recall'));
 assert(!handles({role:'caserne'},'dispatch')&&handles({role:'caserne'},'recall')&&!handles({role:'caserne'},'qualify')&&!handles({role:'caserne'},'police'));
 assert(handles({role:'agres'},'scene')&&!handles({role:'agres'},'dispatch'));
 const own={id:'FPT 1'},south={id:'FPTL Sud',localVolunteer:true,external:true,mutualAid:true};
 assert(ownEngine(own)&&!ownEngine(south));
 assert.equal(engageRefusal({role:null},[south]),null);assert.equal(engageRefusal({role:'salle'},[south]),null);
 assert.match(engageRefusal({role:'caserne'},[own]),/CODIS déclenche/);assert.match(engageRefusal({role:'caserne'},[own,south]),/CODIS déclenche/);
 assert.match(engageRefusal({role:'agres'},[own]),/CODIS décide/);
 const button=selector=>({closest:s=>s.split(',').includes(selector)?{}:null});
 assert.equal(roleRefusal({role:null},button('[data-nozzle]')),null);
 assert.match(roleRefusal({role:'salle'},button('[data-nozzle]'),own),/chefs d’agrès IA/);
 assert.equal(roleRefusal({role:'agres',playerEngine:'FPT 1'},button('[data-nozzle]'),own),null,'My own engine obeys me');
 assert.match(roleRefusal({role:'agres',playerEngine:'FPT 1'},button('[data-nozzle]'),{id:'VSAV 1'}),/propre chef d’agrès/);
 assert.match(roleRefusal({role:'caserne'},button('[data-answer]')),/opérateurs/);assert.match(roleRefusal({role:'caserne'},button('[data-police]')),/salle coordonne/);
 assert(playerRuns({role:null},own));assert(!playerRuns({role:'caserne'},own));assert(!playerRuns({role:'salle'},own),'Salle delegates scenes by default');assert(playerRuns({role:'salle',salleScene:true},own),'Salle can keep the scenes');assert.equal(roleRefusal({role:'salle',salleScene:true},button('[data-nozzle]'),own),null);
}
// Le choix du poste se retient d'une garde à l'autre et n'apparaît dans le brief que si on le demande.
{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 assert.equal(loadRole(storage),null);saveRole('agres','VSAV 1',storage);assert.deepEqual(loadRole(storage),{role:'agres',engine:'VSAV 1'});saveRole('salle',ANY_ENGINE,storage,true);assert.equal(loadRole(storage).scene,true);assert(rolePicker('salle',[],ANY_ENGINE,true).includes('id="roleScene" checked'));
 data.set('valmont.role','{broken');assert.equal(loadRole(storage),null);
 const s={};assert(!chooseRole(s,'pompier'));assert(chooseRole(s,'agres','VSAV 1'));assert.equal(s.playerEngine,'VSAV 1');assert(chooseRole(s,'agres',ANY_ENGINE));assert.equal(s.playerEngine,null);assert(chooseRole(s,null));assert.equal(s.role,null);
 const engines=[{id:'FPT 1',kind:'FPT'},{id:'VLCG',kind:'VLCG'},{id:'SMUR 1',kind:'SAMU',external:true}];
 assert.deepEqual(agresChoices(engines).map(e=>e.id),['FPT 1']);
 const picker=rolePicker('caserne',engines);for(const id of Object.keys(ROLES))assert(picker.includes(`value="${id}"`));assert(/value="caserne" checked/.test(picker));assert(picker.includes('Tous'));assert(!picker.includes('value="VLCG"'));
 const brief=shiftBriefHtml({minute:480,shiftStart:480},picker);assert(brief.includes('rolePicker'));assert(!shiftBriefHtml({minute:480,shiftStart:480}).includes('rolePicker'));
}
// Le CODIS déclenche tous les centres sans attendre le chef de caserne.
{
 assert.deepEqual(reinforcementKinds({reconComplete:false},[]),[]);
 const c={id:1,reconComplete:true,type:'SUAP',patients:[{severe:false}]};assert.deepEqual(reinforcementKinds(c,[]),['VSAV']);
}
// Le personnage suit les étapes : montée à pied, cabine, puis scène.
{
 const model={position:{x:10,z:20}},c={id:1,target:[10,60],address:'Rue test',reconProgress:.5};
 assert.equal(agresPhase(null,null),'attente');assert(agresPose(null,null,0).visible);
 const e={id:'FPT 1',status:'departing',model,alertAt:0,boarding:[{delay:1,duration:3,path:[[0,0],[10,0]]}]};
 assert.deepEqual(agresPose(e,c,2).point,[5,0]);assert.equal(agresPose(e,c,3.5).visible,false,'Inside the cab');
 e.status='enroute';assert.equal(agresPhase(e,c),'route');assert.equal(agresPose(e,c,4).visible,false);
 e.status='scene';assert.equal(agresPhase(e,c),'scene');const halfway=agresPose(e,c,5).point;assert.equal(halfway[1],27,'Walks toward the fire during reconnaissance');
 c.reconProgress=0;assert.match(agresPanel({agresChoice:'FPT 1'},e,c,[e]),/Partir en reconnaissance/);
 c.reconProgress=.4;assert.match(agresPanel({agresChoice:'FPT 1'},e,c,[e]),/40 %/,'Crew already started without me');
 c.reconLaunched=true;c.reconComplete=true;assert.match(agresPanel({agresChoice:'FPT 1'},e,c,[e]),/Transmettre le bilan/);
 c.bilanSent=true;assert(!agresPanel({agresChoice:'FPT 1'},e,c,[e]).includes('Transmettre'));
}
console.log('PASS postes de jeu : périmètres, refus, mémoire du choix, délais de la salle, étapes du chef d’agrès');

let seed=23;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');const s=game.state;
s.schedule=[];s.nextMaintenanceAt=Infinity;s.policePlan=[];s.preventionDone=Array.from({length:4000},(_,i)=>String(i));s.surveillancePlan=[];s.training=true;
const call=(id,extra={})=>{const c={id,type:'SUAP',catalogId:'sap-malaise-commerce',name:'Malaise',setting:'sidewalk',scene:'patient',requires:'VSAV',casualties:'single',severity:0,at:s.minute,status:'waiting',duration:12,progress:0,allowComplications:false,...extra};s.calls.push(c);game.onCall(c);c.target=[-60,120];return c;};
const run=(until,limit=4000)=>{for(let i=0;i<limit&&!until();i++)game.advanceSimulation(.25);};
const engaged=c=>game.engines.filter(e=>e.call===c.id);

// Chef d'agrès sur « tous » : la salle déclenche, je pars, la reconnaissance m'attend, le bilan débloque les renforts.
s.incoming.length=0;s.calls.length=0;game.advanceSimulation(.25);s.calls.length=0;for(const e of game.engines)assert.equal(e.call??null,null,'Test starts with a free fleet');
s.minute=10*60;chooseRole(s,'agres',ANY_ENGINE);
{
 const c=call(80);assert.match(game.engageUnits([game.engines.find(e=>e.kind==='VSAV'&&e.status==='ready').id]),/CODIS décide/,'The player cannot dispatch');
 run(()=>s.playerEngine);assert(s.playerEngine,'Next triggered engine becomes mine');const mine=game.engines.find(e=>e.id===s.playerEngine);assert.equal(mine.call,c.id);
 const card=document.getElementById('captainCard'),name=document.getElementById('captainName'),chief=crewLeader(mine,s);assert(chief,'A crew chief leads my engine');
 card.onclick();assert.equal(name.textContent,`${chief.grade} ${chief.name}`,'Card shows the crew chief, not the commander');assert.match(card.title,new RegExp(`suivre ${mine.id}`));
 run(()=>mine.status==='scene',12000);assert.equal(mine.status,'scene');run(()=>false,8);assert.equal(c.reconProgress||0,0,'Reconnaissance waits for the player');assert(c.reconHeld);
 game.agresAction('recon');assert(c.reconLaunched);run(()=>c.reconComplete,800);assert(c.reconComplete);
 game.agresAction('bilan');assert(c.bilanSent);assert(c.radio.some(r=>/Moyens|Renfort|bilan/i.test(r.message||r.text||'')));
 run(()=>c.status==='closed',16000);assert.equal(c.status,'closed','Crew handles the patient and closes');
 run(()=>!s.playerEngine,16000);assert.equal(s.playerEngine,null,'Free for the next departure once back');
 card.onclick();assert.equal(name.textContent,'Chef d’agrès','No named chief while waiting for a departure');
}
console.log('PASS chef d’agrès : déclenché sur le prochain engin, reconnaissance et bilan à la main, libre au retour');

// Sans réaction du chef d'agrès, l'équipage lance la reconnaissance : l'intervention ne se bloque pas.
{
 const c=call(81);run(()=>c.reconComplete,16000);assert(c.reconComplete,'Fallback reconnaissance');assert((c.playerWait||0)>=PLAYER_SCENE_SECONDS-1);
 run(()=>c.status==='closed',16000);assert.equal(c.status,'closed');run(()=>!s.playerEngine,16000);
}
console.log('PASS chef d’agrès absent : l’équipage prend le relais');

// Chef de caserne : le CODIS déclenche ses engins, le joueur ne décide pas des départs.
chooseRole(s,'caserne');
{
 const c=call(82);const own=game.engines.find(e=>e.kind==='VSAV'&&ownEngine(e)&&e.status==='ready');
 game.selectIncident(c.id);assert.match(game.engageUnits([own.id]),/CODIS déclenche/);assert.equal(own.call??null,null,'Player cannot dispatch');
 run(()=>engaged(c).length,(AI_DISPATCH_SECONDS+10)*4);assert(engaged(c).length,'CODIS engages without waiting for the chief');
 run(()=>c.status==='closed',16000);assert.equal(c.status,'closed');
}
console.log('PASS chef de caserne : départs ordonnés par le CODIS, aucun engagement à la main');

// Chef de salle : rien ne part sans lui, mais les chefs d'agrès IA mènent le feu une fois sur place.
chooseRole(s,'salle');
run(()=>false,2);assert(game.police.units.filter(v=>v.force==='PN').every(v=>v.parked&&v.model.visible&&Math.abs(v.model.position.x-(game.police.units[0].model.position.x))<1),'Salle: les unités PN restent garées devant le commissariat');
{
 const c=call(84,{type:'INC',catalogId:'inc-poubelle',name:'Feu de poubelle',scene:'bin',setting:'sidewalk',requires:'FPT',duration:14});
 run(()=>false,60);assert.equal(engaged(c).length,0,'Salle: no automatic departure');assert(!game.police.units.some(v=>v.call===c.id),'Salle: no police leaves on its own');
 const fpt=game.engines.find(e=>e.kind==='FPT'&&e.status==='ready');game.selectIncident(c.id);assert(!game.engageUnits([fpt.id]));
 run(()=>c.fireContained||(fpt.nozzles?.lance||0)>0,16000);assert((fpt.nozzles?.lance||0)>0||c.fireContained,'AI crew opens a line');
 run(()=>c.status==='closed',20000);assert.equal(c.status,'closed');
}
{const {operationsRoom}=await import('../dist/operations-room.js');const room=operationsRoom();assert(room.building&&room.eye.length===3,'La salle opérationnelle a son bâtiment');assert.equal(game.state.role,'salle');}
// Chef de salle : le SAMU s'engage directement, par le bouton de la fiche comme par l'engin de la colonne.
{
 const c=call(85,{type:'SUAP',catalogId:'sap-inconscient',name:'Personne inconsciente',vitalDistressConfirmed:true,victimCount:1,patients:[{severe:true,health:65,evacuated:false,assignedTo:null,transportRequired:true}]});
 game.selectIncident(c.id);
 const smur=game.engines.find(e=>e.kind==='SAMU'&&e.status==='ready'&&!e.doctorAway);assert(smur,'A SMUR team is free');
 assert.equal(game.engageUnits([smur.id]),null,'Salle engages the SMUR from the column');assert.equal(smur.call,c.id);
 const other=game.engines.find(e=>e.kind==='SAMU'&&e.status==='ready'&&!e.doctorAway&&e.call==null);
 const d=call(86,{type:'SUAP',catalogId:'sap-inconscient',name:'Personne inconsciente',vitalDistressConfirmed:true,victimCount:1,patients:[{severe:true,health:65,evacuated:false,assignedTo:null,transportRequired:true}]});
 game.selectIncident(d.id);if(other){assert.equal(game.notifySmur(d),null,'Salle button engages directly');assert.equal(other.call,d.id);}
 const e3=call(87,{type:'SUAP',catalogId:'sap-inconscient',name:'Personne inconsciente',vitalDistressConfirmed:true,victimCount:1,patients:[{severe:true,health:65,evacuated:false,assignedTo:null,transportRequired:true}]});
 const free=game.engines.filter(e=>e.kind==='SAMU'&&e.status==='ready'&&!e.doctorAway&&e.call==null);
 game.selectIncident(e3.id);if(free.length){const pick=free.at(-1);assert.equal(game.notifySmur(e3,pick.id),null,'Salle chooses the SMUR vehicle');assert.equal(pick.call,e3.id);game.returnEngine(pick);assert.notEqual(pick.call,e3.id,'Salle can disengage the SMUR');assert.equal(pick.status,'returning');}
 assert(smurNotificationPanel(e3,true,['SMUR 1','SMUR 2']).includes('Engager SMUR 2'),'One button per free SMUR team');
}
// Le SAMU s'engage aussi sur un feu d'appartement sans victime connue.
{
 const f=call(87,{type:'INC',catalogId:'inc-appartement',name:'Feu d’appartement',scene:'apartment',setting:'tower',requires:'FPT',duration:14});
 game.selectIncident(f.id);const team=game.engines.find(e=>e.kind==='SAMU'&&e.status==='ready'&&!e.doctorAway&&e.call==null);
 if(team){assert.equal(game.engageUnits([team.id]),null,'Salle engages the SAMU on a fire without known victims');assert.equal(team.call,f.id);}
}
console.log('PASS chef de salle : départs à la main, intervention menée par le chef d’agrès IA');
