import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {waterHeight,createLakeSurface} from '../dist/water-surface.js';
import {rescueBoat,updateWaterVisual} from '../dist/water-models.js';
import {inLake} from '../dist/beach-layout.js';
const world=new T.Group(),surface=createLakeSurface(world),positions=surface.mesh.geometry.attributes.position.array.slice();surface.update(12);assert.equal(surface.clock.value,12);assert.deepEqual(surface.mesh.geometry.attributes.position.array,positions,'The surface updates through a uniform, without allocating/rebuilding its mesh each frame');
assert.notEqual(waterHeight(70,-158,1),waterHeight(70,-158,2));for(let i=0;i<1000;i++){const y=waterHeight(60+i*.03,-165+i*.02,i*.01);assert(y>.1&&y<.4,'Wind waves remain small and above the lake bed');}
const boat=rescueBoat(world,true),c={patients:[{evacuated:false}],nautical:{unitId:'VPL',phase:1,progress:.1,dock:[100,-155],victim:[72,-158]}},geometry=boat.userData.wake.foam.geometry,material=boat.userData.wake.foam.material;
for(let i=0;i<180;i++){c.nautical.progress=.1+i/400;updateWaterVisual(c,boat,null,null,i/60);assert(boat.userData.wake.foam.count<=192);assert.equal(boat.userData.wake.foam.geometry,geometry);assert.equal(boat.userData.wake.foam.material,material);}
const wake=boat.userData.wake;assert(wake.root.visible);assert(wake.foam.count>50);assert(wake.particles.some(p=>Number.isFinite(p.born)&&p.x>boat.position.x+2),'Foam remains behind on the actual travelled path');
const mat=new T.Matrix4(),v=new T.Vector3();boat.updateMatrixWorld(true);for(let i=0;i<wake.foam.count;i++){wake.foam.getMatrixAt(i,mat);v.setFromMatrixPosition(mat);assert(inLake([v.x,v.z]),'No foam on the shore');assert(Math.abs(v.y-waterHeight(v.x,v.z,179/60)-.035)<1e-5);}
c.nautical.phase=2;updateWaterVisual(c,boat,null,null,3.05);assert(wake.root.visible,'Residual foam persists briefly');updateWaterVisual(c,boat,null,null,9);assert(!wake.root.visible);assert.equal(wake.foam.count,0);
c.nautical.phase=3;c.nautical.progress=.3;updateWaterVisual(c,boat,null,null,10);assert(wake.root.visible);c.nautical.done=true;updateWaterVisual(c,boat,null,null,11);assert(!wake.root.visible&&!boat.visible);
const carried=rescueBoat(world);assert(!carried.userData.wake.root.visible,'No wake while carried on the trailer');
console.log('PASS time-varying water, bounded wave height, stable GPU resources, bounded foam on travelled water, gradual stop dissipation and no wake on trailer or after recovery');
