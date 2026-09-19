import assert from 'node:assert/strict';
import {initIncident,radio,reinforcementPanel,radioPanel} from '../dist/command.js';
const c={id:1,type:'SUAP'};initIncident(c);
radio(c,480,'VSAV 1','Victime grave : soutien infirmier conseillé.',()=>{},true);
radio(c,481,'VLI 1','Soins infirmiers terminés.',()=>{},true);
assert.equal(c.reinforcementAlerts.length,1);assert(reinforcementPanel(c).includes('soutien infirmier conseillé'));assert(!radioPanel(c).includes('soutien infirmier conseillé'));assert(radioPanel(c).includes('Soins infirmiers terminés'));
radio(c,482,'Centre','Renfort incendie conseillé.',()=>{},true);assert.equal(c.reinforcementAlerts.length,2);c.reinforcementAlerts=[];assert.equal(reinforcementPanel(c),'');assert(radioPanel(c).includes('Renfort incendie conseillé'));
console.log('PASS persistent detailed reinforcement alerts, no duplicate feed entries, acknowledgement restores radio history');
