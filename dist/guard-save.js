import * as T from 'three';
export const SAVE_KEY='valmont.guard.v1',RESUME_KEY='valmont.resume.v1';
// Only simulation data is persisted; GPU resources and visual rigs are rebuilt.
const visualKeys=new Set(['playerVehicles','parkedActors','serviceSignalOriginal','model','officer','hoseVisuals','zoneLightRig','refillVisual','supplyCrew','rig','blueParts','rearDoors']);
export function encodeGuard(value,references=new Map()){
 const seen=new Map(),nodes=[];
 function encode(v){
  if(v==null||typeof v==='string'||typeof v==='boolean')return v;
  if(typeof v==='number')return Number.isFinite(v)?v:{$number:String(v)};
  if(typeof v!=='object')return undefined;
  if(references.has(v))return {$external:references.get(v)};
  if(v.isVector3)return {$vector:[v.x,v.y,v.z]};
  if(v.isObject3D||v.isMaterial||v.isBufferGeometry||v.isTexture)return undefined;
  if(seen.has(v))return {$ref:seen.get(v)};
  const id=nodes.length;seen.set(v,id);const node={array:Array.isArray(v),data:{}};nodes.push(node);
  for(const [key,item]of Object.entries(v)){if(visualKeys.has(key)||['__proto__','constructor','prototype'].includes(key))continue;const encoded=encode(item);if(encoded!==undefined)node.data[key]=encoded;}
  return {$ref:id};
 }
 const root=encode(value);return {root,nodes};
}
export function decodeGuard(graph,references=new Map()){
 if(!Array.isArray(graph?.nodes)||graph.nodes.length>100000)throw Error('Sauvegarde invalide.');
 const objects=graph.nodes.map(n=>n.array?[]:{});
 function decode(v){if(v==null||typeof v!=='object')return v;if('$ref'in v){if(!objects[v.$ref])throw Error('Référence invalide.');return objects[v.$ref];}if('$external'in v)return references.get(v.$external)||null;if('$vector'in v)return new T.Vector3(...v.$vector);if('$number'in v)return v.$number==='Infinity'?Infinity:v.$number==='-Infinity'?-Infinity:NaN;throw Error('Donnée invalide.');}
 graph.nodes.forEach((node,i)=>{for(const [key,value]of Object.entries(node.data)){if(['__proto__','constructor','prototype'].includes(key))continue;objects[i][key]=decode(value);}});return decode(graph.root);
}
export function readGuard(storage=globalThis.localStorage){try{const data=JSON.parse(storage?.getItem(SAVE_KEY)||'null');return data?.version===1&&Array.isArray(data.specs)&&data.specs.length<=40&&data.graph?.nodes?data:null;}catch{return null;}}
export function takeResume(storage=globalThis.localStorage,session=globalThis.sessionStorage){try{if(session?.getItem(RESUME_KEY)!=='1')return null;session.removeItem(RESUME_KEY);return readGuard(storage);}catch{return null;}}
export function requestResume(session=globalThis.sessionStorage){session.setItem(RESUME_KEY,'1');}
export function guardReferences(engines,hydrants){const pairs=engines.map(e=>[e.model,'vehicle:'+e.id]);hydrants.forEach((h,i)=>pairs.push([h,'hydrant:'+i]));return pairs;}
export function saveGuard(state,engines,hydrants,camera,controls,storage=globalThis.localStorage){
 const refs=new Map(guardReferences(engines,hydrants));
 const specs=engines.map(e=>Object.fromEntries(['id','kind','home','size','name','dedicated','external','mutualAid','base','mobilization','lightForest','longChassis','lightPump','tankCapacity','ambulanceModel','signalStyle','signalFront','signalRear','signalAmber','foamEnabled','lightingEnabled'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]])));
 const data={version:1,at:Date.now(),minute:state.minute,citySeed:state.citySeed,specs,graph:encodeGuard({state,engines:engines.map(e=>({...e,position:e.model.position.clone(),yaw:e.model.rotation.y})),camera:camera.position.clone(),target:controls.target.clone()},refs)};
 try{storage.setItem(SAVE_KEY,JSON.stringify(data));return null;}catch{return 'Sauvegarde impossible : stockage du navigateur plein ou indisponible.';}
}
export function restoreGuard(data,state,engines,hydrants,camera,controls,rebuild){
 const refs=new Map(guardReferences(engines,hydrants).map(([object,key])=>[key,object])),snapshot=decodeGuard(data.graph,refs);
 if(!Number.isFinite(snapshot.state?.minute)||snapshot.engines.length!==engines.length)throw Error('Sauvegarde incompatible.');
 Object.assign(state,snapshot.state);state.paused=true;state.composingStation=false;
 for(const saved of snapshot.engines){const e=engines.find(e=>e.id===saved.id);if(!e)throw Error('Engin manquant dans la sauvegarde.');const {position,yaw,...runtime}=saved;Object.assign(e,runtime);e.model.position.copy(position);e.model.rotation.y=yaw;}
 for(const c of state.calls)if(c.status!=='closed')rebuild(c);
 camera.position.copy(snapshot.camera);controls.target.copy(snapshot.target);
 return snapshot;
}
