import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=Number(process.env.TEST_SEED||23);Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,perimeters}=game;
const {roads}=await import('../dist/roads.js');
const {planCivilian}=await import('../dist/civilian-routing.js');
const {recallCrew}=await import('../dist/crew.js');
const {footprint,overlaps,clearPlacement}=await import('../dist/vehicle-spacing.js');
state.schedule=[];state.shiftEnd=100000;recallCrew(state,1);
const c={id:1,type:'AVP',templateId:'avp-collision',extricationChance:0,name:'Collision entre deux voitures',requires:'VSAV',at:state.minute,status:'waiting',progress:0};state.calls.push(c);onCall(c);
Object.assign(c,{target:[140,95],accessTarget:[140,95],actionPoint:[140,95],duration:90,victimCount:2,patients:Array.from({length:2},()=>({severe:false,evacuated:false,assignedTo:null,transportRequired:true}))});
selectIncident(c.id);assert.equal(engageUnits(['FPTSR','VSAV 1']),null);
const units=engines.filter(e=>e.call===c.id);let active=false,protectedWait=false,recovered=false,completed=false,injected=false,heldFor=0,lateResponse=false;
for(let i=0;i<7000;i++){
 state.minute+=.25;tickEngines(.25);
 if(!injected&&units.every(e=>e.status==='scene')&&perimeters.records.get(c.id)?.active){
  const car=game.district.traffic.find(v=>clearPlacement(v.model,137.9,64,0,game.vehicleObstacles()));
  if(car){game.trafficControl.release(car);car.yielding=null;car.model.position.set(137.9,0,64);car.model.rotation.y=0;car.road=roads.find(r=>r.a[0]===140&&r.a[1]===30&&r.b[1]===160);planCivilian(car,roads,Math.random,perimeters.blockedRoads());injected=car;}
 }
 if(injected?.controlWaiting?.includes('Balisage')){heldFor+=.25;assert(injected.model.position.z<84,'Civilian cannot enter the scene after waiting 20 seconds');}
 if(heldFor>=20&&!lateResponse){assert.equal(engageUnits(['VSAV 2']),null);units.push(engines.find(e=>e.id==='VSAV 2'));lateResponse=true;}
 active||=!!perimeters.records.get(c.id)?.active;
 protectedWait||=game.roadVehicles().some(v=>v.controlWaiting?.includes('Balisage'));
 const models=game.vehicleObstacles().filter(v=>v.visible!==false);
 for(let a=0;a<models.length;a++)for(let b=a+1;b<models.length;b++)assert(!overlaps(footprint(models[a]),footprint(models[b])),'No overlaps during cordon operation');
 recovered||=state.logs.some(l=>l.message.includes('repositionnement'));
 if(c.status==='closed'&&units.every(e=>e.status==='ready')&&!perimeters.records.size){completed=true;break;}
}
if(!completed)console.log(JSON.stringify({status:c.status,records:[...perimeters.records.values()].map(r=>({phase:r.phase,active:r.active})),vehicles:game.roadVehicles().concat(units).filter(v=>v.path).map(v=>({id:v.id,status:v.status,wait:v.controlWaiting,x:v.model.position.x,z:v.model.position.z,next:v.path?.slice(v.segment,v.segment+2)}))},null,2));
assert(active,'Cordon is installed');assert(injected&&protectedWait&&heldFor>=20,'A car already committed to the road waits safely until reopening');assert(completed,'Accident, two hospital transports, road reopening and all returns complete');assert(!recovered,'Cordon must not cause forced repositioning');
console.log('PASS road accident with active cordon, two VSAV, FPTSR, ambient traffic, CH handover and CIS return',{protectedWait});
