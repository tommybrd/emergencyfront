import * as T from 'three';

export function createFoamVisuals(world){
 const records=new Map(),geometry=new T.CircleGeometry(1,10),material=new T.MeshStandardMaterial({color:'#eef3ec',roughness:1,side:T.DoubleSide});
 return {records,update(calls){
  const present=new Set();
  for(const c of calls){
   if(!(c.foamCoverage>.005))continue;present.add(c.id);
   let g=records.get(c.id);
   if(!g){
    g=new T.Group();g.name='Tapis de mousse · '+c.id;world.add(g);records.set(c.id,g);
    for(let i=0;i<24;i++){
     const patch=new T.Mesh(geometry,material),angle=i*2.39996,r=Math.sqrt(i/23);
     patch.rotation.x=-Math.PI/2;patch.position.set(Math.cos(angle)*r*2.7,.275+i*.0005,Math.sin(angle)*r*4);
     patch.scale.set(.65+(i%3)*.1,.7+(i%4)*.08,1);g.add(patch);
    }
   }
   const p=c.fireTarget||c.actionPoint||c.target;
   g.position.set(p[0],0,p[1]);g.rotation.y=c.site?.yaw||0;
   const size=Math.sqrt(c.foamCoverage)*(c.scene==='motorcycle'?.65:1);g.scale.set(size,1,size);
  }
  for(const[id,g]of records)if(!present.has(id)){world.remove(g);records.delete(id);}
 },dispose(){for(const g of records.values())world.remove(g);records.clear();geometry.dispose();material.dispose();}};
}
