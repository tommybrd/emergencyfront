// Road junctions, excluding bends and dead ends.
export function junctions(roads){const nodes=new Map();for(const r of roads.filter(r=>!r.trail)){for(const p of[r.a,r.b]){const key=p.join(',');const n=nodes.get(key)||{point:p,count:0};n.count++;nodes.set(key,n);}}return [...nodes.values()].filter(n=>n.count>=3).map(n=>n.point);}
export function automaticSiren(e,traffic,crossings){
 if(!e.beacons||!e.path||!['enroute','transport','returning','moving'].includes(e.status))return false;
 const {x,z}=e.model.position,heading=e.model.rotation.y;
 const ahead=(px,pz,radius)=>{const dx=px-x,dz=pz-z;return Math.hypot(dx,dz)<radius&&dx*Math.sin(heading)+dz*Math.cos(heading)>-7;};
 return crossings.some(p=>ahead(p[0],p[1],26))||traffic.some(v=>ahead(v.model.position.x,v.model.position.z,30));
}
