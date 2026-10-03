import * as T from 'three';
import {box,cylinder,sign} from './models.js';
import {RIVER,RIVER_BRIDGES} from './river-layout.js';
import {batchStatic} from './batching.js';
export function createRiver(world){
 const root=new T.Group();root.name='La Valme · deux rives et ponts';world.add(root);
 const length=RIVER.z1-RIVER.z0,z=(RIVER.z0+RIVER.z1)/2;
 box(root,RIVER.halfWidth*2,.1,length,'#487f89',RIVER.x,.045,z);
 for(const side of[-1,1]){
  const x=RIVER.x+side*(RIVER.halfWidth+RIVER.bankWidth/2);
  const cuts=[RIVER.z0,...RIVER_BRIDGES.flatMap(b=>[b.z-(b.express?12:8),b.z+(b.express?12:8)]),RIVER.z1].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){
   const middle=(cuts[i-1]+cuts[i])/2;if(RIVER_BRIDGES.some(b=>Math.abs(b.z-middle)<(b.express?12:8)))continue;
   box(root,RIVER.bankWidth,.35,cuts[i]-cuts[i-1],'#a2aa91',x,.07,middle);box(root,.17,.58,cuts[i]-cuts[i-1],'#859a93',RIVER.x+side*RIVER.halfWidth,.16,middle);
   // Quays are limited to the urban reach. Long shared-material pieces remain
   // cheap after static batching while giving both banks a finished promenade.
   const start=Math.max(cuts[i-1],-155),end=Math.min(cuts[i],280),length=end-start;if(length<=4)continue;
   const z=(start+end)/2,railX=RIVER.x+side*(RIVER.halfWidth+.16);
   box(root,1.45,.055,length,'#c8b999',x,.28,z);
   for(const y of[.7,1.08])box(root,.075,.075,length,'#607976',railX,y,z);
   for(let p=start+2;p<end-1;p+=8)cylinder(root,.055,.065,1.08,'#607976',railX,.57,p,6);
  }
 }
 for(const b of RIVER_BRIDGES){
  const width=b.express?22:12.3,span=RIVER.halfWidth*2+RIVER.bankWidth*2+1;
  box(root,span,.32,width,'#86918a',RIVER.x,.11,b.z);
  box(root,span,.045,b.express?18:9,'#555f62',RIVER.x,.275,b.z);
  for(const side of[-1,1]){box(root,span,.1,.13,'#b1bfba',RIVER.x,1.2,b.z+side*(width/2-.2));box(root,span,.08,.1,'#a8b8b2',RIVER.x,.72,b.z+side*(width/2-.2));for(let x=RIVER.x-span/2+.2;x<=RIVER.x+span/2;x+=2)box(root,.08,1.02,.1,'#647976',x,.71,b.z+side*(width/2-.2));box(root,span,.075,.13,'#e1dfc3',RIVER.x,.31,b.z+side*(b.express?9:4.35));}
  for(const x of[RIVER.x-4,RIVER.x+4]){box(root,1.15,.48,width-1,'#748780',x,-.02,b.z);}
  for(const side of[-1,1]){const x=RIVER.x+side*(span/2+2),edge=b.z+width/2-.35;cylinder(root,.06,.075,1.7,'#647976',x,.85,edge,6);const label=sign(root,'LA VALME',2.6,.48,x,1.8,edge,'#3a6775','#edf1df');label.rotation.y=side>0?-Math.PI/2:Math.PI/2;}
 }
 // Sparse glints use one static instanced draw rather than a water shader.
 for(let i=0;i<70;i++)box(root,1.1+(i%3)*.35,.008,.035,'#6fa0a5',RIVER.x-4.5+(i*7%10),.103,RIVER.z0+12+i*10.5);
 // A few seats and named quay markers make the river usable as a city place.
 for(const [side,z]of[[-1,-118],[1,-65],[-1,72],[1,142],[-1,224]]){
  const x=RIVER.x+side*(RIVER.halfWidth+RIVER.bankWidth/2),seat=new T.Group();seat.position.set(x,0,z);seat.rotation.y=side*Math.PI/2;root.add(seat);
  box(seat,2.35,.14,.58,'#8b7255',0,.62,0);box(seat,2.35,.55,.1,'#8b7255',0,.95,-.24);for(const dx of[-.78,.78])box(seat,.1,.55,.45,'#465952',dx,.3,0);
 }
 for(const [side,z,label]of[[-1,-138,'QUAI DES TILLEULS'],[1,205,'QUAI DES JARDINS']]){
  const marker=sign(root,label,5.8,.55,RIVER.x+side*(RIVER.halfWidth+RIVER.bankWidth/2),1.7,z,'#466c6e','#f2ead2');marker.rotation.y=side*Math.PI/2;
 }
 batchStatic(root);return{root,bridges:RIVER_BRIDGES};
}
