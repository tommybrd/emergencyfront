import assert from 'node:assert/strict';
import {initWater,setNozzle,tickEquipment,tickWater,setLanceFlow,setLanceJet,setLanceOpen,setLancePosition,lanceMoveError,lanceFlows,migrateLances,jetFactor,equipmentStatus,LANCE_REACH} from '../dist/hydraulics.js';
import {lancePanel,lancePopup} from '../dist/vehicle-console.js';

// Une seule lance : le débit se règle par binôme, sans re-établir le tuyau.
const e={kind:'FPT',status:'scene',crew:6,model:{position:{x:0,z:0}}};initWater(e);
assert.deepEqual(lanceFlows(e),[150,250,350,500]);
assert(setNozzle(e,'lance',2));tickEquipment(e,20);
assert.equal(tickWater(e,1),500,'Two lances at the default 250 L/min');
assert(setLanceFlow(e,0,500));assert(!setLanceFlow(e,0,420),'Only the selector positions');
assert.equal(tickWater(e,1),750);
assert(setLanceOpen(e,1,false));assert.equal(tickWater(e,1),500,'A closed lance stops its flow');
assert(setLanceOpen(e,1,true));
console.log('PASS variable lance flow and shut-off per binôme');

// Le jet change l'efficacité d'attaque, pas le débit.
e.hoseTarget=[5,0];assert.equal(jetFactor(e,e.hoses[0]),1);
assert(setLanceJet(e,0,'diffuse'));assert.equal(jetFactor(e,e.hoses[0]),1.2,'Diffused jet is better close to the fire');
e.hoseTarget=[30,0];assert.equal(jetFactor(e,e.hoses[0]),.8);
assert(setLanceJet(e,0,'protection'));assert.equal(jetFactor(e,e.hoses[0]),.5);
assert(!setLanceJet(e,0,'mitraillette'));
tickWater(e,1);assert.equal(e.flow,750);assert(e.attackFactor<1);
console.log('PASS jet type modulates attack efficiency');

// Déplacement : portée limitée, pas d'eau pendant le trajet.
assert(lanceMoveError(e,0,[LANCE_REACH+5,0]));
assert(setLancePosition(e,0,[10,4]));assert.equal(equipmentStatus(e),'Binôme en déplacement');
e.water=e.capacity;assert.equal(tickWater(e,1),250,'Moving binôme stops its jet');
tickEquipment(e,3);e.water=e.capacity;assert.equal(tickWater(e,1),750);assert.deepEqual(e.hoses[0].position,[10,4]);
assert(lanceMoveError(e,2,[1,1]),'No third binôme');
console.log('PASS binôme relocation with hose reach');

// Restrictions des engins conservées sous forme de débits plafonnés.
const ccf={kind:'CCF',status:'scene',crew:4};initWater(ccf);assert.deepEqual(lanceFlows(ccf),[150,250]);
const ps={kind:'VSAV',firstAid:true,tankCapacity:880,status:'scene',crew:6};initWater(ps);assert(setNozzle(ps,'lance',1));assert.equal(ps.hoses[0].flow,110);

// Anciennes sauvegardes LDT / petite / grosse lance.
const old={kind:'FPT',status:'scene',crew:6,capacity:3000,nozzles:{ldt:1,small:0,large:1},hoses:[{key:'ldt',index:0,progress:1},{key:'small',index:0,progress:0},{key:'large',index:0,progress:1}]};
migrateLances(old);assert.equal(old.nozzles.lance,2);assert.deepEqual(old.hoses.map(h=>h.flow),[500,150]);assert(old.hoses.every(h=>h.key==='lance'&&h.progress===1));
console.log('PASS engine flow caps and legacy save migration');

const html=lancePanel(e,{type:'INC'},true,0);
assert(html.includes('+ Établir une lance')&&html.includes('data-lance-select="1"'),'engine console lists binômes');assert(!html.includes('data-lance-flow'),'binôme settings are not in the engine panel');
const popup=lancePopup(e,{type:'INC'},0,0);
assert(popup.includes('Binôme 1')&&popup.includes('data-lance-close'));assert(popup.includes('data-lance-flow="500"'));assert(popup.includes('data-lance-jet="diffuse"'));assert(popup.includes('Annuler le déplacement'));
assert.equal(lancePopup(e,{type:'INC'},5),'','no popup for a lance that is not established');
console.log('PASS binôme list in the console, settings in a popup');

// Transport CH : la rampe orange arrière s'allume par défaut (le joueur peut toujours la couper).
const {vehicleConsole}=await import('../dist/vehicle-console.js');
const amberOn=unit=>/data-amber-mode="off"[^>]*aria-pressed="false"/.test(vehicleConsole(unit));
const vsav={kind:'VSAV',status:'transport',model:{userData:{rearAmber:Array(8).fill({})}}};
assert(amberOn(vsav),'Rear amber lights on during hospital transport');
assert(!amberOn({...vsav,amber:false}),'Player override still switches them off');
assert(!amberOn({...vsav,status:'returning'}));
console.log('PASS rear amber lights on by default during CH transport');
