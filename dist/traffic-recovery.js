import {waypointYaw} from './station-routing.js';
import {clearMove,clearPlacement} from './vehicle-spacing.js';

export const MANUAL_RECOVERY_DISTANCE=12;
export function canManualRecovery(v){
 return !!(v.path?.length>1&&['enroute','transport','returning','positioning','moving'].includes(v.status)&&(v.trafficWaiting||v.controlWaiting)&&!v.aerial?.mode&&!v.hydrant&&!v.ladderDeployed);
}
// Explicit player recovery stays on the existing route. Try ahead first, then
// retreat along the approach; never change lanes or skip a whole intersection.
export function manualRecoverySpot(v,obstacles,finalYaw,permitted=()=>true){
 if(!canManualRecovery(v))return null;
 const model=v.model,path=v.path,segment=Math.min(v.segment,path.length),others=obstacles.filter(o=>o!==model);
 for(const direction of[1,-1]){
  let from=[model.position.x,model.position.z],travelled=0;
  for(let i=direction===1?segment:segment-1;i>=0&&i<path.length&&travelled<MANUAL_RECOVERY_DISTANCE;i+=direction){
   const to=path[i],dx=to[0]-from[0],dz=to[1]-from[1],length=Math.hypot(dx,dz);
   if(length<.001){from=to;continue;}
   for(let d=Math.min(1,length);;d=Math.min(length,d+1)){
    const total=travelled+d;
    if(total>MANUAL_RECOVERY_DISTANCE)break;
    if(total>=3){
     const x=from[0]+dx*d/length,z=from[1]+dz*d/length,next=direction===1?(d===length?i+1:i):i+1;
     const yaw=direction===1&&next===path.length&&finalYaw!=null?finalYaw:waypointYaw(path,direction===1?i:i+1,dx*direction,dz*direction);
     const target=path[next],probe={position:{x,z},rotation:{y:yaw},scale:model.scale,userData:model.userData};
     const ahead=target&&Math.hypot(target[0]-x,target[1]-z),step=ahead?Math.min(2,ahead)/ahead:0;
     if(permitted(x,z,yaw)&&clearPlacement(model,x,z,yaw,others)&&(!ahead||clearMove(probe,x+(target[0]-x)*step,z+(target[1]-z)*step,waypointYaw(path,next,target[0]-x,target[1]-z),others)))return{x,z,yaw,segment:next};
    }
    if(d===length)break;
   }
   travelled+=length;from=to;
  }
 }
 return null;
}
// Search distance along the route, not the length of a single smoothed corner.
export function recoverySpot(model,path,segment,obstacles,finalYaw,permitted=()=>true){
 let from=[model.position.x,model.position.z],travelled=0;
 for(let i=segment;i<path.length&&travelled<45;i++){
  const to=path[i],dx=to[0]-from[0],dz=to[1]-from[1],length=Math.hypot(dx,dz);
  if(length<.001){from=to;continue;}
  for(let d=Math.min(2,length);;d=Math.min(length,d+2)){
   const total=travelled+d,last=i===path.length-1&&d===length;
   if(total>=5&&total<=45){const x=from[0]+dx*d/length,z=from[1]+dz*d/length,yaw=last&&finalYaw!=null?finalYaw:waypointYaw(path,i,dx,dz);
    if(permitted(x,z)&&clearPlacement(model,x,z,yaw,obstacles))return{x,z,yaw,segment:d===length?i+1:i};
   }
   if(d===length)break;
  }
  travelled+=length;from=to;
 }
 return null;
}
export function recoveryDue(v,dt,moving){const p=v.model.position;if(!moving){v.blockedSeconds=0;v.recoveryAnchor=null;return false;}if(!v.recoveryAnchor)v.recoveryAnchor=[p.x,p.z];if(Math.hypot(p.x-v.recoveryAnchor[0],p.z-v.recoveryAnchor[1])>=1){v.recoveryAnchor=[p.x,p.z];v.blockedSeconds=0;}v.blockedSeconds=(v.blockedSeconds||0)+dt;return v.blockedSeconds>=20;}
export function resetRecovery(v){v.blockedSeconds=0;v.recoveryAnchor=[v.model.position.x,v.model.position.z];}
