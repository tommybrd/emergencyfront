import assert from 'node:assert/strict';
import './game-environment.mjs';
import {adaptSimulationSpeed} from '../dist/simulation-clock.js';
import {DEFENSE_SECTORS,defenseSector,sectorPolygon} from '../dist/defense-sectors.js';
import {dispatchDistance,distanceLabel} from '../dist/dispatch-distance.js';
const s={speed:60,speedMode:'auto',incoming:[],calls:[]};assert.equal(adaptSimulationSpeed(s,1),68);adaptSimulationSpeed(s,10);assert.equal(s.speed,90);s.incoming.push({});assert.equal(adaptSimulationSpeed(s,.25),10);s.incoming=[];s.calls=[{status:'transport'}];assert.equal(adaptSimulationSpeed(s,10),10);s.calls[0].status='closed';assert.equal(adaptSimulationSpeed(s,1),18);s.speedMode='manual';s.speed=30;assert.equal(adaptSimulationSpeed(s,1),30);
for(const station of DEFENSE_SECTORS){assert.equal(defenseSector(station.point),station);const poly=sectorPolygon(station,[[-400,-400],[500,-400],[500,500],[-400,500]]);assert(poly.length>=3);for(const p of poly){const chosen=defenseSector(p),other=DEFENSE_SECTORS.find(x=>x!==station);assert(chosen===station||Math.abs(Math.hypot(p[0]-station.point[0],p[1]-station.point[1])-Math.hypot(p[0]-other.point[0],p[1]-other.point[1]))<1e-6);}}
const e={kind:'VSAV',status:'ready',home:[230,220],localVolunteer:true,external:true,model:{position:{x:230,z:220},userData:{}}},c={id:1,target:[240,183]};const near=dispatchDistance(e,c);assert(near>0&&Number.isFinite(near));assert.match(distanceLabel(e,c),/par la route/);e.model.position.x=-300;e.model.position.z=-200;e.status='returning';assert(dispatchDistance(e,c)>near);assert(Number.isFinite(dispatchDistance(e,{id:2,target:[0,0]})));
console.log('PASS adaptive clock, manual override, incoming/transport phases, station territory ownership, road distances and moving-unit cache invalidation');
const {initWater,setNozzle,tickWater,waterMinutes}=await import('../dist/hydraulics.js');
const {smallFireProgress,smallFireWaterTarget}=await import('../dist/fire-status.js');
for(const scene of ['bin','vehicle'])for(const speed of [10,60,90]){
 const c={type:'INC',scene,spread:.5,progress:0},e={kind:'FPT',size:6,crew:6,status:'scene'};initWater(e);const nozzle=scene==='bin'?'ldt':'small';assert(setNozzle(e,nozzle,1));e.hoses.find(h=>h.key===nozzle).progress=1;
 for(let i=0;i<100000&&c.progress<1;i++){const minutes=waterMinutes(.1*speed/60);tickWater(e,minutes);c.progress+=smallFireProgress(c,e.flow,e.flow,minutes);}
 const used=e.capacity-e.water,target=smallFireWaterTarget(c);assert(c.progress>=1);assert(used>=target&&used<target+10);assert(e.water>0,'Small isolated fire can finish on tank water');
}
assert.equal(smallFireWaterTarget({type:'INC',scene:'bin-room',site:{kind:'building'}}),null);assert.equal(smallFireWaterTarget({type:'INC',scene:'vehicle',batteryFire:true}),null);assert.equal(smallFireProgress({type:'INC',scene:'bin'},0,0,1),0);
console.log('PASS small-fire extinction consumes its balanced water volume at each speed; zero flow cannot extinguish; buildings/batteries excluded');
const {volunteerFleet,mobilizeLocalCrew,tickLocalCrew}=await import('../dist/volunteer-station.js');
for(const minute of [9*60,23*60]){const e={...volunteerFleet[0],status:'departing'};mobilizeLocalCrew(e,minute);assert(e.localCrew.every(p=>p.activity===(minute===23*60?'Domicile':p.id%3!==0?'Travail':'Domicile')));tickLocalCrew(e,minute);assert.equal(e.crew,0);const last=Math.max(...e.localCrew.map(p=>p.arrivalAt));tickLocalCrew(e,last-.01);assert(e.crew<e.size);tickLocalCrew(e,last);assert.equal(e.crew,e.size);}
console.log('PASS South volunteers leave work/home by time of day and all finish changing/boarding before dispatch');
