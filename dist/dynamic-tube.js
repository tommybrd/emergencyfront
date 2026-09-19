import * as T from 'three';
// Allocate once. Hose placement and flowing water only update vertex buffers.
export function dynamicTube(segments=20,sides=6){
 const geometry=new T.BufferGeometry(),count=(segments+1)*(sides+1);
 const positions=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
 const normals=new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage),indices=[];
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 geometry.setAttribute('position',positions);geometry.setAttribute('normal',normals);geometry.setIndex(indices);
 const points=Array.from({length:segments+1},()=>new T.Vector3()),tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),up=new T.Vector3(0,1,0);
 return{geometry,points,update(radius){
  for(let i=0;i<=segments;i++){
   tangent.subVectors(points[Math.min(segments,i+1)],points[Math.max(0,i-1)]).normalize();
   normal.crossVectors(tangent,up);if(normal.lengthSq()<.001)normal.set(1,0,0);else normal.normalize();
   binormal.crossVectors(tangent,normal).normalize();
   for(let j=0;j<=sides;j++){const angle=j/sides*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle),x=c*normal.x+s*binormal.x,y=c*normal.y+s*binormal.y,z=c*normal.z+s*binormal.z,k=i*(sides+1)+j,p=points[i];positions.setXYZ(k,p.x+x*radius,p.y+y*radius,p.z+z*radius);normals.setXYZ(k,x,y,z);}
  }
  positions.needsUpdate=true;normals.needsUpdate=true;geometry.computeBoundingSphere();
 }};
}
