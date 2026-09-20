// Oriented vehicle footprints, with a clearance margin on every side.
export function footprint(model,x=model.position.x,z=model.position.z,yaw=model.rotation.y){if(model.userData.staticFootprint)return {x,z,yaw,...model.userData.staticFootprint};const scale=model.scale?.x||1,kind=model.userData.kind,tail=(model.userData.rearOverhang||0)*scale;return{x:x-Math.sin(yaw)*tail/2,z:z-Math.cos(yaw)*tail/2,yaw,length:((model.userData.length||4.45)+.8)*scale+tail,width:((['FPT','CCF','EPA','CCGC'].includes(kind)?3.15:kind==='VLCG'?2.25:2.6)+.3)*scale};}
export function overlaps(a,b){const axes=r=>[[Math.sin(r.yaw),Math.cos(r.yaw)],[Math.cos(r.yaw),-Math.sin(r.yaw)]],aa=axes(a),bb=axes(b),dx=b.x-a.x,dz=b.z-a.z;
 for(const [x,z]of[...aa,...bb]){const ra=Math.abs(x*aa[0][0]+z*aa[0][1])*a.length/2+Math.abs(x*aa[1][0]+z*aa[1][1])*a.width/2,rb=Math.abs(x*bb[0][0]+z*bb[0][1])*b.length/2+Math.abs(x*bb[1][0]+z*bb[1][1])*b.width/2;if(Math.abs(dx*x+dz*z)>=ra+rb)return false;}return true;}
export function clearMove(model,x,z,yaw,others){const p=model.position,turn=Math.atan2(Math.sin(yaw-model.rotation.y),Math.cos(yaw-model.rotation.y)),steps=Math.max(1,Math.ceil(Math.hypot(x-p.x,z-p.z)/.5),Math.ceil(Math.abs(turn)/.08));const nearby=others.filter(o=>o!==model&&o.visible!==false&&Math.hypot(o.position.x-p.x,o.position.z-p.z)<Math.hypot(x-p.x,z-p.z)+22).map(o=>footprint(o));for(let i=1;i<=steps;i++){const f=footprint(model,p.x+(x-p.x)*i/steps,p.z+(z-p.z)*i/steps,model.rotation.y+turn*i/steps);if(nearby.some(o=>overlaps(f,o)))return false;}return true;}

export function clearPlacement(model,x,z,yaw,others){const f=footprint(model,x,z,yaw);return !others.some(o=>o!==model&&o.visible!==false&&overlaps(f,footprint(o)));}

// Shared by movement and intersection arbitration: a vehicle unable to
// advance behind its leader must not keep the leader's crossing reserved.
export function queueLeader(v,actors,dx,dz,yaw){const d=Math.hypot(dx,dz);if(d<.001)return null;return actors.find(o=>{
 if(o===v||!o.path||o.reversing||Math.cos(o.model.rotation.y-yaw)<.65)return false;
 const x=o.model.position.x-v.model.position.x,z=o.model.position.z-v.model.position.z,ahead=(x*dx+z*dz)/d,side=Math.abs(x*dz-z*dx)/d;
 const gap=((v.model.userData.length||4.45)*(v.model.scale.x||1)+(o.model.userData.length||4.45)*(o.model.scale.x||1))/2+3;
 return ahead>0&&ahead<gap&&side<2.7;
});}
