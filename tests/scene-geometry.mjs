import assert from 'node:assert/strict';
import './game-environment.mjs';
import * as T from '../dist/vendor/three.module.js';
import {operatorPoint,responseVisuals} from '../dist/response-visuals.js';
import {vehicle,tree} from '../dist/models.js';
import {initWater,tickEquipment} from '../dist/hydraulics.js';
import {neighborhood} from '../dist/real-neighborhood.js';
import {readFileSync} from 'node:fs';
const world=new T.Scene();const district=neighborhood(world);
let roadTop,trailTop;
district.root.traverse(o=>{if(o.geometry?.type!=='BoxGeometry')return;const color=o.material?.color?.getHexString();if(color==='555f62')roadTop=o.position.y+o.geometry.parameters.height/2;if(color==='ae9a74')trailTop=o.position.y+o.geometry.parameters.height/2;});
assert(roadTop-trailTop>.05,'Dirt access lies below asphalt: no coplanar triangles at road intersections');
const urban=readFileSync(new URL('../dist/urban-detail.js',import.meta.url),'utf8');
const rutY=Number(urban.match(/const rut=box\(root,[\s\S]*?side\*1\.1,([.\d]+),/)[1]);
assert(rutY+.025/2<roadTop-.05,'Trail ruts also stay below asphalt at crossings');
const walkY=Number(urban.match(/walkMesh.position.y=([.\d]+)/)[1]);
assert(walkY+(.3+1.2)*.1<roadTop-.05,'Curved park footpath must not cross above the road');
const p=operatorPoint(-300,100,[{x:-300,z:100,radius:2}]);assert(Math.hypot(p[0]+300,p[1]-100)>=2);
const testWorld=new T.Scene(),model=vehicle(testWorld,'FPT'),e={kind:'FPT',model,status:'scene',call:1,size:6,crew:6,workStarted:0};model.position.set(-300,.2,100);initWater(e);e.nozzles.ldt=1;tickEquipment(e,12);e.flow=150;
const c={id:1,type:'INC',reconComplete:true,fireTarget:[-301,105],fireHeight:9};tree(testWorld,-301,101,1);
const fx=responseVisuals(testWorld,[e]);fx.update(1,{minute:20,calls:[c]});
const line=e.hoseVisuals.find(l=>l.p.visible);assert(line);assert.equal(line.p.rotation.x,0);assert.equal(line.p.rotation.z,0,'Aim height must not tilt the whole firefighter');
assert(Math.hypot(line.p.position.x+301,line.p.position.z-101)>=1.15,'Porte-lance stays clear of the trunk');
console.log('PASS forest/asphalt layering, upright nozzle operator and clear tree placement');
const {roads}=await import('../dist/roads.js');
district.root.traverse(o=>{if(!o.userData.treeClearance)return;for(const r of roads){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],x=o.position.x,z=o.position.z,t=Math.max(0,Math.min(1,((x-r.a[0])*dx+(z-r.a[1])*dz)/(dx*dx+dz*dz||1)));assert(Math.hypot(x-r.a[0]-t*dx,z-r.a[1]-t*dz)>=(r.trail?4.5:6.5)+o.userData.treeClearance,'Tree trunk clear of road and pavement');}});
console.log('PASS all decorative and forest tree sources clear of roads and trails');
const medicalWorld=new T.Scene(),ambulanceModel=vehicle(medicalWorld,'VSAV'),ambulance={kind:'VSAV',id:'VSAV test',model:ambulanceModel,status:'scene',call:7,size:3,crew:3,workStarted:0};
const medicalFx=responseVisuals(medicalWorld,[ambulance]),sap={id:7,type:'SUAP',reconComplete:true,victimCount:1,target:[5,5],actionPoint:[5,5],patients:[]};
medicalFx.update(1,{minute:1,calls:[sap]});const medics=[];medicalWorld.traverse(o=>{if(o.name==='Sapeur-pompier · secours à personne')medics.push(o);});assert(medics.length);assert(medics.every(p=>!p.userData.interventionHelmet?.visible),'Routine SAP has no helmets');sap.type='INC';medicalFx.update(2,{minute:2,calls:[sap]});assert(medics.every(p=>!p.userData.interventionHelmet?.visible),'VSAV crew stays bare-headed during medical support at a fire');
console.log('PASS both VSAV crew members bare-headed for SAP and medical support');

const utilityWorld=new T.Scene(),utility={...ambulance,kind:'VTU',model:vehicle(utilityWorld,'VTU')};
const utilityFx=responseVisuals(utilityWorld,[utility]);
for(const type of ['OD','SUAP','INC']){
 utilityFx.update(1,{minute:1,calls:[{...sap,type}]});
 const crew=[];utilityWorld.traverse(o=>{if(o.userData.uniform==='ssuap')crew.push(o);});
 assert.equal(crew.length,2);
 assert(crew.every(p=>!p.userData.interventionHelmet?.visible),'VTU crew remains bare-headed');
 assert(crew.every(p=>!p.children.some(o=>o.geometry?.type==='CylinderGeometry'&&o.position.z<0)),'VTU crew has no air cylinder');
}
console.log('PASS VTU crew without helmet or air cylinder on utility, medical and fire support calls');

const forestWorld=new T.Scene(),forest={...e,kind:'CCF',model:vehicle(forestWorld,'CCF')};
const forestFx=responseVisuals(forestWorld,[forest]);forestFx.update(1,{minute:20,calls:[c]});
const forestCrew=[];forestWorld.traverse(o=>{if(o.userData.uniform==='forest')forestCrew.push(o);});
assert(forestCrew.length>=2);assert(forestCrew.every(p=>p.userData.interventionHelmet.name==='Casque léger feux de forêt'));
assert(forestCrew.every(p=>!p.children.some(o=>o.geometry?.type==='CylinderGeometry'&&o.position.z<0)));
console.log('PASS CCF forest uniform, lightweight helmet and no structural air cylinder');
