import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {vehicle,medicalResponder} from '../dist/models.js';
import {signalPanel,vehicleConsole as consoleFor} from '../dist/vehicle-console.js';
import {agresPanel} from '../dist/agres-view.js';
import {callLead,playerLeads,playerRuns} from '../dist/player-role.js';
import {capability} from '../dist/operations.js';
import {salleSpec,salleCallOf} from '../dist/salle-vehicle.js';
import {tickExtrications,extricationStatus} from '../dist/extrication.js';
import {remainingRouteDistance,smoothRoute} from '../dist/route3d.js';
import {sirenViewGain,sirenScheduleScale} from '../dist/audio.js';
import {formatRadio} from '../dist/radio-voice.js';
import {reserveParking} from '../dist/parking.js';
import {locateIncident} from '../dist/incident-location.js';
import {installAmberEffects,updateAmberEffects,installRotaryBeacons,installBlueLedEffects,updateBlueLedEffects} from '../dist/rotary-beacons.js';
import {setNozzle,setLanceFlow,nozzleLimit,tickWater,initWater,tickEquipment,stow} from '../dist/hydraulics.js';
import {dynamicTube} from '../dist/dynamic-tube.js';
import {supplyCrew} from '../dist/supply-crew.js';
import {recallButtonState,cancelVolunteer,volunteerPanel,requestVolunteers,tickVolunteers,volunteerPool} from '../dist/reinforcements.js';
import {createShift} from '../dist/sim.js';
import {createTrafficControl} from '../dist/traffic-control.js';
import {vehicleConsole,lancePopup} from '../dist/vehicle-console.js';
const world=new T.Scene(),model=vehicle(world,'FPT'),engine={id:'FPTSR',kind:'FPT',model,size:6,status:'scene'};
const parking=reserveParking(engine,{type:'INC',target:[250,160],accessTarget:[250,160],actionPoint:[250,169]},[engine]);assert(Math.hypot(parking.target[0]-250,parking.target[1]-169)<40,'Park near the incident, not at the start of a long road');assert(parking.target[1]>160,'Prefer the incident side of the road');
for(let i=0;i<12;i++){const c={id:i,type:'INC',name:'Feu',setting:'tower',target:[0,0]};locateIncident(c,()=>i/12);const slot=reserveParking(engine,c,[engine]);assert(Math.hypot(slot.target[0]-c.actionPoint[0],slot.target[1]-c.actionPoint[1])<75,'Building access remains close while leaving intersections clear');}
assert.equal(remainingRouteDistance([3,0],[[0,0],[10,0],[10,20]],1),27);assert.equal(remainingRouteDistance([10,12],[[0,0],[10,0],[10,20]],2),8);assert.equal(remainingRouteDistance([0,0],null),null);
assert.equal(sirenViewGain(30,{x:0,y:0,z:0}),1);assert(sirenViewGain(30,{x:1.3,y:0,z:0})<=.04);assert(sirenViewGain(30,{x:0,y:0,z:0},true)<.1);assert.equal(sirenViewGain(400,{x:0,y:0,z:0}),0);assert.equal(sirenScheduleScale(12*60),1);assert(sirenScheduleScale(23*60)<.5);assert(sirenScheduleScale(6*60)<.5);
assert.equal(formatRadio(12,'VSAV 1','Sur les lieux. Reconnaissance en cours.'),'Centre de secours, ici VSAV 1, intervention 12. Sur les lieux. Reconnaissance en cours.');
assert.equal(formatRadio(12,'VSAV 1','prend le départ — en route sur les lieux.'),'Centre de secours, ici VSAV 1, intervention 12. Départ, en route sur les lieux.');
const medic=medicalResponder(world);assert(!medic.userData.interventionHelmet?.visible,'SAP responder starts without a helmet');assert.equal(medic.userData.uniform,'ssuap');
const ambulance=vehicle(world,'VSAV');installBlueLedEffects(ambulance);updateBlueLedEffects(ambulance,true,20,true);assert(ambulance.userData.blueLedEffects.lamps.some(l=>l.glow.visible));assert(ambulance.userData.blueLedEffects.lamps.some(l=>!l.glow.visible),'LED modules alternate instead of one global flash');
const light=vehicle(world,'FPT',undefined,{lightPump:true});installRotaryBeacons(light);installAmberEffects(light);assert.equal(light.userData.rotaryBeacons.length,2);assert(light.userData.beacons.every(l=>l.geometry.type==='CylinderGeometry'));assert.equal(light.userData.rearAmber.length,8);
const amberConsole=vehicleConsole({kind:'FPT',status:'scene',model:light,capacity:2000,water:2000,crew:4,nozzles:{lance:0}});assert(amberConsole.includes('data-amber-mode="off"'));assert(amberConsole.includes('>OFF</button>'));assert(!/data-amber(?:\s|=)/.test(amberConsole),'No redundant amber toggle above the pattern row');
updateAmberEffects(light,true,'alternate',1000,true);assert(light.userData.amberEffects.beam.visible);assert(light.userData.amberEffects.lamps.some(l=>l.glow.visible));updateAmberEffects(light,false,'alternate',1000,true);assert(!light.userData.amberEffects.beam.visible);assert(light.userData.amberEffects.lamps.every(l=>!l.glow.visible));
// Establishment and packing reuse their geometry, with an actual reel and crew
// travelling round the chassis to a hydrant in front of the truck.
model.position.set(260,.2,27);model.rotation.y=Math.PI/2;initWater(engine);engine.hydrant={position:new T.Vector3(271,0,34)};
const visuals=supplyCrew(world,[engine]),record=visuals.records[0],geometry=record.hose.geometry;const phases=new Set(),locations=[];
for(let i=0;i<40;i++){tickEquipment(engine,.5);visuals(i);phases.add(record.phase);if(record.crew[0].visible)locations.push(record.crew[0].position.clone());assert.equal(record.hose.geometry,geometry);assert([...geometry.attributes.position.array].every(Number.isFinite));}
assert(phases.has('unloading')&&phases.has('laying')&&phases.has('connecting')&&phases.has('returning'));assert(locations.some(p=>p.distanceTo(locations[0])>5));assert(record.reel.g.visible);assert(record.hose.visible);assert(record.crew.every(p=>!p.visible));
stow(engine);tickEquipment(engine,3);visuals(41);assert(record.crew.every(p=>p.visible));tickEquipment(engine,12);visuals(50);assert(!record.group.visible);
const shift=createShift();shift.minute=22*60;const menu=volunteerPanel(shift);assert.equal((menu.match(/data-recall-level=/g)||[]).length,2);assert(menu.includes('Équipe d’astreinte'));const first=requestVolunteers(shift,1,()=>0);assert.equal(first,10);assert.equal(requestVolunteers(shift,1),0);assert.equal(requestVolunteers(shift,2,()=>0),27);assert.equal(volunteerPool(shift).length+shift.roster.length,50);shift.minute+=30;tickVolunteers(shift,()=>{});assert.equal(shift.roster.filter(p=>p.kind==='SPV'&&p.present).length,37);
// Vehicles can enter the safety disc in a queue: the leader needs the grant,
// even if a following emergency vehicle appears first in the engine array.
const lead={model:vehicle(world,'VLCG'),path:[[-5,2.1],[70,2.1]],segment:1,status:'traffic'},follower={model:vehicle(world,'VSAV'),path:[[-16,2.1],[70,2.1]],segment:1,status:'enroute'};
lead.model.position.set(-5,0,2.1);follower.model.position.set(-16,0,2.1);lead.model.rotation.y=follower.model.rotation.y=Math.PI/2;
const control=createTrafficControl([[0,0]]);control.update([follower,lead],0);assert.equal(control.reason(lead,-4,2.1),null);assert.equal(control.reason(follower,-15,2.1),null,'Same lane and exit: the follower crosses in convoy, spacing stays physical');lead.model.position.x=40;control.update([follower,lead],1);assert.equal(control.reason(follower,-15,2.1),null);
// A clear first metre must not authorize a turn that becomes blocked midway.
const turner={model:vehicle(world,'VLCG'),path:smoothRoute([[-22,2.1],[-2.1,2.1],[-2.1,60]]),segment:1,status:'traffic'},obstacle={model:vehicle(world,'VLCG'),path:null,status:'ready'};
turner.model.position.set(-22,0,2.1);turner.model.rotation.y=Math.PI/2;obstacle.model.position.set(-2.1,0,12);
const curvedControl=createTrafficControl([[0,0]]);curvedControl.update([turner,obstacle],0);assert(curvedControl.reason(turner,-17,2.1),'Wait outside a turn whose exit lane is obstructed');
obstacle.model.position.z=55;curvedControl.update([turner,obstacle],1);assert.equal(curvedControl.reason(turner,-17,2.1),null,'Grant the complete turn as soon as its path is clear');
const tube=dynamicTube(2,6);tube.points.forEach((p,i)=>p.set(0,0,i));tube.update(.1);const points=tube.geometry.attributes.position,normal=tube.geometry.attributes.normal,index=tube.geometry.index.array;const a=new T.Vector3().fromBufferAttribute(points,index[0]),b=new T.Vector3().fromBufferAttribute(points,index[1]),d=new T.Vector3().fromBufferAttribute(points,index[2]),out=new T.Vector3().fromBufferAttribute(normal,index[0]);assert(b.sub(a).cross(d.sub(a)).dot(out)>0,'Hoses have outward-facing triangles and remain visible from outside');
console.log('PASS nearby parking, remaining road distance, off-screen sirens, concise radio, helmets, FPTL and amber lamps, visible hose crew/reel, two recall groups and intersection queue leader');

