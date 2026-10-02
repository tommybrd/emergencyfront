import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {batchStatic,suspendHiddenTransforms} from '../dist/batching.js';
const root=new T.Group();root.position.set(12,3,-9);root.rotation.y=.6;
const material=new T.MeshStandardMaterial({color:0xdddddd});
for(let i=0;i<6;i++){const m=new T.Mesh(new T.BoxGeometry(i+1,2,3),material);m.position.set(i*3,1,0);root.add(m);}
root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root);batchStatic(root);root.updateMatrixWorld(true);
const after=new T.Box3().setFromObject(root);assert(before.min.distanceTo(after.min)<1e-5);assert(before.max.distanceTo(after.max)<1e-5);assert.equal(root.children.length,1);assert.equal(root.children[0].count,6);
const custom=new T.Group();for(let i=0;i<3;i++){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,i+1,0,0,0,1,0],3));custom.add(new T.Mesh(geometry,material));}batchStatic(custom);assert(custom.children.every(o=>!o.isInstancedMesh),'Different custom panels must not become the same geometry');
const excluded=new T.Group(),moving=new T.Group();excluded.add(moving);for(let i=0;i<3;i++)moving.add(new T.Mesh(new T.BoxGeometry(),material));batchStatic(excluded,[moving]);assert.equal(moving.children.length,3);
// Merging unlike shapes must retain every triangle, transformed normal and UV.
const mixed=new T.Group();mixed.position.set(15,2,-10);mixed.rotation.y=.4;
for(const [i,geometry]of [new T.CylinderGeometry(.4,.7,2,9),new T.SphereGeometry(.8,12,8),new T.ConeGeometry(.6,1.5,11)].entries()){
 const mesh=new T.Mesh(geometry,material);mesh.position.set(i*2,1,i);mesh.rotation.set(.2,.3*i,-.1);mesh.scale.set(1,.8,1.2);mixed.add(mesh);
}
mixed.updateWorldMatrix(true,true);const inverse=mixed.matrixWorld.clone().invert();
const originals=mixed.children.map(o=>(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(inverse.clone().multiply(o.matrixWorld)));
const expectedBounds=new T.Box3().setFromObject(mixed,true);batchStatic(mixed,[],{freezeRoot:false});
assert.equal(mixed.children.length,1);const merged=mixed.children[0];assert(merged.userData.fixedBatch);
for(const name of ['position','normal','uv']){
 const expected=originals.flatMap(g=>Array.from(g.attributes[name].array));const actual=merged.geometry.attributes[name].array;
 assert.equal(actual.length,expected.length);actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-5,`${name} preserved at ${i}`));
}
mixed.updateMatrixWorld(true);const mergedBounds=new T.Box3().setFromObject(mixed,true);
assert(expectedBounds.min.distanceTo(mergedBounds.min)<1e-5);assert(expectedBounds.max.distanceTo(mergedBounds.max)<1e-5);
assert.equal(mixed.matrixAutoUpdate,true,'Articulated roots remain live');mixed.position.x+=8;mixed.updateMatrixWorld();
assert(Math.abs(merged.getWorldPosition(new T.Vector3()).x-23)<1e-5,'Merged body follows its moving root');

const glass=new T.Group(),transparent=new T.MeshStandardMaterial({transparent:true,opacity:.4});
for(const geometry of [new T.CylinderGeometry(),new T.SphereGeometry(),new T.ConeGeometry()])glass.add(new T.Mesh(geometry,transparent));
batchStatic(glass);assert.equal(glass.children.length,3,'Different transparent shapes keep independent sorting');
const repeatedGlass=new T.Group();for(let i=0;i<3;i++)repeatedGlass.add(new T.Mesh(new T.BoxGeometry(),transparent));
batchStatic(repeatedGlass);assert.equal(repeatedGlass.children.length,3,'Identical transparent panes retain individual sorting');
const attachments=new T.Group();for(let i=0;i<3;i++){const mesh=new T.Mesh(new T.BoxGeometry(),material);mesh.add(new T.Object3D());attachments.add(mesh);}
batchStatic(attachments);assert.equal(attachments.children.length,3,'Meshes with attachments retain their hierarchy');
const cells=new T.Group();for(let cell=0;cell<2;cell++)for(let i=0;i<3;i++){
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,i+1,0,0,0,1,0],3));
 const mesh=new T.Mesh(geometry,material);mesh.position.x=cell*160;cells.add(mesh);
}
batchStatic(cells);assert.equal(cells.children.length,2,'Distant geometry retains separate culling bounds');
const dormant=suspendHiddenTransforms(new T.Group()),actor=new T.Group();dormant.add(actor);let visits=0;
const updateActor=actor.updateMatrixWorld;actor.updateMatrixWorld=function(force){visits++;updateActor.call(this,force);};
dormant.visible=false;dormant.position.set(7,0,0);actor.position.set(3,0,0);dormant.updateMatrixWorld(true);assert.equal(visits,0);
dormant.visible=true;dormant.updateMatrixWorld(true);assert.equal(visits,1);assert.equal(actor.matrixWorld.elements[12],10,'Hidden actors resume with current transforms');
console.log('PASS batching preserves triangles, normals, UVs, bounds, spatial culling, transparency, animated exclusions and hidden transform resumption');
