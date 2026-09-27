import assert from 'node:assert/strict';
import './game-environment.mjs';
import {PROFILE_KEY,DEFAULT_PROFILE,loadProfile,saveProfile,normalizeProfile,profileForm} from '../dist/player-profile.js';
import {footprint,overlaps} from '../dist/vehicle-spacing.js';
import {canChangePlayerVehicle,PLAYER_PARKING,parkedPlayerVehicles} from '../dist/player-vehicle.js';
import {vehicle,captain,dressCaptain} from '../dist/models.js';
import {radioPanel} from '../dist/command.js';

const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
assert.deepEqual(loadProfile(),DEFAULT_PROFILE);
memory.set(PROFILE_KEY,'{corrupt');assert.deepEqual(loadProfile(),DEFAULT_PROFILE);
assert.deepEqual(normalizeProfile({name:'  Léa   Martin\n',grade:'__proto__',outfit:'unknown',vehicle:'truck'}),{...DEFAULT_PROFILE,name:'Léa Martin'});
assert.equal(normalizeProfile({name:'a'.repeat(60)}).name.length,32);
assert(!profileForm({name:'"><img src=x onerror=alert(1)>'},true).includes('<img'));
assert(!radioPanel({events:[{message:'<img src=x onerror=alert(1)>'}]}).includes('<img'));
const initial={name:'Léa Martin',grade:'commandant',outfit:'station',vehicle:'car'};
assert(saveProfile(initial));assert.deepEqual(loadProfile(),{...initial,vehicle:"van"});

const {state,engines,applyPlayerProfile,showPlayerProfile,onCall,selectIncident,selectEngine,engageUnits,tickEngines,returnEngine,camera,controls}=await import('../dist/scene.js');
state.schedule=[];state.calls=[];state.shiftEnd=100000;state.paused=true;
const cg=engines.find(e=>e.kind==='VLCG'),player=state.roster.find(p=>p.role==='captain'),world=cg.model.parent;
assert.equal(engines.filter(e=>!e.external).length,14);assert.equal(engines.filter(e=>e.kind==='VLCG').length,1);
assert.equal(state.freeStaff,11);assert.equal(player.name,'Léa Martin');assert.equal(player.grade,'commandant');assert.equal(player.role,'captain');
assert.equal(cg.name,'Commandant Léa Martin · chef de centre');
assert.equal(cg.model.userData.bodyStyle,'hilux-pickup');
assert.deepEqual(Object.keys(cg.playerVehicles),['van']);assert.equal(parkedPlayerVehicles(cg).length,0);
assert.deepEqual([cg.model.position.x,cg.model.position.z],cg.home);
assert(!profileForm(initial,true).includes('playerVehicle'));
const identity=cg.model;assert.equal(applyPlayerProfile(initial,false).pending,false);assert.equal(cg.model,identity);

// The station and field avatars both use the selected outfit, without rebuilding every frame.
globalThis.frame(performance.now());const avatars=[];world.traverse(o=>{if(o.userData.role==='captain')avatars.push(o);});
assert.equal(avatars.length,2);assert(avatars.every(a=>a.userData.outfit==='station'));
applyPlayerProfile({...initial,outfit:'fire'},false);globalThis.frame(performance.now());assert(avatars.every(a=>a.userData.outfit==='fire'));
const uniform=avatars[0].userData.uniform;dressCaptain(avatars[0],state.playerProfile);assert.equal(avatars[0].userData.uniform,uniform);
const childCount=avatars[0].children.length;
for(const outfit of['station','command','fire','station','command'])dressCaptain(avatars[0],{...initial,outfit});
assert.equal(avatars[0].children.length,childCount,'outfit changes do not accumulate meshes');