for(const kind of ['EPA','CCGC','CCF'])for(const signalStyle of ['standard','round','wide']){const m=vehicle(new T.Group(),kind,undefined,{signalStyle});assert(m.userData.beacons.every(b=>b.geometry.type==='CylinderGeometry'),kind+' must not have isolated square beacons');}
console.log('PASS standalone beacons round on EPA, tankers and all forest trucks, including legacy styles');

const recallShift=createShift();recallShift.minute=9*60;
assert(requestVolunteers(recallShift,1,()=>0)>0);
assert(recallButtonState(recallShift,1).active);
assert(recallButtonState(recallShift,1).disabled);
const batchCount=recallShift.recallBatches.length;
assert.equal(requestVolunteers(recallShift,1,()=>0),0);
assert.equal(recallShift.recallBatches.length,batchCount);
assert(!recallButtonState(recallShift,2).disabled,'General recall remains available after duty recall');
cancelVolunteer(recallShift,recallShift.recallBatches[0].id);
assert(!recallButtonState(recallShift,1).disabled,'Cancelled recall can be requested again');
requestVolunteers(recallShift,1,()=>0);recallShift.minute+=30;tickVolunteers(recallShift,()=>{});
assert(recallButtonState(recallShift,1).disabled,'Recall remains marked after crew arrival');
console.log('PASS recall feedback, duplicate prevention, escalation, cancellation and arrivals');

