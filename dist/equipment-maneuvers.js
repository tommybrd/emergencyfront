import * as T from 'three';
import {box,cylinder,mat} from './models.js';
import {walkRoute} from './building-actions.js';
import {alongHomeWalk} from './player-home.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// Reference each movable shutter before vehicle batching; its shelves stay
// attached to the chassis, with no extra crew or operational delay.
// rear : coffre posé sur la face arrière (z donné), depth : profondeur réduite pour ne pas dépasser du gabarit.
export function equipmentLocker(g,{side,z,width,height,y,color,rear=null,depth=1}){
 const root=new T.Group();root.name='Coffre matériel · rideau roulant';if(rear==null){root.position.set(side*1.255,y,z);root.rotation.y=side*Math.PI/2;}else{root.position.set(0,y,rear);root.rotation.y=Math.PI;}g.add(root);const d=depth;
 const interior=new T.Group();root.add(interior);interior.visible=false;
 box(interior,width,height,.035,'#263638',0,0,-.018*d);
 for(const yy of[-height*.3,height*.18])box(interior,width-.08,.035,.16*d,'#6c7d7a',0,yy,.035*d);
 // Tuyaux en écheveaux rangés debout, à la suite, vus par la tranche (comme dans un vrai coffre).
 const roll=Math.min(.16,height*.13),rolls=Math.max(2,Math.min(8,Math.floor((width*.62)/(roll*.75+.03))));for(let i=0;i<rolls;i++){const coil=new T.Mesh(new T.TorusGeometry(roll,roll*.38,6,12),mat('#ccb991'));coil.rotation.y=Math.PI/2;coil.scale.x=.4*d;coil.position.set(-width*.42+(i+.5)*width*.62/rolls,-height*.3+.02+roll*1.38,.05*d);interior.add(coil);}
 box(interior,.17,height*.52,.18*d,'#d03d33',width*.31,-height*.12,.09*d);
 const shutter=new T.Group();root.add(shutter);const panels=[];
 const slatMesh=new T.InstancedMesh(new T.BoxGeometry(width-.035,height/10-.012,.055),typeof color==='object'?color:mat(color),10);slatMesh.castShadow=slatMesh.receiveShadow=true;shutter.add(slatMesh);
 for(let i=0;i<10;i++){const p=new T.Object3D();p.position.set(0,-height/2+(i+.5)*height/10,.19*d);p.updateMatrix();slatMesh.setMatrixAt(i,p.matrix);panels.push(p);}slatMesh.computeBoundingSphere();slatMesh.frustumCulled=false;
 const handle=box(shutter,Math.min(.37,width*.5),.045,.08,'#334445',0,-height/2+.09,.23*d);
 cylinder(root,.075,.075,width,'#82908c',0,height/2+.025,.14*d,10).rotation.z=Math.PI/2;
 const r={root,panels,slatMesh,interior,handle,width,height,progress:0,side,z,rear:rear!=null};(g.userData.equipmentLockers??=[]).push(r);return r;
}
export function updateEquipmentLockers(e,c,t,minute){
 const rig=e.model.userData,age=minute-(e.workStarted??minute),scene=e.status==='scene'&&c?.status!=='closed';
 const preparing=scene&&(age<2.2||(e.hoses||[]).some(h=>h.progress>0&&h.progress<1)||e.supplyProgress>0&&e.supplyProgress<1||e.extricationTask!=null);
 const dt=rig.equipmentAt==null?0:Math.max(0,Math.min(2.5,t-rig.equipmentAt));rig.equipmentAt=t;
 // Le coffre arrière (pompe) reste ouvert tant que l'alimentation est raccordée.
 const supplied=scene&&(!!e.hydrant||(e.supplyProgress||0)>0);
 for(const r of rig.equipmentLockers||[]){r.progress=clamp(r.progress+(preparing||e.model.userData.routineCheck||r.rear&&supplied?1:-1)*dt/1.1);const lift=r.progress*r.height;r.interior.visible=r.progress>0;if(r.drawnProgress!==r.progress){r.drawnProgress=r.progress;r.panels.forEach((p,i)=>{p.position.y=-r.height/2+(i+.5)*r.height/10+lift;p.visible=p.position.y<r.height/2;p.scale.setScalar(p.visible?1:0);p.updateMatrix();r.slatMesh.setMatrixAt(i,p.matrix);});r.slatMesh.instanceMatrix.needsUpdate=true;}r.handle.position.y=-r.height/2+.09+lift;r.handle.visible=r.progress<.92;}
 return scene&&age>=0&&age<2.2&&c.complication?.status!=='active'&&!e.aerial?.mode&&!e.extricationTask&&!(e.hoses||[]).some(h=>h.progress>.05)?clamp(age/2.2):null;
}
export function createCarryTool(worker,kind){
 const tool=new T.Group();tool.name='Matériel porté depuis le véhicule';worker.children[4].add(tool);tool.position.set(0,-.28,.14);tool.visible=false;
 if(['VSAV','VLI','VTU','PC','VPCE'].includes(kind)){box(tool,.38,.27,.2,kind==='PC'?'#637b79':'#c63535',0,0,0);box(tool,.17,.04,.08,'#2a373d',0,.16,0);}
 else{const reel=new T.Mesh(new T.TorusGeometry(.24,.07,6,12),mat('#c6b795'));tool.add(reel);box(tool,.055,.055,.42,'#404d50',.15,0,0);}
 return tool;
}
export function prepareCrew(e,worker,tool,phase,end,t){
 tool.visible=false;if(phase==null||!worker)return;
 const yaw=e.model.rotation.y,sin=Math.sin(yaw),cos=Math.cos(yaw),p=e.model.position,lock=e.model.userData.equipmentLockers?.find(r=>r.side===1),z=lock?.z??-e.model.userData.length*.25;
 const start=[p.x+cos*1.8+sin*1.4,p.z-sin*1.8+cos*1.4],pickup=[p.x+cos*1.9+sin*z,p.z-sin*1.9+cos*z],key=e.call+':'+p.x+':'+p.z+':'+end.x+':'+end.z;
 if(tool.userData.routeKey!==key){tool.userData.routeKey=key;tool.userData.approach=walkRoute(start,pickup);tool.userData.route=walkRoute(pickup,[end.x+1,end.z+1]);}
 const route=phase<.22?tool.userData.approach:phase<.4?[pickup,pickup]:tool.userData.route;if(!route)return;
 const f=phase<.22?phase/.22:phase<.4?0:clamp((phase-.4)/.6),pose=alongHomeWalk(route,f);
 worker.visible=true;worker.position.set(...[pose.point[0],0,pose.point[1]]);worker.rotation.set(0,phase>=.22&&phase<.4?yaw-Math.PI/2:pose.yaw,0);
 const walking=(phase<.22||phase>.4)&&f<1;worker.children[1].rotation.x=walking?Math.sin(t*7)*.45:0;worker.children[2].rotation.x=-worker.children[1].rotation.x;worker.children[4].rotation.x=phase>.22?-.9:0;tool.visible=phase>=.35;
}
