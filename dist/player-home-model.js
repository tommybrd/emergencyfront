import * as T from 'three';
import {box,mat,person,sign,tree,dressCaptain} from './models.js';
import {batchStatic} from './batching.js';
import {PLAYER_HOME,alongHomeWalk} from './player-home.js';

export function createPlayerHome(world){
 const root=new T.Group();root.name='Domicile du chef de centre';world.add(root);
 const [x,z]=PLAYER_HOME.position,w=17,d=15;
 box(root,31,.12,25,'#9aa97e',22,.05,z);
 box(root,7,.16,25,'#b5b7a9',10,.17,z);
 box(root,7,.04,2.3,'#d7ccb5',14,.29,z);
 box(root,w,.3,d,'#d7cbb1',x,.3,z);
 // Front door faces the driveway. Cutaway roof reveals the bedroom at night.
 for(const dz of[-d/2,d/2])box(root,w,3.3,.25,'#d6c5a8',x,1.9,z+dz);
 box(root,.25,3.3,d,'#d6c5a8',x+w/2,1.9,z);
 for(const dz of[-4.3,4.3])box(root,.25,3.3,6.4,'#d6c5a8',x-w/2,1.9,z+dz);
 box(root,.25,.85,2.2,'#d6c5a8',x-w/2,3.1,z);
 for(const zz of[z-4.5,z+4.5]){box(root,.08,1.4,2.3,'#324d57',x-w/2-.15,2.05,zz);for(const side of[-1,1])box(root,.1,1.6,.42,'#6f877a',x-w/2-.18,2.05,zz+side*1.4);}
 const door=new T.Group();door.position.set(x-w/2-.17,.32,z-1.05);root.add(door);box(door,.12,2.25,2.1,'#536b65',0,1.125,1.05);box(door,.16,.1,.12,'#d2c49d',-.12,1.12,1.8);
 const plaque=sign(root,'DOMICILE • CHEF DE CENTRE',7.2,.55,x-w/2-.3,3.15,z,'#536b65');plaque.rotation.y=-Math.PI/2;
 const roofShape=new T.Shape();roofShape.moveTo(-w/2-.5,0);roofShape.lineTo(0,3);roofShape.lineTo(w/2+.5,0);roofShape.closePath();
 const roof=new T.Mesh(new T.ExtrudeGeometry(roofShape,{depth:d+1,bevelEnabled:false}),mat('#976b54'));roof.position.set(x,3.65,z-d/2-.5);roof.castShadow=true;root.add(roof);
 box(root,1.05,1.6,.9,'#c3ae96',31,5.1,121);
 const [bx,bz]=PLAYER_HOME.bed;box(root,2.25,.45,3.7,'#836d54',bx,.55,bz);box(root,2.1,.2,3.5,'#d4dacf',bx,.88,bz);box(root,1.8,.2,.7,'#e8e5d9',bx,1.02,bz-1.35);
 box(root,1.8,.65,1.1,'#927b5e',31,0.75,bz-1.5);box(root,3.5,.9,1.6,'#647b77',22,.85,129);box(root,3.6,.4,.3,'#647b77',22,1.4,129.7);box(root,2,.45,1.5,'#a58c6c',22,.55,126.9);
 const sleeper=person(root,bx,bz,'#829096');sleeper.userData.role='player-sleeper';sleeper.rotation.x=-Math.PI/2;sleeper.position.y=1.02;sleeper.visible=false;
 const blanket=box(root,1.95,.15,2.2,'#7d9298',bx,1.14,bz+.37);
 for(const zz of[z-12,z+12])box(root,21,.65,.2,'#c0b9a0',24,.5,zz);box(root,.2,.65,24,'#c0b9a0',34.5,.5,z);tree(root,36,132,.65,1);
 const porch=box(root,.14,.25,.3,new T.MeshStandardMaterial({color:'#b7aa7c',emissive:'#ffe4a5',emissiveIntensity:0}),16.2,2.6,126.4);
 batchStatic(root,[roof,door,sleeper,blanket,porch]);
 return {root,roof,sleeper,door,update(s,e){
  const p=s.roster.find(p=>p.role==='captain'),officer=e.officer,home=!!e.atResidence;
  sleeper.visible=false;roof.visible=!home;door.rotation.y=0;porch.material.emissiveIntensity=0;
  if(!home||!officer)return;
  officer.visible=false;dressCaptain(officer,s.playerProfile);
  const b=e.status==='departing'&&e.wasAtHome?e.boarding?.[0]:null,elapsed=s.minute-e.alertAt;
  let walk=null,sleeping=false;
  if(b){if(elapsed<b.delay)sleeping=b.resting;else if(elapsed<b.duration)walk=alongHomeWalk(b.path,(elapsed-b.delay)/(b.duration-b.delay));}
  else if(e.status==='ready'){const fraction=(s.minute-(p.homeArrivedAt??s.minute))/3;if(fraction<1)walk=alongHomeWalk([PLAYER_HOME.parking,PLAYER_HOME.door,PLAYER_HOME.bed],fraction);else sleeping=true;}
  sleeper.visible=sleeping;
  if(walk){officer.visible=true;officer.position.set(walk.point[0],.35,walk.point[1]);officer.rotation.set(0,walk.yaw,0);officer.children[1].rotation.x=Math.sin(s.minute*5)*.3;officer.children[2].rotation.x=-Math.sin(s.minute*5)*.3;door.rotation.y=Math.abs(walk.point[0]-PLAYER_HOME.door[0])<4?1.4:0;porch.material.emissiveIntensity=2;}
  else if(b&&!sleeping&&elapsed<b.delay){officer.visible=true;officer.position.set(b.from[0],.35,b.from[1]);officer.rotation.set(0,0,0);}
 }};
}
