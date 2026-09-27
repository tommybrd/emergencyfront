import * as T from 'three';
import {roads} from './roads.js';
export const DEFENSE_SECTORS=[{id:'centre',name:'CIS Centre',point:[-70,71],color:'#64c9d2'},{id:'sud',name:'CIS Sud',point:[240,220],color:'#e9b763'}];
export function defenseSector(point){return DEFENSE_SECTORS.reduce((best,s)=>Math.hypot(point[0]-s.point[0],point[1]-s.point[1])<Math.hypot(point[0]-best.point[0],point[1]-best.point[1])?s:best);}
export function sectorPolygon(sector,bounds){
 const other=DEFENSE_SECTORS.find(s=>s!==sector),a=sector.point,b=other.point,n=[b[0]-a[0],b[1]-a[1]],limit=(b[0]**2+b[1]**2-a[0]**2-a[1]**2)/2,value=p=>p[0]*n[0]+p[1]*n[1]-limit,out=[];
 for(let i=0;i<bounds.length;i++){const p=bounds[i],q=bounds[(i+1)%bounds.length],u=value(p),v=value(q);if(u<=0)out.push(p);if((u<=0)!==(v<=0)){const t=u/(u-v);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}
 return out;
}
export function createDefenseSectors(world){
 const group=new T.Group();group.name='Secteurs de premier appel';group.visible=false;world.add(group);
 const points=roads.flatMap(r=>[r.a,r.b]),xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),x0=Math.min(...xs)-30,x1=Math.max(...xs)+30,z0=Math.min(...zs)-30,z1=Math.max(...zs)+30;
 for(const sector of DEFENSE_SECTORS){const polygon=sectorPolygon(sector,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]),vertices=[];for(let i=1;i<polygon.length-1;i++)for(const p of[polygon[0],polygon[i],polygon[i+1]])vertices.push(p[0],.38,p[1]);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:sector.color,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide}));group.add(mesh);}
 return group;
}
