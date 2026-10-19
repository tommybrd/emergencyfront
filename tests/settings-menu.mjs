import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {createShift} from '../dist/sim.js';
import {installSettings} from '../dist/settings-menu.js';
const state=createShift(),call={id:999,at:state.minute,status:'waiting'};state.calls.push(call);
let html='',closed=0,visible=false;const opened=[];
document.getElementById('modal').close=()=>closed++;
const sectorState={textContent:''};document.getElementById('sectors').querySelector=()=>sectorState;
const ids=['guardTools','briefShift','composeStation','editPlayerProfile','soundSettings','help','debug'];
installSettings({state,modal:text=>html=text,actions:Object.fromEntries(ids.map(id=>[id,()=>opened.push(id)])),sectorsVisible:()=>visible,toggleSectors:()=>{visible=!visible;}});
const show=els.get('settings').onclick;show();
for(const id of ids){assert(html.includes(`id="${id}"`),`${id} must be rendered before binding`);els.get(id).onclick();}
assert.deepEqual(opened,ids);assert.equal(closed,0,'reusing the dialog must not fire the next page’s close listener and undo its temporary pause');
show();els.get('density').oninput({target:{value:'13'}});assert.equal(state.density,13);assert.equal(els.get('densityValue').textContent,13);assert.equal(state.calls[0],call,'density keeps existing interventions');show();assert.match(html,/value="13"/,'reopening shows the current density');
els.get('sectors').onclick();assert.equal(visible,true);assert.equal(els.get('sectors').getAttribute('aria-pressed'),'true');assert.equal(sectorState.textContent,'Activés');show();assert.match(html,/aria-pressed="true"/);els.get('sectors').onclick();assert.equal(visible,false);assert.equal(sectorState.textContent,'Masqués');
console.log('PASS settings navigation, live density without losing calls, and persistent sector toggle');
