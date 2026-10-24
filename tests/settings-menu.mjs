import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {createShift} from '../dist/sim.js';
import {installSettings,SETTINGS_TABS} from '../dist/settings-menu.js';
const state=createShift(),call={id:999,at:state.minute,status:'waiting'};state.calls.push(call);
let html='',closed=0,visible=false,mini=false,volume=.5,muted=false;const opened=[],options={autoPause:true,guidance:false,radioFocus:false,ambience:true},saved=[];
document.getElementById('modal').close=()=>closed++;
const actions=Object.fromEntries(['briefShift','composeStation','editPlayerProfile','help','debug'].map(id=>[id,()=>opened.push(id)]));
const guard={options,savedLabel:()=>saved.length?'14:32':null,canReplay:()=>false,save:()=>saved.push(1),resume:()=>opened.push('resume'),openDay:()=>opened.push('day'),album:()=>opened.push('album'),replay:()=>opened.push('replay'),miniVisible:()=>mini,toggleMini:()=>{mini=!mini;},closeCamera:()=>false,toggleCloseCamera(){},photo:()=>opened.push('photo'),setOption:(k,v)=>{options[k]=v;}};
const sound={volume:()=>volume,setVolume:v=>{volume=v;},voiceSupported:true,voiceMuted:()=>muted,setVoiceMuted:m=>{muted=m;},testTwoTone:()=>opened.push('twoTone')};
installSettings({state,modal:text=>html=text,actions,sectorsVisible:()=>visible,toggleSectors:()=>{visible=!visible;},guard,sound});
const show=els.get('settings').onclick;show();
assert.deepEqual(SETTINGS_TABS.map(([id])=>id),['partie','affichage','son','caserne']);
for(const [id,label]of SETTINGS_TABS)assert(html.includes(`id="tab-${id}"`)&&html.includes(`>${label}</button>`),`${label} tab`);
assert.match(html,/id="tab-partie" aria-selected="true"/);assert(html.includes('Aucune sauvegarde'));assert.match(html,/id="resumeGuard"[^>]*disabled/);
els.get('saveGuard').onclick();assert.equal(saved.length,1);assert(html.includes('Sauvegarde disponible · 14:32'),'saving refreshes the tab');
els.get('density').oninput({target:{value:'13'}});assert.equal(state.density,13);assert.equal(els.get('densityValue').textContent,13);assert.equal(state.calls[0],call,'density keeps existing interventions');show();assert.match(html,/value="13"/);
els.get('opt-guidance').onclick();assert.equal(options.guidance,true);assert.equal(els.get('opt-guidance').getAttribute('aria-checked'),'true');
console.log('PASS settings tabs: party tab, save refresh, density and switches');

els.get('tab-affichage').onclick();assert.match(html,/id="tab-affichage" aria-selected="true"/);assert(html.includes('Secteurs sur la carte')&&html.includes('Mini-carte'));assert(!html.includes('id="saveGuard"'),'one tab at a time');
els.get('sectors').onclick();assert.equal(visible,true);assert.equal(els.get('sectors').getAttribute('aria-checked'),'true');show();assert.match(html,/id="sectors" aria-checked="true"/,'reopening keeps the last tab and state');
els.get('miniMap').onclick();assert.equal(mini,true);els.get('photoMode').onclick();assert(opened.includes('photo'));

els.get('tab-son').onclick();assert(html.includes('id="volume"')&&html.includes('Radio parlée')&&html.includes('Ambiances de proximité'));
els.get('volume').oninput({target:{value:'.2'}});assert.equal(volume,.2);els.get('radioVoice').onclick();assert.equal(muted,true);els.get('testTwoTone').onclick();assert(opened.includes('twoTone'));
els.get('opt-radioFocus').onclick();assert.equal(options.radioFocus,true);

els.get('tab-caserne').onclick();for(const id of['briefShift','composeStation','editPlayerProfile']){assert(html.includes(`id="${id}"`));els.get(id).onclick();}
els.get('help').onclick();els.get('debug').onclick();
for(const id of['briefShift','composeStation','editPlayerProfile','help','debug'])assert(opened.includes(id),id);
assert.equal(closed,0,'reusing the dialog must not fire the next page’s close listener and undo its temporary pause');
console.log('PASS settings tabs: display, sound and station pages, footer links');
