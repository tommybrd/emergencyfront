import assert from 'node:assert/strict';
import {canManualRecovery,manualRecoverySpot,MANUAL_RECOVERY_DISTANCE} from '../dist/traffic-recovery.js';
import {footprint,overlaps} from '../dist/vehicle-spacing.js';
import {vehicleConsole} from '../dist/vehicle-console.js';
import {inStation} from '../dist/traffic-control.js';
import {els} from './game-environment.mjs';

const model=(x,z,length=6.25,yaw=0)=>({position:{x,z},rotation:{y:yaw},scale:{x:1},userData:{kind:'VSAV',length},visible:true});
const make=()=>({status:'enroute',trafficWaiting:true,model:model(0,0),path:[[0,0],[0,50]],segment:1,call:1});
let v=make(),obstacle=model(0,2,4.45),spot=manualRecoverySpot(v,[v.model,obstacle]);
assert(spot&&spot.z>2,'The manual reset can escape an overlapping vehicle ahead');
assert(Math.hypot(spot.x,spot.z)<=MANUAL_RECOVERY_DISTANCE);
assert(!overlaps(footprint(v.model,spot.x,spot.z,spot.yaw),footprint(obstacle)));
v.trafficWaiting=false;v.controlWaiting='Priorité au carrefour';
assert(canManualRecovery(v),'Priority waits must also expose the reset');
assert(vehicleConsole(v).match(/data-unblock[^>]*aria-pressed="true"/));

v=make();v.model.position.z=20;v.path=[[0,0],[0,20],[0,50]];v.segment=2;
spot=manualRecoverySpot(v,[],undefined,(x,z)=>z<20);
assert(spot&&spot.z<20&&spot.segment===1,'Retreat keeps the next waypoint on the original route');
v.path[2].gear=-1;spot=manualRecoverySpot(v,[]);
assert(Math.abs(Math.cos(spot.yaw)+1)<.001,'Reverse parking orientation survives recovery');
assert.equal(manualRecoverySpot(v,[],undefined,()=>false),null);
assert.equal(manualRecoverySpot(v,[model(0,20,80)]),null,'Do not jump further than 12 m to escape a full area');
for(const status of['ready','departing','scene','hospital','reconditioning'])assert(!canManualRecovery({...v,status}));
assert(!canManualRecovery({...v,trafficWaiting:false,controlWaiting:null}));
assert(!canManualRecovery({...v,hydrant:{}}));
assert(!canManualRecovery({...v,aerial:{mode:'rescue'}}));
assert(vehicleConsole({...v,status:'ready'}).match(/data-unblock[^>]*disabled/));

let seed=12;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,selectEngine,vehicleObstacles,district,trafficControl,repositionEngine}=game;
state.schedule=[];state.shiftEnd=100000;
const c={id:1,type:'SUAP',name:'Malaise à domicile',at:state.minute,status:'waiting',progress:0,duration:10000};
state.calls.push(c);onCall(c);selectIncident(c.id);assert.equal(engageUnits(['VSAV 1']),null);
const e=engines.find(e=>e.id==='VSAV 1');
for(let i=0;i<3000&&!(e.status==='enroute'&&!inStation(e.model.position.x,e.model.position.z,15));i++){state.minute+=.25;tickEngines(.25);}
assert(e.status==='enroute'&&e.path,'Actual departure reaches the road');
const original={call:e.call,status:e.status,crew:e.crew,path:e.path,parking:e.parking};
const click=()=>els.get('vehiclePanel').onclick({target:{closest:s=>s==='[data-unblock]'?{}:null}});
for(const wait of['traffic','priority','safety']){
 const p=e.model.position.clone();
 e.trafficWaiting=wait==='traffic';e.controlWaiting=wait==='priority'?'Priorité au carrefour':wait==='safety'?'Distance de sécurité':null;
 // A stale reservation elsewhere must be released, then normal arbitration resumes.
 const stale=trafficControl.records.get('junction-0');stale.owner=e;stale.queue.set(e,0);
 els.get('fleet').onclick({target:{closest:s=>s==='[data-engine]'?{dataset:{engine:e.id}}:null}});
 assert(els.get('vehiclePanel').innerHTML.match(/data-unblock[^>]*aria-pressed="true"/));click();
 const distance=p.distanceTo(e.model.position);assert(distance>=2.9&&distance<=12.001,'Actual button only moves a few metres');
 assert.equal(e.call,original.call);assert.equal(e.status,original.status);assert.equal(e.crew,original.crew);assert.equal(e.path,original.path);assert.equal(e.parking,original.parking);
 assert(!e.trafficWaiting&&!e.controlWaiting);assert.equal(e.blockedSeconds,0);
 assert.notEqual(stale.owner,e,'The old reservation is not retained');
 for(const m of vehicleObstacles())if(m!==e.model&&m.visible!==false)assert(!overlaps(footprint(e.model),footprint(m)),'Reset must never overlap another vehicle');
}
// A fully occupied area must leave the vehicle and mission untouched.
const p=e.model.position.clone(),barrier={model:model(p.x,p.z,100,e.model.rotation.y),status:'ready'};
district.traffic.push(barrier);e.trafficWaiting=true;
assert.equal(repositionEngine(e),false);assert(e.model.position.equals(p));assert.equal(e.path,original.path);
assert(state.logs.at(-1).message.includes('aucun emplacement libre'));
district.traffic.pop();
assert(state.logs.some(l=>l.message.includes('Destination conservée')));
console.log('PASS manual nearby reset, real control button, collision/priority/safety waits, reverse route, no overlap, bounded refusal and preserved mission');
