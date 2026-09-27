import {applyServiceSignals} from './service-signals.js';
import {updateBlueLedEffects,updateRotaryBeacons,updateAmberEffects} from './rotary-beacons.js';
export const PLAYER_PARKING=Object.freeze({point:[-30,92],yaw:0,entry:[-21,102.9],exit:[-21,107.1]});
export const playerBasePoint=e=>e.kind==='VLCG'&&e.model.userData.playerVehicle==='car'?PLAYER_PARKING.point:e.home;
export const playerBaseYaw=e=>e.baseYaw??(e.kind==='VLCG'&&e.model.userData.playerVehicle==='car'?PLAYER_PARKING.yaw:0);
export function canChangePlayerVehicle(e){const home=e&&playerBasePoint(e);return e?.kind==='VLCG'&&e.status==='ready'&&!e.atResidence&&!e.crew&&!e.path&&Math.hypot(e.model.position.x-home[0],e.model.position.z-home[1])<1;}
function lightsOff(model){
 model.userData.headlights.forEach(l=>l.material.emissiveIntensity=0);model.userData.beacons.forEach(l=>l.material.emissiveIntensity=0);model.userData.penetrationLights?.forEach(l=>l.material.emissiveIntensity=0);model.userData.light.visible=false;model.userData.ring.visible=false;
 updateBlueLedEffects(model,false,0,false);updateRotaryBeacons(model,false,0,model.position);updateAmberEffects(model,false,'alternate',0,false);
}
function initialize(e){
 if(e.playerVehicles)return;
 e.playerVehicles={van:e.model};
 e.model.position.set(e.home[0],.2,e.home[1]);e.model.rotation.y=e.baseYaw??0;
 applyServiceSignals(e.model,'van');lightsOff(e.model);e.basePoint=e.home;e.parkedActors=[];
}
export const parkedPlayerVehicles=e=>(e?.parkedActors||[]).filter(v=>v.model!==e.model);
export function syncPlayerVehicle(e,profile){
 if(e?.kind!=='VLCG')return false;initialize(e);
 return false;
}
