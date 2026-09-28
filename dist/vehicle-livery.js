import * as T from 'three';
export const LIVERIES=Object.freeze({service:'Service',plain:'Rouge uni'});
export const normalizeLivery=value=>Object.hasOwn(LIVERIES,value)?value:'service';
// These are the model builders' body/reflective paint colours, not lamp colours.
const paint=new Set(['e7e83e','e9ed35','dfea35','e7df42','e5ed38','eaf21d','e5eb2e','b5b82f','b5ad28','dfec36']);
const redMaterials=new Map();
export function installVehicleLivery(model,skin='service'){
 const red=model.userData.bodyStyle==='hilux-pickup'?'#cb3030':model.userData.kind==='VSAV'?'#cf292d':'#bd292b';
 if(!redMaterials.has(red)){const m=new T.MeshStandardMaterial({color:red,roughness:.65,side:T.DoubleSide});m.userData.shared=true;redMaterials.set(red,m);}
 const parts=[];
 model.traverse(o=>{
  const decal=o.userData.liveryDecal&&o.name!=='Plaque de flotte';
  const repaint=o.isMesh&&!o.material?.map&&paint.has(o.material?.color?.getHexString())&&!o.material?.emissive?.getHex()&&o.geometry?.type!=='CylinderGeometry';
  if(decal||repaint)parts.push({object:o,visible:o.visible,material:o.material,decal:!!decal});
 });
 model.userData.liveryParts=parts;model.userData.plainLiveryMaterial=redMaterials.get(red);
 applyVehicleLivery(model,skin);
}
export function applyVehicleLivery(model,skin){
 skin=normalizeLivery(skin);model.userData.livery=skin;
 for(const p of model.userData.liveryParts||[]){p.object.visible=p.visible&&!(skin==='plain'&&p.decal);if(!p.decal)p.object.material=skin==='plain'?model.userData.plainLiveryMaterial:p.material;}
}
