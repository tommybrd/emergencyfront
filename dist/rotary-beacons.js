import * as T from 'three';
import {box} from './models.js';
let blueTexture;
function blueGlowTexture(){if(blueTexture)return blueTexture;const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=(y*size+x)*4,r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));data[n]=18;data[n+1]=72;data[n+2]=255;data[n+3]=Math.round(Math.pow(Math.max(0,1-r),2.4)*220);}blueTexture=new T.DataTexture(data,size,size);blueTexture.needsUpdate=true;return blueTexture;}
// A programmed sequence stays readable while varying individual modules.
// Offsets never consume the simulation's random stream.
let blueRigSerial=0;
export function blueRampLit(index,count,now){
 const t=((now%7680)+7680)%7680,phase=Math.floor(t/1920),p=t%1920;
 if(phase===0){const beat=p%640,half=index<count/2?0:1,q=(beat-half*320+640)%640;return q<65||q>=125&&q<195;}
 if(phase===1){const beat=p%480,q=(beat-(index%2)*240+480)%480;return q<55||q>=100&&q<160;}
 if(phase===2){const step=Math.floor(p/120)%(2*count-2),head=step<count?step:2*count-2-step;return p%120<90&&(index===head||index===Math.max(0,head-1));}
 const beat=Math.floor(p/240),q=p%240,pair=[0,3,1,2,3,0,2,1][beat];
 return Math.floor(index*4/count)===pair&&(q<60||q>=105&&q<165);
}
export function installBlueLedEffects(model){
 if(model.userData.blueLedEffects)return;
 const group=new T.Group();group.name='Halos LED bleus';model.add(group);
 const lamps=(model.userData.beacons||[]).filter(l=>l.geometry?.type!=='CylinderGeometry').map((lamp,i)=>{const glow=new T.Sprite(new T.SpriteMaterial({map:blueGlowTexture(),color:'#1258ff',transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(lamp.position);glow.position.y+=.02;glow.scale.set(.62,.48,1);group.add(glow);return{lamp,glow,side:lamp.position.x<0?0:1,index:i};});
 for(const rear of[false,true]){const row=lamps.filter(l=>(l.lamp.position.z<0)===rear).sort((a,b)=>a.lamp.position.x-b.lamp.position.x);const wide=row.length>=6&&row.at(-1).lamp.position.x-row[0].lamp.position.x>=1.15;row.forEach((l,i)=>{l.rank=i;l.count=row.length;l.wide=wide;l.offset=rear?370:0;});}
 model.userData.blueLedEffects={group,lamps,offset:(blueRigSerial++*733)%7680};
}
export function updateBlueLedEffects(model,enabled,now,night=false){const rig=model.userData.blueLedEffects;if(!rig)return;for(const {lamp,glow,side,index,rank,count,wide,offset}of rig.lamps){const time=now+rig.offset+offset,p=((time+index%2*25)%920+920)%920,on=enabled&&(wide?blueRampLit(rank,count,time):side===0?(p<85||p>=155&&p<240):(p>=460&&p<545||p>=615&&p<700));lamp.material.emissiveIntensity=on?8:.03;glow.visible=!!on;glow.material.opacity=on?(night?.78:.48):0;}}
// Fixed LED ring: only the illuminated sector and its projected beam travel.
function rotaryItems(model,lenses,color='#0754ff',baseParent=model){const items=[];for(const lens of lenses){if(lens.geometry.type!=='CylinderGeometry')continue;const radius=Number(lens.geometry.parameters.radiusBottom)||.22;const factor=.72;if(!lens.userData.rotarySized){lens.userData.rotarySized=true;lens.scale.multiplyScalar(factor);lens.position.y-=(Number(lens.geometry.parameters.height)||.23)*(1-factor)/2;const base=baseParent.children.find(m=>m!==lens&&m.geometry?.type==='CylinderGeometry'&&Math.abs(m.position.x-lens.position.x)<.01&&Math.abs(m.position.z-lens.position.z)<.01&&m.position.y<lens.position.y&&lens.position.y-m.position.y<.25);if(base){base.scale.x*=factor;base.scale.z*=factor;}}lens.material.transparent=true;lens.material.opacity=.38;lens.material.depthWrite=false;const ring=new T.Group();ring.position.copy(lens.position);ring.scale.setScalar(.72);model.add(ring);const leds=Array.from({length:16},(_,i)=>{const a=i*Math.PI*2/16,led=box(ring,.055,.12,.03,new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0}),Math.sin(a)*.17,0,Math.cos(a)*.17);led.rotation.y=a;return led;});const rotor=new T.Group();rotor.position.copy(lens.position);model.add(rotor);const beam=new T.SpotLight(color,0,22,.3,.65,1.4);beam.position.set(0,0,.13);const target=new T.Object3D();target.position.set(0,-1.8,6);rotor.add(beam,target);beam.target=target;beam.castShadow=false;beam.visible=false;items.push({lens,ring,leds,rotor,beam});}return items;}
export function installRotaryBeacons(model){model.userData.rotaryBeacons=rotaryItems(model,model.userData.beacons);}
function updateRotators(model,items,enabled,seconds,camera){for(const [i,b]of items.entries()){if(enabled)b.rotor.rotation.y=seconds*7+i*1.4;const angle=b.rotor.rotation.y;b.beam.intensity=enabled?88:0;b.beam.visible=!!enabled;b.leds.forEach((led,j)=>{const sector=j*Math.PI*2/b.leds.length;led.material.emissiveIntensity=enabled?12*Math.pow(Math.max(0,Math.cos(angle-sector)),12):0;});const view=camera?Math.atan2(camera.x-model.position.x,camera.z-model.position.z)-model.rotation.y:0;const sweep=Math.pow(Math.max(0,Math.cos(angle-view)),14);b.lens.material.emissiveIntensity=enabled?.15+3*sweep:0;}return items.length>0;}
export function updateRotaryBeacons(model,enabled,seconds,camera){return updateRotators(model,model.userData.rotaryBeacons||[],enabled,seconds,camera);}

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
 const rotators=model.userData.signalAmber?.startsWith('round')?rotaryItems(group,model.userData.rearAmber,'#ff9d16',model):[];
 model.userData.amberEffects={group,lamps,beam,rotators};
}
export function updateAmberEffects(model,enabled,pattern,now,night,camera){
 const rig=model.userData.amberEffects;if(!rig)return;
 if(rig.rotators.length){rig.beam.visible=false;rig.beam.intensity=0;for(const {glow} of rig.lamps)glow.visible=false;updateRotators(model,rig.rotators,enabled,now/1000,camera);return;}
 let lit=0,weighted=0;for(const [i,{lamp,glow}]of rig.lamps.entries()){const on=enabled&&amberLit(pattern,i,rig.lamps.length,now);lamp.material.emissiveIntensity=on?5:.03;glow.visible=!!on;glow.material.opacity=on?(night?.8:.55):0;if(on){lit++;weighted+=lamp.position.x;}}
 rig.beam.visible=lit>0;rig.beam.intensity=lit?(night?52:18)*Math.min(1,lit/2):0;if(lit){rig.beam.position.x=weighted/lit;rig.beam.target.position.x=weighted/lit;}
}
