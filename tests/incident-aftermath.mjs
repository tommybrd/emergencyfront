import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {createIncidentAftermath} from '../dist/incident-aftermath.js';
import {incidentProps} from '../dist/incident-props.js';
import {mat} from '../dist/models.js';
const world=new T.Scene(),aftermath=createIncidentAftermath(world,{limit:3}),palette=mat('#454439');let paletteDisposed=false;palette.addEventListener('dispose',()=>paletteDisposed=true);
for(const c of[{type:'SUAP'},{type:'OD'},{type:'INC',inspection:true,fireConfirmed:false}])assert.equal(aftermath.capture({...c,id:1,target:[0,0]},null,500),false);
assert.equal(aftermath.records.size,0,'No invented damage on medical calls or false alarms');
const c={id:2,type:'INC',scene:'vehicle',actionPoint:[145,85],site:{kind:'roadside',yaw:.5}};const wreck=incidentProps(world,c);
assert(aftermath.capture(c,wreck,500));assert.equal(aftermath.obstacles().length,1);assert.equal(aftermath.obstacles()[0].model.position.x,145);assert.equal(aftermath.obstacles()[0].model.rotation.y,.5);
aftermath.capture(c,wreck,500);assert.equal(aftermath.records.size,1,'One aftermath per incident');aftermath.update(679);assert(wreck.parent);aftermath.update(680);assert.equal(wreck.parent,null);assert.equal(aftermath.obstacles().length,0,'Wreck recovered while scorch mark remains');
const home={id:3,type:'INC',scene:'house',actionPoint:[121,70],target:[110,70],site:{kind:'building',position:[110,70],width:20,depth:16,height:6}};
aftermath.capture(home,null,700);const record=aftermath.records.get(3),patch=record.group.children[1];assert(Math.abs(patch.position.x-120.045)<.001,'Soot is flush with this facade only');
aftermath.update(725,()=>true);assert(record.residents.every(r=>!r.model.visible),'Neighbours wait for the cordon to open');aftermath.update(730);assert(record.residents.some(r=>r.model.visible));aftermath.update(770);assert(record.residents.every(r=>!r.model.visible));
const first=aftermath.records.get(2).group;for(let id=4;id<10;id++)aftermath.capture({id,type:'INC',scene:'forest',target:[150+id,70]},null,800);
assert.equal(aftermath.records.size,3,'Bounded geometry across continued shifts');assert.equal(first.parent,null);assert(!paletteDisposed,'Cleanup preserves shared city materials');
aftermath.update(2300);assert.equal(aftermath.records.size,0);assert.equal(world.children.length,0);assert(!paletteDisposed);
console.log('PASS localized soot, retained/recovered wreck obstacles, gradual resident return, false alarms, bounded memory and shared materials');

// A burning car already reserves its physical space, so keeping the wreck after
// closure never spawns a new obstacle inside the departing fire appliance.
// Seed 3 also places the wreck beside the entrance to the closest parking bay.
let seed=Number(process.env.TEST_SEED||3);Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines}=game;
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const fire={id:700,type:'INC',name:'Feu de véhicule',requires:'FPT',status:'waiting',at:state.minute,progress:0};
state.schedule=[];state.shiftEnd=100000;state.calls.push(fire);onCall(fire);selectIncident(fire.id);assert.equal(engageUnits(['FPTSR']),null);
const pump=engines.find(e=>e.id==='FPTSR');let ended=false;
for(let i=0;i<5000;i++){
 state.minute+=.25;tickEngines(.25);
 if(pump.status==='scene'&&fire.reconComplete){pump.hydrant=game.district.hydrants[0];pump.nozzles.large=2;fire.progress=Math.max(fire.progress,.999);}
 for(const m of game.vehicleObstacles())if(m!==pump.model&&m.visible!==false)assert(!overlaps(footprint(pump.model),footprint(m)),'Fire engine never parks inside the burning car or retained wreck');
 if(fire.status==='closed'&&pump.status==='ready'){ended=true;break;}
}
assert(ended,'Vehicle fire, retained wreck and return complete');assert(game.aftermath.records.has(fire.id));assert(!state.logs.some(l=>l.message.includes('repositionnement')));
console.log('PASS vehicle-fire dispatch and parking, persistent physical wreck, extinction and collision-free return');
