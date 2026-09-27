import * as T from 'three';
import {box,cylinder,sign} from './models.js';
export function updateRoadSign(e,seconds){
 if(e.kind!=='VSR')return;
 let rig=e.model.userData.roadSign;
 if(!rig){
  const pivot=new T.Group();pivot.name='Panneau de balisage rabattable';pivot.position.set(0,3.4,-2.6);e.model.add(pivot);
  box(pivot,2.4,1.85,.12,'#293333',0,.95,0);
  const lamps=[];
  for(let row=0;row<5;row++)for(const col of [-1,1]){
   const lamp=cylinder(pivot,.13,.13,.09,new T.MeshStandardMaterial({color:'#d98a22',emissive:'#ff9600',emissiveIntensity:0}),col*(.85-row*.17),.35+row*.3,-.12,12);lamp.rotation.x=Math.PI/2;lamps.push(lamp);
  }
  const label=sign(pivot,'ACCIDENT',2.2,.3,0,.14,-.1,'#202929','#ffbd4b');label.rotation.y=Math.PI;
  rig=e.model.userData.roadSign={pivot,lamps,progress:0,time:0};
 }
 if(e.path||!['scene','idle','ready'].includes(e.status))e.roadSignDeployed=false;
 const target=e.roadSignDeployed?1:0;rig.progress+=Math.sign(target-rig.progress)*Math.min(Math.abs(target-rig.progress),Math.max(0,seconds)/3);
 rig.pivot.rotation.x=(1-rig.progress)*Math.PI/2;rig.time+=seconds;
 for(const lamp of rig.lamps)lamp.material.emissiveIntensity=rig.progress>.95&&Math.floor(rig.time*2)%2===0?3:0;
}
export function roadSignPanel(e){return e.kind==='VSR'?`<section class="supportCommands"><button data-support-action="road-sign" aria-pressed="${!!e.roadSignDeployed}" ${e.path||!['scene','idle','ready'].includes(e.status)?'disabled':''}>${e.roadSignDeployed?'Replier':'Déployer'} le panneau de signalisation</button></section>`:'';}
