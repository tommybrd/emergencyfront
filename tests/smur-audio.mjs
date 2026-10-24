import assert from 'node:assert/strict';
const clips=[];
globalThis.document={addEventListener(){}};
globalThis.Audio=class{
 constructor(src){this.src=String(src);this.paused=true;this.ended=false;this.currentTime=0;this.playCount=0;clips.push(this);}
 pause(){this.paused=true;}
 play(){this.paused=false;this.playCount++;return Promise.resolve();}
};
globalThis.window={AudioContext:class{constructor(){this.currentTime=0;this.destination={};}createGain(){return{gain:{value:0},connect(){}};}resume(){return Promise.resolve();}}};
const {activateAudio,holdSiren,syncSiren,sound,stopCaptainPager,setVolume,toggleSound}=await import('../dist/audio.js');
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
const commander=clips.find(c=>c.src.endsWith('/bipeur-commandant.wav')),volunteers=clips.find(c=>c.src.endsWith('/bipeur.mp3'));
assert(commander&&volunteers);sound('captain');assert.equal(commander.playCount,1);assert.equal(volunteers.playCount,0,'command alert uses the supplied alphanumeric pager');sound('selective');assert.equal(volunteers.playCount,1);assert(!commander.paused,'volunteer recall does not interrupt the commander');setVolume(.6);assert.equal(commander.volume,.3);stopCaptainPager();assert(commander.paused);assert.equal(commander.currentTime,0);assert(!volunteers.paused,'acknowledgement does not stop volunteer recall');sound('captain');await toggleSound();assert(clips.every(c=>c.paused),'mute stops every audio source');
console.log('PASS supplied command pager, independent volunteer recall, volume, acknowledgement and mute');
console.log('PASS distinct SMUR and firefighter two-tone controls');

// Bip sélectif de départ plus discret (30 % du volume), bipeur commandant inchangé (50 %).
{
 setVolume(1);const pager=clips.find(c=>c.src.endsWith('/bipeur.mp3')),captain=clips.find(c=>c.src.endsWith('/bipeur-commandant.wav'));
 assert.equal(pager.volume,.3,'departure selective beep is quieter');assert.equal(captain.volume,.5);
 console.log('PASS quieter departure selective beep');
}
