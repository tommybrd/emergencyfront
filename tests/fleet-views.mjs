import assert from 'node:assert/strict';
import './game-environment.mjs';
import {roleRefusal} from '../dist/player-role.js';
import {policeBeacons} from '../dist/police.js';
const {engines,police,state,onCall,selectIncident}=await import('../dist/scene.js');
const $=id=>document.getElementById(id),fleet=()=>$('fleet').innerHTML;
const cards=()=>[...fleet().matchAll(/data-engine="([^"]+)"/g)].map(m=>m[1]);
// L'environnement de test ignore les classes : ces éléments reçoivent une vraie liste.
for(const id of['garage','garageSouth','viewPolice','viewSamu','fleetSidebar']){const set=new Set();$(id).classList={toggle:(name,on)=>on?set.add(name):set.delete(name),add:name=>set.add(name),remove:name=>set.delete(name),contains:name=>set.has(name)};}
const lit=()=>['garage','garageSouth','viewPolice','viewSamu'].filter(id=>$(id).classList.contains('active'));

$('viewSamu').onclick();
assert.deepEqual(lit(),['viewSamu']);assert.equal($('fleetTitle').textContent,'SAMU · Centre hospitalier');
assert.deepEqual(cards().sort(),engines.filter(e=>e.kind==='SAMU').map(e=>e.id).sort());assert.equal(cards().length,2);assert($('fleetSidebar').classList.contains('foreignBase'));

$('viewPolice').onclick();
assert.deepEqual(lit(),['viewPolice']);assert.equal($('fleetTitle').textContent,'Commissariat');assert.equal(cards().length,0);
for(const v of police.units)assert(fleet().includes(`data-police-unit="${v.id}"`),v.id+' is listed');assert.match(fleet(),/En patrouille/);
// La BAC reste à portée sans unité sur la carte, et part sur l'intervention sélectionnée.
assert(!police.units.some(v=>v.force==='BAC'));assert.match(fleet(),/data-police-force="BAC"[^>]*disabled/);assert.match(fleet(),/Choisir une intervention/);
const clickBac=()=>$('fleet').onclick({target:{closest:selector=>selector==='[data-police-force]'?{dataset:{policeForce:'BAC'}}:null}});
const call={id:77,type:'SUAP',name:'Rixe',requires:'VSAV',at:state.minute,status:'waiting',progress:0,radio:[]};state.calls.push(call);onCall(call);selectIncident(call.id);$('viewPolice').onclick();
assert.match(fleet(),/Mobiliser · I77/);assert(!/data-police-force="BAC"[^>]*disabled/.test(fleet()));
clickBac();const bac=police.units.find(v=>v.force==='BAC');assert.equal(bac?.call,call.id,'BAC is mobilised on the selected call');assert.match(fleet(),/data-police-unit="BAC 1"/);assert.match(fleet(),/Déjà engagée/);
// La Gendarmerie se mobilise de la même façon et vient de sa brigade, pas du commissariat.
assert.match(fleet(),/data-police-force="GN"/);$('fleet').onclick({target:{closest:selector=>selector==='[data-police-force]'?{dataset:{policeForce:'GN'}}:null}});
const gn=police.units.find(v=>v.force==='GN');assert.equal(gn?.id,'GN 1');assert.equal(gn.call,call.id);assert.match(fleet(),/data-police-unit="GN 1"/);assert.match(police.request(state,call,'GN').error,/déjà engagée/);
state.calls.splice(state.calls.indexOf(call),1);
assert.equal(roleRefusal({role:'caserne'},{closest:selector=>selector.includes('[data-police-force]')?{}:null}),'La salle coordonne la police et les équipes spécialisées.');

$('garageSouth').onclick();
assert.deepEqual(lit(),['garageSouth']);assert.equal($('fleetTitle').textContent,'CIS Sud');
assert.deepEqual(cards().sort(),engines.filter(e=>e.localVolunteer).map(e=>e.id).sort());assert(cards().length>0);

$('garage').onclick();
assert.deepEqual(lit(),['garage']);assert.equal($('fleetTitle').textContent,'CIS Centre');assert(!$('fleetSidebar').classList.contains('foreignBase'));
assert(cards().length>0);assert(cards().every(id=>!engines.find(e=>e.id===id).external),'Centre lists its own engines only');

// Choisir un engin garde la base affichée et le bouton allumé.
$('viewSamu').onclick();const smur=cards()[0];
$('fleet').onclick({target:{closest:selector=>selector==='[data-engine]'?{dataset:{engine:smur}}:null}});
assert.deepEqual(lit(),['viewSamu']);assert.equal(cards().length,2);
// SMUR et police : mêmes commandes de signalisation que les engins.
assert.match($('vehiclePanel').innerHTML,/data-blue[^]*data-siren[^]*data-siren-once/,'SMUR panel has the signal keys');
const smurUnit=engines.find(e=>e.id===smur);$('vehiclePanel').onclick({target:{closest:selector=>selector==='[data-siren]'?{}:null}});assert(smurUnit.siren&&smurUnit.beacons,'Siren key drives the SMUR');
smurUnit.siren=false;smurUnit.beacons=false;
$('viewPolice').onclick();const car=police.units[0];
$('fleet').onclick({target:{closest:selector=>selector==='[data-police-unit]'?{dataset:{policeUnit:car.id}}:null}});
assert.match($('vehiclePanel').innerHTML,/data-unit-blue[^]*data-unit-siren[^]*data-unit-siren-once/,'Police panel has the signal keys');assert(!policeBeacons(car));
const key=attr=>$('vehiclePanel').onclick({target:{closest:selector=>selector===attr?{}:null}});
key('[data-unit-blue]');assert(policeBeacons(car));key('[data-unit-siren]');assert(car.siren);key('[data-unit-blue]');assert(!policeBeacons(car)&&!car.siren,'Beacons off also stops the siren');
assert.equal(roleRefusal({role:'agres'},{closest:selector=>selector.includes('[data-police-signal]')?{}:null}),'La salle coordonne la police et les équipes spécialisées.');
console.log('PASS colonne des moyens : Centre, Sud, Police et SAMU montrent chacun leurs véhicules, et le bouton reste allumé');
