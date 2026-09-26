import assert from 'node:assert/strict';
import {advanceForest} from '../dist/forest-fire.js';
const trees=[{x:0,z:0},{x:7,z:0},{x:-7,z:0},{x:14,z:0},{x:100,z:0}],neighbors=[[1,2],[0,3],[0],[1],[]];
const fire=()=>({type:'INC',requires:'CCF',status:'active',progress:0,target:[0,0],fireFront:{direction:0}});
const c=fire(),damage={};advanceForest(c,trees,neighbors,damage,1,1);assert(c.forestFire.cells[0].heat===1);assert(!c.forestFire.cells[1]||c.forestFire.cells[1].heat<1,'no instant chain reaction');for(let i=0;i<7;i++)advanceForest(c,trees,neighbors,damage,1,1);assert(c.forestFire.cells[1].heat===1);assert((c.forestFire.cells[2]?.heat||0)<1,'upwind slower');assert(!c.forestFire.cells[4]);
const watered=fire();for(let i=0;i<8;i++)advanceForest(watered,trees,neighbors,{},1,1,1400);assert((watered.forestFire.cells[1]?.heat||0)<c.forestFire.cells[1].heat,'water limits new ignition');
for(let i=0;i<35;i++)advanceForest(c,trees,neighbors,damage,1,1);assert.equal(damage[0],1,'tree eventually consumed');const snapshot=structuredClone(c.forestFire);c.fireContained=true;advanceForest(c,trees,neighbors,damage,20,1);assert.deepEqual(c.forestFire,snapshot,'extinction stops spread');
console.log('PASS gradual neighbor ignition, faster downwind spread, finite tree fuel, isolated tree untouched, water protection and extinction');
