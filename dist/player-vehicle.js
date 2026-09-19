import {vehicle,addPenetrationLights} from './models.js';
import {installRotaryBeacons} from './rotary-beacons.js';
import {disposeObject} from './dispose.js';

export function canChangePlayerVehicle(e){return e?.kind==='VLCG'&&e.status==='ready'&&!e.crew&&!e.path&&Math.hypot(e.model.position.x-e.home[0],e.model.position.z-e.home[1])<1;}
export function syncPlayerVehicle(e,profile){
 if(!canChangePlayerVehicle(e)||e.model.userData.playerVehicle===profile.vehicle)return false;
 const previous=e.model,next=vehicle(previous.parent,e.kind,undefined,{serviceCar:profile.vehicle==='car'});
 next.position.copy(previous.position);next.quaternion.copy(previous.quaternion);next.scale.copy(previous.scale);next.visible=previous.visible;
 installRotaryBeacons(next);addPenetrationLights(next);
 e.model=next;disposeObject(previous);
 return true;
}
