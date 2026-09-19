import {waypointYaw} from './station-routing.js';
import {clearPlacement} from './vehicle-spacing.js';
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
