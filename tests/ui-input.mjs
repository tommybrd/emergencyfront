import assert from 'node:assert/strict';
import './game-environment.mjs';
const listeners=new Map();window.addEventListener=(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);};
const {setMarkup}=await import('../dist/scene.js');
const button={closest:()=>button},panel={innerHTML:'',contains:x=>x===button,querySelectorAll:()=>[]};
setMarkup(panel,'Before');for(const fn of listeners.get('pointerdown'))fn({target:button});setMarkup(panel,'During press');assert.equal(panel.innerHTML,'Before','Preserve the pressed button until the click is delivered');
for(const fn of listeners.get('pointerup'))fn({target:button});setMarkup(panel,'Before click');assert.equal(panel.innerHTML,'Before');await new Promise(r=>setTimeout(r,5));setMarkup(panel,'After click');assert.equal(panel.innerHTML,'After click','Live updates resume after the interaction');
console.log('PASS refresh cannot remove a button between pointerdown and click');

const {cameraKeys,panKeyboard,camera,controls,state}=await import('../dist/scene.js');
const emit=(type,key,extra={})=>{let prevented=false;const event={key,target:{closest:()=>null},preventDefault(){prevented=true;},...extra};for(const fn of listeners.get(type)||[])fn(event);return prevented;};
const origin=camera.position.clone(),target=controls.target.clone();
const reset=()=>{cameraKeys.clear();camera.position.copy(origin);controls.target.copy(target);};
for(const [letter,arrow] of [['q','ArrowLeft'],['z','ArrowUp'],['s','ArrowDown'],['d','ArrowRight']]){
 reset();assert(emit('keydown',letter));panKeyboard(.2);const expected=camera.position.clone();assert(expected.distanceTo(origin)>0);emit('keyup',letter);
 reset();assert(emit('keydown',arrow),'camera arrows prevent page scrolling');panKeyboard(.2);assert(camera.position.distanceTo(expected)<1e-9,arrow+' matches '+letter);assert(controls.target.clone().sub(target).distanceTo(camera.position.clone().sub(origin))<1e-9,'camera and target move together');
 emit('keyup',arrow);const stopped=camera.position.clone();panKeyboard(.2);assert(camera.position.distanceTo(stopped)<1e-9,'release stops camera movement');
}
reset();emit('keydown','z');emit('keydown','ArrowUp');emit('keyup','ArrowUp');assert(cameraKeys.has('z'),'releasing an alias keeps the other held key active');panKeyboard(.2);assert(camera.position.distanceTo(origin)>0);emit('keyup','z');
reset();emit('keydown','ArrowUp');panKeyboard(.2);const singleDistance=camera.position.distanceTo(origin);
reset();emit('keydown','ArrowUp');emit('keydown','ArrowRight');panKeyboard(.2);assert(Math.abs(camera.position.distanceTo(origin)-singleDistance)<1e-9,'diagonals retain the same speed');
for(const fn of listeners.get('blur')||[])fn();assert.equal(cameraKeys.size,0,'blur clears every held camera key');
for(const modifier of ['ctrlKey','metaKey','altKey'])assert.equal(emit('keydown','ArrowDown',{[modifier]:true}),false);
assert.equal(emit('keydown','ArrowDown',{target:{closest:selector=>selector.includes('input')?{}:null}}),false,'native form controls keep their arrows');
const dialog=document.getElementById('modal');dialog.open=true;assert.equal(emit('keydown','ArrowDown'),false);dialog.open=false;
state.composingStation=true;assert.equal(emit('keydown','ArrowDown'),false);state.composingStation=false;assert.equal(cameraKeys.size,0);
reset();console.log('PASS arrows match QZSD, no scrolling or faster diagonals, alias release, focus loss and input/modal/modifier guards');
