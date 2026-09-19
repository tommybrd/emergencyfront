import * as T from 'three';
import {box,textTexture} from './models.js';

export function createPlacementMarkers(world){
 const root=new T.Group();world.add(root);root.visible=false;
 const colors=['#81def4','#ffc76c','#b4ec97'];
 const marks=colors.map((color,index)=>{
  const g=new T.Group();root.add(g);g.userData.placementIndex=index;
  const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false});
  for(const x of[-1.9,1.9])box(g,.16,.04,9,material,x,.38,0);
  for(const z of[-4.5,4.5])box(g,3.8,.04,.16,material,0,.38,z);
  const label=new T.Sprite(new T.SpriteMaterial({map:textTexture(String(index+1),{width:128,height:128,size:92,background:color,color:'#152e37'}),depthTest:false,depthWrite:false}));
  label.position.set(0,2,0);label.scale.set(3.8,3.8,1);label.renderOrder=20;g.add(label);
  return g;
 });
 return {root,update(choices){root.visible=choices.length>0;marks.forEach((m,i)=>{m.visible=!!choices[i];if(choices[i]){m.position.set(choices[i].target[0],0,choices[i].target[1]);m.rotation.y=choices[i].yaw;}});}};
}
