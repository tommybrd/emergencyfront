import assert from 'node:assert/strict';
import './game-environment.mjs';
const {engines,police}=await import('../dist/scene.js');
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
console.log('PASS colonne des moyens : Centre, Sud, Police et SAMU montrent chacun leurs véhicules, et le bouton reste allumé');
