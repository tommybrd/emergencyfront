import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {vehicle} from '../dist/models.js';
import {assignSector,coordination,tickFireFront} from '../dist/incident-coordination.js';
import {createInterior,updateInterior} from '../dist/interior-scene.js';
import {animateContainer} from '../dist/support-vehicles.js';
import {withSimulationRandom} from '../dist/guard-campaign.js';
const c={id:501,type:'INC',requires:'CCF',progress:0,spread:.6},pc={id:'PC',kind:'PC',call:501,status:'scene',crew:2},pump={id:'FPT',kind:'FPT',capacity:3000,call:501,status:'scene',crew:6,flow:0};
assert(assignSector(c,pump,'contain',[pc,pump]));assert.equal(coordination(c,[pc,pump]).containment,1,'dry engine offers no protection');pump.flow=250;assert(coordination(c,[pc,pump]).containment<1);pc.status='returning';assert.equal(coordination(c,[pc,pump]).containment,1);assert(!assignSector(c,pump,'attack',[pc,pump]));
tickFireFront(c,20,{key:'wind',windDirection:Math.PI/2});assert(c.fireFront.downwind>c.fireFront.flank);assert(c.fireFront.flank>c.fireFront.upwind);assert.equal(c.fireFront.direction,Math.PI/2);const front=structuredClone(c.fireFront);c.fireContained=true;tickFireFront(c,20,{key:'wind'});assert.deepEqual(c.fireFront,front);
const root=new T.Group(),carrier={model:vehicle(root,'VPCE'),containerProgress:1};animateContainer(carrier);assert.equal(carrier.model.userData.container.position.z,-6.2);assert(Math.abs(carrier.model.userData.container.rotation.x)<1e-9);carrier.containerProgress=0;animateContainer(carrier);assert.equal(carrier.model.userData.container.position.length(),0);
const building={id:8,target:[10,20],site:{width:14,depth:12,yaw:.5},cutaway:true,reconComplete:true};const room=createInterior(root,building);updateInterior(room,building,[{kind:'FPT',crew:6,workActive:true}]);assert(room.responders.every(p=>p.visible));building.cutaway=false;updateInterior(room,building,[]);assert(!room.root.visible);assert(!room.responders.some(p=>p.visible));assert(room.responders.every(p=>!p.userData.interventionHelmet),'medical interior crews have no helmet');
const a={dayPlan:{seed:77}},b={dayPlan:{seed:77}};const random=s=>withSimulationRandom(s,'simulation',()=>Array.from({length:10},()=>Math.random()));assert.deepEqual(random(a),random(b));const saved=structuredClone(a);assert.deepEqual(random(a),random(saved),'saved stream continues');
const game=await import('../dist/scene.js');game.state.campaign=true;game.state.schedule=[];game.state.nextMaintenanceAt=Infinity;
const inherited={id:502,type:'INC',name:'Feu de maison',requires:'FPT',scene:'house',setting:'house',handover:true,at:game.state.minute,status:'waiting',progress:0,duration:80};game.state.calls.push(inherited);game.onCall(inherited);assert(inherited.handoverUnits?.length);assert(inherited.reconComplete);assert(inherited.firstArrival<game.state.minute);for(const id of inherited.handoverUnits){const e=game.engines.find(e=>e.id===id);assert.equal(e.status,'scene');assert(e.crew>0);assert(e.model.position.distanceTo(new T.Vector3(...[e.parking.target[0],.2,e.parking.target[1]]))<.01);}
console.log('PASS sectors require PC and flowing water, directional fire, container movement, interior visibility, reproducible streams, inherited crews already on site');
const idx=game.district.block.buildings.findIndex(b=>Math.hypot(b.x-inherited.target[0],b.z-inherited.target[1])<1);assert(idx>=0);game.extraFeatures.action(inherited,'cutaway');game.extraFeatures.visuals(20,false);assert.equal(game.district.buildings[idx].visible,false);game.extraFeatures.action(inherited,'cutaway');game.extraFeatures.visuals(21,false);assert.equal(game.district.buildings[idx].visible,true);console.log('PASS actual building shell hides and restores with cutaway');