const smallCrew={kind:'CCF',status:'scene',crew:4};initWater(smallCrew);
assert(!setNozzle(smallCrew,'large',1),'CCF: no 500 L/min lance');assert(setNozzle(smallCrew,'lance',2));
tickEquipment(smallCrew,30);tickWater(smallCrew,1);assert.equal(smallCrew.flow,500);
assert(!setNozzle(smallCrew,'lance',3),'No third line');assert(!setLanceFlow(smallCrew,0,500),'CCF lance capped at 250 L/min');assert(setLanceFlow(smallCrew,1,150));
tickWater(smallCrew,1);assert.equal(smallCrew.flow,400);
smallCrew.buildingCrew=2;tickWater(smallCrew,1);assert.equal(smallCrew.flow,0);
smallCrew.buildingCrew=0;assert.equal(nozzleLimit(smallCrew),2);
smallCrew.crew=6;assert.equal(nozzleLimit(smallCrew),2);assert(!setNozzle(smallCrew,'large',1));
smallCrew.crew=4;smallCrew.hydrant={};smallCrew.supplyProgress=.5;assert.equal(nozzleLimit(smallCrew),0);
console.log('PASS CCF: no large hose, two small or LDT + small, shared water, busy crew gating, no third line');
for(const [minute,expected] of [[7*60,1],[21*60,.42],[6*60+59,.42],[20*60+59,1]]){
 assert.equal(sirenScheduleScale(minute),expected);
 assert.equal(sirenScheduleScale(minute,'night'),.42);
 assert.equal(sirenScheduleScale(minute,'day'),1);
}
const nightConsole=vehicleConsole({kind:'VSAV',status:'ready',model:ambulance,sirenMode:'night'});
assert.match(nightConsole,/data-siren-mode="night" aria-pressed="true"/);
assert.match(nightConsole,/data-siren-mode="auto" aria-pressed="false"/);
console.log('PASS per-vehicle siren Auto/Day/Night controls and 21:00–07:00 boundaries');

