import {createRadioVoice} from './radio-voice.js';
let ctx,master,on=true,volume=.45,sampleUntil=0,pendingSound=null,sirenGain=0,heldGain=1,voiceSpeaking=false;
const pager=new Audio(new URL('./bipeur.mp3',import.meta.url));pager.preload='auto';pager.volume=volume*.5;
const twoTone=new Audio(new URL('./deux-tons.mp3',import.meta.url));twoTone.preload='auto';twoTone.volume=volume;
const oneShot=new Audio(new URL('./deux-tons.mp3',import.meta.url));oneShot.preload='auto';oneShot.loop=false;oneShot.volume=volume;

export function sirenOnce(){if(!on)return;oneShot.pause();oneShot.currentTime=0;oneShot.play().catch(()=>{});}
export const isSoundOn=()=>on;
export const getVolume=()=>volume;
export function sirenScheduleScale(minute,mode='auto'){if(mode==='night')return .42;if(mode==='day')return 1;const h=minute/60%24;return (h>=21||h<7)?.42:1;}
export const radioVoice=createRadioVoice({enabled:()=>on&&volume>0,volume:()=>volume,onSpeaking:value=>{voiceSpeaking=value;}});
globalThis.document?.addEventListener?.('visibilitychange',()=>{if(document.hidden)radioVoice.stop();});
async function ready(){ctx??=new(window.AudioContext||window.webkitAudioContext)();if(!master){master=ctx.createGain();master.connect(ctx.destination);}master.gain.value=on?volume:0;await ctx.resume();}
export async function toggleSound(){on=!on;if(!on)radioVoice.stop();else radioVoice.activate();await ready();if(!on){pendingSound=null;oneShot.pause();oneShot.currentTime=0;stopPager();twoTone.pause();twoTone.currentTime=0;}return on;}
export function setVolume(v){volume=Math.max(0,Math.min(1,v));if(!volume)radioVoice.stop();if(master)master.gain.value=on?volume:0;pager.volume=volume*.5;twoTone.volume=volume*(Date.now()<sampleUntil?1:sirenGain);oneShot.volume=volume*heldGain;}
export function stopPager(){pager.pause();pager.currentTime=0;}
export async function activateAudio(){if(!on)return;radioVoice.activate();await ready();if(pendingSound){const type=pendingSound;pendingSound=null;sound(type);}}
export function sound(type){if(!on)return;if(!ctx){if(['call','selective','printer'].includes(type))pendingSound=type;return;}if(type==='selective'){stopPager();pager.play().catch(()=>{});return;}if(type==='siren'){// Un départ simultané ne coupe pas l’enregistrement déjà en lecture.
 if(twoTone.paused||twoTone.ended){twoTone.currentTime=0;twoTone.play().catch(()=>{});}return;}
 let t=ctx.currentTime;const pattern=type==='call'?Array.from({length:12},(_,i)=>[i%2?440:480,.12]):type==='printer'?Array.from({length:24},(_,i)=>[120+(i%4)*65,.035]):[[1800,.045],[1300,.035]];for(const[f,d]of pattern){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type==='printer'?'sawtooth':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.008);g.gain.setValueAtTime(.055,t+d-.008);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d);t+=d+.02;}}
export async function testPager(){if(!on)on=true;await ready();sound('selective');return on;}
export async function testTwoTone(){if(!on)on=true;await ready();sampleUntil=Date.now()+19000;twoTone.volume=volume;twoTone.pause();twoTone.currentTime=0;sound('siren');return on;}

export function stopSiren(){twoTone.pause();twoTone.currentTime=0;}

export function syncSiren(active,gain=1,momentaryGain=1){sirenGain=Math.max(0,Math.min(1,gain));heldGain=Math.max(0,Math.min(1,momentaryGain));oneShot.volume=volume*heldGain;if(Date.now()<sampleUntil)return;twoTone.volume=volume*sirenGain*(voiceSpeaking?.28:1);oneShot.volume=volume*heldGain*(voiceSpeaking?.28:1);twoTone.loop=true;if(active&&on)sound('siren');else if(!twoTone.paused)stopSiren();}

export function holdSiren(pressed,gain=heldGain,samu=false){heldGain=Math.max(0,Math.min(1,gain));const clip=oneShot;clip.volume=volume*heldGain;clip.loop=true;if(pressed&&on){if(clip.paused||clip.ended){clip.currentTime=0;clip.play().catch(()=>{});}}else{for(const audio of [oneShot]){audio.pause();audio.currentTime=0;}}}


// Full volume at vehicle-follow distance, then a smooth falloff to silence.
export function sirenDistanceGain(distance){const t=Math.max(0,Math.min(1,(distance-55)/300));return (1-t)*(1-t);}
// Screen visibility complements distance: nearby sirens outside the game view
// should be a faint background sound, including when a panel covers the engine.
export function sirenViewGain(distance,screen,covered=false){const base=sirenDistanceGain(distance);if(!screen||screen.z< -1||screen.z>1)return base*.035;const edge=Math.max(Math.abs(screen.x),Math.abs(screen.y)),t=Math.max(0,Math.min(1,(1.03-edge)/.18)),view=.035+.965*t*t*(3-2*t);return base*view*(covered?.08:1);}

// One shared noise bed: spatial gain follows the camera without extra audio files.
let ambience;
export function syncAmbience(levels={},paused=false){
 if(!ctx||!master)return;
 const gain=on&&!paused?Math.min(.055,(levels.fire||0)*.035+(levels.water||0)*.025+(levels.tools||0)*.03):0;
 if(!ambience&&gain>0){const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);let seed=73;for(let i=0;i<data.length;i++){seed=Math.imul(seed,1664525)+1013904223>>>0;data[i]=(seed/4294967296-.5)*.5;}const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),volumeNode=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=900;source.connect(filter);filter.connect(volumeNode);volumeNode.connect(master);volumeNode.gain.value=0;source.start();ambience={source,filter,gain:volumeNode};}
 if(ambience){ambience.filter.frequency.setTargetAtTime(levels.water>levels.fire?1800:600,ctx.currentTime,.2);ambience.gain.gain.setTargetAtTime(gain,ctx.currentTime,.2);}
}
