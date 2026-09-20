import {lakePlacement} from './lake-supply.js';
import {roads,projectRoad,block} from './roads.js';
import {clearPlacement,footprint,overlaps} from './vehicle-spacing.js';
import {inLake} from './beach-layout.js';
import {parkingManeuversClear} from './parking.js';
import {aerialBusy} from './aerial-operations.js';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export const tacticalKinds=['VSAV','EPA','FPT','CCF'];
export function placementError(e,c){
 if(!c||c.status==='closed'||c.siteCompletedAt!=null||e.call!==c.id||!tacticalKinds.includes(e.kind)||!['departing','enroute','scene'].includes(e.status))return 'Placement indisponible pendant cette phase.';
 if(e.ventilationCrew)return 'Ventilation en cours : attendez le rangement du matériel.';
 if(e.buildingCrew)return 'Mise en sécurité en cours : attendez le retour de l’équipe avant de déplacer l’engin.';
 if(aerialBusy(e)||e.externalFlow>0)return 'Repliez la nacelle et son alimentation avant de déplacer l’engin.';
 if(e.hydrant||e.supplyProgress>0||e.hoses?.some(h=>h.progress>0)||Object.values(e.nozzles||{}).some(Boolean))return 'Repliez les lances et l’alimentation avant de déplacer l’engin.';
 if(e.ladderDeployed||e.zoneLighting||e.zoneLightRig?.extension>0)return 'Repliez l’échelle et l’éclairage avant de déplacer l’engin.';
 if(e.kind==='VSAV'&&e.patientAssigned)return 'Prise en charge en cours : le VSAV reste auprès de la victime.';
 if(c.complication?.status==='active'&&c.complication.unitId===e.id)return 'Sauvetage en cours : cet engin doit rester en place.';
 return null;
}

export function tacticalChoices(e,c,engines,{hydrants=[],obstacles=engines.map(v=>v.model)}={}){
 if(placementError(e,c)||c.waterRescue||c.setting==='beach')return [];
 const access=c.accessTarget||c.target,action=c.actionPoint||access,candidates=[];
 for(const road of roads){
  if(road.name.includes('(simulation)')||road.trail&&e.kind!=='CCF')continue;
  const dx=road.b[0]-road.a[0],dz=road.b[1]-road.a[1],len=Math.hypot(dx,dz);
  if(len<44||distance(projectRoad(access,road),access)>50)continue;
  const dir=[dx/len,dz/len],projection=projectRoad(action,road),base=(projection[0]-road.a[0])*dir[0]+(projection[1]-road.a[1])*dir[1];
  for(const shift of[0,-18,18,-36,36,-54,54])for(const side of[-1,1]){
   const at=Math.max(22,Math.min(len-22,base+shift)),laneWidth=road.express?5:road.trail?1.3:2.1,shoulder=laneWidth+4;
   const center=[road.a[0]+dir[0]*at,road.a[1]+dir[1]*at],target=[center[0]+dir[1]*side*shoulder,center[1]-dir[0]*side*shoulder],heading=[-side*dir[0],-side*dir[1]],yaw=Math.atan2(...heading);
   if(distance(target,access)>85||candidates.some(p=>distance(p.target,target)<10)||e.parking&&distance(e.parking.target,target)<8)continue;
   if(inLake(target)||block.buildings.some(b=>Math.abs(target[0]-b.x)<b.w/2+2.5&&Math.abs(target[1]-b.z)<b.d/2+2.5))continue;
   if(!clearPlacement(e.model,...target,yaw,obstacles)||engines.some(v=>v!==e&&v.parking&&(distance(target,v.parking.target)<18||overlaps(footprint(e.model,...target,yaw),footprint(v.model,...v.parking.target,v.parking.yaw)))))continue;
   if(c.type==='INC'&&distance(target,action)<(e.kind==='VSAV'?20:9))continue;
   const lane=[center[0]+dir[1]*side*laneWidth,center[1]-dir[0]*side*laneWidth];
   candidates.push({target,entry:[lane[0]-heading[0]*8,lane[1]-heading[1]*8],approach:[target[0]-heading[0]*3,target[1]-heading[1]*3],exit:[lane[0]+heading[0]*8,lane[1]+heading[1]*8],yaw,distance:Math.round(distance(target,action))});
  }
 }
 const choices=[];
  function pick(id,label,score){const remaining=candidates.filter(p=>choices.every(q=>distance(p.target,q.target)>15));remaining.sort((a,b)=>score(a)-score(b));const choice=remaining.find(p=>parkingManeuversClear(e.model,p,obstacles));if(choice)choices.push({...choice,id,label});}
 pick('access',e.kind==='VSAV'?'Accès victime':e.kind==='EPA'?(c.site?.kind==='building'?'Face au bâtiment':'Accès sauvetage'):'Attaque',p=>distance(p.target,action));
 if(e.capacity&&hydrants.length){const near=hydrants.filter(h=>distance([h.position.x,h.position.z],access)<85);if(near.length)pick('water','Près du poteau',p=>Math.min(...near.map(h=>distance(p.target,[h.position.x,h.position.z])))+distance(p.target,action)*.2);}
 pick('back',e.kind==='VSAV'?'Accès dégagé':'En retrait',p=>Math.abs(distance(p.target,action)-40));
 const lake=lakePlacement(e,c,engines,obstacles);if(lake)choices.push(lake);
 return choices;
}
