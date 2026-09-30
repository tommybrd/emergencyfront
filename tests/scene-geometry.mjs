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
const ambulanceParts=new Set();ambulanceModel.traverse(o=>{if(o.name)ambulanceParts.add(o.name);});
for(const part of['Cabine Renault profilée','Cellule sanitaire monobloc','Pare-brise panoramique','Calandre Renault','Volet technique','Chevrons réfléchissants capot'])assert(ambulanceParts.has(part),`Detailed VSAV keeps its ${part}`);
assert.equal(ambulanceModel.userData.penetrationLights.length,0,'VSAV keeps a clean flank without side flash modules');
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

const {block,urbanPlots}=await import('../dist/city-layout.js');
for(const p of urbanPlots)assert.equal(block.buildings.filter(b=>b.x>p.x0&&b.x<p.x1&&b.z>p.z0&&b.z<p.z1).length,p.count||4);
for(const [xs,zs] of [[[0,70,140],[-90,-30,30]],[[140,186,234,280],[-90,-40,30]],[[0,75,140],[30,109,160]]])for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){const n=block.buildings.filter(b=>b.x>xs[i-1]&&b.x<xs[i]&&b.z>zs[j-1]&&b.z<zs[j]).length;assert(n>0&&n<=4,'Occupied block has at most four buildings');}
const seen=new Set([block.roads[0].a.join(',')]);let old;do{old=seen.size;for(const r of block.roads)if(seen.has(r.a.join(','))||seen.has(r.b.join(','))){seen.add(r.a.join(','));seen.add(r.b.join(','));}}while(old!==seen.size);
assert(block.roads.every(r=>seen.has(r.a.join(','))&&seen.has(r.b.join(','))),'All added streets connect to the routing graph');
console.log('PASS populated urban plots, maximum four buildings per block and connected street subdivisions');
const {installDiveKit}=await import('../dist/water-models.js');
const vpl={model:vehicle(world,'VPL')};installDiveKit(vpl);assert.equal(vpl.model.userData.carriedBoat.parent,vpl.model.userData.boatTrailer);assert(vpl.model.userData.boatTrailer.position.z<-vpl.model.userData.length/2);assert(vpl.model.userData.rearOverhang>=5);assert.equal(vpl.model.userData.boatTrailer.userData.wheels.length,2);
const {updateRoadSign}=await import('../dist/road-sign.js');const vsr={kind:'VSR',status:'scene',model:vehicle(world,'VSR'),roadSignDeployed:true};updateRoadSign(vsr,1);assert(vsr.model.userData.roadSign.progress>0&&vsr.model.userData.roadSign.progress<1);updateRoadSign(vsr,3);assert.equal(vsr.model.userData.roadSign.progress,1);vsr.path=[[0,0],[1,1]];updateRoadSign(vsr,3);assert.equal(vsr.roadSignDeployed,false);assert.equal(vsr.model.userData.roadSign.progress,0);
console.log('PASS boat carried on wheeled trailer and VSR sign deployment/retraction interlock');

const {createGarage,updateStationGate}=await import('../dist/garage.js');
const gateScene=new T.Group(),gateModel=createGarage(gateScene).gate;
const approaching={path:[[0,0]],model:{position:{x:-70,z:120}}};
updateStationGate(gateModel,[approaching],2);assert.equal(gateModel.progress,1);assert(gateModel.rotor.visible);
updateStationGate(gateModel,[],3);assert.equal(gateModel.progress,1,'Hold gate clear after vehicle passes');
updateStationGate(gateModel,[],5);assert.equal(gateModel.progress,0);
updateStationGate(gateModel,[],1);assert(!gateModel.rotor.visible);
console.log('PASS automatic sliding gate, vehicle approach, delayed closure and amber beacon');

const {setInsigniaState}=await import('../dist/crew-insignia.js');
e.crewIds=[100,101];setInsigniaState({roster:[{id:100,grade:'Sapeur'},{id:101,grade:'Adjudant'}],calls:[c]});fx.update(3,{minute:25,calls:[c]});let chief;testWorld.traverse(o=>{if(o.userData.operationalRole==='chef-agres'&&o.userData.personId===101)chief=o;});assert(chief?.visible,'actual crew chief visible during attack');assert.equal(chief.userData.personGrade,'Adjudant');e.status='returning';fx.update(4,{minute:26,calls:[c]});assert(!chief.parent.visible,'chief boards for return');setInsigniaState(null);
const {updateMorningChecks}=await import('../dist/station-life.js');
const checkEngine={kind:'EPA',status:'ready',model:{userData:{}}};updateMorningChecks({minute:529},[checkEngine]);assert(checkEngine.model.userData.routineTesting);assert(checkEngine.model.userData.routineHeadlights);updateMorningChecks({minute:533},[checkEngine]);assert.equal(checkEngine.model.userData.routineLadder,1);checkEngine.status='departing';updateMorningChecks({minute:533},[checkEngine]);assert.equal(checkEngine.model.userData.routineLadder,0);assert.equal(checkEngine.model.userData.routineTesting,false);assert.equal(checkEngine.model.userData.routineCheck,null);
console.log('PASS actual chief outside during fire and hidden on return; morning checks and immediate dispatch interruption');
