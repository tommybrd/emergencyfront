import {smoothRoute} from './route3d.js';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const lane=(r,t)=>{const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],len=Math.hypot(dx,dz),w=r.express?5:2.1;return[r.a[0]+dx*t-dz/len*w,r.a[1]+dz*t+dx/len*w];};
export function planCivilian(v,roads,random=Math.random){
 const r=v.road,next=roads.filter(n=>n!==r&&!n.trail&&!n.name.includes('(simulation)')&&(distance(n.a,r.b)<.01||distance(n.b,r.b)<.01));
 const onward=next.filter(n=>distance(n.a,r.a)>.01&&distance(n.b,r.a)>.01);
 const choices=onward.length?onward:next;
 const n=choices.length?choices[Math.floor(random()*choices.length)]:{...r,a:r.b,b:r.a};
 const road=distance(n.a,r.b)<.01?n:{...n,a:n.b,b:n.a};
 const end=lane(r,1),begin=lane(road,0),a=[end[0]-r.b[0],end[1]-r.b[1]],b=[begin[0]-r.b[0],begin[1]-r.b[1]],denom=Math.max(.5,1+(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b))),corner=[r.b[0]+(a[0]+b[0])/denom,r.b[1]+(a[1]+b[1])/denom],t=Math.min(.4,16/distance(road.a,road.b));
 v.path=smoothRoute([[v.model.position.x,v.model.position.z],corner,lane(road,t)]);v.segment=1;v.nextRoad=road;v.nextProgress=t;v.status='traffic';
}
export function finishCivilian(v){v.road=v.nextRoad;v.progress=v.nextProgress;v.path=null;v.segment=1;}