for(const options of [{lightForest:true,tankCapacity:2000},{tankCapacity:4000},{tankCapacity:8000,longChassis:true}]){
 const forest={...options,kind:'CCF',status:'scene',crew:4,model:vehicle(new T.Scene(),'CCF',undefined,options)};initWater(forest);
 assert(setNozzle(forest,'lance',2));assert(!setNozzle(forest,'large',1));assert(!setNozzle(forest,'lance',3));
 const html=vehicleConsole(forest,{incident:{type:'INC'}});assert(html.includes('data-nozzle="lance"'));const popup=lancePopup(forest,{type:'INC'},0);assert(popup.includes('data-lance-flow="250"'));assert(!popup.includes('data-lance-flow="500"'));
}
console.log('PASS CCFL, CCFM and CCFS consoles expose only LDT and small hoses with two-line capacity');

for(const kind of ['SAMU','POLICE']){const panel=signalPanel({kind,beacons:true,siren:false,sirenMode:'night'},{prefix:'data-unit-'});assert.match(panel,/data-unit-blue/);assert.match(panel,/data-unit-siren-once/);assert.match(panel,/data-siren-mode="night" aria-pressed="true"/,`${kind} a le réglage de volume jour/nuit`);}
console.log('PASS pupitre SAMU et police : bleus, sirène, appel et volume');

{const vsr={id:'VSR',kind:'VSR',call:7,status:'scene',crew:3},call={id:7,status:'open',reconComplete:true,extrication:{patient:0,progress:0,approach:0,packing:0,unitId:null,done:false},patients:[{trapped:true}]},said=[];
 tickExtrications([call],[vsr],1,(c,u,m)=>said.push(m),()=>true);assert.equal(call.extrication.progress,0,'désincarcération attend l’ordre du joueur');assert.match(extricationStatus(call),/à lancer/);
 call.extrication.ordered=true;tickExtrications([call],[vsr],7,(c,u,m)=>said.push(m),()=>true);tickExtrications([call],[vsr],3,(c,u,m)=>said.push(m),()=>true);assert(call.extrication.progress>0,'ordre donné : l’opération progresse');
 const auto={extrication:{patient:0,progress:0,approach:0,packing:0,unitId:null,done:false},id:8,status:'open',reconComplete:true,patients:[{trapped:true}]};tickExtrications([auto],[{...vsr,call:8}],7,()=>{},null);assert.equal(auto.extrication.ordered,true,'sans poste imposé : lancement automatique');}
console.log('PASS désincarcération sur ordre du joueur');

{const e={id:'FPTSR',kind:'FPT',status:'scene',call:3,capacity:3000,water:3000,nozzles:{lance:2},hoses:[{index:0,flow:250},{index:1,flow:250}],crew:6,model:{position:{x:0,z:0}}},c={id:3,type:'INC',reconComplete:true,accessClosed:true,victimCount:1,reconLaunched:true,reconProgress:1,siteCompletedAt:null,target:[10,10]};
 const html=agresPanel({agresChoice:'FPTSR'},e,c,[e]);
 assert.match(html,/data-agres="access"/,'chef d’agrès : ouvrir la porte');assert.match(html,/data-agres-lance="1"/,'chef d’agrès : réglage de chaque binôme');assert.match(html,/data-agres="console"/,'chef d’agrès : commandes de l’engin');assert.match(html,/data-agres="walk"/,'chef d’agrès : déplacer son personnage');assert.match(html,/data-agres="reinforce"/,'chef d’agrès : renforts à volonté');}
console.log('PASS poste chef d’agrès : porte, binômes, déplacement, renforts');

{const mk=(id,kind,status,since)=>({id,kind,call:5,status,sceneSince:since,capacity:kind==='FPT'?3000:0,nozzles:{lance:0},hoses:[],crew:4,model:{position:{x:0,z:0}}}),c={id:5,type:'INC',reconComplete:false,siteCompletedAt:null,target:[0,0]};
 const fpt=mk('FPT 1','FPT','scene',3),vsav=mk('VSAV 1','VSAV','scene',1),vlcg=mk('VLCG','VLCG','enroute');
 assert.equal(callLead(c,[fpt,vsav]).id,'VSAV 1','le premier arrivé est référent');
 assert.equal(callLead(c,[fpt,vsav,vlcg]).id,'VLCG','le VLCG dirige dès qu’il est engagé');
 const s={role:'agres',playerEngine:'FPT 1'};assert.equal(playerLeads(s,c,[fpt,vsav]),false);assert.equal(playerLeads(s,c,[fpt]),true,'référent : prend la direction');
 assert.doesNotMatch(agresPanel(s,fpt,c,[fpt,vsav,vlcg]),/data-agres="recon"/,'sous les ordres du VLCG : pas de reconnaissance à lancer');
 assert.match(agresPanel(s,fpt,c,[fpt]),/data-agres="recon"/,'référent : reconnaissance à lancer');}
