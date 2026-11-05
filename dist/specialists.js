// Équipes spécialisées départementales : elles viennent de loin, sur demande du centre.
// Délais, durées et planning : équilibrage de jeu. Planning propre à la garde, sans hasard partagé.
import * as T from 'three';
import {vehicle,person,sign} from './models.js';
import {roads,streetRoute} from './roads.js';
import {smoothRoute} from './route3d.js';
import {reserveParking} from './parking.js';
import {clearPlacement} from './vehicle-spacing.js';
export const TEAMS={
 RCH:{label:'Cellule risques chimiques',short:'CMIC',role:'Identifier le produit, confiner la fuite',delay:16,work:18,color:'#d2a11f'},
 RAD:{label:'Cellule risques radiologiques',short:'CMIR',role:'Mesurer, baliser, récupérer la source',delay:20,work:16,color:'#3e8f7d'},
 SD:{label:'Sauvetage-déblaiement',short:'SDE',role:'Étayer et dégager les personnes ensevelies',delay:18,work:22,color:'#b8622a'},
 GRIMP:{label:'Groupe de reconnaissance en milieu périlleux',short:'GRIMP',role:'Atteindre la victime sur cordes',delay:14,work:14,color:'#3e6fb0'}
};
export const SPECIALIST_MISSIONS=[
 {id:'spe-fuite',team:'RCH',type:'OD',name:'Fuite de produit chimique dans un atelier',setting:'shop',requires:'FPT',duration:20},
 {id:'spe-source',team:'RAD',type:'OD',name:'Source radioactive découverte dans un entrepôt',setting:'office',requires:'FPT',duration:20},
 {id:'spe-effondrement',team:'SD',type:'SUAP',name:'Effondrement partiel, personne ensevelie',setting:'home',severity:.5},
 {id:'spe-grimp',team:'GRIMP',type:'SUAP',name:'Personne bloquée sur une structure en hauteur',setting:'tower',severity:.2}
];
const hash=n=>{let h=2166136261;for(const ch of String(n)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
// Une mission spécialisée par garde, entre 10 h et 22 h.
export function planSpecialist(state){
 const seed=`${state.citySeed??0}:${state.shiftStart}:specialist`;
 return {at:state.shiftStart+120+Math.floor(hash(seed+':at')*720),kind:SPECIALIST_MISSIONS[Math.floor(hash(seed+':k')*SPECIALIST_MISSIONS.length)].id,key:String(state.shiftStart)};
}
export function dueSpecialist(state){
 if(state.training)return [];
 state.specialistPlan??=planSpecialist(state);state.specialistDone??=[];
 const slot=state.specialistPlan;
 if(state.minute<slot.at||state.minute>=state.shiftEnd||state.specialistDone.includes(slot.key))return [];
 state.specialistDone.push(slot.key);
 const m=SPECIALIST_MISSIONS.find(m=>m.id===slot.kind),call={type:m.type,catalogId:m.id,name:m.name,setting:m.setting,at:state.minute,allowComplications:false,specialty:{team:m.team,done:false,progress:0}};
 if(m.type==='SUAP')Object.assign(call,{scene:'patient',requires:'VSAV',duration:26,severity:m.severity,casualties:'single'});
 else Object.assign(call,{requires:m.requires,duration:m.duration,victimCount:0});
 return [call];
}
export const specialtyPending=c=>!!c?.specialty&&!c.specialty.done;
// Les victimes restent inaccessibles tant que l'équipe n'a pas terminé.
export function holdVictims(c){for(const p of c.patients||[])if(!p.evacuated&&!p.deceased)p.trapped=true;}
export function specialtyStatus(c){
 const s=c.specialty;if(!s)return '';const t=TEAMS[s.team];
 if(s.done)return `${t.short} : mission terminée`;
 return s.state?`${t.short} · ${s.state}`:`${t.label} nécessaire · demandez ${t.short}`;
}
export function createSpecialists(world,{advance,actors,release}){
 const units=[],entries=roads.filter(r=>!r.trail&&!r.express&&!r.name.includes('(simulation)')&&Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])>50);
 function build(team){
  const info=TEAMS[team],model=vehicle(world,'VTU',info.color);model.name=info.label;model.visible=false;model.userData.kind='SPECIALIST';
  for(const side of[-1,1]){const label=sign(model,info.short,1.8,.36,side*1.2,1.3,0,info.color,'#14181b');label.rotation.y=side*Math.PI/2;}
  const crew=[0,1,2].map(()=>{const p=person(world,0,0,info.color);p.visible=false;return p;});
  return {id:`${info.short} ${units.filter(u=>u.team===team).length+1}`,team,kind:'SPECIALIST',service:true,model,crew,status:'called',segment:1,path:null,call:null};
 }
 function route(v,target,parking=null){const p=v.model.position;v.parking=parking;v.path=smoothRoute(parking?[...streetRoute([p.x,p.z],parking.entry,{startYaw:v.model.rotation.y,endYaw:parking.yaw}),parking.approach,parking.target]:streetRoute([p.x,p.z],target,{startYaw:v.model.rotation.y}));v.segment=1;}
 const farthest=c=>entries.slice().sort((a,b)=>Math.hypot(b.a[0]-c.target[0],b.a[1]-c.target[1])-Math.hypot(a.a[0]-c.target[0],a.a[1]-c.target[1]))[0];
 function request(s,c){
  const spec=c?.specialty;if(!spec||c.status==='closed')return {error:'Intervention terminée.'};
  if(units.some(v=>!v.retired&&v.call===c.id))return {error:`${TEAMS[spec.team].short} déjà demandée.`};
  const info=TEAMS[spec.team],v=build(spec.team);units.push(v);v.call=c.id;v.arriveAt=s.minute+info.delay;spec.state=`En route · ~${info.delay} min`;
  return {message:`${info.label} demandée pour l’intervention n°${c.id} · arrivée dans ${info.delay} min.`};
 }
 function update(s,dt){
  for(const v of units){
   if(v.retired)continue;
   const c=s.calls.find(c=>c.id===v.call);
   if(v.status==='called'){
    if(s.minute<v.arriveAt||!c)continue;
    const r=farthest(c),yaw=Math.atan2(r.b[0]-r.a[0],r.b[1]-r.a[1]);
    if(!clearPlacement(v.model,r.a[0],r.a[1],yaw,actors().map(a=>a.model)))continue;
    v.model.position.set(r.a[0],.2,r.a[1]);v.model.rotation.y=yaw;v.model.visible=true;v.status='enroute';const parking=reserveParking(v,c,actors());route(v,parking.target,parking);continue;
   }
   if(v.path&&advance(v,dt)){release(v);v.path=null;
    if(v.status==='returning'){v.retired=true;v.model.visible=false;continue;}
    v.status='scene';if(v.parking)v.model.rotation.y=v.parking.yaw;if(c?.specialty)c.specialty.state='Sur place, engagement';
    v.crew.forEach((p,i)=>{p.visible=true;p.position.copy(v.model.position);p.position.x+=Math.cos(v.model.rotation.y)*(2+i);p.position.z-=Math.sin(v.model.rotation.y)*(2+i);p.rotation.y=v.model.rotation.y;});
   }
   if(v.status==='scene'&&(!c||c.status==='closed'||c.specialty?.done)){v.crew.forEach(p=>p.visible=false);v.call=null;v.status='returning';route(v,farthest({target:[v.model.position.x,v.model.position.z]}).a);}
  }
 }
 // Sans premier engin sur place pour reconnaître et baliser, l'équipe ne peut pas s'engager.
 function tick(c,engines,minutes){
  const s=c.specialty;if(!s||s.done||c.status==='closed')return null;
  const team=units.find(v=>v.call===c.id&&v.status==='scene');if(!team)return null;
  if(!engines.some(e=>e.call===c.id&&e.status==='scene')){s.state='Sur place · attend un engin pour le balisage';return null;}
  const info=TEAMS[s.team];s.progress+=minutes/info.work;s.state=`Engagée · ${Math.min(100,Math.round(s.progress*100))} %`;
  if(s.progress<1)return null;
  s.done=true;for(const p of c.patients||[])if(!p.deceased)p.trapped=false;
  return {text:`${team.id} : mission terminée${c.patients?.length?', victime accessible':', zone sûre'}.`,finished:!c.victimCount};
 }
 return {units,request,update,tick};
}
