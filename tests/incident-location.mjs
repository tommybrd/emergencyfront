import assert from 'node:assert/strict';
import {locateIncident} from '../dist/incident-location.js';
import {block} from '../dist/roads.js';
for(const [name,type,style]of[['Inondation de cave','OD',null],['Malaise à domicile','SUAP',null],['Ascenseur bloqué','OD','tower'],['Feu d’appartement','INC','tower'],['Malaise au centre commercial','SUAP','mall']]){const c={name,type,target:[0,0]};locateIncident(c,()=>.5);assert.equal(c.site.kind,'building');assert(block.buildings.some(b=>b.x===c.target[0]&&b.z===c.target[1]));if(style)assert.equal(c.site.style,style);assert(c.accessTarget);assert.notDeepEqual(c.actionPoint,c.target);}
for(const c of[{type:'AVP',name:'Collision entre deux voitures'},{type:'INC',name:'Feu de véhicule'},{type:'OD',name:'Branche sur la chaussée'}]){c.target=[12,30];locateIncident(c);assert.deepEqual(c.target,[12,30]);assert(!c.site);}
const s={type:'SUAP',name:'Blessure au stade'};locateIncident(s);assert.equal(s.site.kind,'stadium');console.log('PASS building types, separate road access, stadium and preserved road incidents');
