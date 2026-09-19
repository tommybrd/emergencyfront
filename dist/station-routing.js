import {smoothRoute} from './route3d.js';
import {PLAYER_HOME} from './player-home.js';
import {PLAYER_PARKING} from './player-vehicle.js';
export const STATION_GATE=[-70,105];
export const bayYaw=e=>e.home[0]<-70?Math.PI/2:-Math.PI/2;
// Returning vehicles stop at the apron, then reverse along the aisle into their
// own bay. They finish facing out, so the next departure never needs a U-turn.
export function stationPath(e,start,target,status,streetRoute,options={}){
 if(e.kind==='VLCG'&&e.atResidence&&Math.hypot(start[0]-PLAYER_HOME.parking[0],start[1]-PLAYER_HOME.parking[1])<1){
  const exit=smoothRoute([start,[10,119],PLAYER_HOME.exit]);
  return [...exit,...stationPath(e,PLAYER_HOME.exit,target,status,streetRoute,{...options,startYaw:PLAYER_HOME.yaw}).slice(1)];
 }
 if(e.kind==='VLCG'&&status==='returning'&&e.returnTo==='home'){
  const road=stationPath(e,start,PLAYER_HOME.entry,'homebound',streetRoute,{...options,endYaw:PLAYER_HOME.yaw});
  return [...road,...smoothRoute([PLAYER_HOME.entry,PLAYER_HOME.approach,PLAYER_HOME.parking]).slice(1)];
 }
 if(e.kind==='VLCG'&&e.model.userData.playerVehicle==='car'){
  if(status==='returning'){
   const road=smoothRoute(streetRoute(start,PLAYER_PARKING.entry,{...options,endYaw:-Math.PI/2}));
   const approach=smoothRoute([PLAYER_PARKING.entry,[-30,102.9],[-30,99]]);const reverse=smoothRoute([[-30,99],PLAYER_PARKING.point]);reverse.forEach(p=>p.gear=-1);
   return [...road,...approach.slice(1),...reverse.slice(1)];
  }
  if(Math.hypot(start[0]-PLAYER_PARKING.point[0],start[1]-PLAYER_PARKING.point[1])<1){
   const exit=smoothRoute([start,[-30,100],[-29,104],[-25,107.1],PLAYER_PARKING.exit]);
   return [...exit,...smoothRoute(streetRoute(PLAYER_PARKING.exit,target,{...options,startYaw:Math.PI/2})).slice(1)];
  }
 }
 if(status==='returning'&&!e.external){
  const road=smoothRoute(streetRoute(start,STATION_GATE,options));
  const reverse=smoothRoute([STATION_GATE,[-70,e.home[1]],e.home]);
  reverse.forEach(p=>p.gear=-1);
  return [...road,...reverse.slice(1)];
 }
 if(!e.external&&!(e.kind==='VLCG'&&e.model.userData.playerVehicle==='car')&&(e.status==='ready'&&!e.atResidence||e.status==='departing'&&e.wasAtStation||start[0]>-96&&start[0]<-44&&start[1]>=52&&start[1]<=105))return smoothRoute([start,[-70,start[1]],STATION_GATE,...streetRoute(STATION_GATE,target,options)]);
 return smoothRoute(streetRoute(start,target,options));
}
export function waypointYaw(path,segment,dx,dz){return Math.atan2(dx,dz)+(path?.[segment]?.gear===-1?Math.PI:0);}
