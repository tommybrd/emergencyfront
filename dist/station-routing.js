import {smoothRoute} from './route3d.js';
import {PLAYER_HOME} from './player-home.js';
import {PLAYER_PARKING} from './player-vehicle.js';
export const STATION_GATE=[-70,105];
export const bayYaw=e=>e.home[0]<-70?Math.PI/2:-Math.PI/2;
// Cross the open departure court forwards; reverse only for the final bay manoeuvre.
export function stationPath(e,start,target,status,streetRoute,options={}){
 if(e.localVolunteer){const gate=[240,205],entry=[235,183];if(status==='returning'){const route=smoothRoute(streetRoute(start,entry,options)),reverse=smoothRoute([entry,gate,[e.home[0],207],[...e.home]]);reverse.forEach(p=>p.gear=-1);return [...route,...reverse.slice(1)];}if(Math.hypot(start[0]-e.home[0],start[1]-e.home[1])<2)return [...smoothRoute([start,[e.home[0],207],gate,entry]),...smoothRoute(streetRoute(entry,target,options)).slice(1)];}
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
  const apron=[e.home[0]<-70?-77:-63,e.home[1]];
  const approach=smoothRoute([STATION_GATE,[-70,101],[-70,e.home[1]],apron]);
  const reverse=smoothRoute([apron,[...e.home]]);
  reverse.forEach(p=>p.gear=-1);
  return [...road,...approach.slice(1),...reverse.slice(1)];
 }
 if(!e.external&&!(e.kind==='VLCG'&&e.model.userData.playerVehicle==='car')&&(e.status==='ready'&&!e.atResidence||e.status==='departing'&&e.wasAtStation||start[0]>-99&&start[0]<-41&&start[1]>=57&&start[1]<=105))return smoothRoute([start,[-70,start[1]],STATION_GATE,...streetRoute(STATION_GATE,target,options)]);
 return smoothRoute(streetRoute(start,target,options));
}
export function waypointYaw(path,segment,dx,dz){return Math.atan2(dx,dz)+(path?.[segment]?.gear===-1?Math.PI:0);}

// Preserve ongoing guards when loading the former narrow-remise layout.
export function migrateStationBay(e){
 if(e.external||![-84,-56].includes(e.home?.[0]))return false;
 const old=e.home,west=old[0]===-84,index=(old[1]-52)/(west?5:10);
 if(!Number.isInteger(index)||index<0||index>(west?8:4))return false;
 e.home=[west?-91:-49,60+index*(west?4.5:9)];return true;
}
