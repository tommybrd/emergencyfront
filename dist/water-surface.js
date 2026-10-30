import * as T from 'three';
import {LAKE,lakeEdge,inLake} from './beach-layout.js';
// Small crossed wind waves, in metres. The hull and foam sample the same surface.
export function waterHeight(x,z,t){return .24+Math.sin(x*1.1+z*.45-t*1.7)*.065+Math.sin(x*-.5+z*1.4-t*2.1)*.03+Math.sin(x*2.1-z*1.3+t*2.8)*.015;}
const waves=`uniform float waterTime;
float surface(vec2 p){return .24+sin(dot(p,vec2(1.1,.45))-waterTime*1.7)*.065+sin(dot(p,vec2(-.5,1.4))-waterTime*2.1)*.03+sin(dot(p,vec2(2.1,-1.3))+waterTime*2.8)*.015;}
`;
export function createLakeSurface(parent){
 const root=new T.Group();root.name='Lac · surface ondulante';parent.add(root);const positions=[],indices=[],sectors=192,rings=48;
 for(let r=0;r<=rings;r++)for(let i=0;i<=sectors;i++){const a=i/sectors*Math.PI*2,edge=lakeEdge(a,.94),f=r/rings;positions.push(LAKE.center[0]+(edge[0]-LAKE.center[0])*f,.24,LAKE.center[1]+(edge[1]-LAKE.center[1])*f);}
 for(let r=0;r<rings;r++)for(let i=0;i<sectors;i++){const a=r*(sectors+1)+i,b=a+sectors+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const clock={value:0},material=new T.MeshStandardMaterial({color:'#397e87',roughness:.22,metalness:.16,side:T.DoubleSide});
 material.onBeforeCompile=shader=>{shader.uniforms.waterTime=clock;shader.vertexShader=waves+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y=surface(position.xz);');shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nfloat h=surface(position.xz);objectNormal=normalize(vec3((h-surface(position.xz+vec2(.08,0.0)))/.08,1.0,(h-surface(position.xz+vec2(0.0,.08)))/.08));');};
 material.customProgramCacheKey=()=> 'valmont-water-waves-151';const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);
 return{root,mesh,clock,update(t){clock.value=t;}};
}
function foamTexture(){
 const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
 const noise=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);return(hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b;};
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n*2-1,v=y/n*2-1,r=Math.hypot(u,v),broad=noise(u*4+17,v*4+11),bubbles=noise(u*13+31,v*13+29),edge=Math.max(0,Math.min(1,(.8+broad*.25-r)*4)),a=edge*(.2+.8*broad)*(bubbles<.25?.12:.55+bubbles*.45),i=(y*n+x)*4;data[i]=232;data[i+1]=249;data[i+2]=244;data[i+3]=Math.round(a*255);}
 const map=new T.DataTexture(data,n,n);map.magFilter=T.LinearFilter;map.minFilter=T.LinearFilter;map.needsUpdate=true;return map;
}
export function createBoatWake(boat){
 const root=new T.Group();root.name='Écume et turbulence du hors-bord';root.visible=false;root.matrixAutoUpdate=false;boat.add(root);
 const capacity=192,geometry=new T.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);const opacity=new T.InstancedBufferAttribute(new Float32Array(capacity),1);geometry.setAttribute('foamOpacity',opacity);
 const clock={value:0},material=new T.MeshBasicMaterial({map:foamTexture(),transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});material.onBeforeCompile=shader=>{shader.uniforms.waterTime=clock;shader.vertexShader=waves+'attribute float foamOpacity; varying float foamAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfoamAlpha=foamOpacity;vec3 foamPoint=(instanceMatrix*vec4(transformed,1.0)).xyz;transformed.y=surface(foamPoint.xz)+.035-instanceMatrix[3].y;');shader.fragmentShader='varying float foamAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=foamAlpha;');};material.customProgramCacheKey=()=> 'valmont-foam-151';
 const foam=new T.InstancedMesh(geometry,material,capacity);foam.count=0;foam.frustumCulled=false;root.add(foam);
 const particles=Array.from({length:capacity},()=>({born:-Infinity})),dummy=new T.Object3D();return{root,foam,opacity,particles,dummy,clock,next:0,last:null,emittedAt:-Infinity,serial:0};
}
export function updateBoatWake(boat,moving,active,t){
 const wake=boat.userData.wake,p=boat.position,yaw=boat.rotation.y,forward=[Math.sin(yaw),Math.cos(yaw)],side=[forward[1],-forward[0]],previous=wake.last;
 wake.clock.value=t;const dt=previous?t-previous.t:0,travel=previous?Math.hypot(p.x-previous.x,p.z-previous.z):0;
 if(!active||dt<0){wake.particles.forEach(p=>p.born=-Infinity);wake.foam.count=0;wake.last=null;wake.root.visible=false;return;}
 if(moving&&(!previous||t-wake.emittedAt>.055||travel>.18)){
  const samples=Math.max(1,Math.min(12,Math.ceil(travel/.28)));
  for(let j=1;j<=samples;j++)for(let k=0;k<3;k++){
   const serial=wake.serial++,f=previous?j/samples:1,baseX=previous?previous.x+(p.x-previous.x)*f:p.x,baseZ=previous?previous.z+(p.z-previous.z)*f:p.z,spread=Math.sin(serial*2.399)*.56;
   const particle=wake.particles[wake.next++%wake.particles.length];Object.assign(particle,{x:baseX-forward[0]*2.2+side[0]*spread,z:baseZ-forward[1]*2.2+side[1]*spread,born:t-(1-f)*Math.min(.2,Math.max(0,dt)),life:3.2+(serial%5)*.22,angle:serial*1.73,dx:side[0]*spread*.24-forward[0]*.12,dz:side[1]*spread*.24-forward[1]*.12,size:.38+(serial%7)*.055});
  }wake.emittedAt=t;
 }
 let count=0;for(const particle of wake.particles){const age=t-particle.born;if(age<0||age>particle.life)continue;const f=age/particle.life,x=particle.x+particle.dx*age,z=particle.z+particle.dz*age;if(!inLake([x,z]))continue;const d=wake.dummy;d.position.set(x,waterHeight(x,z,t)+.035,z);d.rotation.set(0,particle.angle+age*.15,0);const size=particle.size*(1+f*2.1);d.scale.set(size,1,size*.8);d.updateMatrix();wake.foam.setMatrixAt(count,d.matrix);wake.opacity.setX(count,Math.pow(1-f,1.6)*Math.min(1,age*9+.35));count++;}
 wake.foam.count=count;wake.foam.instanceMatrix.needsUpdate=true;wake.opacity.needsUpdate=true;boat.updateMatrix();wake.root.matrix.copy(boat.matrix).invert();wake.root.matrixWorldNeedsUpdate=true;wake.root.visible=count>0;wake.last={x:p.x,z:p.z,t};
}