// A choice made while mobilized waits until the crew has returned, including cancellation.
const c={id:900,type:'INC',name:'Feu de véhicule',requires:'FPT',at:480,status:'waiting',progress:0};state.calls.push(c);onCall(c);selectIncident(c.id);
const cameraBefore=camera.position.toArray(),targetBefore=controls.target.toArray();assert.equal(engageUnits(['VLCG']),null);assert.deepEqual(camera.position.toArray(),cameraBefore);assert.deepEqual(controls.target.toArray(),targetBefore);assert(!document.getElementById('incidentPanel').innerHTML.includes('class="crewRoster"'));assert.equal(player.engine,'VLCG');assert.equal(cg.crew,1);assert.equal(state.freeStaff,11);assert(!cg.beacons);
const departingModel=cg.model;assert.equal(applyPlayerProfile({...initial,vehicle:'car'},false).pending,false);assert.equal(cg.model,departingModel);assert.equal(cg.call,c.id);
returnEngine(cg);assert.equal(cg.status,'ready');assert.equal(cg.model.userData.playerVehicle,'van');assert.equal(player.engine,null);assert.equal(cg.crew,0);
applyPlayerProfile(initial,false);

const step=()=>{state.minute+=.25;tickEngines(.25);for(const e of engines)if(e!==cg)assert(!overlaps(footprint(cg.model),footprint(e.model)),'VLCG overlaps '+e.id);};
for(const variant of['van']){
 selectIncident(c.id);assert.equal(engageUnits(['VLCG']),null);
 for(let n=0;n<200&&cg.status==='departing';n++)step();
 assert.equal(cg.status,'enroute');assert(cg.beacons);assert.equal(cg.model.userData.playerVehicle,variant);
 if(variant==='car'){const current=cg.model;assert.equal(applyPlayerProfile({...initial,vehicle:'car'},false).pending,false);assert.equal(cg.model,current);}
 for(let n=0;n<4000&&cg.status!=='scene';n++)step();
 assert.equal(cg.status,'scene');assert.equal(cg.model.userData.playerVehicle,variant);assert.equal(cg.command,true);assert.equal(player.engine,'VLCG');
 assert(c.radio.some(r=>r.sender==='Commandant Léa Martin'));
 returnEngine(cg);for(let n=0;n<4000&&cg.status!=='ready';n++)step();
 assert.equal(cg.status,'ready');assert(canChangePlayerVehicle(cg));assert.equal(cg.model.userData.playerVehicle,'van');assert.equal(cg.crew,0);assert.equal(player.engine,null);assert.equal(state.freeStaff,11);
}

// Exercise the profile dialog handlers: pause, cancel, save, and restore a pre-existing pause.
const modal=document.getElementById('modal'),callbacks=[];
modal.showModal=()=>{modal.open=true;};modal.close=()=>{modal.open=false;for(const f of callbacks.splice(0))f();};
modal.addEventListener=(type,fn)=>{if(type==='close')callbacks.push(fn);};document.getElementById('playerName').focus=()=>{};
state.paused=false;const before={...state.playerProfile};showPlayerProfile();assert(state.paused);modal.close();assert(!state.paused);assert.deepEqual(state.playerProfile,before);
state.paused=true;showPlayerProfile();modal.close();assert(state.paused);
state.paused=false;showPlayerProfile();const values={playerName:'Alex <Test>',playerGrade:'lieutenant',playerOutfit:'command',playerVehicle:'car'};
document.getElementById('playerProfileForm').onsubmit({preventDefault(){},currentTarget:{elements:{namedItem:key=>({value:values[key]})}}});
assert(!modal.open);assert(!state.paused);assert.equal(cg.model.userData.playerVehicle,'van');assert.equal(loadProfile().name,'Alex <Test>');
document.getElementById('captainCard').onclick();assert.equal(document.getElementById('captainName').textContent,'Lieutenant Alex <Test>');
assert(!document.getElementById('vehiclePanel').innerHTML.includes('data-player-vehicle'));assert(!document.getElementById('vehiclePanel').innerHTML.includes('Voiture de service'));assert(document.getElementById('vehiclePanel').innerHTML.includes('Alex &lt;Test&gt;'));assert(!document.getElementById('vehiclePanel').innerHTML.includes('Alex <Test>'));
globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
assert.deepEqual(loadProfile(),DEFAULT_PROFILE);assert.equal(applyPlayerProfile(initial).saved,false);assert.equal(state.playerProfile.name,initial.name);
console.log('PASS player profile: persistence, name safety, crew identity, single pickup, legacy car migration, no spare car, outfits, round trip and dialog pause/save/cancel');
