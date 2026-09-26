import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {batchStatic} from '../dist/batching.js';
const root=new T.Group();root.position.set(12,3,-9);root.rotation.y=.6;
const material=new T.MeshStandardMaterial({color:0xdddddd});
for(let i=0;i<6;i++){const m=new T.Mesh(new T.BoxGeometry(i+1,2,3),material);m.position.set(i*3,1,0);root.add(m);}
root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root);batchStatic(root);root.updateMatrixWorld(true);
const after=new T.Box3().setFromObject(root);assert(before.min.distanceTo(after.min)<1e-5);assert(before.max.distanceTo(after.max)<1e-5);assert.equal(root.children.length,1);assert.equal(root.children[0].count,6);
const custom=new T.Group();for(let i=0;i<3;i++){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,i+1,0,0,0,1,0],3));custom.add(new T.Mesh(geometry,material));}batchStatic(custom);assert(custom.children.every(o=>!o.isInstancedMesh),'Different custom panels must not become the same geometry');
const excluded=new T.Group(),moving=new T.Group();excluded.add(moving);for(let i=0;i<3;i++)moving.add(new T.Mesh(new T.BoxGeometry(),material));batchStatic(excluded,[moving]);assert.equal(moving.children.length,3);
console.log('PASS static batching reduces calls, preserves transformed bounds, custom panels and animated exclusions');
