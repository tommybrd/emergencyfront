import * as T from 'three';
import {box,sign} from './models.js';
import {supplyPath} from './water-supply.js';
import {clearPlacement} from './vehicle-spacing.js';
import {parkingManeuversClear} from './parking.js';
export const LAKE_INTAKE=[105.5,-155],LAKE_SUPPLY_REACH=24;
export const LAKE_PARKING={id:'lake',label:'Aspiration au lac',target:[114,-148.9],entry:[110,-152.9],approach:[111,-148.9],exit:[126,-152.9],yaw:Math.PI/2};
export function createLakeIntake(world){const g=new T.Group();g.name='Point d’aspiration du lac';g.userData.supplyKind='lake';g.position.set(...[LAKE_INTAKE[0],0,LAKE_INTAKE[1]]);world.add(g);box(g,1.6,.09,2,'#7c8b86',1,.04,0);box(g,.08,1.2,.08,'#7c8b86',1,.6,1);sign(g,'ASPIRATION',2,.4,1,1.35,1,'#296779','#e9efe5');return g;}
export function findLakeSupply(e,source,engines=[]){
 if(e.kind!=='CCF'||e.status!=='scene'||!source?.parent||!source.visible||e.supplyProgress>0&&!e.hydrant||engines.some(v=>v!==e&&(v.hydrant===source||v.supplyProgress>0&&v.supplyHydrant===source)))return null;
 if(e.model.position.distanceTo(source.position)>LAKE_SUPPLY_REACH)return null;
 const anchor=source.position.clone();anchor.y=.08;const route=supplyPath(e,anchor);if(!route)return null;const distance=route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0);return distance<=LAKE_SUPPLY_REACH?{hydrant:source,anchor,route,distance}:null;
}
export function lakePlacement(e,c,engines,obstacles){const p=LAKE_PARKING;if(e.kind!=='CCF'||!c||Math.hypot(c.target[0]-p.target[0],c.target[1]-p.target[1])>350||engines.some(v=>v!==e&&v.parking&&Math.hypot(v.parking.target[0]-p.target[0],v.parking.target[1]-p.target[1])<18)||!clearPlacement(e.model,...p.target,p.yaw,obstacles)||!parkingManeuversClear(e.model,p,obstacles))return null;return {...p,distance:Math.round(Math.hypot(c.target[0]-p.target[0],c.target[1]-p.target[1]))};}
