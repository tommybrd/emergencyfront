import * as T from 'three';
// Only immutable scenery belongs here. Animated vehicle parts retain their own meshes.
const cubePositions=new T.BoxGeometry(1,1,1).attributes.position.array;
function plainBox(g){
 if(g.type!=='BoxGeometry'||g.attributes.position?.count!==24||g.index?.count!==36)return false;
 const dimensions=[g.parameters.width,g.parameters.height,g.parameters.depth],a=g.attributes.position.array;
 return a.every((v,i)=>Math.abs(v-cubePositions[i]*dimensions[i%3])<1e-5);
}
export function batchStatic(root,excluded=[],{freezeRoot=true}={}){
 root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert(),exclude=new Set(excluded),groups=new Map(),candidates=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.children.length||Array.isArray(o.material)||o.material.transparent||o===root)return;
  let p=o;while(p){if(exclude.has(p)||!p.visible)return;p=p.parent;}
  candidates.push(o);
  const cell=Math.floor(o.matrixWorld.elements[12]/80)+','+Math.floor(o.matrixWorld.elements[14]/80);
  // Plain boxes share a unit cube: dimensions become instance transforms. Custom
  // BufferGeometry must remain distinct, even when it has no parameters.
  const unit=plainBox(o.geometry)&&!o.material.map;
  const geometryKey=unit?'unit-box':o.geometry.parameters?o.geometry.type+JSON.stringify(o.geometry.parameters):o.geometry.uuid;
  const key=[cell,geometryKey,o.material.uuid,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask].join('|');
  if(!groups.has(key))groups.set(key,{unit,objects:[]});groups.get(key).objects.push(o);
 });
 for(const {unit,objects}of groups.values()){
  if(objects.length<3)continue;
  const first=objects[0],geometry=unit?new T.BoxGeometry(1,1,1):first.geometry,inst=new T.InstancedMesh(geometry,first.material,objects.length);
  inst.castShadow=first.castShadow;inst.receiveShadow=first.receiveShadow;inst.renderOrder=first.renderOrder;inst.layers.mask=first.layers.mask;
  objects.forEach((o,i)=>{
   const matrix=inverse.clone().multiply(o.matrixWorld);
   if(unit){const {width,height,depth}=o.geometry.parameters;matrix.scale(new T.Vector3(width,height,depth));}
   inst.setMatrixAt(i,matrix);
   let tree=o.parent;while(tree&&!tree.userData.treeClearance)tree=tree.parent;
   if(tree)(tree.userData.fuelParts??=[]).push({mesh:inst,index:i,base:matrix.clone(),crown:o.geometry.type!=='CylinderGeometry'});
   o.removeFromParent();if(o.geometry!==geometry)o.geometry.dispose();
  });
  inst.computeBoundingSphere();inst.updateMatrix();inst.matrixAutoUpdate=false;root.add(inst);
 }
 mergeFixed(root,candidates,inverse);
 root.traverse(o=>{if(o===root)return;let p=o;while(p){if(exclude.has(p))return;p=p.parent;}o.updateMatrix();o.matrixAutoUpdate=false;});
 if(freezeRoot){root.updateMatrix();root.matrixAutoUpdate=false;}
}

// Different opaque shapes can share one draw without losing vertices, normals
// or UVs. Small spatial cells retain culling; transparent objects keep their order.
function mergeFixed(root,candidates,inverse){
 const groups=new Map(),retired=new Set();
 for(const o of candidates){
  if(!o.parent||o.material.transparent||o.geometry.morphAttributes&&Object.keys(o.geometry.morphAttributes).length||o.geometry.drawRange.start!==0||Number.isFinite(o.geometry.drawRange.count))continue;
  let tree=o;while(tree&&!tree.userData.treeClearance)tree=tree.parent;if(tree)continue;
  const matrix=inverse.clone().multiply(o.matrixWorld);if(matrix.determinant()<0)continue;
  const attributes=Object.entries(o.geometry.attributes).sort(([a],[b])=>a.localeCompare(b));
  if(attributes.some(([,a])=>a.isInterleavedBufferAttribute))continue;
  const layout=attributes.map(([name,a])=>[name,a.itemSize,a.normalized,a.array.constructor.name].join(':')).join('|');
  const cell=Math.floor(o.matrixWorld.elements[12]/80)+','+Math.floor(o.matrixWorld.elements[14]/80);
  const key=[cell,o.material.uuid,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask,layout].join('|');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push({o,matrix});
 }
 for(const objects of groups.values()){
  if(objects.length<3)continue;
  const geometries=objects.map(({o,matrix})=>(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(matrix)),geometry=new T.BufferGeometry();
  for(const [name,attribute]of Object.entries(geometries[0].attributes)){
   const length=geometries.reduce((sum,g)=>sum+g.attributes[name].array.length,0),array=new attribute.array.constructor(length);let offset=0;
   for(const g of geometries){array.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}
   geometry.setAttribute(name,new T.BufferAttribute(array,attribute.itemSize,attribute.normalized));
  }
  geometry.computeBoundingSphere();geometry.computeBoundingBox();
  const first=objects[0].o,mesh=new T.Mesh(geometry,first.material);mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask;mesh.userData.fixedBatch=true;root.add(mesh);
  for(const {o}of objects){retired.add(o.geometry);o.removeFromParent();}for(const g of geometries)g.dispose();
 }
 // A geometry may also belong to an excluded lamp or articulated part.
 root.traverse(o=>{if(o.geometry)retired.delete(o.geometry);});for(const g of retired)g.dispose();
}

// Pure visual groups need no descendant transforms while hidden. A visible
// parent resumes normal Three.js updates, including after a change of position.
export function suspendHiddenTransforms(root){
 const update=root.updateMatrixWorld;
 root.updateMatrixWorld=function(force){if(this.visible)update.call(this,force);};
 return root;
}

// Keep all named, referenced or articulated parts intact. Only anonymous fixed
// body details share draws; lights, wheels, doors, ladders and berces stay live.
export function batchVehicle(root){
 const referenced=new Set(),visited=new Set();
 function references(value){if(!value||typeof value!=='object'||visited.has(value))return;visited.add(value);if(value.isObject3D){referenced.add(value);return;}if(Array.isArray(value))value.forEach(references);else if(Object.getPrototypeOf(value)===Object.prototype)Object.values(value).forEach(references);}
 references(root.userData);
 const excluded=root.children.filter(o=>!o.isMesh||o.name||o.children.length||referenced.has(o)||Object.keys(o.userData).length||!o.material?.userData?.shared);
 batchStatic(root,excluded,{freezeRoot:false});
}