console.log('PASS direction de l’intervention : VLCG ou référent');

{const e={id:'VSAV 1',kind:'VSAV',status:'scene',call:9,nozzles:{lance:0},hoses:[],crew:3,model:{position:{x:0,z:0}}},c={id:9,type:'SAP',name:'Malaise',reconComplete:true,victimCount:1,siteCompletedAt:null,target:[0,0]};
 const tabs={ticket:'<section>TICKET-OK</section>',bilan:'<section>BILAN-OK</section>',moyens:'<section>MOYENS-OK</section>'};
 const home=agresPanel({agresChoice:'VSAV 1'},e,c,[e],{tabs,tab:'actions',clock:'12:34'});
 assert.match(home,/TABLETTE CA/);assert.equal((home.match(/data-agres-tab=/g)||[]).length,4,'quatre onglets');assert.match(home,/data-agres="console"/);
 const bilan=agresPanel({agresChoice:'VSAV 1'},e,c,[e],{tabs,tab:'bilan'});assert.match(bilan,/BILAN-OK/);assert.doesNotMatch(bilan,/data-agres="console"/,'onglet bilan : écran dédié');assert.match(bilan,/VSAV 1/,'en-tête conservé');
 assert.doesNotMatch(agresPanel({agresChoice:'VSAV 1'},null,null,[],{tabs}),/data-agres-tab/,'pas d’onglets sans intervention');}
console.log('PASS tablette du chef d’agrès : onglets intervention, ticket, bilan, moyens');

{const e={id:'VSAV 1',kind:'VSAV',status:'scene',call:9,nozzles:{lance:0},hoses:[],crew:3,model:{position:{x:0,z:0}}},c={id:9,type:'SAP',name:'Malaise',reconComplete:true,victimCount:1,siteCompletedAt:null,target:[0,0]};
 const html=agresPanel({agresChoice:'VSAV 1'},e,c,[e],{status:'Sur les lieux (SLL)'});assert.match(html,/data-agres="status"[^>]*>📻 Sur les lieux \(SLL\)/,'statut à transmettre par le chef d’agrès');
 assert.doesNotMatch(agresPanel({agresChoice:'VSAV 1'},e,c,[e],{}),/data-agres="status"/);}
console.log('PASS statuts radio transmis par le chef d’agrès');

{const e={id:'FPTL 1',kind:'FPT',status:'scene',call:9,nozzles:{lance:0},hoses:[],crew:4,model:{position:{x:0,z:0}}},c={id:9,type:'INC',name:'Feu',reconComplete:true,siteCompletedAt:null,target:[0,0]};
 const html=agresPanel({agresChoice:'FPTL 1'},e,c,[e],{radio:{text:'Moyens suffisants.',count:2}});assert.match(html,/Message radio \(2\) : « Moyens suffisants. »/);assert.match(html,/data-agres="radio"/,'message radio retenu à transmettre');}
console.log('PASS messages radio du chef d’agrès retenus pour transmission');

{const car={...salleSpec(),status:'ready'},fire={id:4,type:'INC',status:'active'},visit={id:5,type:'OD',prevention:true};
 assert.equal(car.kind,'VLCS');assert.notEqual(car.kind,'VLCG','voiture du chef de salle distincte du VLCG');
 assert.equal(capability(car,fire),null,'VL CODIS réservé au chef de salle');car.salleActive=true;assert.equal(capability(car,fire),'command');assert.equal(capability(car,visit),null,'pas de déplacement sur une mission non urgente');
 const fpt={id:'FPT 1',call:4},other={id:'VSAV 1',call:6},s={role:'salle',salleScene:false};
 assert.equal(salleCallOf(s,[{...car,status:'enroute',call:4}]),null,'en route : les chefs d’agrès gardent la main');s.salleCall=salleCallOf(s,[{...car,status:'scene',call:4}]);
 assert.equal(s.salleCall,4);assert(playerRuns(s,fpt),'sur place : le chef de salle mène cette intervention');assert(!playerRuns(s,other),'les autres interventions restent aux chefs d’agrès IA');}
console.log('PASS VL CODIS : voiture du chef de salle, distincte du VLCG, conduite de l’intervention une fois sur place');
