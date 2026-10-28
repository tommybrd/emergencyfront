import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {vehicle} from '../dist/models.js';
import {installDiveKit,rescueBoat,updateWaterVisual} from '../dist/water-models.js';
import {updateBoatTrailer} from '../dist/trailer-motion.js';
import {updateCommandDeployment} from '../dist/command-deployment.js';
import {vehicleConsole,vehicleNavigation,vehicleRecoveryKey} from '../dist/vehicle-console.js';
import {stationPath} from '../dist/station-routing.js';
import {exercisePose} from '../dist/station-exercises.js';
const world=new T.Scene(),e={kind:'VPL',model:vehicle(world,'VPL')};installDiveKit(e);updateBoatTrailer(e);
const hitch=e.model.userData.trailerHitch;const exit=stationPath({...e,status:'departing',wasAtStation:true,home:[-105,71]},[-105,71],[20,105],'enroute',(a,b)=>[a,b]);assert(exit.find(p=>Math.abs(p[0]+105)>1)[1]>94,'Trailer clears garage pillars before steering');
for(let i=1;i<=60;i++){
 const a=i/60*Math.PI/2;e.model.position.set(12*(1-Math.cos(a)),.2,12*Math.sin(a));e.model.rotation.y=a;updateBoatTrailer(e);
 const point=e.model.localToWorld(new T.Vector3(0,0,hitch.position.z));assert(Math.abs(point.distanceTo(hitch.userData.axle)-3.7)<1e-6);
}
assert(Math.abs(hitch.rotation.y)>.15,'Trailer cuts inside the curve instead of staying rigid');assert(Math.abs(hitch.rotation.y)<1.02);
const before=hitch.rotation.y;for(let n=0;n<10;n++)updateBoatTrailer(e);assert.equal(hitch.rotation.y,before,'No articulation drift while parked');
for(let i=0;i<15;i++){e.model.position.x-=.1;updateBoatTrailer(e);}assert(Number.isFinite(hitch.rotation.y));assert(Math.abs(hitch.rotation.y)<=1.02);
const boat=rescueBoat(world,true),c={patients:[{}],nautical:{unitId:'VPL',phase:1,progress:.3,dock:[0,0],victim:[20,20]}};
updateWaterVisual(c,boat,null,e,1);assert(boat.userData.wake.root.visible);const spin=boat.userData.propeller.rotation.z;updateWaterVisual(c,boat,null,e,2);assert.notEqual(boat.userData.propeller.rotation.z,spin);c.nautical.phase=2;updateWaterVisual(c,boat,null,e,3);assert(!boat.userData.wake.root.visible);assert(boat.userData.crew.every(p=>p.userData.uniform==='diver'&&!p.userData.interventionHelmet));
const pc={kind:'PC',model:vehicle(world,'PC'),status:'enroute',crew:3,size:3};updateCommandDeployment(pc,5);assert(!pc.model.userData.commandDeployment);pc.status='scene';updateCommandDeployment(pc,1);const rig=pc.model.userData.commandDeployment;assert(rig.progress>0&&rig.progress<1);assert(!rig.board.visible);updateCommandDeployment(pc,4);assert.equal(rig.progress,1);assert(rig.board.visible&&rig.mast.visible&&rig.crew.length===3);pc.status='reconditioning';updateCommandDeployment(pc,5);assert.equal(rig.progress,0);assert(!rig.root.visible);
const van={kind:'VSAV',model:vehicle(world,'VSAV'),status:'ready'};
assert(!vehicleConsole(van).includes('data-back-incident'));assert(!vehicleConsole(van).includes('data-unblock'));assert(vehicleNavigation(van).includes('data-follow'));assert(vehicleNavigation(van).includes('data-cis'));assert(vehicleRecoveryKey(van).includes('data-unblock'));
for(let slot=0;slot<4;slot++){assert.notDeepEqual(exercisePose(slot,840).point,exercisePose(slot,841).point,'Training partners have real movement');}
console.log('PASS articulated trailer arc and stationary stability, motor and speed-dependent wake, dive crew, progressive PC deployment/packing, separate console navigation and active training');
