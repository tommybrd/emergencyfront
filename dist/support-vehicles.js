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
 e.longSupplyProvider=carrier.id;e.supplyReach=LONG_SUPPLY_REACH;e.supplyDuration=15+option.supply.distance/5;e.supplyPackDuration=10+option.supply.distance/7;
 carrier.longSupplyTarget=e.id;return true;
}
export function stopLongSupply(carrier,engines){const e=engines.find(e=>e.id===carrier.longSupplyTarget);if(e)e.hydrant=null;}
export function tickSupportVehicles(engines){
 for(const carrier of engines.filter(e=>e.kind==='VPCE'&&e.longSupplyTarget)){
  const e=engines.find(e=>e.id===carrier.longSupplyTarget);
  if(e&&(carrier.status!=='scene'||carrier.call!==e.call||carrier.crew<2))e.hydrant=null;
  if(!e||!e.hydrant&&!e.supplyProgress){if(e){delete e.longSupplyProvider;delete e.supplyReach;}delete carrier.longSupplyTarget;}
 }
}
