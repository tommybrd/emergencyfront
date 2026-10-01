import {RIVER} from './river-layout.js';
import * as T from 'three';
import {roads} from './roads.js';
export const DEFENSE_SECTORS=[{id:'centre',name:'CIS Centre',point:[-70,71],color:'#64c9d2'},{id:'sud',name:'CIS Sud',point:[240,220],color:'#e9b763'}];
export function defenseSector(point){return DEFENSE_SECTORS[point[0]<=RIVER.x?0:1];}
export function sectorPolygon(sector,bounds){
 const west=sector.id==='centre',value=p=>(p[0]-RIVER.x)*(west?1:-1),out=[];
 for(let i=0;i<bounds.length;i++){const p=bounds[i],q=bounds[(i+1)%bounds.length],u=value(p),v=value(q);if(u<=0)out.push(p);if((u<=0)!==(v<=0)){const t=u/(u-v);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}
 return out;
}
export function createDefenseSectors(world){
 const group=new T.Group();group.name='Secteurs de premier appel';group.visible=false;world.add(group);
 const points=roads.flatMap(r=>[r.a,r.b]),xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),x0=Math.min(...xs)-30,x1=Math.max(...xs)+30,z0=Math.min(...zs)-30,z1=Math.max(...zs)+30;
 for(const sector of DEFENSE_SECTORS){const polygon=sectorPolygon(sector,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]),vertices=[];for(let i=1;i<polygon.length-1;i++)for(const p of[polygon[0],polygon[i],polygon[i+1]])vertices.push(p[0],.38,p[1]);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:sector.color,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide}));group.add(mesh);}
 return group;
}
