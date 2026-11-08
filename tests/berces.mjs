import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from 'three';
import {BERCES,BERCE_LOAD_MINUTES,berceFor,initBerce,loadBerceForCall,refillFoam,restockBerce,showBerce} from '../dist/berces.js';
import {longSupplyOptions} from '../dist/support-vehicles.js';
import {supportVehiclePanel,supportAction} from '../dist/support-console.js';
import {capability} from '../dist/operations.js';
import {vehicle} from '../dist/models.js';
const fuel={id:5,type:'OD',scene:'fuel',status:'active'},house={id:6,type:'INC',scene:'house',status:'active'};
assert.equal(berceFor(fuel),'emul');assert.equal(berceFor(house),'alim');
assert.equal(capability({kind:'VPCE'},fuel),'supply','The carrier can join a fuel leak with its foam berce');
const carrier={id:'VPCE',kind:'VPCE',wasAtStation:true};initBerce(carrier);assert.equal(carrier.berce,'alim');
assert.equal(loadBerceForCall(carrier,house),0,'Same berce: no loading');
assert.equal(loadBerceForCall(carrier,fuel),BERCE_LOAD_MINUTES);assert.equal(carrier.berce,'emul');
carrier.berceChoice='alim';assert.equal(loadBerceForCall(carrier,fuel),BERCE_LOAD_MINUTES,'The player’s choice overrides the advice');assert.equal(carrier.berce,'alim');
carrier.berceChoice=null;carrier.wasAtStation=false;assert.equal(loadBerceForCall(carrier,fuel),0,'No reloading away from the station');
// Foam refill from the berce.
const fpt={id:'FPT',kind:'FPT',call:5,status:'scene',foamCapacity:120,foamReserve:10},ccf={id:'CCF',kind:'CCF',call:5,status:'scene',foamCapacity:60,foamReserve:60};
Object.assign(carrier,{berce:'emul',berceFoam:BERCES.emul.foam,call:5,status:'scene',crew:2});
const r=refillFoam(carrier,[carrier,fpt,ccf]);assert.match(r.message,/110 L/);assert.equal(fpt.foamReserve,120);assert.equal(carrier.berceFoam,BERCES.emul.foam-110);
assert.match(refillFoam(carrier,[carrier,fpt,ccf]).error,/Aucun engin/);
assert.deepEqual(longSupplyOptions(carrier,[carrier,fpt],[]),[],'No long supply with the foam berce');
assert.match(supportVehiclePanel(carrier,fuel,[carrier,fpt],[]),/Berce émulseur · 890 L/);
restockBerce(carrier);assert.equal(carrier.berceFoam,BERCES.emul.foam);
// Station choice before the next departure.
Object.assign(carrier,{status:'ready',call:null});const html=supportVehiclePanel(carrier,null,[carrier],[]);assert.match(html,/data-support-berce="emul"/);assert.match(html,/Automatique/);
assert.match(supportAction(carrier,null,'berce',{berce:'emul'},[carrier],[]).message,/émulseur imposée/);assert.equal(carrier.berceChoice,'emul');
carrier.status='scene';assert.match(supportAction(carrier,null,'berce',{berce:'alim'},[carrier],[]).error,/au CIS/);
// The model shows the loaded cargo.
const model=vehicle(new T.Group(),'VPCE','#c93a2d');showBerce(model,'emul');assert(model.userData.berceCargo.emul.visible&&!model.userData.berceCargo.alim.visible);showBerce(model,'alim');assert(model.userData.berceCargo.alim.visible);
console.log('PASS berces : alimentation ou émulseur selon l’intervention, choix au CIS, chargement au départ, ravitaillement en émulseur et cargaison visible');
