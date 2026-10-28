import * as T from 'three';
const up=new T.Vector3(0,1,0),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// The axle follows the moving hitch; reverse motion naturally increases articulation.
export function updateBoatTrailer(e){
 const rig=e.model.userData.trailerHitch;if(!rig)return;
 e.model.updateWorldMatrix(true,false);const hitch=e.model.localToWorld(new T.Vector3(0,0,rig.position.z)),r=rig.userData;
 const moved=r.last?hitch.distanceTo(r.last):Infinity;
 if(!r.axle||moved>15){r.yaw=e.model.rotation.y;r.axle=hitch.clone().add(new T.Vector3(0,0,-3.7).applyAxisAngle(up,r.yaw));}
 else if(moved>.0001){
  const delta=hitch.clone().sub(r.axle),wanted=Math.atan2(delta.x,delta.z),relative=Math.max(-1.02,Math.min(1.02,wrap(wanted-e.model.rotation.y)));
  r.yaw=e.model.rotation.y+relative;r.axle.copy(hitch).add(new T.Vector3(0,0,-3.7).applyAxisAngle(up,r.yaw));
 }
 rig.rotation.y=wrap(r.yaw-e.model.rotation.y);r.last=hitch;
}
