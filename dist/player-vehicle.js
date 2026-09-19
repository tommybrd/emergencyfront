import {vehicle,addPenetrationLights,box} from './models.js';
import {installRotaryBeacons,installAmberEffects,updateRotaryBeacons,updateAmberEffects} from './rotary-beacons.js';
export const PLAYER_PARKING=Object.freeze({point:[-30,92],yaw:0,entry:[-21,102.9],exit:[-21,107.1]});
export const playerBasePoint=e=>e.kind==='VLCG'&&e.model.userData.playerVehicle==='car'?PLAYER_PARKING.point:e.home;
export const playerBaseYaw=e=>e.kind==='VLCG'&&e.model.userData.playerVehicle==='car'?PLAYER_PARKING.yaw:e.home[0]<-70?Math.PI/2:-Math.PI/2;
export function canChangePlayerVehicle(e){const home=e&&playerBasePoint(e);return e?.kind==='VLCG'&&e.status==='ready'&&!e.atResidence&&!e.crew&&!e.path&&Math.hypot(e.model.position.x-home[0],e.model.position.z-home[1])<1;}
function lightsOff(model){
 model.userData.headlights.forEach(l=>l.material.emissiveIntensity=0);model.userData.beacons.forEach(l=>l.material.emissiveIntensity=0);model.userData.penetrationLights?.forEach(l=>l.material.emissiveIntensity=0);model.userData.light.visible=false;model.userData.ring.visible=false;
 updateRotaryBeacons(model,false,0,model.position);updateAmberEffects(model,false,'alternate',0,false);
}
function initialize(e){
 if(e.playerVehicles)return;
 const current=e.model,kind=current.userData.playerVehicle||'van',other=kind==='car'?'van':'car',spare=vehicle(current.parent,'VLCG',undefined,{serviceCar:other==='car'});
 installRotaryBeacons(spare);installAmberEffects(spare);addPenetrationLights(spare);
 e.playerVehicles={[kind]:current,[other]:spare};
 for(const [id,model]of Object.entries(e.playerVehicles)){const point=id==='car'?PLAYER_PARKING.point:e.home;model.position.set(point[0],.2,point[1]);model.rotation.y=id==='car'?PLAYER_PARKING.yaw:Math.PI/2;lightsOff(model);}
 e.basePoint=playerBasePoint(e);
 box(current.parent,7,.025,11,'#788078',-30,.035,92);
 for(const x of[-33,-27])box(current.parent,.12,.025,9,'#dfdfc5',x,.055,92);
 box(current.parent,6,.025,.12,'#dfdfc5',-30,.055,87.5);
 e.parkedActors=Object.entries(e.playerVehicles).map(([id,model])=>({id:'PARK-VLCG-'+id,kind:'VLCG',model,status:'parked',path:null}));
}
export const parkedPlayerVehicles=e=>(e?.parkedActors||[]).filter(v=>v.model!==e.model);
export function syncPlayerVehicle(e,profile){
 if(e?.kind!=='VLCG')return false;initialize(e);
 if(!canChangePlayerVehicle(e)||e.model.userData.playerVehicle===profile.vehicle)return false;
 lightsOff(e.model);e.model=e.playerVehicles[profile.vehicle];e.basePoint=playerBasePoint(e);lightsOff(e.model);return true;
}
