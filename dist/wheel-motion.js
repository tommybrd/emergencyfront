import * as T from 'three';
export function installRollingWheels(model){
 if(model.userData.rollingWheels)return;
 const wheels=model.userData.wheels||[],rigs=[],dark=new T.MeshStandardMaterial({color:'#263034',roughness:.8});
 for(const tyre of wheels){
  if(!tyre.geometry)continue;
  const radius=tyre.geometry.parameters.radiusTop,center=tyre.position.clone(),side=Math.sign(center.x)||1;
  const parts=model.children.filter(p=>{
   if(p===tyre)return true;if(!p.isMesh||p===tyre||Math.abs(p.position.x-center.x)>.4)return false;
   const d=Math.hypot(p.position.y-center.y,p.position.z-center.z),g=p.geometry;
   if(g.type==='CylinderGeometry'&&Math.abs(Math.abs(p.rotation.z)-Math.PI/2)<.01&&d<radius*.8)return true;
   const a=g.parameters;return model.userData.kind==='CCF'&&g.type==='BoxGeometry'&&a.width===.41&&a.height===.13&&a.depth===.18&&Math.abs(d-radius)<.03;
  });
  const rig=new T.Group();rig.name='Roue complète · pneu et jante';rig.position.copy(center);rig.userData.wheelRadius=radius;model.add(rig);
  for(const part of parts){part.position.sub(center);rig.add(part);}
  // Smooth hubcaps also need readable details, otherwise their rotation is invisible.
  if(parts.filter(p=>p.geometry.type==='CylinderGeometry').length<4)for(let i=0;i<6;i++){
   const a=i*Math.PI/3,bolt=new T.Mesh(new T.CylinderGeometry(radius*.065,radius*.065,.025,6),dark);
   bolt.rotation.z=Math.PI/2;bolt.position.set(side*(tyre.geometry.parameters.height/2+.028),Math.cos(a)*radius*.36,Math.sin(a)*radius*.36);rig.add(bolt);
  }
  rigs.push(rig);
 }
 model.userData.wheels=rigs;model.userData.rollingWheels=true;
}
export function rollWheels(model,distance){
 for(const wheel of model.userData.wheels||[]){const radius=(wheel.userData.wheelRadius||wheel.geometry?.parameters?.radiusTop||.56)*(model.scale?.z||1);wheel.rotation.x=(wheel.rotation.x+distance/radius)%(Math.PI*2);}
}
