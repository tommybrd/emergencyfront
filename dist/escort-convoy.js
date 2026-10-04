const position=vehicle=>vehicle?.model?.position;

function routeDirection(vehicle){
 const at=position(vehicle),target=vehicle?.path?.[vehicle.segment||1];
 if(!at||!target)return null;
 const dx=target[0]-at.x,dz=target[1]-at.z,length=Math.hypot(dx,dz);
 return length>.01?[dx/length,dz/length]:null;
}

export function escortSpacing(vli,vsav){
 const a=position(vli),b=position(vsav);
 if(!a||!b)return{distance:Infinity,ahead:0};
 const dx=a.x-b.x,dz=a.z-b.z,distance=Math.hypot(dx,dz);
 const direction=routeDirection(vsav)||[Math.sin(vsav.model.rotation.y),Math.cos(vsav.model.rotation.y)];
 return{distance,ahead:dx*direction[0]+dz*direction[1]};
}

// The VLI leads the medical convoy by roughly one vehicle length. It slows
// before reaching the holding distance, then stops until the VSAV closes up.
export function escortPace(vli,vsav){
 const {distance,ahead}=escortSpacing(vli,vsav);
 if(ahead<=1)return 1;
 if(distance>=11.5)return 0;
 if(distance>=9)return .45;
 if(distance>=7.5)return .72;
 return 1;
}

export function escortTravelAllowance(vli,vsav){
 const {distance,ahead}=escortSpacing(vli,vsav);
 return ahead>1?Math.max(0,11.5-distance):Infinity;
}

export function escortDepartureReady(vli,vsav){
 const {distance,ahead}=escortSpacing(vli,vsav);
 return distance>=6.75&&ahead>=5.5;
}