// A departed access crew must never leave the medical action permanently disabled.
const accessCall={id:503,type:'SUAP',name:'Malaise à domicile',requires:'VSAV',scene:'house',setting:'house',at:game.state.minute,status:'active',progress:0,duration:20};game.state.calls.push(accessCall);game.onCall(accessCall);accessCall.reconComplete=true;accessCall.accessClosed=true;
const ambulances=game.engines.filter(e=>e.kind==='VSAV'&&!e.external).slice(0,2);for(const e of ambulances){e.call=503;e.status='scene';e.crew=3;}
game.extraFeatures.options.guidance=false;assert(game.extraFeatures.panel(accessCall).includes('Accès fermé · prise en charge en attente'));
game.extraFeatures.action(accessCall,'access');assert(accessCall.accessTask);const assigned=game.engines.find(e=>e.id===accessCall.accessTask.unit);assigned.status='returning';game.extraFeatures.tick(0);assert.equal(accessCall.accessTask,null);assert(game.extraFeatures.gates(accessCall,ambulances[1]));
game.extraFeatures.action(accessCall,'access');assert(accessCall.accessTask);game.state.minute+=4;game.extraFeatures.tick(4);assert.equal(accessCall.accessClosed,false);assert(!game.extraFeatures.gates(accessCall,ambulances[1]));
console.log('PASS blocked medical access is explained without guidance; interrupted opening can restart with another crew and release treatment');

// Emergency abandonment frees only the selected mission, including deployed kit.
const {dayResult,timeline}=await import('../dist/guard-campaign.js');
const {objectiveResult}=await import('../dist/reinforcements.js');
const stranded={id:504,type:'INC',name:'Feu bloqué',requires:'FPT',scene:'house',setting:'house',at:game.state.minute,status:'waiting',progress:0,duration:50};game.state.calls.push(stranded);game.onCall(stranded);
const committed=game.state.completed,otherCall=inherited.status;
const resetUnits=game.engines.filter(e=>['FPT','EPA','VSAV','VLI'].includes(e.kind)&&!e.external);
for(const e of resetUnits){e.call=504;e.status='scene';e.crew=e.size;e.hydrant=game.district.hydrants[0];e.supplyProgress=.7;e.escortVehicle='blocked';e.longSupplyTarget='blocked';e.containerProgress=1;e.model.position.set(5,.2,5);if(e.capacity)e.water=0;if(e.aerial)e.aerial.mode='rescue';}
const patient={assignedTo:resetUnits.find(e=>e.kind==='VSAV').id,trapped:true,evacuated:false};stranded.patients=[patient];
assert(game.abandonIncident(stranded));assert(!game.abandonIncident(stranded),'idempotent');
assert.equal(game.state.completed,committed);assert(stranded.abandoned);assert.equal(inherited.status,otherCall);
assert.equal(objectiveResult(stranded).finish,false);assert(timeline(stranded).includes('Abandon'));
assert.equal(dayResult({calls:[stranded],shiftStart:0}).completed,0);assert(!patient.evacuated);assert.equal(patient.deliveredAt,undefined);
for(const e of resetUnits){assert.equal(e.call,null);assert.equal(e.path,null);assert.equal(e.crew,0);assert.equal(e.hydrant,null);assert.equal(e.longSupplyTarget,null);assert.equal(e.escortVehicle,null);assert.equal(e.model.position.x,e.home[0]);assert.equal(e.model.position.z,e.home[1]);assert.equal(e.status,e.capacity?'refilling':'ready');if(e.aerial)assert.equal(e.aerial.mode,null);}
assert(!game.hazards.has(504));assert(!game.fireEffects.has(504));
console.log('PASS emergency abandonment: own units reset, dry engines refill, no invented rescue/success, other missions intact, repeat safe');
