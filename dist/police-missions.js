// Missions des forces de l'ordre : la police sécurise avant les secours, et certaines missions ne concernent qu'elle.
// Créneaux, délais d'escalade et durées relèvent de l'équilibrage de jeu.
export const FORCE_RANK={PM:1,PN:2,BAC:3};
export const SECURING_MINUTES=2,OPJ_MINUTES=10,UNATTENDED_MINUTES=8,POLICE_EXPIRY=25;
export const POLICE_MISSIONS=[
 {id:'pol-rixe',type:'SUAP',name:'Blessé lors d’une rixe',setting:'sidewalk',severity:.35,force:'PN',escalate:'BAC',escalateAfter:8,opj:true},
 {id:'pol-arme-blanche',type:'SUAP',name:'Personne blessée par arme blanche',setting:'sidewalk',severity:.65,force:'BAC',opj:true},
 {id:'pol-suspect',type:'OD',name:'Individu suspect devant l’école',setting:'sidewalk',force:'PM',escalate:'PN',escalateAfter:10,presence:6},
 {id:'pol-rassemblement',type:'OD',name:'Rassemblement tendu en centre-ville',setting:'sidewalk',force:'PN',escalate:'BAC',escalateAfter:8,presence:10},
 {id:'pol-agressif',type:'OD',name:'Personne agressive dans un commerce',setting:'shop',force:'PN',opj:true}
];
// Créneaux de la garde, en minutes depuis 8 h : un le matin, un l'après-midi, un en soirée, un la nuit.
const WINDOWS=[[150,300],[420,660],[720,900],[960,1260]];
const hash=n=>{let h=2166136261;for(const ch of String(n)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
// Planning propre à chaque garde, sans consommer le hasard partagé des appels.
export function planPoliceMissions(state){
 const seed=`${state.citySeed??0}:${state.shiftStart}`;
 return WINDOWS.map(([a,b],i)=>({at:state.shiftStart+a+Math.floor(hash(seed+':at'+i)*(b-a)),kind:POLICE_MISSIONS[Math.floor(hash(seed+':k'+i)*POLICE_MISSIONS.length)].id,key:`${state.shiftStart}:${i}`}));
}
export function duePoliceMissions(state){
 state.policePlan??=planPoliceMissions(state);state.policeDone??=[];
 const due=[];
 for(const slot of state.policePlan){
  if(state.minute<slot.at||state.minute>=state.shiftEnd||state.policeDone.includes(slot.key))continue;
  state.policeDone.push(slot.key);
  const m=POLICE_MISSIONS.find(m=>m.id===slot.kind);
  const call={type:m.type,catalogId:m.id,name:m.name,setting:m.setting,at:state.minute,allowComplications:false,security:{force:m.force,escalate:m.escalate||null,escalateAfter:m.escalateAfter||null,opj:!!m.opj,secured:false}};
  if(m.type==='SUAP')Object.assign(call,{scene:'patient',requires:'VSAV',duration:28,severity:m.severity,casualties:'single'});
  else Object.assign(call,{scene:'police',requires:'POLICE',duration:m.presence||OPJ_MINUTES,policeOnly:true,presence:m.presence||0,victimCount:0});
  due.push(call);
 }
 return due;
}
export const isPoliceOnly=c=>!!c?.policeOnly;
export const securityPending=c=>!!c?.security&&!c.security.secured;
const covers=(unit,force)=>FORCE_RANK[unit.force]>=FORCE_RANK[force];
const label={PM:'Police municipale',PN:'Police nationale',BAC:'BAC'};
// Fait avancer la sécurisation, l'escalade, les constatations OPJ et la fin des missions police.
// `request(force,options)` engage une unité ; renvoie les messages radio à diffuser.
export function tickSecurity(c,police,minute,request){
 const s=c.security;if(!s||c.status==='closed'||c.siteCompletedAt!=null)return [];
 const out=[],here=police.filter(v=>!v.retired&&v.call===c.id&&v.status==='scene'),engaged=police.filter(v=>!v.retired&&v.call===c.id);
 if(!s.secured){
  // Sans force adaptée engagée à temps, la situation se dégrade et réclame une force plus robuste.
  if(s.escalate&&!s.escalated&&minute>=c.at+s.escalateAfter&&!engaged.some(v=>covers(v,s.force))){s.escalated=true;s.escalatedAt=minute;s.force=s.escalate;out.push({urgent:true,text:`La situation dégénère : ${label[s.force]} nécessaire pour sécuriser.`});}
  // Le CIC finit par engager lui-même la force requise : d'emblée pour des secours bloqués, en renfort pour une mission police déjà prise.
  const force=s.force==='PM'?'PN':s.force;
  if(!engaged.some(v=>covers(v,s.force))&&minute>=(s.escalatedAt??c.at)+UNATTENDED_MINUTES&&s.autoRequested!==s.force&&(!c.policeOnly||engaged.length)){s.autoRequested=s.force;const r=request(force);if(!r.error)out.push({text:`Le CIC engage d’office : ${label[force]}.`});}
  const guard=here.find(v=>covers(v,s.force));
  if(guard){s.securingSince??=minute;if(minute-s.securingSince>=SECURING_MINUTES){s.secured=true;s.securedAt=minute;s.securedBy=guard.id;out.push({text:c.policeOnly?`${guard.id} : situation maîtrisée sur place.`:`${guard.id} : zone sécurisée, les secours peuvent intervenir.`});}}
  else s.securingSince=null;
  if(c.policeOnly&&!engaged.length&&minute>=c.at+POLICE_EXPIRY){c.status='closed';c.closedAt=minute;c.policeFailed=true;out.push({urgent:true,text:'Mission de police non traitée : les faits sont signalés au parquet sans intervention.'});}
  return out;
 }
 if(s.opj&&!s.opjRequested){s.opjRequested=true;const r=request('PN',{opj:true});out.push({text:r.error?'OPJ indisponible : constatations reportées.':'OPJ demandé pour les constatations.'});if(r.error)s.opjDone=true;}
 const opj=here.find(v=>v.opj);
 if(s.opj&&!s.opjDone&&opj){s.opjSince??=minute;if(minute-s.opjSince>=OPJ_MINUTES){s.opjDone=true;out.push({text:`${opj.id} : constatations terminées.`});}}
 if(c.policeOnly&&(s.opj?s.opjDone:minute-s.securedAt>=c.presence)){c.status='closed';c.closedAt=minute;c.policeHandled=true;out.push({text:'Mission de police terminée, retour des équipages.'});}
 return out;
}
export function securityStatus(c){
 const s=c?.security;if(!s)return '';
 if(!s.secured)return `${c.policeOnly?'Mission police':'Secours en attente de sécurisation'} · ${label[s.force]} requise${s.escalated?' (escalade)':''}`;
 if(s.opj&&!s.opjDone)return 'Zone sécurisée · constatations OPJ en cours';
 return 'Zone sécurisée';
}
