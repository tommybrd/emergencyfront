import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=Number(process.env.TEST_SEED||23);Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,perimeters,roadClearance}=game;
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
state.schedule=[];state.shiftEnd=100000;
const c={id:501,type:'AVP',templateId:'avp-collision',extricationChance:0,name:'Collision entre deux voitures',requires:'VSAV',at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);
const target=(process.env.TEST_TARGET||'140,95').split(',').map(Number);
// Keep the incident props and the road assignment at the same location.
Object.assign(c,{target,accessTarget:target,actionPoint:target,duration:35,victimCount:1,patients:[{severe:false,evacuated:false,assignedTo:null,transportRequired:true}]});
const hazard=game.hazards.get(c.id);hazard.position.set(target[0],.15,target[1]);
selectIncident(c.id);assert.equal(engageUnits(['VSAV 1']),null);
const ambulance=engines.find(e=>e.id==='VSAV 1');let moving=false,workers=false,loaded=false,held=false,cleaned=false,finished=false;
for(let i=0;i<16000;i++){
 state.minute+=.25;tickEngines(.25);
 const record=roadClearance.records.get(c.id),job=c.roadCleanup;
 moving||=roadClearance.vehicles().some(v=>v.path&&Math.hypot(v.model.position.x-367,v.model.position.z-122)>20);
 workers||=record?.workers.some(w=>w.visible);loaded||=record?.cargo?.parent===record?.vehicle?.model;
 held||=!!(c.siteCompletedAt&&job&&!job.reopenRequested&&perimeters.records.get(c.id)?.active);
 cleaned||=!!record?.debris.some(d=>!d.visible);
 assert(roadClearance.vehicles().length<=2);
 const models=game.vehicleObstacles().filter(m=>m.visible!==false);
 for(let a=0;a<models.length;a++)for(let b=a+1;b<models.length;b++)assert(!overlaps(footprint(models[a]),footprint(models[b])),`Vehicles never overlap: ${models[a].name}/${models[b].name}`);
 if(job?.phase==='done'&&c.status==='closed'&&ambulance.status==='ready'){finished=true;break;}
}
if(!finished)console.log(JSON.stringify({job:c.roadCleanup,records:[...roadClearance.records.values()].map(r=>({phase:r.job.phase,cargo:!!r.cargo,board:r.boarding,loaded:r.loaded,workAt:r.workAt,workers:r.workers.map(w=>w.position)})),perimeters:[...perimeters.records.values()].map(r=>({phase:r.phase,active:r.active})),vehicles:game.roadVehicles().concat(roadClearance.vehicles()).filter(v=>v.path).map(v=>({id:v.id,p:v.model.position,yaw:v.model.rotation.y,wait:v.controlWaiting,blocked:v.trafficWaiting,path:v.path?.slice(v.segment,v.segment+3)}))},null,2));
assert(finished,'Two wrecks recovered, debris cleared, cordon removed and tow truck back at depot');assert(moving&&workers&&loaded&&held&&cleaned);
assert.equal(c.roadCleanup.removed,2);assert.equal(hazard.parent,null);assert.equal(roadClearance.records.size,0);assert.equal(roadClearance.vehicles().length,0);
assert(!state.logs.some(l=>l.message.includes('repositionnement')),'Recovery crews must not force vehicle teleportation');
assert(!state.logs.some(l=>/dépann|dégager la chaussée|récupération des véhicules|chaussée nettoyée/i.test(l.message)),'Tow-truck operations remain visual and do not create radio communications');
assert(c.closedAt<c.roadCleanup.completedAt,'Municipal work does not delay mission credit or hospital handover');
console.log('PASS automatic road recovery, physical tow trips, retained wrecks, workers, gradual debris cleanup, cordon handover and no vehicle overlaps');
