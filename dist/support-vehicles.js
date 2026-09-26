import {findHydrantSupply,connectSupply} from './water-supply.js';
export const LONG_SUPPLY_REACH=500;
export function longSupplyOptions(carrier,engines,hydrants){
 if(carrier.kind!=='VPCE'||carrier.status!=='scene'||carrier.crew<2||carrier.longSupplyTarget)return [];
 return engines.filter(e=>e!==carrier&&e.call===carrier.call&&e.status==='scene'&&e.capacity>0&&!e.hydrant&&!e.supplyProgress).flatMap(e=>{
  // The carrier's crew brings the hose container close to the receiving pump.
  if(e.model.position.distanceTo(carrier.model.position)>65)return [];
  const supply=findHydrantSupply(e,hydrants,engines,LONG_SUPPLY_REACH);return supply?[{engine:e,supply}]:[];
 });
}
export function beginLongSupply(carrier,receiver,engines,hydrants){
 const option=longSupplyOptions(carrier,engines,hydrants).find(o=>o.engine.id===receiver);if(!option)return false;
 const e=option.engine;if(!connectSupply(e,option.supply))return false;
 e.longSupplyProvider=carrier.id;carrier.containerProgress=0;carrier.containerPhase="unloading";e.supplyDeployWait=8;e.supplyReach=LONG_SUPPLY_REACH;e.supplyDuration=15+option.supply.distance/5;e.supplyPackDuration=10+option.supply.distance/7;
 carrier.longSupplyTarget=e.id;return true;
}
export function stopLongSupply(carrier,engines){const e=engines.find(e=>e.id===carrier.longSupplyTarget);if(e)e.hydrant=null;}
export function tickSupportVehicles(engines,minutes=0){
 for(const carrier of engines.filter(e=>e.kind==='VPCE'&&e.longSupplyTarget)){
  const e=engines.find(e=>e.id===carrier.longSupplyTarget);
  if(e&&(carrier.status!=='scene'||carrier.call!==e.call||carrier.crew<2))e.hydrant=null;
  if(carrier.containerPhase==='unloading'){carrier.containerProgress=Math.min(1,(carrier.containerProgress||0)+minutes/8);if(carrier.containerProgress>=1)carrier.containerPhase='deployed';}
  if(!e||!e.hydrant&&!e.supplyProgress){carrier.containerPhase='loading';carrier.containerProgress=Math.max(0,(carrier.containerProgress||0)-minutes/8);if(carrier.containerProgress>0)continue;if(e){delete e.longSupplyProvider;delete e.supplyReach;}delete carrier.longSupplyTarget;}
 }
}

export function animateContainer(carrier){
 const {container,containerArm}=carrier.model.userData;if(!container)return;
 const model=carrier.model;
 const parts=new Set([...(model.userData.blueParts||[]),...(model.userData.rearBlue||[]),...(model.userData.rearAmber||[])]);
 for(const p of [...model.children])if((parts.has(p)||p.userData.configuredBlue||p.userData.configuredAmber||p.userData.amberPart)&&p.position.z<0)container.add(p);
 for(const rig of model.userData.rotaryBeacons||[])if(rig.lens.position.z<0){if(rig.ring.parent===model)container.add(rig.ring);if(rig.rotor.parent===model)container.add(rig.rotor);}
 for(const {lamp,glow}of model.userData.blueLedEffects?.lamps||[])if(lamp.position.z<0&&glow.parent!==container)container.add(glow);
 const amber=model.userData.amberEffects?.group;if(amber&&amber.parent===model)container.add(amber);
 const t=Math.max(0,Math.min(1,carrier.containerProgress||0));
 // Roll rearwards over the chassis, then lower the bed to ground level.
 container.position.set(0,-1.05*Math.max(0,(t-.45)/.55),-6.2*t);
 container.rotation.x=-Math.sin(Math.PI*t)*.26;
 if(containerArm){containerArm.rotation.x=-Math.sin(Math.PI*t)*.6;containerArm.position.z=-2.4*Math.sin(Math.PI*t);}
}
