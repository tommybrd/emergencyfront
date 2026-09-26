import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {vehicle} from '../dist/models.js';
import {block} from '../dist/roads.js';
import {locateIncident} from '../dist/incident-location.js';
import {reserveParking,parkingManeuversClear} from '../dist/parking.js';
import {footprint,overlaps} from '../dist/vehicle-spacing.js';
const houses=block.buildings.filter(b=>['house','town'].includes(b.style));
const world=new T.Scene(),fpt={kind:'FPT',model:vehicle(world,'FPT')},epa={kind:'EPA',model:vehicle(world,'EPA')};
let checked=0;
for(let i=0;i<houses.length;i++){
 const c={name:'Feu de cheminée',type:'INC',setting:'home'};
 locateIncident(c,()=> (i+.1)/houses.length);
 if(!c.address.includes('Faubourgs'))continue;
 fpt.parking=null;epa.parking=null;
 const p=reserveParking(fpt,c,[fpt]);
 const distance=Math.hypot(p.target[0]-c.actionPoint[0],p.target[1]-c.actionPoint[1]);
 assert(distance<25,`Faubourgs ${houses[i].x},${houses[i].z}: first pump ${distance.toFixed(1)} m from facade`);
 assert(distance>=9,'Keep fire standoff');
 assert(parkingManeuversClear(fpt.model,p,[]),'Entry and exit remain clear of furniture');
 fpt.parking=p;
 const q=reserveParking(epa,c,[fpt,epa]);
 assert(!overlaps(footprint(fpt.model,...p.target,p.yaw),footprint(epa.model,...q.target,q.yaw)),'EPA reservation stays clear of pump');
 checked++;
}
assert.equal(checked,5);
console.log('PASS five Faubourgs buildings: nearby pump, safe standoff, furniture clearance and separate EPA reservation');
