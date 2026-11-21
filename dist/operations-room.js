// Salle opérationnelle (CTA-CODIS 41) : bâtiment du centre-ville du chef de salle, distinct du VLCG et du CIS.
import * as T from 'three';
import {box,sign} from './models.js';
import {block} from './roads.js';
import {policeStation} from './police.js';
const CIS_CENTRE=[-67,71];
export function operationsRoom(){
 const police=policeStation().building;
 const b=block.buildings.filter(b=>b.style==='town'&&b!==police).sort((a,c)=>Math.hypot(a.x-CIS_CENTRE[0],a.z-CIS_CENTRE[1])-Math.hypot(c.x-CIS_CENTRE[0],c.z-CIS_CENTRE[1]))[0];
 return {building:b,target:[b.x,b.z],eye:[b.x+34,36,b.z+30]};
}
export function buildOperationsRoom(world){
 const room=operationsRoom(),b=room.building,h=b.levels*3,g=new T.Group();g.name='Salle opérationnelle · CTA-CODIS 41';world.add(g);
 const text='SALLE OPÉRATIONNELLE · CTA-CODIS 41',red='#a3242c',pale='#f4efe6';
 // Enseigne sur chaque façade : le bâtiment se lit depuis n'importe quel angle de caméra.
 for(const [dx,dz,ry,len] of [[1,0,Math.PI/2,b.d],[-1,0,-Math.PI/2,b.d],[0,1,0,b.w],[0,-1,Math.PI,b.w]]){
  const plaque=sign(g,text,len*.92,1.1,b.x+dx*(b.w/2+.06),h-1,b.z+dz*(b.d/2+.06),red,pale);plaque.rotation.y=ry;plaque.name='Enseigne de la salle opérationnelle';
 }
 // Marquage sur le versant est du toit, lisible depuis la vue aérienne.
 const run=b.w/2+.4,rise=2.5+b.w*.035,slope=new T.Group();slope.position.set(b.x+run*.72,h+.05+rise*.28+.07,b.z);slope.rotation.z=-Math.atan2(rise,run);g.add(slope);
 const roofMark=sign(slope,'CODIS',b.d*.9,Math.hypot(run,rise)*.45,0,0,0,red,pale);roofMark.rotation.set(-Math.PI/2,0,Math.PI/2);roofMark.name='Marquage de toit CODIS';
 // Mât d'antenne et parabole : la salle est la tête du réseau radio.
 box(g,.12,7,.12,'#d8d8d2',b.x-b.w*.25,h+3.5,b.z-b.d*.2);box(g,.9,.9,.12,'#e9e9e3',b.x-b.w*.25+.5,h+6.2,b.z-b.d*.2);box(g,.5,.08,.5,'#a3242c',b.x-b.w*.25,h+7.1,b.z-b.d*.2);
 return g;
}
