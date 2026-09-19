import * as T from 'three';
import {person,cylinder} from './models.js';
import {disposeObject} from './dispose.js';

export function vehicleRemainsObstacle(hazard){
 if(!hazard||hazard.userData.incidentScene!=='vehicle')return null;
 if(hazard.userData.roadObstacle)return hazard.userData.roadObstacle;
 const car=hazard.children.find(o=>o.userData?.length);if(!car)return null;
 const position=new T.Vector3();car.updateWorldMatrix(true,false);car.getWorldPosition(position);
 return hazard.userData.roadObstacle={status:'wreck',path:null,model:{position,rotation:{y:car.rotation.y+hazard.rotation.y},scale:car.scale,visible:true,userData:car.userData}};
}

// Local overlays preserve the city palette and the batched building materials.
function stain(parent,width,height,seed,opacity=.55){
 const shape=new T.Shape();
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=.8+Math.sin(i*7+seed)*.15,x=Math.cos(a)*width/2*r,y=Math.sin(a)*height/2*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}
 shape.closePath();const m=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:'#302d28',transparent:true,opacity,side:T.DoubleSide,depthWrite:false}));parent.add(m);return m;
}
export function createIncidentAftermath(world,{limit=24,lifetime=1440}={}){
 const records=new Map();
 function remove(id){const r=records.get(id);if(!r)return;disposeObject(r.group);disposeObject(r.wreck);records.delete(id);}
 function capture(c,hazard,minute){
  if(records.has(c.id))return records.get(c.id).wreck===hazard;
  if(c.type!=='INC'||c.inspection&&c.fireConfirmed!==true)return false;
  const group=new T.Group();group.name='Après intervention '+c.id;world.add(group);
  const p=c.actionPoint||c.target,ground=stain(group,['forest','vegetation'].includes(c.scene)?12:5,['forest','vegetation'].includes(c.scene)?10:4,c.id,.45);
  ground.rotation.x=-Math.PI/2;ground.position.set(p[0],.29,p[1]);
  const record={id:c.id,group,createdAt:minute,wreck:null,obstacle:null,residents:[]};
  if(c.site?.kind==='building'){
   const site=c.site,center=site.position||c.target,dx=p[0]-center[0],dz=p[1]-center[1];
   const xFace=Math.abs(dx)/(site.width/2)>Math.abs(dz)/(site.depth/2),normal=xFace?[Math.sign(dx),0]:[0,Math.sign(dz)];
   const chimney=c.scene==='chimney',height=chimney?1.5:Math.min(site.height-.5,c.scene==='apartment'?6:4.5),patch=stain(group,chimney?2:Math.min(6,(xFace?site.depth:site.width)*.65),height,c.id+3);
   patch.position.set(xFace?center[0]+normal[0]*(site.width/2+.045):p[0],chimney?site.height-.6:height/2+.7,xFace?p[1]:center[1]+normal[1]*(site.depth/2+.045));patch.rotation.y=Math.atan2(...normal);
   if(!chimney){const core=stain(group,2.6,height*.65,c.id+11,.38);core.position.copy(patch.position);core.position.x+=normal[0]*.012;core.position.z+=normal[1]*.012;core.position.y-=.45;core.rotation.copy(patch.rotation);}
   // Two neighbours return only after the cordon has been packed away.
   for(let i=0;i<(c.buildingActions?.evacuate?.requested?0:2);i++){const start=[p[0]+normal[0]*(10+i*2)-normal[1]*2,p[1]+normal[1]*(10+i*2)+normal[0]*2],model=person(group,...start,i?'#b8946a':'#658a8a');model.visible=false;record.residents.push({model,start,end:[p[0],p[1]],delay:20+i*8});}
  }
  if(['forest','vegetation'].includes(c.scene))for(let i=0;i<3;i++)cylinder(group,.13,.28,1.5+i*.5,'#454439',p[0]+Math.sin(i*3)*3,.75+i*.25,p[1]+Math.cos(i*4)*2,5);
  if(c.scene==='vehicle'&&hazard){
   record.wreck=hazard;
   record.obstacle=vehicleRemainsObstacle(hazard);
  }
  records.set(c.id,record);while(records.size>limit)remove(records.keys().next().value);
  return record.wreck===hazard&&!!hazard;
 }
 function update(minute,closedArea=()=>false){
  for(const [id,r]of records){
   const age=minute-r.createdAt;if(age>=lifetime){remove(id);continue;}
   if(r.wreck&&age>=180){disposeObject(r.wreck);r.wreck=null;r.obstacle=null;}
   for(const resident of r.residents){
    if(closedArea(resident.end)){resident.delay=Math.max(resident.delay,age+2);resident.model.visible=false;continue;}
    const t=(age-resident.delay)/15;resident.model.visible=t>=0&&t<1;if(!resident.model.visible)continue;
    const [a,b]=[resident.start,resident.end];resident.model.position.set(a[0]+(b[0]-a[0])*t,0,a[1]+(b[1]-a[1])*t);resident.model.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);resident.model.children[1].rotation.x=Math.sin(age*6)*.35;resident.model.children[2].rotation.x=-resident.model.children[1].rotation.x;
   }
  }
 }
 return {records,capture,update,obstacles:()=>[...records.values()].flatMap(r=>r.obstacle?[r.obstacle]:[]),clear(){for(const id of records.keys())remove(id);}};
}
