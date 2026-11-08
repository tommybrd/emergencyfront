import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {MAIN_BAYS} from '../dist/station-layout.js';
import {stationWalkRoute,stationWalkClear,stationBoardingRoute,stationDirectRoute,boardingAccess,STAFF_LOCKER,STAFF_ENTRY_ROUTE} from '../dist/station-access.js';
import {stationWalk} from '../dist/volunteer-travel.js';
import {crewPosition,prepareCrew,boardingPosition,upgradeStationBoarding} from '../dist/crew.js';
import {createGarage} from '../dist/garage.js';
import {stationLife} from '../dist/station-life.js';
const clear=path=>{for(let i=1;i<path.length;i++)assert(stationWalkClear(path[i-1],path[i]),`Blocked pedestrian segment ${path[i-1]} → ${path[i]}`);};
assert(!stationWalkClear([-28,114],[-39,43]),'The former diagonal crosses the compound boundary');
assert(!stationWalkClear([-72,51],[-72,99]),'A shutter/parked bay cannot be a shortcut to sport');
for(const z of[124,146])for(const x of[-95,-64.4,-33.8]){const path=stationWalk([x,z]);clear(path);assert(path.some(p=>p[0]===-28&&p[1]===54),'Recalled staff use the side wicket');assert.deepEqual(path.at(-1),STAFF_LOCKER);clear(path.slice().reverse());}
for(const minute of[0,480,510,550,600,610,700,720,840,1100,1320])for(let slot=0;slot<50;slot++){
 const from=crewPosition({id:slot+1,slot},minute);if(from[0]>0)continue;clear(stationWalkRoute(from,STAFF_LOCKER));
}
const world=new T.Group();createGarage(world);const life=stationLife(world),ray=new T.Raycaster();
world.updateMatrixWorld(true);const solid=[];world.traverse(o=>{if(o.isMesh)solid.push(o);});
function physicalClear(path){for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<.01)continue;const direction=new T.Vector3((b[0]-a[0])/d,0,(b[1]-a[1])/d);ray.set(new T.Vector3(a[0],1.3,a[1]),direction);ray.far=d-.01;const hit=ray.intersectObjects(solid,false).find(h=>h.object.isMesh&&!h.object.userData.personId);assert(!hit,`Physical wall or door on ${a} → ${b}: ${hit?.point.toArray()}`);}}
physicalClear(STAFF_ENTRY_ROUTE);
for(const b of MAIN_BAYS){const route=stationBoardingRoute(STAFF_LOCKER,{home:[b.x,71]});clear(route);physicalClear(route);assert(route.some(p=>p[0]===b.x+1.95&&p[1]===61),'Use a genuine rear staff door, never the closed shutter');}
// A dressed VSAV crew walks straight to its own raised shutter; only that shutter may be crossed.
const vsavBay=MAIN_BAYS.find(b=>b.group==='medical'),ownDoorRoute=from=>{const route=stationDirectRoute(from,{home:[vsavBay.x,71]});clear(route.slice(0,-1));return route;};
const fromYard=ownDoorRoute([-73,86]);assert.deepEqual(fromYard.at(-1),boardingAccess({home:[vsavBay.x,71]}));assert(fromYard.at(-2)[1]===79,'The yard crew enters through the front of its own bay');assert(!fromYard.some(p=>p[0]===STAFF_LOCKER[0]&&p[1]===STAFF_LOCKER[1]));
const dressed=(minute,kind='VSAV',home=[vsavBay.x,71])=>{const person={id:3,slot:3,present:true},e={kind,home,crewIds:[3]},total=prepareCrew({roster:[person],minute},e,()=>.5,[]);return{total,path:e.boarding[0].path};},viaLocker=path=>path.some(p=>p[0]===STAFF_LOCKER[0]&&p[1]===STAFF_LOCKER[1]);
assert(!viaLocker(dressed(524).path),'Rassemblement dans la cour : le VSAV part sans vestiaire');assert(dressed(524).total<3,'VSAV crew only has to climb aboard');
assert(!viaLocker(dressed(1000).path),'Manœuvre : déjà en tenue de service');
assert(viaLocker(dressed(524,'FPT',[MAIN_BAYS[2].x,71]).path),'Fire engines still collect fire kit');assert(viaLocker(dressed(100).path),'Night crew dresses first');assert(viaLocker(dressed(650).path),'Sport kit is changed first');
for(const minute of[0,480,510,524,525,550,840,1100,1320])for(let slot=0;slot<50;slot++){const from=crewPosition({id:slot+1,slot},minute);if(from[0]<=0)for(const b of MAIN_BAYS.filter(b=>b.group==='medical')){const route=stationDirectRoute(from,{home:[b.x,71]}),last=route.at(-2)[1]===79?route.slice(0,-1):route;clear(last);}}
// Actual life animation follows a path when moving from sleeping rooms to the apron.
const p={id:1,slot:0,present:true},s={roster:[p],minute:359,playerProfile:{outfit:'station'}};life.update(0,s,[]);s.minute=510;life.update(1,s,[]);
let previous=p.stationPoint.point;assert(stationWalkClear([-87,18],previous));
for(let i=1;i<160;i++){s.minute=510+i*.1;life.update(i,s,[]);assert(stationWalkClear(p.stationPoint.point,p.stationPoint.point),`Actor inside a wall at ${s.minute}: ${p.stationPoint.point}`);world.traverse(o=>{if(o.userData.roomWalk)clear(o.userData.roomWalk.path);});previous=p.stationPoint.point.slice();}
const e={home:[MAIN_BAYS[0].x,71],crewIds:[1]},before=p.stationPoint.point.slice();prepareCrew({...s,minute:s.minute},e,()=>0,[]);assert.deepEqual(e.boarding[0].from,before,'Departure starts from the person actually walking, not their future activity');clear(e.boarding[0].path);
for(let i=0;i<=100;i++)assert(boardingPosition(e.boarding[0],i/100).point.every(Number.isFinite));
const legacy={status:'departing',wasAtStation:true,home:[MAIN_BAYS[0].x,71],alertAt:0,departAt:30,boarding:[{id:1,path:[[-72,51],[-28,57],[-28,78],[-105,78],[-105,71]],delay:1,duration:30}]};assert(upgradeStationBoarding({minute:8},legacy));assert.equal(legacy.boarding[0].accessVersion,151);clear(legacy.boarding[0].path);assert(!upgradeStationBoarding({minute:8},legacy),'Migration is idempotent');
const full={roster:Array.from({length:50},(_,slot)=>({id:slot+1,slot,present:true})),minute:480,playerProfile:{outfit:'station'}};for(const minute of[480,481,510,524,525,550,600,601,640,680,719,720,840,1080,1320]){full.minute=minute;life.update(minute,full,[]);for(const person of full.roster)assert(stationWalkClear(person.stationPoint.point,person.stationPoint.point),`Activity inside wall: ${minute}, ${person.id}`);}
const inspector={id:1,slot:0,present:true},checkState={roster:[inspector],minute:550,playerProfile:{outfit:'station'}},inspectionFleet=MAIN_BAYS.slice(0,2).map((b,i)=>{const model=new T.Group();model.position.set(b.x,.2,71);model.userData.length=6;return{id:'Inspection '+i,status:'ready',model};});life.update(550,checkState,inspectionFleet);const inspectionBefore=inspector.stationPoint.point.slice();inspectionFleet[0].status='departing';life.update(551,checkState,inspectionFleet);assert.deepEqual(inspector.stationPoint.point,inspectionBefore,'A changed inspection vehicle starts a real walk, not a jump through bay partitions');
console.log('PASS physical staff wicket and doors, 450 activity origins, all 14 rear bay accesses, no barrier/shutter shortcut, actual walking departure and reciprocal SPV route');
