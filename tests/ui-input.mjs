import assert from 'node:assert/strict';
import './game-environment.mjs';
const listeners=new Map();window.addEventListener=(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);};
const {setMarkup}=await import('../dist/scene.js');
const button={closest:()=>button},panel={innerHTML:'',contains:x=>x===button,querySelectorAll:()=>[]};
setMarkup(panel,'Before');for(const fn of listeners.get('pointerdown'))fn({target:button});setMarkup(panel,'During press');assert.equal(panel.innerHTML,'Before','Preserve the pressed button until the click is delivered');
for(const fn of listeners.get('pointerup'))fn({target:button});setMarkup(panel,'Before click');assert.equal(panel.innerHTML,'Before');await new Promise(r=>setTimeout(r,5));setMarkup(panel,'After click');assert.equal(panel.innerHTML,'After click','Live updates resume after the interaction');
console.log('PASS refresh cannot remove a button between pointerdown and click');
