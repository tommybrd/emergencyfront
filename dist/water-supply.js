import {walkRoute} from './building-actions.js';

export const SUPPLY_REACH=80;
const length=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
export function hydrantPresent(h,hydrants){
 if(!h?.parent||!hydrants.includes(h))return false;
 for(let p=h;p;p=p.parent)if(p.visible===false)return false;
 return true;
}
export function supplyPath(e,anchor){
 const p=e.model.position,yaw=e.model.rotation.y,size=e.model.userData.length||7,dx=anchor.x-p.x,dz=anchor.z-p.z;
 const localX=Math.cos(yaw)*dx-Math.sin(yaw)*dz,localZ=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
 const toWorld=(x,z)=>[p.x+Math.cos(yaw)*x+Math.sin(yaw)*z,p.z-Math.sin(yaw)*x+Math.cos(yaw)*z];
 const side=(localX<0?-1:1)*3.2,behind=-size/2-1,points=[toWorld(0,behind)];
 if(localZ>behind){points.push(toWorld(side,behind));points.push(toWorld(side,Math.abs(localX)<2.5?size/2+1.8:localZ));}
 points.push([anchor.x,anchor.z]);const route=[points[0]];
 for(let i=1;i<points.length;i++){const leg=walkRoute(points[i-1],points[i]);if(!leg)return null;route.push(...leg.slice(1));}
 return route;
}
export function findHydrantSupply(e,hydrants=[],engines=[]){
 if(!e.capacity||e.status!=='scene'||e.supplyProgress>0&&!e.hydrant)return null;
 let best=null;
 for(const h of hydrants){
  if(!hydrantPresent(h,hydrants)||Math.hypot(h.position.x-e.model.position.x,h.position.z-e.model.position.z)>SUPPLY_REACH)continue;
  if(engines.some(v=>v!==e&&(v.hydrant===h||v.supplyProgress>0&&v.supplyHydrant===h)))continue;
  const anchor=h.position.clone();anchor.x+=Math.sign(e.model.position.x-h.position.x||1)*.43;anchor.y=.8;
  const route=supplyPath(e,anchor);if(!route)continue;
  const distance=length(route);if(distance>SUPPLY_REACH||best&&distance>=best.distance)continue;
  best={hydrant:h,anchor,route,distance};
 }
 return best;
}
export function connectSupply(e,supply){
 if(!supply||e.hydrant||e.supplyProgress>0)return false;
 e.hydrant=e.supplyHydrant=supply.hydrant;e.supplyAnchor=supply.anchor.clone();e.supplyRoute=supply.route;e.supplyLength=supply.distance;
 e.supplyOrigin=[e.model.position.x,e.model.position.z,e.model.rotation.y];
 e.supplyDuration=Math.max(20,10+supply.distance/2);e.supplyPackDuration=Math.max(15,8+supply.distance/2);
 return true;
}
export function validateSupply(e,hydrants){
 if(!e.hydrant)return true;
 const origin=e.supplyOrigin,valid=hydrantPresent(e.hydrant,hydrants)&&Math.hypot(e.model.position.x-e.hydrant.position.x,e.model.position.z-e.hydrant.position.z)<=SUPPLY_REACH&&
  (!origin||Math.hypot(e.model.position.x-origin[0],e.model.position.z-origin[1])<.5&&Math.abs(e.model.rotation.y-origin[2])<.05);
 if(!valid)e.hydrant=null;
 return valid;
}
