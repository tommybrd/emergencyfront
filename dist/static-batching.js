// Optimisation du rendu : regroupe en un seul objet les pièces fixes qui partagent
// le même parent et le même matériau. Le parent est conservé, donc ses déplacements
// et sa visibilité s'appliquent toujours au bloc fusionné.
// Une pièce n'est jamais fusionnée si le code peut la retrouver : nom, userData,
// enfants, ou référence depuis un userData (roues, gyrophares, portes, toits…).
import * as T from 'three';

const ALLOWED=new Set(['position','normal','uv']);
const normalMatrix=new T.Matrix3();

function collectRefs(value,set,depth=0,seen=new Set()){
 if(!value||typeof value!=='object'||depth>5||seen.has(value))return;
 seen.add(value);
 if(value.isObject3D){set.add(value);return;}
 if(value.isMaterial||value.isBufferGeometry||value.isTexture)return;
 if(Array.isArray(value)){for(const v of value)collectRefs(v,set,depth+1,seen);return;}
 if(value instanceof Map||value instanceof Set){for(const v of value.values())collectRefs(v,set,depth+1,seen);return;}
 const proto=Object.getPrototypeOf(value);
 if(proto===Object.prototype||proto===null)for(const v of Object.values(value))collectRefs(v,set,depth+1,seen);
}

// Toutes les pièces référencées depuis un userData de la scène, ou depuis les objets fournis.
export function referencedObjects(root,extra=[]){
 const refs=new Set();
 root.traverse(o=>{if(o.userData&&Object.keys(o.userData).length)collectRefs(o.userData,refs);});
 for(const value of extra)collectRefs(value,refs);
 return refs;
}

function mergeable(mesh,refs){
 if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||mesh.isBatchedMesh)return false;
 if(refs.has(mesh)||mesh.children.length||mesh.name||!mesh.visible)return false;
 // Les personnages sont articulés par index (jambes, bras) : leurs pièces restent séparées.
 if(mesh.parent?.userData?.person||mesh.parent?.userData?.noBatch)return false;
 mesh.updateMatrix();if(mesh.matrix.determinant()<=0)return false;
 if(Object.keys(mesh.userData).length||mesh.renderOrder||mesh.layers.mask!==1||!mesh.frustumCulled)return false;
 if(mesh.onBeforeRender!==T.Object3D.prototype.onBeforeRender)return false;
 const m=mesh.material,g=mesh.geometry;
 if(!m||Array.isArray(m)||m.transparent||m.alphaTest>0||m.isShaderMaterial)return false;
 if(!g?.attributes?.position||!g.attributes.normal||g.morphAttributes&&Object.keys(g.morphAttributes).length)return false;
 for(const name of Object.keys(g.attributes))if(!ALLOWED.has(name))return false;
 return true;
}

function mergeInto(meshes){
 const hasUv=meshes.every(m=>m.geometry.attributes.uv);
 let vertices=0,indices=0;
 for(const m of meshes){const g=m.geometry;vertices+=g.attributes.position.count;indices+=g.index?g.index.count:g.attributes.position.count;}
 const position=new Float32Array(vertices*3),normal=new Float32Array(vertices*3),uv=hasUv?new Float32Array(vertices*2):null;
 const index=vertices>65535?new Uint32Array(indices):new Uint16Array(indices);
 const v=new T.Vector3();let vo=0,io=0;
 for(const m of meshes){
  m.updateMatrix();normalMatrix.getNormalMatrix(m.matrix);
  const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,t=g.attributes.uv;
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);position.set([v.x,v.y,v.z],(vo+i)*3);
   v.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();normal.set([v.x,v.y,v.z],(vo+i)*3);
   if(uv)uv.set([t.getX(i),t.getY(i)],(vo+i)*2);
  }
  if(g.index)for(let i=0;i<g.index.count;i++)index[io++]=g.index.getX(i)+vo;
  else for(let i=0;i<p.count;i++)index[io++]=i+vo;
  vo+=p.count;
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(position,3));
 geometry.setAttribute('normal',new T.BufferAttribute(normal,3));
 if(uv)geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
 geometry.setIndex(new T.BufferAttribute(index,1));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}

// Photographie des pièces candidates : celles qui bougent, changent de matériau ou
// de visibilité entre la photo et la fusion sont animées par le jeu et restent intactes.
export function snapshotStatic(root,refs=referencedObjects(root)){
 const shots=new Map();
 root.traverse(o=>{if(mergeable(o,refs))shots.set(o,{matrix:[...o.matrix.elements],position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone(),material:o.material,parent:o.parent});});
 return shots;
}
const unchanged=(o,s)=>s&&o.material===s.material&&o.parent===s.parent&&o.position.equals(s.position)&&o.quaternion.equals(s.quaternion)&&o.scale.equals(s.scale);

// Fusionne, parent par parent, les pièces fixes de même matériau et de mêmes réglages d'ombre.
export function batchStatic(root,refs=referencedObjects(root),shots=null){
 const buckets=new Map();
 root.traverse(o=>{
  if(!mergeable(o,refs)||!o.parent||shots&&!unchanged(o,shots.get(o)))return;
  const key=o.parent.uuid+'|'+o.material.uuid+'|'+o.castShadow+'|'+o.receiveShadow;
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push(o);
 });
 let removed=0,added=0;
 for(const meshes of buckets.values()){
  if(meshes.length<2)continue;
  const parent=meshes[0].parent,first=meshes[0];
  const merged=new T.Mesh(mergeInto(meshes),first.material);
  merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;
  merged.userData.staticBatch=meshes.length;
  for(const m of meshes)parent.remove(m);
  parent.add(merged);removed+=meshes.length;added++;
 }
 return {removed,added};
}

// Les pièces plates (marquages, bordures, chaussées) ou minuscules n'ont pas d'ombre visible :
// on les retire du calcul d'ombre, qui redessine tous les objets plusieurs fois par seconde.
export function pruneShadowCasters(root,refs=new Set()){
 const size=new T.Vector3(),scale=new T.Vector3();let pruned=0;
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh||!o.castShadow||refs.has(o)||!o.geometry?.attributes?.position)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  o.geometry.boundingBox.getSize(size);o.matrixWorld.decompose(new T.Vector3(),new T.Quaternion(),scale);
  size.multiply(scale);
  const flat=Math.min(size.x,size.y,size.z)<.16&&size.y<.3,tiny=Math.max(size.x,size.y,size.z)<.3;
  if(flat||tiny){o.castShadow=false;pruned++;}
 });
 return pruned;
}
