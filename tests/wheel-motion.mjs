import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {vehicle} from '../dist/models.js';
import {rollWheels} from '../dist/wheel-motion.js';
for(const [kind,options]of[['VSAV',{}],['VSAV',{ambulanceModel:'master'}],['VSAV',{ambulanceModel:'man'}],['CCF',{}],['FPT',{}],['VLCG',{}],['VLI',{}],['EPA',{}],['PC',{}],['VPCE',{}]]){
 const model=vehicle(new T.Scene(),kind,undefined,options),wheel=model.userData.wheels[0],r=wheel.userData.wheelRadius;
 assert(wheel.isGroup&&wheel.children.length>=4,'tyre, hub and details rotate together');const detail=wheel.children.find(m=>Math.hypot(m.position.y,m.position.z)>.01);assert(detail);
 model.updateMatrixWorld(true);const before=detail.getWorldPosition(new T.Vector3());rollWheels(model,r*.4);model.updateMatrixWorld(true);assert(Math.abs(wheel.rotation.x-.4)<1e-8);assert(detail.getWorldPosition(new T.Vector3()).distanceTo(before)>.001);
 const angle=wheel.rotation.x;rollWheels(model,0);assert.equal(wheel.rotation.x,angle);rollWheels(model,-r*.4);assert(Math.abs(wheel.rotation.x)<1e-8);model.scale.setScalar(.5);rollWheels(model,r*.2);assert(Math.abs(wheel.rotation.x-.4)<1e-8);
}
console.log('PASS wheel rigs: tyres/rims/bolts/treads move together, distance/radius rotation, stop, reverse and vehicle scale');
