import * as T from 'three';
import {box} from './models.js';
let blueTexture;
function blueGlowTexture(){if(blueTexture)return blueTexture;const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[n]=80;data[n+1]=160;data[n+2]=255;data[n+3]=Math.round(Math.pow(Math.max(0,1-r),2.4)*220);}blueTexture=new T.DataTexture(data,size,size);blueTexture.needsUpdate=true;return blueTexture;}
// LED ramps use two alternating double flashes. Each physical module gets a
// small halo, so the ramp reads as several LEDs instead of one blue point.
export function installBlueLedEffects(model){
 if(model.userData.blueLedEffects)return;
 const group=new T.Group();group.name='Halos LED bleus';model.add(group);
 const lamps=(model.userData.beacons||[]).filter(l=>l.geometry?.type!=='CylinderGeometry').map((lamp,i)=>{const glow=new T.Sprite(new T.SpriteMaterial({map:blueGlowTexture(),color:'#3898ff',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(lamp.position);glow.position.y+=.02;glow.scale.set(.62,.48,1);group.add(glow);return{lamp,glow,side:lamp.position.x<0?0:1,index:i};});
 model.userData.blueLedEffects={group,lamps};
}
export function updateBlueLedEffects(model,enabled,now,night=false){const rig=model.userData.blueLedEffects;if(!rig)return;const phase=((now%920)+920)%920;for(const {lamp,glow,side,index}of rig.lamps){const p=(phase+(index%2)*25)%920,on=enabled&&(side===0?(p<85||p>=155&&p<240):(p>=460&&p<545||p>=615&&p<700));lamp.material.emissiveIntensity=on?8:.03;glow.visible=!!on;glow.material.opacity=on?(night?.78:.48):0;}}
// Fixed LED ring: only the illuminated sector and its projected beam travel.
export function installRotaryBeacons(model){const items=[];for(const lens of model.userData.beacons){if(lens.geometry.type!=='CylinderGeometry')continue;const radius=Number(lens.geometry.parameters.radiusBottom)||.22;const factor=.72;lens.scale.multiplyScalar(factor);lens.position.y-=(Number(lens.geometry.parameters.height)||.23)*(1-factor)/2;const base=model.children.find(m=>m!==lens&&m.geometry?.type==='CylinderGeometry'&&Math.abs(m.position.x-lens.position.x)<.01&&Math.abs(m.position.z-lens.position.z)<.01&&m.position.y<lens.position.y&&lens.position.y-m.position.y<.25);if(base){base.scale.x*=factor;base.scale.z*=factor;}lens.material.transparent=true;lens.material.opacity=.38;lens.material.depthWrite=false;const ring=new T.Group();ring.position.copy(lens.position);ring.scale.setScalar(.72);model.add(ring);const leds=Array.from({length:16},(_,i)=>{const a=i*Math.PI*2/16,led=box(ring,.055,.12,.03,new T.MeshStandardMaterial({color:'#4c88b1',emissive:'#168aff',emissiveIntensity:0}),Math.sin(a)*.17,0,Math.cos(a)*.17);led.rotation.y=a;return led;});const rotor=new T.Group();rotor.position.copy(lens.position);model.add(rotor);const beam=new T.SpotLight('#258aff',0,22,.3,.65,1.4);beam.position.set(0,0,.13);const target=new T.Object3D();target.position.set(0,-1.8,6);rotor.add(beam,target);beam.target=target;beam.castShadow=false;beam.visible=false;items.push({lens,ring,leds,rotor,beam});}model.userData.rotaryBeacons=items;}
export function updateRotaryBeacons(model,enabled,seconds,camera){const items=model.userData.rotaryBeacons||[];for(const [i,b]of items.entries()){if(enabled)b.rotor.rotation.y=seconds*7+i*1.4;const angle=b.rotor.rotation.y;b.beam.intensity=enabled?160:0;b.beam.visible=!!enabled;b.leds.forEach((led,j)=>{const sector=j*Math.PI*2/b.leds.length;led.material.emissiveIntensity=enabled?12*Math.pow(Math.max(0,Math.cos(angle-sector)),12):0;});const view=Math.atan2(camera.x-model.position.x,camera.z-model.position.z)-model.rotation.y;const sweep=Math.pow(Math.max(0,Math.cos(angle-view)),14);b.lens.material.emissiveIntensity=enabled?.15+3*sweep:0;}return items.length>0;}

// One projected amber beam per ramp, with small shared-texture halos on lit LEDs.
// No shadows and no per-frame geometry allocation.
import {amberLit} from './signalling.js';
let amberTexture;
function glowTexture(){if(amberTexture)return amberTexture;const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=(y*size+x)*4,r=Math.hypot((x+ .5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[n]=255;data[n+1]=255;data[n+2]=255;data[n+3]=Math.round(Math.pow(Math.max(0,1-r),2)*200);}amberTexture=new T.DataTexture(data,size,size);amberTexture.needsUpdate=true;return amberTexture;}
export function installAmberEffects(model){
 if(model.userData.amberEffects||!model.userData.rearAmber?.length)return;
 const group=new T.Group();group.name='Lumière de la rampe orange';model.add(group);const center=new T.Vector3();
 const lamps=model.userData.rearAmber.map(lamp=>{const glow=new T.Sprite(new T.SpriteMaterial({map:glowTexture(),color:'#ff910f',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(lamp.position);glow.position.z-=.065;glow.scale.set(.8,.7,1);group.add(glow);center.add(lamp.position);return{lamp,glow};});center.divideScalar(lamps.length);
 const beam=new T.SpotLight('#ff8b0b',0,15,.9,.8,1.7),target=new T.Object3D();beam.position.copy(center);beam.position.z-=.25;target.position.set(center.x,.1,center.z-7);group.add(beam,target);beam.target=target;beam.castShadow=false;beam.visible=false;
 model.userData.amberEffects={group,lamps,beam};
}
export function updateAmberEffects(model,enabled,pattern,now,night){
 const rig=model.userData.amberEffects;if(!rig)return;
 let lit=0,weighted=0;for(const [i,{lamp,glow}]of rig.lamps.entries()){const on=enabled&&amberLit(pattern,i,rig.lamps.length,now);lamp.material.emissiveIntensity=on?5:.03;glow.visible=!!on;glow.material.opacity=on?(night?.8:.55):0;if(on){lit++;weighted+=lamp.position.x;}}
 rig.beam.visible=lit>0;rig.beam.intensity=lit?(night?95:32)*Math.min(1,lit/2):0;if(lit){rig.beam.position.x=weighted/lit;rig.beam.target.position.x=weighted/lit;}
}
