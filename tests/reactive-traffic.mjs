import assert from 'node:assert/strict';
import './game-environment.mjs';
const game=await import('../dist/scene.js');
const {createReactiveTraffic}=await import('../dist/reactive-traffic.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const {roads}=await import('../dist/roads.js');
const {district,engines,state,trafficControl,advanceVehicle}=game;
const car=district.traffic[0];district.traffic.splice(1);state.speed=60;
const road=roads.find(r=>r.a[0]===140&&r.a[1]===30&&r.b[1]===160);
const first=engines.find(e=>e.id==='FPTSR'),second=engines.find(e=>e.id==='CCF 1');
const actors=()=>[car,first,second];
const reaction=createReactiveTraffic({vehicles:actors,engines:[first,second],crossings:[],release:v=>trafficControl.release(v)});
function reset(){
 trafficControl.release(car);trafficControl.release(first);trafficControl.release(second);
 car.model.position.set(137.9,0,82);car.model.rotation.y=0;car.road=road;car.status='traffic';car.path=[[137.9,82],[137.9,150]];car.segment=1;car.yielding=null;
 first.model.position.set(137.9,.2,51);first.model.rotation.y=0;first.path=[[137.9,51],[137.9,156]];first.segment=1;first.status='enroute';first.beacons=true;
 second.model.position.set(137.9,.2,36);second.model.rotation.y=0;second.path=[[137.9,36],[137.9,156]];second.segment=1;second.status='enroute';second.beacons=true;
}
reset();first.beacons=false;second.beacons=false;reaction.update([car],.1);assert(!car.yielding,'No emergency signals, no pulling over');
first.beacons=true;const obstacle=engines.find(e=>e.id==='VSAV 1');const old=obstacle.model.position.clone();obstacle.model.position.set(134.65,0,91);obstacle.model.rotation.y=0;
const blocked=createReactiveTraffic({vehicles:()=>[...actors(),obstacle],engines:[first],crossings:[],release:v=>trafficControl.release(v)});blocked.update([car],.1);assert(!car.yielding,'Occupied curb is not used');obstacle.model.position.copy(old);
const pedestrian={model:{visible:true,position:{x:134.65,z:92}}};const withPedestrian=createReactiveTraffic({vehicles:actors,engines:[first],crossings:[],release:v=>trafficControl.release(v),pedestrians:[pedestrian]});withPedestrian.update([car],.1);assert(!car.yielding||Math.hypot(car.yielding.target[0]-pedestrian.model.position.x,car.yielding.target[1]-pedestrian.model.position.z)>=3.5,'Pedestrian has priority; an alternative curb must remain clear');
reset();first.parking={target:[134.65,92]};reaction.update([car],.1);assert(!car.yielding,'Keep emergency parking reservations free');first.parking=null;
reset();let pulled=false,waited=false,merged=false,lastPassed=false;
for(let i=0;i<450;i++){
 reaction.update([car],.1);trafficControl.update(actors(),state.minute);
 const before=actors().map(v=>v.model.position.clone());
 const previous=car.yielding?.phase;
 reaction.advance(car,.1,advanceVehicle);
 for(const e of[first,second]){if(advanceVehicle(e,.1)){e.path=null;e.status='idle';trafficControl.release(e);}}
 pulled||=car.yielding?.phase==='pulling';waited||=car.yielding?.phase==='waiting';
 if(car.yielding?.phase==='merging'&&!merged){assert(second.model.position.z>105,'Wait for the rear of the second vehicle');merged=true;}
 lastPassed||=second.model.position.z>115;
 for(let a=0;a<3;a++){assert(actors()[a].model.position.distanceTo(before[a])<1.1,'Smooth movement');for(let b=a+1;b<3;b++)assert(!overlaps(footprint(actors()[a].model),footprint(actors()[b].model)),'No overlap while yielding/merging');}
 if(merged&&!car.yielding&&car.model.position.z>115)break;
}
assert(pulled&&waited&&merged&&lastPassed,'Pull over, wait for convoy, merge and resume');assert(!car.yielding);assert(Math.abs(car.model.position.x-137.9)<.01,'Return to the right lane');
reset();reaction.update([car],.1);assert(car.yielding);first.beacons=false;second.beacons=false;first.path=null;second.path=null;first.model.position.z=0;second.model.position.z=-10;
for(let i=0;i<150&&car.yielding;i++){reaction.update([car],.1);trafficControl.update(actors(),state.minute);reaction.advance(car,.1,advanceVehicle);}
assert(!car.yielding,'Resume even when the emergency trip is cancelled');
console.log('PASS progressive pull-over, occupied curb/pedestrian checks, convoy clearance, right-lane merge and cancelled response');
