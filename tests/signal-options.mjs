import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {vehicle} from '../dist/models.js';
import {installRotaryBeacons,installAmberEffects,updateAmberEffects} from '../dist/rotary-beacons.js';
import {applyServiceSignals,loadServiceSignals} from '../dist/service-signals.js';
import {initWater,nozzleLimit,setNozzle} from '../dist/hydraulics.js';
for(const kind of ['VSAV','CCF','VLI','PC']){const m=vehicle(new T.Scene(),kind,undefined,{signalFront:'none',signalRear:'none',signalAmber:'none'});assert.equal(m.userData.beacons.length,0);assert.equal(m.userData.rearAmber.length,0);assert(!m.children.some(c=>c.userData.amberPart));}
for(const ambulanceModel of ['cell','master','man']){const m=vehicle(new T.Scene(),'VSAV',undefined,{ambulanceModel,signalFront:'round',signalRear:'round'});installRotaryBeacons(m);for(const l of m.userData.beacons){assert.equal(m.userData.ambulanceModel,'cell');const roof=l.position.z>0?2.765:2.955;assert(l.position.y-l.geometry.parameters.height*l.scale.y/2>roof,'Lens must sit above roof');assert(l.position.y<roof+.3,'No floating beacon');}}
const vli=vehicle(new T.Scene(),'VLI',undefined,{signalFront:'wide',signalRear:'round'});assert(vli.userData.frontBlue.every(l=>l.position.y>2.1&&l.position.y<2.5));assert(vli.userData.rearBlue.every(l=>l.position.y<2.5));
for(const serviceCar of [false]){const m=vehicle(new T.Scene(),'VLCG',undefined,{serviceCar});installRotaryBeacons(m);installAmberEffects(m);const key=serviceCar?'car':'van',config=loadServiceSignals();config[key]={signalFront:'none',signalRear:'round',signalAmber:'wide'};applyServiceSignals(m,key,config);assert.equal(m.userData.frontBlue.length,0);assert(m.userData.rearBlue.length);assert.equal(m.userData.rearAmber.length,8);const children=m.children.length;config[key].signalFront='wide';applyServiceSignals(m,key,config);config[key].signalFront='none';applyServiceSignals(m,key,config);assert.equal(m.children.length,children,'Replacing rigs must not leak old lamps');config[key].signalRear='none';config[key].signalAmber='none';applyServiceSignals(m,key,config);assert.equal(m.userData.beacons.length,0);assert.equal(m.userData.rearAmber.length,0);}
for(const [lightPump,crew,expected]of [[true,4,1],[false,6,2],[true,6,1],[false,4,1]]){const e={kind:'FPT',lightPump,crew,status:'scene'};initWater(e);assert.equal(nozzleLimit(e),expected);assert(setNozzle(e,'small',expected));assert(!setNozzle(e,'ldt',1));e.buildingCrew=2;assert.equal(nozzleLimit(e),Math.min(lightPump?1:2,Math.max(0,(crew-4)/2)));}
console.log('PASS none/amber options, no submerged or floating VSAV rotators, VLI roof anchors, both VLCG variants, repeat configuration without duplicate rigs, FPTL 1 / FPTSR 2 attack pairs');

for(const kind of ['VSAV','CCF','VLI','VLCG','POLICE','FPT','PC'])for(const count of [1,2]){
 const choice=count===1?'round-single':'round-double',m=vehicle(new T.Scene(),kind,undefined,{signalFront:choice,signalRear:choice,signalAmber:choice});
 if(kind==='VLI')assert(m.userData.rearAmber.every(l=>l.position.y<2.5),'Orange rotators sit on the VLI roof');
 assert.equal(m.userData.frontBlue.length,count);assert.equal(m.userData.rearBlue.length,count);assert.equal(m.userData.rearAmber.length,count);
 installRotaryBeacons(m);installAmberEffects(m);const rig=m.userData.amberEffects;assert.equal(rig.rotators.length,count);
 updateAmberEffects(m,true,'alternate',1200,true,new T.Vector3(8,8,8));for(const r of rig.rotators){assert(r.beam.visible);assert(r.leds.some(l=>l.material.emissiveIntensity>1));assert(r.leds.some(l=>l.material.emissiveIntensity<.01));}
 const angle=rig.rotators[0].rotor.rotation.y;updateAmberEffects(m,true,'alternate',1500,true);assert.notEqual(rig.rotators[0].rotor.rotation.y,angle);
 updateAmberEffects(m,false,'alternate',1700,true);for(const r of rig.rotators){assert(!r.beam.visible);assert(r.leds.every(l=>l.material.emissiveIntensity===0));}
}
console.log('PASS single/double independent blue and amber rotators across all vehicle families; shared moving-sector rendering and switch-off');
const vlcg=vehicle(new T.Scene(),'VLCG'),nurse=vehicle(new T.Scene(),'VLI');
assert.equal(nurse.userData.bodyStyle,vlcg.userData.bodyStyle);assert.equal(nurse.userData.length,vlcg.userData.length);assert.equal(nurse.userData.kind,'VLI');assert.equal(nurse.userData.playerVehicle,undefined);
assert.deepEqual(nurse.userData.headlights.map(l=>l.position.toArray()),vlcg.userData.headlights.map(l=>l.position.toArray()));
console.log('PASS VLI shares the validated VLCG pickup and headlight positions while retaining its nursing identity');

const {addPenetrationLights}=await import('../dist/models.js');
for(const kind of ['FPT','VSR','CCF','EPA','CCGC','PC','VPCE']){const m=vehicle(new T.Scene(),kind);addPenetrationLights(m);assert(m.userData.penetrationLights.every(l=>l.position.y>m.userData.headlights[0].position.y+.3&&l.position.z<m.userData.length/2+.2));}
console.log('PASS heavy-vehicle penetration lights mounted above the bumper, close to the grille');

for(const signalAmber of ['standard','short','wide']){const pc=vehicle(new T.Scene(),'PC',undefined,{signalAmber});assert(pc.userData.rearAmber.every(l=>l.position.z>pc.userData.rearSurfaceZ-.15));}
console.log('PASS PC amber lamps and configurable rear bar stay attached to actual body face');

// Large LED bars run four different phrases without influencing simulation RNG.
const {blueRampLit,installBlueLedEffects,updateBlueLedEffects}=await import('../dist/rotary-beacons.js');
const phrases=[];for(let phase=0;phase<4;phase++){const masks=new Set();const seen=new Set();for(let t=0;t<1920;t+=20){let mask=0;for(let i=0;i<8;i++)if(blueRampLit(i,8,t+phase*1920)){mask|=1<<i;seen.add(i);}masks.add(mask);}assert.equal(seen.size,8);assert(masks.has(0),'each phrase includes breathing gaps');phrases.push([...masks].sort().join(','));}assert.equal(new Set(phrases).size,4,'four distinct lighting phrases');
const barA=vehicle(new T.Group(),'VSAV'),barB=vehicle(new T.Group(),'VSAV');
installBlueLedEffects(barA);installBlueLedEffects(barB);assert.notEqual(barA.userData.blueLedEffects.offset,barB.userData.blueLedEffects.offset);
assert(barA.userData.blueLedEffects.lamps.every(l=>l.wide));
updateBlueLedEffects(barA,true,100);updateBlueLedEffects(barA,false,100);
assert(barA.userData.blueLedEffects.lamps.every(l=>!l.glow.visible&&l.lamp.material.emissiveIntensity===.03));
console.log('PASS four LED phrases, every module used, dark gaps, vehicle offsets and immediate switch-off');
