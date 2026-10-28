import * as T from 'three';
import {box,cylinder,sign,person} from './models.js';
import {applyEngineInsignia} from './crew-insignia.js';
import {block} from './roads.js';
const clamp=v=>Math.max(0,Math.min(1,v));
function create(e){
 const root=new T.Group();root.name='PC 41 · implantation opérationnelle';e.model.add(root);
 // Prefer the side with enough room for the work area, away from buildings.
 const score=side=>{const p=new T.Vector3(side*3,0,-1).applyAxisAngle(new T.Vector3(0,1,0),e.model.rotation.y).add(e.model.position);return block.buildings.reduce((n,b)=>n+(Math.abs(p.x-b.x)<b.w/2+2&&Math.abs(p.z-b.z)<b.d/2+3?1:0),0);};
 const side=score(1)<=score(-1)?1:-1;root.scale.x=side;
 const awning=new T.Group();root.add(awning);awning.position.set(1.28,3.12,-1.1);
 box(awning,2.7,.09,4.65,'#c4c0aa',1.35,0,0);box(awning,.07,.30,4.65,'#bd292b',2.7,-.1,0);
 for(const z of[-2.14,2.14]){cylinder(awning,.038,.04,3,'#adbbb9',2.6,-1.5,z,8);box(awning,.35,.06,.35,'#263439',2.6,-2.98,z);}
 const work=new T.Group();root.add(work);work.position.set(2.8,0,-1.2);
 box(work,1.05,.1,2.5,'#cbd3cd',0,1.02,0);
 for(const x of[-.42,.42])for(const z of[-1.05,1.05])box(work,.055,1,.055,'#697d7c',x,.5,z);
 for(const z of[-.6,.65]){box(work,.36,.025,.46,'#293d43',0,1.09,z);const screen=box(work,.025,.26,.44,'#26383c',.15,1.24,z);screen.rotation.z=-.15;box(work,.015,.21,.37,'#5b9a9d',.13,1.25,z);}
 sign(work,'SITAC · I / MOYENS',.8,.5,0,1.085,0,'#e6e7d5','#425c5b').rotation.x=-Math.PI/2;
 const board=new T.Group();root.add(board);board.position.set(2.8,0,-3.6);
 box(board,1.65,1.1,.06,'#e7ebe2',0,1.7,0);for(const x of[-.64,.64])box(board,.05,1.2,.05,'#7a8f8c',x,.65,0);
 sign(board,'SITAC · PC 41',1.4,.22,0,2.02,.04,null,'#233c43');
 for(const z of[-.035,.035]){for(const [i,color]of['#cc5945','#567d91','#679e71'].entries())box(board,.85-.15*i,.06,.015,color,-.15,1.77-i*.18,z);}
 const generator=new T.Group();root.add(generator);generator.position.set(2.3,0,1.7);box(generator,.58,.5,.65,'#b85836',0,.35,0);box(generator,.38,.1,.57,'#25363b',0,.65,0);for(const x of[-.34,.34])box(generator,.05,.64,.7,'#2b3a3e',x,.35,0);
 const cable=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(2.3,.08,1.7),new T.Vector3(3.7,.08,1.7),new T.Vector3(3.7,.08,-2.4),new T.Vector3(1.28,.08,-2.4)]),new T.LineBasicMaterial({color:'#343c40'}));root.add(cable);
 const mast=new T.Group();root.add(mast);mast.position.set(-.8,3.35,-3.3);cylinder(mast,.055,.065,3,'#b4c2c3',0,1.5,0,10);box(mast,.65,.1,.16,'#596c73',0,3.02,0);for(const x of[-.25,.25])cylinder(mast,.018,.018,.75,'#30434a',x,3.4,0,6);
 const chairs=[];for(const z of[-.7,.6]){const c=new T.Group();root.add(c);c.position.set(3.85,0,z-1.2);box(c,.43,.07,.43,'#304c60',0,.5,0);box(c,.07,.45,.43,'#304c60',.22,.74,0);for(const x of[-.17,.17])for(const zz of[-.17,.17])box(c,.04,.5,.04,'#8eaaa9',x,.25,zz);chairs.push(c);}
 const cones=[];for(const [x,z]of[[1.7,2.3],[4.4,2.3],[4.4,-4.3],[1.7,-4.3]]){const c=new T.Group();root.add(c);c.position.set(x,0,z);box(c,.48,.06,.48,'#28363a',0,.03,0);cylinder(c,0,.18,.55,'#ec8738',0,.31,0,10);cylinder(c,.07,.11,.12,'#e8e9d2',0,.32,0,10);cones.push(c);}
 const crew=Array.from({length:Math.min(3,e.crew||e.size||3)},()=>person(root,0,0,'#344859'));
 root.traverse(o=>{if(o.userData.signText)o.scale.x=side;});
 return {root,awning,work,board,generator,cable,mast,chairs,cones,crew,side,progress:e.pcDeploymentProgress||0};
}
export function updateCommandDeployment(e,minutes){
 if(e.kind!=='PC')return;
 let r=e.model.userData.commandDeployment;
 if(!r&&e.status==='scene')r=e.model.userData.commandDeployment=create(e);
 if(!r)return;
 const deploying=e.status==='scene'&&e.crew>=2;r.progress=clamp(r.progress+(deploying?1:-1)*minutes/5);
 if(!['scene','reconditioning'].includes(e.status))r.progress=0;
 e.pcDeploymentProgress=r.progress;const p=r.progress;r.root.visible=p>0;if(!r.root.visible)return;
 r.awning.scale.x=Math.max(.01,clamp((p-.12)/.28));r.awning.visible=p>.12;
 r.mast.scale.y=Math.max(.01,clamp((p-.3)/.45));r.mast.visible=p>.3;
 for(const o of[r.work,r.chairs[0],r.chairs[1]])o.visible=p>.38;
 r.board.visible=p>.64;r.generator.visible=r.cable.visible=p>.5;r.cones.forEach((c,i)=>c.visible=p>i*.07);
 r.crew.forEach((person,i)=>{person.visible=i<(e.crew||0);applyEngineInsignia(person,e,i);const target=i===0?[2.15,-3.6]:[3.65,-1.9+(i-1)*1.3],f=clamp((p-.12-i*.15)/.35);person.position.set(1.5+(target[0]-1.5)*f,0,1.2+(target[1]-1.2)*f);person.rotation.y=-Math.PI/2;person.children[3].rotation.x=p<.85?-.65:i===0?-.35:-1.05;person.children[4].rotation.x=person.children[3].rotation.x;person.children[1].rotation.x=p<.85?Math.sin(p*35+i)*.3:0;person.children[2].rotation.x=-person.children[1].rotation.x;if(p>=.85&&i>0){person.position.y=-.3;person.children[1].rotation.x=person.children[2].rotation.x=-1.35;}});
}
