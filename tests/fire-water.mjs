import assert from 'node:assert/strict';
import './game-environment.mjs';
import {initWater,tickWater,tickEquipment,waterMinutes} from '../dist/hydraulics.js';
import {applyFireRegrowth} from '../dist/command.js';
const e={kind:'FPT'};initWater(e);e.nozzles.lance=1;tickEquipment(e,20);
for(let second=0;second<60;second++)tickWater(e,waterMinutes(1));assert(Math.abs(e.water-500)<1e-6,'one small nozzle now lasts 72 real seconds at default speed');
for(let second=0;second<12;second++)tickWater(e,waterMinutes(1));assert(e.water<1e-6);assert(tickWater(e,waterMinutes(1))<1e-6);
const rekindle={type:'INC',status:'active',reconComplete:true,fireContained:false,progress:.6,spread:.5};assert(applyFireRegrowth(rekindle,false,10)>0);assert(rekindle.progress<.6,'fire regains intensity without water');const held=rekindle.progress;applyFireRegrowth(rekindle,true,10);assert.equal(rekindle.progress,held,'active water holds the gained progress');
const game=await import('../dist/scene.js');
const c={id:900,type:'INC',name:'Feu de véhicule',requires:'FPT',at:480,status:'waiting',progress:0};game.state.calls.push(c);game.onCall(c);
assert(Math.abs(Math.hypot(c.fireTarget[0]-c.accessTarget[0],c.fireTarget[1]-c.accessTarget[1])-6.8)<1e-6);assert.deepEqual(c.target,c.fireTarget,'incident marker follows the burning car, with a separate road access');const hazard=game.hazards.get(c.id);assert(hazard);assert.equal(hazard.children[0].userData.bodyStyle,'compact-utility');assert(game.fireEffects.has(c.id));globalThis.frame(performance.now());
console.log('PASS water autonomy ×6, empty tank stops flow, vehicle fire uses a roadside car and renders without error');

// Eau sur le foyer : la fumée passe du gris sombre à la vapeur blanche, puis revient quand l'eau se coupe.
{
 const T=await import('../dist/vendor/three.module.js');const {createIncidentFx}=await import('../dist/effects.js');
 const world=new T.Scene(),fx=createIncidentFx(world,new T.Object3D());fx.setActive(true);
 const smokeMesh=world.children[0].children.find(m=>m.isInstancedMesh&&m.count===34),c=new T.Color();
 const light=()=>{let sum=0;for(let i=0;i<34;i++){smokeMesh.getColorAt(i,c);sum+=(c.r+c.g+c.b)/3;}return sum/34;};
 fx.update(0,1,0,null,0);const dark=light();
 for(let t=.05;t<8;t+=.05)fx.update(t,1,0,null,1);const wet=light();
 assert(wet>dark+.3,'Water on the fire turns the smoke into white steam');
 for(let t=8;t<16;t+=.05)fx.update(t,1,0,null,0);assert(light()<dark+.05,'Smoke darkens again once water stops');
 console.log('PASS white steam while water hits the fire');
}
