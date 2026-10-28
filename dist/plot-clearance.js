// Segment against the building rectangle expanded by the street's full half width.
export function roadIntersectsPlot(b,r,pad=r.express?10:r.trail?3:6.8){
 let lo=0,hi=1;for(const [a,d,min,max]of[[r.a[0],r.b[0]-r.a[0],b.x-b.w/2-pad,b.x+b.w/2+pad],[r.a[1],r.b[1]-r.a[1],b.z-b.d/2-pad,b.z+b.d/2+pad]]){
  if(Math.abs(d)<1e-8){if(a<=min||a>=max)return false;}else{const t0=(min-a)/d,t1=(max-a)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(lo>=hi)return false;}
 }return true;
}
export function clearBuildingPlots(buildings,roads,plots,river){
 const clear=(b,self)=>!roads.some(r=>roadIntersectsPlot(b,r))&&!buildings.some(o=>o!==self&&Math.abs(b.x-o.x)<(b.w+o.w)/2+1&&Math.abs(b.z-o.z)<(b.d+o.d)/2+1)&&
 (b.x+b.w/2<river.x-river.halfWidth-river.bankWidth||b.x-b.w/2>river.x+river.halfWidth+river.bankWidth);
 for(const b of buildings){
  if(!roads.some(r=>roadIntersectsPlot(b,r)))continue;
  const original={...b},plot=plots.find(p=>b.x>p.x0&&b.x<p.x1&&b.z>p.z0&&b.z<p.z1);let found=null;
  for(const scale of[1,.85,.7,.6]){
   const w=Math.max(9,original.w*scale),d=Math.max(9,original.d*scale);
   for(let radius=0;radius<=40&&!found;radius+=2)for(let dx=-radius;dx<=radius&&!found;dx+=2)for(let dz=-radius;dz<=radius&&!found;dz+=2){
    if(radius&&Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
    const q={...b,x:original.x+dx,z:original.z+dz,w,d};if(plot&&(q.x<=plot.x0||q.x>=plot.x1||q.z<=plot.z0||q.z>=plot.z1))continue;
    if(clear(q,b))found=q;
   }
   if(found)break;
  }
  if(!found)throw Error('Aucune parcelle libre pour le bâtiment '+original.x+','+original.z);
  Object.assign(b,found);b.points=[[b.x-b.w/2,b.z-b.d/2],[b.x+b.w/2,b.z-b.d/2],[b.x+b.w/2,b.z+b.d/2],[b.x-b.w/2,b.z+b.d/2],[b.x-b.w/2,b.z-b.d/2]];
 }
}
