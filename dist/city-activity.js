import * as T from 'three';
import {box,cylinder,sign,person} from './models.js';
import {block} from './roads.js';
import {batchStatic} from './batching.js';
import {walkRoute} from './building-actions.js';
import {alongHomeWalk} from './player-home.js';
export function cityActivityLevels(minute){
 const h=((minute/60)%24+24)%24,school=(h>=7.6&&h<9)||(h>=11.5&&h<13.5)||(h>=16&&h<17.5),work=h>=8&&h<18&&!(h>=12&&h<13);
 return{shops:h>=7&&h<20?1:0,cafe:h>=7&&h<22?1:0,school:school?1:0,work:work?1:0,traffic:h<6?.22:h<9?1:h<16?.68:h<19?1:h<22?.58:.3};
}
function buildingNear(x,z){return block.buildings.filter(b=>b.style==='town').sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];}
export function createCityActivity(world){
 const root=new T.Group();root.name='Vie des quartiers · commerces, école et chantier';world.add(root);const staticRoot=new T.Group();root.add(staticRoot);const actors=[];
 function actor(role,color,route,scale=1,delay=0){if(!route)return;const m=person(root,...route[0],color);m.name=role;m.userData.cityActor=role;m.scale.setScalar(scale);actors.push({model:m,role,route,delay});return m;}
 // The school uses an existing building; no extra building in an urban block.
 const school=buildingNear(304,-13),sx=school.x,sz=school.z-school.d/2-.8;
 const label=sign(staticRoot,'ÉCOLE DES DEUX RIVES',school.w*.88,.75,sx,3,sz+.65,'#657e8a','#fff0ca');label.rotation.y=Math.PI;
 for(const x of[sx-3,sx+3]){cylinder(staticRoot,.1,.11,1.25,'#b76446',x,.62,sz-1,8);box(staticRoot,.4,.22,.4,'#d8ca67',x,1.3,sz-1);}
 for(const side of[-1,1]){box(staticRoot,school.w*.35,.04,.9,'#87916e',sx+side*school.w*.31,.1,sz-.3);box(staticRoot,school.w*.35,.75,.065,'#6b8b82',sx+side*school.w*.31,.48,sz-1.4);}
 for(let i=0;i<6;i++){const start=[sx-7+i*2,sz-3],end=[sx+(i%2?1:-1),sz];const child=actor('school',i%2?'#bb8f59':'#7e769b',walkRoute(start,end),i<4?.72:1,i);if(child&&i<4){box(child,.34,.4,.17,['#d45b48','#517c9a'][i%2],0,1.05,-.24);}}
 // Customers walk to shopfronts and stay at the café terrace at opening hours.
 for(const [i,x]of[22,93,118].entries()){
  const start=[x-5,4.5],end=[x+2,2];actor(i===1?'cafe':'shops',['#bc8767','#7a9573','#96829a'][i],walkRoute(start,end),1,i);
  const awning=box(staticRoot,7,.12,1.7,i===2?'#6e8c72':'#b4735b',x,3.35,.1);awning.rotation.x=.05;
 }
 for(let i=0;i<2;i++)actor('cafe',i?'#6b8294':'#ad9762',walkRoute([88+i*4,4],[91+i*4,2]),1,i+3);
 // Renovation scaffolding belongs to another existing building, leaving all
 // road lanes and incident building geometry available to the routing system.
 const site=buildingNear(-200,80),x=site.x,z=site.z+site.d/2+.45;
 for(const xx of[x-site.w/2+1,x,x+site.w/2-1])for(const zz of[z,z+1.3])cylinder(staticRoot,.055,.055,5.8,'#96aaa4',xx,2.9,zz,6);
 for(const y of[2.1,4.3]){box(staticRoot,site.w-1,.085,1.6,'#a58b61',x,y,z+.65);for(const zz of[z,z+1.3])box(staticRoot,site.w-1,.065,.065,'#97aaa2',x,y+1,zz);}
 for(const dx of[-5,-1,3]){box(staticRoot,2,.65,.55,'#ce854c',x+dx,.35,z+3.8);box(staticRoot,2,.07,.58,'#e2ddab',x+dx,.69,z+3.8);}
 sign(staticRoot,'TRAVAUX · RÉNOVATION',site.w*.8,.6,x,1.25,z+4.12,'#d3ac5f','#263638');
 for(let i=0;i<3;i++){
  const m=actor('work',['#6c8585','#9a8564','#71818e'][i],walkRoute([x-5+i*3,z+2],[x+5-i*2,z+2]),1,i);
  if(m){box(m,.55,.35,.33,'#dfb550',0,1.18,0);cylinder(m,.26,.26,.14,'#e3bf55',0,1.84,0,10);}
 }
 const wheelbarrow=new T.Group();staticRoot.add(wheelbarrow);wheelbarrow.position.set(x+4,0,z+3);box(wheelbarrow,.8,.35,1.1,'#638987',0,.68,0);const wheel=cylinder(wheelbarrow,.2,.2,.15,'#2f3b3b',0,.23,.65,10);wheel.rotation.z=Math.PI/2;for(const xx of[-.3,.3])box(wheelbarrow,.055,.055,1.8,'#728780',xx,.46,-.15);
 batchStatic(staticRoot);
 return{root,actors,school,site,update(minute,t,blocked=()=>false){
  const levels=cityActivityLevels(minute);
  for(const a of actors){const m=a.model;m.visible=!!levels[a.role];if(!m.visible)continue;const phase=((minute*.05+a.delay*.21)%2+2)%2,f=phase<1?phase:2-phase,pose=alongHomeWalk(a.route,f);
   // Quietly clear venues affected by an incident perimeter.
   if(blocked(pose.point,2)){m.visible=false;continue;}
   m.position.set(pose.point[0],0,pose.point[1]);m.rotation.y=pose.yaw+(phase>1?Math.PI:0);
   const moving=a.role!=='cafe'&&f>.1&&f<.95;m.children[1].rotation.x=moving?Math.sin(t*6+a.delay)*.4:0;m.children[2].rotation.x=-m.children[1].rotation.x;
   m.children[4].rotation.x=a.role==='work'?-.7+Math.sin(t*2+a.delay)*.3:a.role==='cafe'?-.5:0;
  }
 }};
}
