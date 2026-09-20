import {disposeObject} from './dispose.js';
import {updateWalkingPatient} from './walking-patient.js';
import {updateLoading} from './ambulance-loading.js';
import {dynamicTube} from './dynamic-tube.js';
import {nearestRoad,block} from './roads.js';
import * as T from 'three';
import {person,medicalResponder,setInterventionHelmet,box,cylinder} from './models.js';
const styles={ldt:{hose:'#c9302c',radius:.055,jet:.07,nozzle:.75},small:{hose:'#cbb78a',radius:.08,jet:.11,nozzle:1},large:{hose:'#ded8b6',radius:.115,jet:.18,nozzle:1.35}};
const up=new T.Vector3(0,1,0);
export function operatorPoint(x,z,trees=[]){
 const clear=(x,z)=>!trees.some(t=>Math.hypot(x-t.x,z-t.z)<t.radius)&&!block.buildings.some(b=>Math.abs(x-b.x)<b.w/2+.65&&Math.abs(z-b.z)<b.d/2+.65);
 if(clear(x,z))return [x,z];
 for(const radius of[1.5,3,5,8,12])for(let i=0;i<16;i++){const xx=x+Math.cos(i*Math.PI/8)*radius,zz=z+Math.sin(i*Math.PI/8)*radius;if(clear(xx,zz))return[xx,zz];}
 return null;
}
export function responseVisuals(world,engines){
 const trees=[];world.updateMatrixWorld(true);world.traverse(o=>{if(o.userData.treeClearance){const p=o.getWorldPosition(new T.Vector3());trees.push({x:p.x,z:p.z,radius:o.userData.treeClearance});}});
 const records=new Map();
 function add(e){
  const g=new T.Group();world.add(g);g.visible=false;
  const lines=Array.from({length:e.capacity?5:0},()=>{
   const p=person(g,0,0,'',true),hoseTube=dynamicTube(12),jetTube=dynamicTube(20,5);
   const hose=new T.Mesh(hoseTube.geometry,new T.MeshStandardMaterial({color:'#b99155'})),jet=new T.Mesh(jetTube.geometry,new T.MeshBasicMaterial({color:'#bcf0ff',transparent:true,opacity:.65,depthWrite:false}));g.add(hose,jet);
   const reel=new T.Mesh(new T.TorusGeometry(.36,.1,6,12),new T.MeshStandardMaterial({color:'#bda66d'}));g.add(reel);
   const nozzle=cylinder(g,.08,.065,.42,'#343c40',0,0,0,8);
   return{p,hose,jet,reel,nozzle,hoseTube,jetTube,lastHose:'',lastJet:-Infinity};
  });
  const stretcher=new T.Group();g.add(stretcher);
  if(e.kind==='VSAV'){
   box(stretcher,.8,.18,2,'#efb35b',0,.7,0);box(stretcher,.45,.3,1.5,'#7c9d9f',0,.94,0);
   for(const x of[-.3,.3])for(const z of[-.7,.7])box(stretcher,.08,.6,.08,'#666e72',x,.35,z);
   const patient=person(stretcher,0,.8,'#a57867');patient.rotation.x=-Math.PI/2;patient.position.y=1.02;patient.scale.setScalar(.8);e.stretcherModel=stretcher;
  }
  const team=Array.from({length:e.kind==='VLCG'?0:e.kind==='VLI'?1:2},()=>e.kind==='VSAV'?medicalResponder(g):person(g,0,0,e.kind==='VLI'?'#eeeece':'',e.kind!=='VLI'));
  const kit=box(g,.6,.35,.45,'#e57d38',0,0,0);e.hoseVisuals=lines;
  records.set(e,{g,lines,stretcher,team,kit});
 }
 engines.forEach(add);
 const start=new T.Vector3(),end=new T.Vector3(),a=new T.Vector3(),goal=new T.Vector3(),tip=new T.Vector3(),aim=new T.Vector3(),coupling=new T.Vector3(),direction=new T.Vector3();
 return{add,remove(e){const r=records.get(e);if(r)disposeObject(r.g);records.delete(e);},update(t,state){
  const calls=new Map(state.calls.map(c=>[c.id,c]));
  for(const e of engines){
   const {g,lines,stretcher,team,kit}=records.get(e),c=calls.get(e.call);
   g.visible=['scene','reconditioning','hospital'].includes(e.status);if(!g.visible){updateLoading(e,stretcher,team,end,state.minute);continue;}
   if(c?.fireTarget||c?.scene==='fuel')e.hoseTarget=(c.fireTarget||c.actionPoint||c.target).slice();
   const visibleHoses=(e.hoses||[]).filter(h=>h.progress>0),count=e.status==='hospital'?0:visibleHoses.length;
   const onsite=e.status==='scene'&&c&&e.kind!=='VLCG',recon=onsite&&!c.reconComplete,rescuing=onsite&&c.complication?.status==='active'&&c.complication.unitId===e.id,medical=onsite&&['VSAV','VTU','VLI'].includes(e.kind)&&!!c.victimCount,diverse=onsite&&(c.type==='OD'||c.inspection&&c.fireConfirmed!==true);
   start.copy(e.model.position);end.set(c?.actionPoint?.[0]??(c?.target?.[0]??start.x)+4,0,c?.actionPoint?.[1]??(c?.target?.[1]??start.z)-5);
   const phase=rescuing?Math.min(1,c.complication.progress*3):recon?c.reconProgress:medical&&e.kind!=='VLI'?Math.min(1,(e.patientProgress||0)/.25):Math.min(1,(state.minute-e.workStarted)/5);
   team.forEach((p,i)=>{setInterventionHelmet(p,!!onsite&&c.type!=='SUAP');p.visible=!!(onsite&&e.extricationTask==null&&!e.aerial?.mode&&(rescuing||(recon||medical||diverse)&&!count));if(!p.visible)return;p.position.copy(start).lerp(end,Math.max(0,Math.min(1,phase)));p.position.x+=i?1:-1;p.position.y=0;p.rotation.set(0,Math.atan2(end.x-p.position.x,end.z-p.position.z),0);const walking=phase<1;p.children[1].rotation.x=walking?Math.sin(t*6+i)*.4:0;p.children[2].rotation.x=walking?-Math.sin(t*6+i)*.4:0;});
   kit.visible=!!(onsite&&(medical||diverse)&&!recon);if(kit.visible){kit.position.copy(team[0].position);kit.position.x+=.4;kit.position.y=.5;}
   const supplyWorkers=e.supplyProgress>0&&e.supplyProgress<1?2:0,maxOperators=Math.max(0,(e.crew||e.size||4)-supplyWorkers-(rescuing?2:0)-(e.perimeterCrew||0)-(e.buildingCrew||0));
   lines.forEach((line,i)=>{
    const {p,hose,jet,reel,nozzle,hoseTube,jetTube}=line,h=visibleHoses[i];
    nozzle.visible=hose.visible=i<count;p.visible=i<count&&i<maxOperators;reel.visible=i<count&&h.progress<1;
    jet.visible=i<count&&e.flow>0&&h.progress>=1&&h.index<e.nozzles[h.key];if(i>=count)return;
    const style=styles[h.key],progress=h.progress,walking=progress<.85;
    coupling.set((i-2)*.35,.18,-e.model.userData.length/2+.25).applyAxisAngle(up,e.model.rotation.y).add(start);coupling.y=.18;
    a.set((i-2)*1.6,0,-e.model.userData.length/2-1).applyAxisAngle(up,e.model.rotation.y).add(start);a.y=0;
    goal.set(e.hoseTarget?.[0]??a.x,0,e.hoseTarget?.[1]??a.z);a.lerp(goal,.6*Math.min(1,progress/.85));const safe=operatorPoint(a.x,a.z,trees);if(safe)a.set(safe[0],0,safe[1]);else p.visible=false;p.position.copy(a);
    p.children[1].rotation.x=walking?Math.sin(t*7+i)*.5:0;p.children[2].rotation.x=walking?-Math.sin(t*7+i)*.5:0;p.children[4].rotation.x=walking?-.6:-1.3;
    reel.position.copy(a);reel.position.x+=.45;reel.position.y=.75;reel.rotation.y=t*2;reel.scale.setScalar(Math.max(.35,1-progress));
    aim.set(e.hoseTarget?.[0]??a.x,c?.fireHeight??(c?.name==='Feu de véhicule'?1.2:3),e.hoseTarget?.[1]??a.z);p.rotation.set(0,Math.atan2(aim.x-a.x,aim.z-a.z),0);
    const signature=[h.key,progress,start.x,start.z,e.model.rotation.y,goal.x,goal.z].join(':');
    if(signature!==line.lastHose){
     line.lastHose=signature;hose.material.color.set(style.hose);direction.subVectors(a,coupling);const length=Math.hypot(direction.x,direction.z)||1;
     hoseTube.points.forEach((point,j)=>{const k=j/(hoseTube.points.length-1),slack=Math.sin(k*Math.PI)*Math.min(1.2,length*.08);point.copy(coupling).lerp(a,k);point.x+=direction.z/length*slack;point.z-=direction.x/length*slack;const distance=nearestRoad([point.x,point.z]).distance,ground=(distance<4.55?.235:distance<6.6?.12:.06)+style.radius;point.y=length<3?.85+k*.55:ground+Math.max(0,1-k*length/1.5)*(.85-ground)+Math.max(0,1-(1-k)*length/1.5)*(1.4-ground);});hoseTube.update(style.radius);
    }
    tip.copy(a).setY(1.4);nozzle.position.copy(tip);direction.subVectors(aim,tip).normalize();nozzle.quaternion.setFromUnitVectors(up,direction);nozzle.scale.setScalar(style.nozzle);
    const foaming=e.foamFlow>0&&h.key==='small'&&h.index===0;jet.material.color.set(foaming?'#f3f6e9':'#bcf0ff');jet.material.opacity=foaming?.95:.65;if(foaming)aim.y=.3;
    if(jet.visible&&t-line.lastJet>=1/30){line.lastJet=t;jetTube.points.forEach((point,j)=>{const k=j/(jetTube.points.length-1);point.copy(tip).lerp(aim,k);point.y+=Math.sin(k*Math.PI)*2+Math.sin(t*25+j)*.03;});jetTube.update(style.jet*(foaming?1.7:1));}
   });
   stretcher.visible=!!(medical&&e.kind==='VSAV'&&e.patientAssigned&&e.patientProgress>.5&&c.patients?.some(p=>p.assignedTo===e.id&&p.transportRequired!==false));
   updateLoading(e,stretcher,team,end,state.minute);
   if(e.kind==='VSAV'&&updateWalkingPatient(e,g,team,end,c,t))stretcher.visible=false;
   for(let i=0;i<(e.perimeterCrew||0)+(e.buildingCrew||0)+(e.ventilationCrew||0);i++)if(team[i])team[i].visible=false;
  }
 }};
}
