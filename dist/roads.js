import {block} from './city-layout.js';
export {block};
export const roads=block.roads.map(r=>({...r}));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
roads.push({a:[-70,105],b:[0,105],name:'Accès CIS (simulation)'});
export const hospitalPoint=[375,-120];const chEntry=roads.flatMap(r=>[r.a,r.b]).sort((a,b)=>distance(a,hospitalPoint)-distance(b,hospitalPoint))[0];roads.push({a:chEntry,b:hospitalPoint,name:'Accès CH (simulation)'});
export function projectRoad(p,r){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p[0]-r.a[0])*dx+(p[1]-r.a[1])*dz)/n)):0;return[r.a[0]+t*dx,r.a[1]+t*dz];}
export function nearestRoad(p){let best=null,d=Infinity;for(const r of roads){const point=projectRoad(p,r),n=distance(p,point);if(n<d){d=n;best={road:r,point,distance:n};}}return best;}
export const snap=p=>nearestRoad(p).point;
const key=p=>p.join(','),nodes=new Map();for(const r of roads){for(const p of[r.a,r.b])if(!nodes.has(key(p)))nodes.set(key(p),{p,edges:[]});nodes.get(key(r.a)).edges.push({key:key(r.b),length:distance(r.a,r.b)});nodes.get(key(r.b)).edges.push({key:key(r.a),length:distance(r.a,r.b)});}
export function centerRoute(from,to,{startYaw,endYaw}={}){
 const a=nearestRoad(from),b=nearestRoad(to),heading=(r,yaw)=>yaw==null?null:(r.b[0]-r.a[0])*Math.sin(yaw)+(r.b[1]-r.a[1])*Math.cos(yaw);
 const endDir=heading(b.road,endYaw),startDir=heading(a.road,startYaw);
 if(a.road===b.road){const dx=b.point[0]-a.point[0],dz=b.point[1]-a.point[1],along=dx*(a.road.b[0]-a.road.a[0])+dz*(a.road.b[1]-a.road.a[1]);if((endDir==null||along*endDir>=0)&&(startDir==null||along*startDir>=0))return[a.point,b.point];}
 const dist=new Map(),prev=new Map(),open=new Set(nodes.keys());
 const starts=startDir==null?[a.road.a,a.road.b]:[startDir>=0?a.road.b:a.road.a];
 for(const p of starts)dist.set(key(p),distance(a.point,p));
 while(open.size){let u=null,best=Infinity;for(const k of open)if((dist.get(k)??Infinity)<best){u=k;best=dist.get(k);}if(!u)break;open.delete(u);for(const edge of nodes.get(u).edges){if(startDir!=null&&!prev.has(u)&&starts.some(p=>key(p)===u)&&nodes.get(u).edges.length>1&&[a.road.a,a.road.b].some(p=>key(p)===edge.key))continue;const n=best+edge.length;if(n<(dist.get(edge.key)??Infinity)){dist.set(edge.key,n);prev.set(edge.key,u);}}}
 const ends=endDir==null?[b.road.a,b.road.b]:[endDir>=0?b.road.a:b.road.b];
 const end=ends.sort((x,y)=>(dist.get(key(x))+distance(x,b.point))-(dist.get(key(y))+distance(y,b.point)))[0];
 let k=key(end),path=[];while(k){path.unshift(nodes.get(k).p);k=prev.get(k);}return[a.point,...path,b.point];
}
export function streetRoute(from,to,options={}){
 const pts=centerRoute(from,to,options).filter((p,i,a)=>!i||distance(p,a[i-1])>.01);if(pts.length<2)return[from,to];
 const offsets=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=distance(a,b),r=nearestRoad([(a[0]+b[0])/2,(a[1]+b[1])/2]).road,w=r.express?5:r.trail?1.3:2.1;offsets.push([-(b[1]-a[1])/len*w,(b[0]-a[0])/len*w]);}
 const lane=pts.flatMap((p,i)=>{const a=offsets[Math.max(0,i-1)],b=offsets[Math.min(offsets.length-1,i)],denom=Math.max(.5,1+(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b)));if(i>0&&i<pts.length-1&&denom===.5){const prev=pts[i-1],len=distance(prev,p),extension=Math.max(4,Math.hypot(...a)*2),x=(p[0]-prev[0])/len*extension,z=(p[1]-prev[1])/len*extension;return[[p[0]+a[0],p[1]+a[1]],[p[0]+a[0]+x,p[1]+a[1]+z],[p[0]+b[0]+x,p[1]+b[1]+z],[p[0]+b[0],p[1]+b[1]]];}return[[p[0]+(a[0]+b[0])/denom,p[1]+(a[1]+b[1])/denom]];});
 return[from,...lane,to];
}

export const travelMultiplier=e=>e.status==='transport'?.7:e.beacons?1.3:1;

// Relative gameplay pace: vehicle mass and role, not road speed limits.
export function vehiclePace(e){if(e.kind==='CCF')return (e.tankCapacity||e.capacity||4000)>=8000?.8:.92;if(e.kind==='FPT')return e.lightPump?1.06:1;return {VLCG:1.15,VLI:1.15,VTU:1.1,VSAV:1.05,VPL:.9,EPA:.85}[e.kind]||1;}
