import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {vehicle,addAmbulanceDoors} from '../dist/models.js';
import {applyVehicleLivery} from '../dist/vehicle-livery.js';
import {fleet} from '../dist/sim.js';
import {volunteerFleet} from '../dist/volunteer-station.js';
import {defaultComposition,normalizeComposition,saveComposition,loadComposition,composedFleet} from '../dist/station-config.js';
import {applyStationComposition} from '../dist/station-live.js';
import {loadServiceSignals,applyServiceSignals} from '../dist/service-signals.js';
for(const kind of ['VSAV','VLCG','VLI','CCF','FPT','VSR','EPA','VTU','VPL','PC','VPCE']){
 const g=vehicle(new T.Group(),kind),parts=g.userData.liveryParts;
 assert(parts.length>0,kind+' has paint/decoration');
 const lamps=[...g.userData.beacons,...g.userData.headlights,...g.userData.rearAmber].map(o=>[o,o.material,o.visible]);
 const wheels=g.userData.wheels.map(o=>o.geometry),length=g.userData.length;
 applyVehicleLivery(g,'plain');assert.equal(g.userData.livery,'plain');
 assert(parts.filter(p=>p.decal).every(p=>!p.object.visible));assert(parts.some(p=>!p.decal&&p.object.material===g.userData.plainLiveryMaterial));
 for(const [o,m,v]of lamps){assert.equal(o.material,m);assert.equal(o.visible,v);}
 assert.equal(g.userData.length,length);assert.deepEqual(g.userData.wheels.map(o=>o.geometry),wheels);
 applyVehicleLivery(g,'service');for(const p of parts){assert.equal(p.object.visible,p.visible);assert.equal(p.object.material,p.material);}
 if(kind==='VSAV'){applyVehicleLivery(g,'plain');addAmbulanceDoors(g);assert(g.userData.rearDoors.every(d=>d.pivot.userData.livery==='plain'&&d.pivot.userData.liveryParts.filter(p=>p.decal).every(p=>!p.object.visible)));}
}
const storage={data:new Map(),getItem(k){return this.data.get(k)},setItem(k,v){this.data.set(k,v)}};
const centre=defaultComposition(fleet),south=defaultComposition(volunteerFleet);centre[0].livery='plain';south[0].livery='plain';
assert(!saveComposition(centre,fleet,storage).error);assert(!saveComposition(south,volunteerFleet,storage).error);
assert.equal(loadComposition(fleet,storage)[0].livery,'plain');assert.equal(loadComposition(volunteerFleet,storage)[0].livery,'plain');
assert.equal(normalizeComposition([{...centre[0],livery:'unknown'}],fleet)[0].livery,'service');
assert(composedFleet(volunteerFleet,south,fleet).some(e=>e.livery==='plain'&&e.localVolunteer));
const make=spec=>({...spec,status:'ready',crew:0,model:{position:{x:spec.home[0],z:spec.home[1]}}});
const units=volunteerFleet.map(make),hooks={create:make,remove:()=>{},templateFleet:fleet};units[0].status='enroute';
assert.equal(applyStationComposition(units,volunteerFleet,south,hooks).pending,1);units[0].status='ready';
assert.equal(applyStationComposition(units,volunteerFleet,south,hooks).changed,1);assert.equal(units[0].livery,'plain');
assert.equal(applyStationComposition(units,volunteerFleet,south,hooks).changed,0);
const config=loadServiceSignals(storage),pickup=vehicle(new T.Group(),'VLCG');config.van.livery='plain';applyServiceSignals(pickup,'van',config);assert.equal(pickup.userData.livery,'plain');config.van.livery='service';applyServiceSignals(pickup,'van',config);assert.equal(pickup.userData.livery,'service');
console.log('PASS both liveries, unchanged lights/wheels/body, reversible VLCG, ambulance doors, independent CIS saves and deferred live changes');
