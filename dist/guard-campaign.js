import {INCIDENTS,setDensity,time} from './sim.js';
import {capability,engagementError} from './operations.js';
import {districts} from './city-layout.js';
export const DAY_KEY='valmont.day.next',PREF_KEY='valmont.options.v1',RESULT_KEY='valmont.results.v1';
export const EXTRA_MISSIONS=[{id:'search',type:'OD',name:'Recherche de personne en forêt',setting:'forest',requires:'VTU',duration:50,searchPerson:true},{id:'animal',type:'OD',name:'Chat bloqué dans un arbre',setting:'garden',requires:'VTU',duration:35,animalRescue:true}];
export const CONDITIONS={mild:{key:'mild',label:'Temps doux',detail:'Conditions ordinaires.',risk:'Activité habituelle.'},hot:{key:'hot',label:'Chaleur et sécheresse',detail:'Végétation sèche.',risk:'Départs de feu et propagation favorisés.'},wind:{key:'wind',label:'Vent soutenu',detail:'Vent d’ouest sur le secteur.',risk:'Propagation accélérée sous le vent.'},rain:{key:'rain',label:'Journée pluvieuse',detail:'Chaussées humides.',risk:'Plus de risques routiers ; végétation moins inflammable.'},crowd:{key:'crowd',label:'Ville animée',detail:'Marché et rencontre au stade.',risk:'Accès plus fréquentés autour des événements.'}};
export function randomFrom(seed){let n=seed>>>0;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
export function withRandom(seed,fn){const old=Math.random;Math.random=randomFrom(seed);try{return fn();}finally{Math.random=old;}}
export function readOptions(storage=globalThis.localStorage){try{return {autoPause:false,guidance:true,ambience:true,radioFocus:false,...JSON.parse(storage?.getItem(PREF_KEY)||'{}')}}catch{return {autoPause:false,guidance:true,ambience:true,radioFocus:false}}}
export function plannedDay(storage=globalThis.sessionStorage){try{const plan=JSON.parse(storage?.getItem(DAY_KEY)||'null');storage?.removeItem(DAY_KEY);return plan&&Number.isFinite(plan.seed)?plan:null;}catch{return null;}}
export function prepareDay(state,plan){
 if(!plan)return;
 state.campaign=true;state.citySeed??=plan.citySeed??plan.seed;state.randomStreams={};state.dayPlan={...plan,citySeed:state.citySeed};state.conditions=CONDITIONS[plan.weather]||state.conditions;state.training=plan.mode==='training';if(state.training)state.shiftEnd=state.minute+10080;
 if(plan.schedule){state.schedule=structuredClone(plan.schedule);state.next=0;}
 else{withRandom(plan.seed,()=>setDensity(state,state.density));const random=randomFrom(plan.seed);
  state.schedule=state.schedule.map((c,i)=>{let template=c;if(!c.noDispatch&&plan.profile!=='balanced'&&random()<.55){const choices=INCIDENTS.filter(t=>t.type===(plan.profile==='medical'?'SUAP':'INC'));template={...choices[Math.floor(random()*choices.length)],catalogId:undefined,at:c.at};}return {...template,seed:(plan.seed+i*7919)>>>0};});
  if(state.training){const template=[...INCIDENTS,...EXTRA_MISSIONS].find(c=>c.id===plan.mission)||INCIDENTS[0];state.schedule=[{...template,catalogId:template.id,id:undefined,at:state.minute+1,seed:plan.seed}];state.shiftEnd=state.minute+10080;}
  else{const live=state.schedule.filter(c=>!c.noDispatch);if(live.length&&random()<.6){const i=state.schedule.indexOf(live.at(-1));state.schedule[i]={...EXTRA_MISSIONS[random()<.5?0:1],id:undefined,at:state.schedule[i].at,seed:plan.seed+991};}if(plan.handover&&live[0]){live[0].at=state.minute;live[0].handover=true;}if(plan.weather==='crowd'){const event=state.schedule.find(c=>c.type==='SUAP'&&!c.noDispatch);if(event){event.setting='stadium';event.name='Malaise pendant le match';event.catalogId=undefined;event.scene='medical';}}state.schedule.sort((a,b)=>a.at-b.at);}
  state.dayPlan={...plan,citySeed:state.citySeed,schedule:structuredClone(state.schedule)};
 }
 state.objectives=[{key:'coverage',label:'Garder un VSAV disponible pendant la garde',broken:false},{key:'finish',label:'Terminer toutes les interventions reçues'}];
}
export function recommendDeparture(c,engines,state){
 const desired=c.searchPerson?['VTU','VSAV']:c.animalRescue?['EPA','VTU']:c.waterRescue?['VPL','VSAV']:c.type==='INC'?[c.requires==='CCF'?'CCF':'FPT',...(c.site?.height>8?['EPA']:[]),...(c.victimsKnown&&c.victimCount?['VSAV']:[])]:c.type==='AVP'?['VSAV','VSR']:c.type==='SUAP'?['VSAV']:['VTU'];
 const result=[];let staff=state.freeStaff;
 for(const kind of desired){const candidate=engines.filter(e=>!result.includes(e)&&capability(e,c)&&!engagementError([e],c,staff,state.roster)&&(e.kind===kind||kind==='VSR'&&e.kind==='FPT'&&!e.lightPump)).sort((a,b)=>Math.hypot(a.model.position.x-c.target[0],a.model.position.z-c.target[1])-Math.hypot(b.model.position.x-c.target[0],b.model.position.z-c.target[1]))[0];if(candidate){result.push(candidate);staff-=candidate.crew||candidate.external||candidate.dedicated?0:candidate.size;}}
 return result.map(e=>e.id);
}
export function coverage(state,engines){return districts.map(d=>{const available=engines.filter(e=>['ready','idle','returning'].includes(e.status)&&(!e.capacity||e.water>0)&&(!e.dedicated||e.kind==='VLI')&&(e.crew||e.external||(!e.dedicated&&state.freeStaff>=e.size)||e.dedicated&&state.roster.some(p=>p.present&&!p.engine&&p.role==='nurse')));const nearest=available.sort((a,b)=>Math.hypot(a.model.position.x-d.target[0],a.model.position.z-d.target[1])-Math.hypot(b.model.position.x-d.target[0],b.model.position.z-d.target[1]))[0];return {...d,nearest:nearest?.id,level:!nearest?'Sans moyen':Math.hypot(nearest.model.position.x-d.target[0],nearest.model.position.z-d.target[1])>300?'Éloigné':'Couvert'};});}
export function dayResult(state){const calls=state.calls.filter(c=>c.at>=state.shiftStart||c.handover),done=calls.filter(c=>c.status==='closed'),delays=calls.filter(c=>c.firstArrival!=null).map(c=>c.firstArrival-c.at);const average=delays.length?delays.reduce((n,v)=>n+v,0)/delays.length:0;return{at:Date.now(),seed:state.dayPlan?.seed,completed:done.length,total:calls.length,average:Math.round(average*10)/10,coverage:!state.objectives?.find(o=>o.key==='coverage')?.broken};}
export function advice(result){return [result.completed===result.total?'Toutes les missions reçues sont terminées.':`${result.completed} mission(s) terminée(s) sur ${result.total}.`,result.coverage?'Une réserve sanitaire a été conservée.':'Anticipez le rappel pour conserver une réserve sanitaire.'];}
export function timeline(c){return [['Appel',c.at],['Départ',c.firstDeparture],['Arrivée',c.firstArrival],['Fin sur place',c.siteCompletedAt],['Clôture',c.closedAt]].filter(([,at])=>Number.isFinite(at)).map(([label,at])=>`${label} ${time(at)}`).join(' → ');}

// Persist each stream cursor so resuming does not restart the random sequence.
export function withSimulationRandom(state,key,fn){
 const old=Math.random;const streams=state.randomStreams??={};
 let n=streams[key]??((state.dayPlan?.seed??state.citySeed??1)>>>0);
 Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
 try{return fn();}finally{streams[key]=n;Math.random=old;}
}
