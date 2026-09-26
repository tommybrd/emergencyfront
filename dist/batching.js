import * as T from 'three';
// Only immutable scenery belongs here. Animated vehicle parts retain their own meshes.
const cubePositions=new T.BoxGeometry(1,1,1).attributes.position.array;
function plainBox(g){
 if(g.type!=='BoxGeometry'||g.attributes.position?.count!==24||g.index?.count!==36)return false;
 const dimensions=[g.parameters.width,g.parameters.height,g.parameters.depth],a=g.attributes.position.array;
 return a.every((v,i)=>Math.abs(v-cubePositions[i]*dimensions[i%3])<1e-5);
}
export function batchStatic(root,excluded=[]){
 root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert(),exclude=new Set(excluded),groups=new Map();
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o===root)return;
  let p=o;while(p){if(exclude.has(p)||!p.visible)return;p=p.parent;}
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
 root.traverse(o=>{if(o===root)return;let p=o;while(p){if(exclude.has(p))return;p=p.parent;}o.updateMatrix();o.matrixAutoUpdate=false;});
}

// Keep all named, referenced or articulated parts intact. Only anonymous fixed
// body details are instanced; lights, wheels, doors, ladders and berces stay live.
export function batchVehicle(root){
 const referenced=new Set(),visited=new Set();
 function references(value){if(!value||typeof value!=='object'||visited.has(value))return;visited.add(value);if(value.isObject3D){referenced.add(value);return;}if(Array.isArray(value))value.forEach(references);else if(Object.getPrototypeOf(value)===Object.prototype)Object.values(value).forEach(references);}
 references(root.userData);
 const excluded=root.children.filter(o=>!o.isMesh||o.name||o.children.length||referenced.has(o)||Object.keys(o.userData).length||!o.material?.userData?.shared||!plainBox(o.geometry));
 batchStatic(root,excluded);
}
