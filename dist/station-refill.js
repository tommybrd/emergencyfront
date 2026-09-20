import * as T from 'three';
import {person,box} from './models.js';
import {waterMinutes} from './hydraulics.js';
export function beginStationRefill(e){
 if(!e.capacity||e.water>=e.capacity-.01)return false;
 e.status='refilling';e.stationRefill={phase:'connect',elapsed:0};return true;
}
export function tickStationRefill(e,minutes,onReady){
 const r=e.stationRefill;if(e.status!=='refilling'||!r||minutes<=0)return;
 let left=minutes;
 while(left>0&&e.stationRefill){
  if(r.phase==='fill'){const used=Math.min(left,(e.capacity-e.water)/ (1000/6));e.water=Math.min(e.capacity,e.water+1000*waterMinutes(used));left-=used;if(e.water>=e.capacity-.01){e.water=e.capacity;r.phase='pack';r.elapsed=0;}else break;}
  else{const used=Math.min(left,2-r.elapsed);r.elapsed+=used;left-=used;if(r.elapsed>=2){if(r.phase==='connect'){r.phase='fill';r.elapsed=0;}else{delete e.stationRefill;e.status='ready';onReady(e);}}}
 }
}
export function stationRefillStatus(e){return e.stationRefill?.phase==='connect'?'Raccordement au CIS':e.stationRefill?.phase==='pack'?'Rangement du tuyau':`Plein au CIS · ${Math.round(100*e.water/e.capacity)} %`;}
export function updateStationRefillVisual(e){
 if(!e.stationRefillVisual&&e.status==='refilling'){
  const group=new T.Group();e.model.add(group);group.name='Remplissage de la citerne au CIS';
  const width=(e.model.userData.width||2.5)/2,back=-(e.model.userData.length||7)/2;
  box(group,.16,.65,.16,'#719491',width+1,.15,back);
  const points=[new T.Vector3(width+1,.4,back),new T.Vector3(width+.9,.03,back-.7),new T.Vector3(.4,.04,back-.8),new T.Vector3(0,.6,back)];
  group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.055,6,false),new T.MeshStandardMaterial({color:'#c8af70'})));
  const operator=person(group,width+.7,back-.2,'#263b48');operator.rotation.y=-Math.PI/2;e.stationRefillVisual=group;
 }
 if(e.stationRefillVisual)e.stationRefillVisual.visible=e.status==='refilling';
}
