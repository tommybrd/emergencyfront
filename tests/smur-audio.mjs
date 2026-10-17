import assert from 'node:assert/strict';
const clips=[];
globalThis.document={addEventListener(){}};
globalThis.Audio=class{
 constructor(src){this.src=String(src);this.paused=true;this.ended=false;this.currentTime=0;this.playCount=0;clips.push(this);}
 pause(){this.paused=true;}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
};
globalThis.window={AudioContext:class{constructor(){this.currentTime=0;this.destination={};}createGain(){return{gain:{value:0},connect(){}};}resume(){return Promise.resolve();}}};
const {activateAudio,holdSiren,syncSiren}=await import('../dist/audio.js');
const firefighter=clips.filter(c=>c.src.endsWith('/deux-tons.mp3'));
const smur=clips.filter(c=>c.src.endsWith('/deux-tons-smur.wav'));
assert.equal(firefighter.length,2);assert.equal(smur.length,2,'both emergency two-tone sources are loaded');
holdSiren(true,.7,true);
assert.equal(smur.reduce((n,c)=>n+c.playCount,0),1,'SMUR control uses the medical two-tone');
assert.equal(firefighter.reduce((n,c)=>n+c.playCount,0),0,'SMUR control does not use the firefighter two-tone');
holdSiren(false);
holdSiren(true,.7,false);
assert.equal(firefighter.reduce((n,c)=>n+c.playCount,0),1,'firefighter control keeps its original two-tone');
holdSiren(false);await activateAudio();syncSiren(false,0,0,true,.8);
assert.equal(smur.reduce((n,c)=>n+c.playCount,0),2,'automatic SMUR warning uses the medical two-tone');
console.log('PASS distinct SMUR and firefighter two-tone controls');
