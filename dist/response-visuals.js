import {diverResponder} from './diver-model.js';
import {inRiver} from './river-layout.js';
import {suspendHiddenTransforms} from './batching.js';
import {updateEquipmentLockers,createCarryTool,prepareCrew} from './equipment-maneuvers.js';
import {applyEngineInsignia} from './crew-insignia.js';
import {nozzleLimit,nozzleCount,equipmentBusy,staffedHoses,hoseFlowing} from './hydraulics.js';
import {disposeObject} from './dispose.js';
import {updateWalkingPatient} from './walking-patient.js';
import {updateLoading} from './ambulance-loading.js';
import {dynamicTube} from './dynamic-tube.js';
import {nearestRoad,block} from './roads.js';
import * as T from 'three';
import {forestResponder,person,medicalResponder,smurResponder,setInterventionHelmet,box,cylinder} from './models.js';
const styles={ldt:{hose:'#c9302c',radius:.055,jet:.07,nozzle:.75},small:{hose:'#cbb78a',radius:.08,jet:.11,nozzle:1},mid:{hose:'#d4c79f',radius:.095,jet:.145,nozzle:1.15},large:{hose:'#ded8b6',radius:.115,jet:.18,nozzle:1.35}};
// Une lance à débit variable : le tuyau et le jet grossissent avec le débit choisi.
const styleFor=h=>{const f=h.flow||250;return f<=150?styles.ldt:f<=250?styles.small:f<=350?styles.mid:styles.large;};
const JET_SHAPES={droit:{width:1,reach:1,arc:2,opacity:.65},diffuse:{width:2.4,reach:.6,arc:1,opacity:.38},protection:{width:4,reach:.22,arc:.4,opacity:.28}};
const from=new T.Vector3();
const up=new T.Vector3(0,1,0);
export function operatorPoint(x,z,trees=[]){
 const clear=(x,z)=>!inRiver([x,z],.5)&&!trees.some(t=>Math.hypot(x-t.x,z-t.z)<t.radius)&&!block.buildings.some(b=>Math.abs(x-b.x)<b.w/2+.65&&Math.abs(z-b.z)<b.d/2+.65);
 if(clear(x,z))return [x,z];
 for(const radius of[1.5,3,5,8,12])for(let i=0;i<16;i++){const xx=x+Math.cos(i*Math.PI/8)*radius,zz=z+Math.sin(i*Math.PI/8)*radius;if(clear(xx,zz))return[xx,zz];}
 return null;
}
export function responseVisuals(world,engines){
 const trees=[];world.updateMatrixWorld(true);world.traverse(o=>{if(o.userData.treeClearance){const p=o.getWorldPosition(new T.Vector3());trees.push({x:p.x,z:p.z,radius:o.userData.treeClearance});}});
 const records=new Map();
 function add(e){
  const g=suspendHiddenTransforms(new T.Group());world.add(g);g.visible=false;
  const lines=Array.from({length:e.capacity?5:0},()=>{
   const p=e.kind==='CCF'?forestResponder(g):person(g,0,0,'',true),hoseTube=dynamicTube(12),jetTube=dynamicTube(20,5);
   const hose=new T.Mesh(hoseTube.geometry,new T.MeshStandardMaterial({color:'#b99155'})),jet=new T.Mesh(jetTube.geometry,new T.MeshBasicMaterial({color:'#bcf0ff',transparent:true,opacity:.65,depthWrite:false}));g.add(hose,jet);
   const reel=new T.Mesh(new T.TorusGeometry(.36,.1,6,12),new T.MeshStandardMaterial({color:'#bda66d'}));g.add(reel);
   const nozzle=cylinder(g,.08,.065,.42,'#343c40',0,0,0,8);
   const partner=e.kind==='CCF'?forestResponder(g):person(g,0,0,'',true);
   return{p,partner,hose,jet,reel,nozzle,hoseTube,jetTube,lastHose:'',lastJet:-Infinity};
  });
  const stretcher=new T.Group();g.add(stretcher);
  if(e.kind==='VSAV'||e.medicalTransport){
   box(stretcher,.8,.18,2,'#efb35b',0,.7,0);box(stretcher,.45,.3,1.5,'#7c9d9f',0,.94,0);
   for(const x of[-.3,.3])for(const z of[-.7,.7])box(stretcher,.08,.6,.08,'#666e72',x,.35,z);
   for(const z of[-1.18,1.18]){box(stretcher,.68,.055,.055,'#b8c5c6',0,.72,z);for(const x of[-.3,.3])box(stretcher,.045,.045,.28,'#b8c5c6',x,.72,z-Math.sign(z)*.12);}
   const patient=person(stretcher,0,.8,'#a57867');patient.rotation.x=-Math.PI/2;patient.position.y=1.02;patient.scale.setScalar(.8);e.stretcherModel=stretcher;
  }
  const team=Array.from({length:e.kind==='VLCG'?0:e.kind==='VLI'?1:e.kind==='SAMU'||e.kind==='VSAV'?3:2},()=>e.kind==='VPL'?diverResponder(g):e.kind==='CCF'?forestResponder(g):e.kind==='SAMU'?smurResponder(g):!e.firstAid&&['VSAV','VTU','PC','VPCE'].includes(e.kind)?medicalResponder(g):person(g,0,0,e.kind==='VLI'?'#eeeece':'',e.kind!=='VLI'));
  const kit=box(team[0]||g,.44,.56,.25,'#c92f35',0,1.08,-.29);kit.name='Sac de secours dorsal';
  box(kit,.34,.23,.07,'#a9232d',0,-.09,-.155);box(kit,.36,.045,.015,'#dce2d9',0,.08,-.135);
  for(const x of[-.14,.14])box(kit,.045,.5,.025,'#29343a',x,.03,.14);box(kit,.19,.055,.08,'#29343a',0,.31,0);e.hoseVisuals=lines;
  const carry=team[1]&&createCarryTool(team[1],e.kind);records.set(e,{g,lines,stretcher,team,kit,carry});
 }
 engines.forEach(add);
 const start=new T.Vector3(),end=new T.Vector3(),a=new T.Vector3(),goal=new T.Vector3(),tip=new T.Vector3(),aim=new T.Vector3(),coupling=new T.Vector3(),direction=new T.Vector3();
 return{add,remove(e){const r=records.get(e);if(r)disposeObject(r.g);records.delete(e);},update(t,state){
  const calls=new Map(state.calls.map(c=>[c.id,c]));
  for(const e of engines){
   const {g,lines,stretcher,team,kit,carry}=records.get(e),c=calls.get(e.call);const preparation=updateEquipmentLockers(e,c,t,state.minute);if(carry)carry.visible=false;
   g.visible=['scene','reconditioning','hospital'].includes(e.status);if(!g.visible){updateLoading(e,stretcher,team,end,state.minute);continue;}
   if(c?.fireTarget||c?.scene==='fuel')e.hoseTarget=(e.protectNeighbor&&c.neighborTarget||c.fireTarget||c.actionPoint||c.target).slice();
   const visibleHoses=(e.hoses||[]).filter(h=>h.progress>0),count=e.status==='hospital'?0:visibleHoses.length;
   const onsite=e.status==='scene'&&c&&e.kind!=='VLCG',recon=onsite&&!c.reconComplete,rescuing=onsite&&c.complication?.status==='active'&&c.complication.unitId===e.id,medical=onsite&&['VSAV','VTU','VLI','SAMU'].includes(e.kind)&&!!c.victimCount&&!(e.firstAid&&(nozzleCount(e)||e.hydrant||equipmentBusy(e))),diverse=onsite&&(c.type==='OD'||c.inspection&&c.fireConfirmed!==true);
   start.copy(e.model.position);end.set(c?.actionPoint?.[0]??(c?.target?.[0]??start.x)+4,0,c?.actionPoint?.[1]??(c?.target?.[1]??start.z)-5);
   const careProgress=e.kind==='SAMU'?Math.max(c?.patients?.[e.medicalPatient]?.medicalProgress||0,e.patientProgress||0):e.patientProgress,phase=rescuing?Math.min(1,c.complication.progress*3):recon?c.reconProgress:medical&&!['VLI'].includes(e.kind)?Math.min(1,(careProgress||0)/.25):Math.min(1,(state.minute-e.workStarted)/5);
   team.forEach((p,i)=>{applyEngineInsignia(p,e,i);setInterventionHelmet(p,!!onsite&&(e.firstAid||!['VTU','VSAV','SAMU','VPL'].includes(e.kind))&&(e.kind==='CCF'||c.type!=='SUAP'));p.visible=!!(onsite&&i<(e.crew||e.size||team.length)&&e.kind!=='PC'&&e.extricationTask==null&&!e.aerial?.mode&&(rescuing||(recon||medical||diverse)&&!count));if(!p.visible)return;p.position.copy(start).lerp(end,Math.max(0,Math.min(1,phase)));p.position.x+=(i-(team.length-1)/2)*1.1;p.position.y=0;p.rotation.set(0,Math.atan2(end.x-p.position.x,end.z-p.position.z),0);const walking=phase<1;p.children[1].rotation.x=walking?Math.sin(t*6+i)*.4:0;p.children[2].rotation.x=walking?-Math.sin(t*6+i)*.4:0;});
   if(onsite&&e.kind==='VSAV'&&!e.firstAid&&!c.victimCount)team.forEach((p,i)=>{const q=new T.Vector3(1.9,0,-.4-i*.85).applyAxisAngle(up,e.model.rotation.y).add(start),safe=operatorPoint(q.x,q.z,trees);p.visible=i<(e.crew||e.size||3)&&!!safe;if(safe)p.position.set(safe[0],0,safe[1]);p.rotation.set(0,e.model.rotation.y+Math.PI/2,0);});
   // Keep the existing crew leader outside during fire operations; no extra crew member.
   if(onsite&&c.type==='INC'&&(e.firstAid||['FPT','CCF','EPA'].includes(e.kind))&&!(e.kind==='EPA'&&(e.aerial?.mode||e.ladderDeployed))){const chief=team[0],yaw=e.model.rotation.y,x=start.x+Math.cos(yaw)*2.15,z=start.z-Math.sin(yaw)*2.15,safe=operatorPoint(x,z,trees);chief.visible=!!safe;if(safe){chief.position.set(safe[0],0,safe[1]);chief.rotation.set(0,Math.atan2(end.x-safe[0],end.z-safe[1]),0);chief.children[1].rotation.x=chief.children[2].rotation.x=0;chief.children[3].rotation.x=-.85;chief.children[4].rotation.x=-.3;}}
   if(carry&&team[1]&&!(e.perimeterCrew||e.buildingCrew||e.ventilationCrew))prepareCrew(e,team[1],carry,preparation,end,t);
   kit.visible=!!(onsite&&(medical||diverse)&&team[0]?.visible);
   const supplyWorkers=e.supplyProgress>0&&e.supplyProgress<1?2:0,maxOperators=Math.max(0,(e.crew||e.size||4)-supplyWorkers-(rescuing?2:0)-(e.perimeterCrew||0)-(e.buildingCrew||0));
   lines.forEach((line,i)=>{
    const {p,partner,hose,jet,reel,nozzle,hoseTube,jetTube}=line,h=visibleHoses[i];const supplyPair=!e.longSupplyProvider&&e.supplyProgress>0&&e.supplyProgress<1?2:0;applyEngineInsignia(p,e,2+supplyPair+i*(e.kind==='CCF'?1:2));applyEngineInsignia(partner,e,3+supplyPair+i*2);
    nozzle.visible=hose.visible=i<count;p.visible=i<count&&(staffedHoses(e).includes(h)||h.index>=nozzleCount(e)&&i<Math.max(0,nozzleLimit(e)-staffedHoses(e).length));if(h){p.userData.lanceIndex=partner.userData.lanceIndex=h.index<nozzleCount(e)?h.index:null;}partner.visible=p.visible&&e.kind!=='CCF';reel.visible=i<count&&h.progress<1;
    jet.visible=i<count&&staffedHoses(e).includes(h)&&e.flow>0&&hoseFlowing(e,h)&&h.index<nozzleCount(e);if(i>=count)return;
    const style=styleFor(h),shape=JET_SHAPES[h.jet]||JET_SHAPES.droit,progress=h.progress,walking=progress<.85||h.relocate>0;
    coupling.set((i-2)*.35,.18,-e.model.userData.length/2+.25).applyAxisAngle(up,e.model.rotation.y).add(start);coupling.y=.18;
    a.set((i-2)*1.6,0,-e.model.userData.length/2-1).applyAxisAngle(up,e.model.rotation.y).add(start);a.y=0;
    goal.set(e.hoseTarget?.[0]??a.x,0,e.hoseTarget?.[1]??a.z);if(h.position){a.lerp(goal,.6);if(h.from)from.set(h.from[0],0,h.from[1]);else from.copy(a);a.set(h.position[0],0,h.position[1]);from.lerp(a,1-Math.max(0,Math.min(1,h.relocate||0)));a.copy(from);}else a.lerp(goal,.6*Math.min(1,progress/.85));const safe=operatorPoint(a.x,a.z,trees);if(safe)a.set(safe[0],0,safe[1]);else p.visible=false;p.position.copy(a);
    p.children[1].rotation.x=walking?Math.sin(t*7+i)*.5:0;p.children[2].rotation.x=walking?-Math.sin(t*7+i)*.5:0;p.children[4].rotation.x=walking?-.6:-1.3;
    partner.position.copy(p.position);partner.position.x+=.65;partner.position.z+=.5;partner.rotation.copy(p.rotation);partner.children[1].rotation.x=p.children[1].rotation.x;partner.children[2].rotation.x=p.children[2].rotation.x;
    reel.position.copy(a);reel.position.x+=.45;reel.position.y=.75;reel.rotation.y=t*2;reel.scale.setScalar(Math.max(.35,1-progress));
    aim.set(e.hoseTarget?.[0]??a.x,c?.fireHeight??(c?.name==='Feu de véhicule'?1.2:3),e.hoseTarget?.[1]??a.z);p.rotation.set(0,Math.atan2(aim.x-a.x,aim.z-a.z),0);
    const signature=[h.flow,progress,start.x,start.z,e.model.rotation.y,a.x.toFixed(2),a.z.toFixed(2)].join(':');
    if(signature!==line.lastHose){
     line.lastHose=signature;hose.material.color.set(style.hose);direction.subVectors(a,coupling);const length=Math.hypot(direction.x,direction.z)||1;
     hoseTube.points.forEach((point,j)=>{const k=j/(hoseTube.points.length-1),slack=Math.sin(k*Math.PI)*Math.min(1.2,length*.08);point.copy(coupling).lerp(a,k);point.x+=direction.z/length*slack;point.z-=direction.x/length*slack;const distance=nearestRoad([point.x,point.z]).distance,ground=(distance<4.55?.235:distance<6.6?.12:.06)+style.radius;point.y=length<3?.85+k*.55:ground+Math.max(0,1-k*length/1.5)*(.85-ground)+Math.max(0,1-(1-k)*length/1.5)*(1.4-ground);});hoseTube.update(style.radius);
    }
    tip.copy(a).setY(1.4);nozzle.position.copy(tip);direction.subVectors(aim,tip).normalize();nozzle.quaternion.setFromUnitVectors(up,direction);nozzle.scale.setScalar(style.nozzle);
    const foaming=e.foamFlow>0&&h.index===0;jet.material.color.set(foaming?'#f3f6e9':'#bcf0ff');jet.material.opacity=foaming?.95:shape.opacity;if(foaming)aim.y=.3;else if(shape.reach<1)aim.lerpVectors(tip,aim,shape.reach);
    if(jet.visible&&t-line.lastJet>=1/30){line.lastJet=t;jetTube.points.forEach((point,j)=>{const k=j/(jetTube.points.length-1);point.copy(tip).lerp(aim,k);point.y+=Math.sin(k*Math.PI)*(foaming?2:shape.arc)+Math.sin(t*25+j)*.03;});jetTube.update(style.jet*(foaming?1.7:shape.width));}
   });
   stretcher.visible=!!(medical&&(e.kind==='VSAV'||e.medicalTransport)&&e.patientAssigned&&e.patientProgress>.5&&c.patients?.some(p=>p.assignedTo===e.id&&p.transportRequired!==false));
   updateLoading(e,stretcher,team,end,state.minute);
   if(e.kind==='VSAV'&&updateWalkingPatient(e,g,team,end,c,t))stretcher.visible=false;
   for(let i=0;i<(e.perimeterCrew||0)+(e.buildingCrew||0)+(e.ventilationCrew||0);i++)if(team[i])team[i].visible=false;
  }
 }};
}
