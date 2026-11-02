import assert from 'node:assert/strict';
import {els} from './game-environment.mjs';
import {codisBoard,codisLogs,codisFilterOptions,radioStatus} from '../dist/codis-board.js';

assert.equal(radioStatus({status:'ready'}),1);assert.equal(radioStatus({status:'enroute'}),2);assert.equal(radioStatus({status:'scene'}),3);
assert.equal(radioStatus({status:'transport'}),4);assert.equal(radioStatus({status:'hospital'}),5);assert.equal(radioStatus({status:'returning'}),6);assert.equal(radioStatus({status:'maintenance'}),7);
const logs=[{at:600,message:'Radio · I01 VSAV 1 sur les lieux',callId:1},{at:601,message:'Effectif réduit',urgent:true},{at:602,message:'FPTSR engagé',callId:2}];
assert.deepEqual(codisLogs(logs,'call:1').map(l=>l.at),[600]);assert.deepEqual(codisLogs(logs,'urgent').map(l=>l.at),[601]);
assert.deepEqual(codisLogs(logs,'radio').map(l=>l.at),[600]);assert.deepEqual(codisLogs(logs).map(l=>l.at),[602,601,600],'Most recent first');
const state={minute:620,logs,calls:[{id:1,type:'SUAP',name:'Malaise',address:'Rue A',at:598,status:'active',reinforcementAlerts:[{sender:'VSAV 1',message:'Demande SMUR',minute:610}]},{id:2,type:'INC',name:'Feu de poubelle',declaredId:'x',declaredName:'Feu de véhicule',address:'Rue B',at:605,status:'waiting'},{id:3,type:'OD',name:'Clos',at:500,status:'closed'}]};
const engines=[{id:'VSAV 1',kind:'VSAV',status:'scene',call:1},{id:'FPTSR',kind:'FPT',status:'ready'},{id:'Police 1',kind:'POLICE',status:'patrol'}];
const html=codisBoard(state,engines,{statusText:e=>e.status==='scene'?'Bilan':'Disponible CIS'});
assert.match(html,/Interventions en cours · 2/);assert.match(html,/Feu de véhicule/,'Shows the motif as qualified on the phone');assert(!html.includes('Clos'));
assert.match(html,/Renforts en attente · 1/);assert.match(html,/Demande SMUR/);assert.match(html,/<i data-status="3">VSAV 1<\/i>/);
assert(!html.includes('Police 1'));assert.match(html,/<em>Aucun moyen<\/em>/);
assert.match(codisFilterOptions(state,'call:2'),/value="call:2" selected/);

const game=await import('../dist/scene.js');
game.openCodis();assert.match(els.get('modalContent').innerHTML,/Tableau CODIS/);assert.match(els.get('codisBody').innerHTML,/Moyens · statuts radio/);
assert.match(els.get('codisBody').innerHTML,/FPTSR/);
console.log('PASS tableau CODIS : statuts radio, interventions, renforts en attente, main courante filtrée, ouverture en jeu');
