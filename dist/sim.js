import {initCrew} from './crew.js';
export const SHIFT={start:8*60,duration:1440,minCalls:5,maxCalls:20};
import {INCIDENTS,isNight,familyFor,pickIncident,casualtyProfile} from './incident-catalog.js';
export {INCIDENTS};
const rnd=()=>Math.random();
export function newShiftConditions(random=rnd){const roll=random();return roll<.24?{key:'hot',label:'Journée chaude et sèche',detail:'Les sols et la végétation sont secs.',risk:'Risque accru de départ et de propagation des feux de végétation.'}:roll<.43?{key:'wind',label:'Vent sensible',detail:'Des rafales traversent le secteur.',risk:'Un feu déclaré peut se propager plus vite et demander davantage d’eau.'}:roll<.62?{key:'rain',label:'Pluie intermittente',detail:'Les chaussées restent humides par moments.',risk:'Prudence sur les axes routiers et pendant les déplacements.'}:roll<.8?{key:'crowd',label:'Ville très fréquentée',detail:'Commerces, stade et espaces publics attirent du monde.',risk:'Les accès et les déplacements peuvent être plus chargés.'}:{key:'mild',label:'Conditions ordinaires',detail:'Temps doux et activité habituelle dans les quartiers.',risk:'Aucun risque particulier annoncé à la prise de garde.'};}
export function createShift(){const s={shiftStart:SHIFT.start,shiftEnd:SHIFT.start+SHIFT.duration,minute:SHIFT.start,speed:60,paused:false,ended:false,schedule:[],next:0,calls:[],incoming:[],logs:[],received:0,completed:0,selected:'FPTSR',spv:false,recallAt:null,freeStaff:12,density:8,phoneSerial:0,noDispatch:0,shiftNoDispatch:0,conditions:newShiftConditions()};initCrew(s);setDensity(s,8);return s;}
export function setDensity(s,count){
 s.density=Math.max(SHIFT.minCalls,Math.min(SHIFT.maxCalls,Math.round(count)));
 const already=s.calls.filter(c=>c.at>=s.shiftStart).length+s.incoming.filter(c=>!c.noDispatch).length;
 const remaining=s.minute>=s.shiftEnd-15?0:Math.max(0,s.density-already);
 s.schedule=s.schedule.slice(0,s.next);
 const times=[];
 for(let i=0;i<remaining;i++){
  let at;do{at=s.minute+3+rnd()*Math.max(1,s.shiftEnd-s.minute-15);}while(rnd()>hourWeight(at));
  if(i>0&&i%5===0)at=Math.min(s.shiftEnd-8,times.at(-1)+2+rnd()*6);
  times.push(at);
 }
 const recent=[...s.calls,...s.incoming].filter(c=>c.catalogId).slice(-2).map(c=>c.catalogId);
 for(const at of times.sort((a,b)=>a-b)){
  const night=isNight(at),base=familyFor(at,rnd),condition=s.conditions?.key,type=condition==='hot'&&rnd()<.28?'INC':condition==='wind'&&rnd()<.18?'INC':condition==='rain'&&rnd()<.2?'AVP':condition==='crowd'&&rnd()<.2?'SUAP':base,template=pickIncident(type,at,rnd,recent.slice(-2));
  s.schedule.push({...template,catalogId:template.id,id:undefined,at,limitedInfo:night&&rnd()<.65});recent.push(template.id);
 }
 const falseCount=remaining?Math.max(1,Math.round(remaining*.2)):0;
 for(let i=0;i<falseCount;i++)s.schedule.push({at:s.minute+10+rnd()*Math.max(1,s.shiftEnd-s.minute-20),noDispatch:true});
 s.schedule.sort((a,b)=>a.at-b.at);
}
export function time(m){const n=Math.floor(m)%1440;return`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
// Only skip idle time; incoming qualification and open missions must be handled first.
export function nextCallBlocked(s){
 if(s.ended||s.minute>=s.shiftEnd)return 'Garde terminée';
 if(s.calls.some(c=>c.status!=='closed'))return 'Une intervention est encore en cours';
 if(s.incoming.length)return 'Un appel est en cours de qualification';
 if(s.next>=s.schedule.length||s.schedule[s.next].at>=s.shiftEnd)return 'Tous les appels de cette garde ont été reçus';
 return '';
}
export function requestNextCall(s,onPhone=()=>{},advance){
 if(nextCallBlocked(s))return false;
 const target=Math.max(s.minute,s.schedule[s.next].at,s.minute+dispatchPacing(s,s.schedule[s.next])),paused=s.paused;
 s.paused=false;
 try{
  if(advance)advance((target-s.minute)*60/s.speed);
  else s.minute=target;
  tickShift(s,0,()=>{},onPhone);
 }finally{s.paused=paused;}
 return true;
}
// Admission follows operational workload, including calls still being qualified.
// Minutes are simulation minutes, independent of frame rate and game speed.
export function incidentWorkload(c){
 if(c.noDispatch||c.status==='closed'||c.siteCompletedAt!=null)return 0;
 if(c.type==='INC'&&!c.fireContained)return c.requires==='CCF'||['forest','vegetation'].includes(c.scene)||c.setting==='forest'?3:2;
 return c.type==='AVP'?2:1;
}
export function dispatchPacing(s,c,random=Math.random){
 if(c.noDispatch)return 0;
 const active=[...s.calls,...s.incoming].filter(v=>incidentWorkload(v)>0);
 const level=Math.max(0,...active.map(incidentWorkload));
 const gap=level===3?90:level===2?35:6,retry=level===3?30:level===2?15:8;
 const last=s.lastDispatchAt??Math.max(-Infinity,...[...s.calls,...s.incoming].filter(v=>!v.noDispatch).map(v=>v.receivedAt??v.at??-Infinity));
 if(s.minute-last<gap)return Math.max(1,gap-(s.minute-last));
 if(!active.length)return 0;
 const heavy=incidentWorkload(c)>=2;
 if(active.length>=(level>=2?2:4)||heavy&&(level>=2||active.length>=2))return retry;
 // Draw only once per admission attempt, never once per rendered frame.
 return level===3&&random()>=.12||level===2&&random()>=.35?retry:0;
}
function postponeDispatch(s,delay){
 const c=s.schedule[s.next];c.scheduledAt??=c.at;c.at=s.minute+delay;
 s.schedule.splice(s.next,s.schedule.length-s.next,...s.schedule.slice(s.next).sort((a,b)=>a.at-b.at));
}
export function tickShift(s,dt,onCall,onPhone=()=>{},onNoDispatch=()=>{}){if(s.paused||s.ended)return;s.minute=Math.min(s.shiftEnd,s.minute+dt*s.speed/60);while(s.next<s.schedule.length&&s.schedule[s.next].at<=s.minute){const pending=s.schedule[s.next],delay=dispatchPacing(s,pending);if(delay){postponeDispatch(s,delay);continue;}if(!pending.noDispatch)s.lastDispatchAt=s.minute;const c={...s.schedule[s.next++],receivedAt:s.minute,phoneId:++s.phoneSerial,answerAt:s.minute+2+Math.random()*3};if(c.handover){Object.assign(c,{id:++s.received,status:'waiting',progress:0,engine:null});s.calls.push(c);onCall(c);continue;}s.incoming.push(c);onPhone(c);}for(const c of [...s.incoming]){if(c.answerAt>s.minute)continue;s.incoming.splice(s.incoming.indexOf(c),1);if(c.noDispatch){s.noDispatch++;s.shiftNoDispatch++;onNoDispatch(c);continue;}Object.assign(c,{id:++s.received,status:'waiting',progress:0,engine:null});s.calls.push(c);onCall(c);}if(s.minute>=s.shiftEnd)s.ended=true;}
export const fleet=[{id:'VLI 1',size:1,home:[-56,52],kind:'VLI',dedicated:true,name:'Véhicule léger infirmier · soutien au VSAV'},{id:'FPTL 1',size:4,home:[-84,57],kind:'FPT',lightPump:true,tankCapacity:2000,name:'Fourgon pompe-tonne léger · 2 000 L'},{id:'CCFM 3',size:4,home:[-84,77],kind:'CCF',name:'Camion-citerne feux de forêts · 4 000 L'},{id:'VPL 1',size:3,home:[-84,52],kind:'VPL',name:'Plongeurs · bateau de sauvetage'},{id:'FPTSR',size:6,home:[-84,62],kind:'FPT',name:'Fourgon pompe-tonne de secours routier'},{id:'CCFM 1',size:4,home:[-84,67],kind:'CCF',name:'Camion-citerne feux de forêts'},{id:'VSAV 1',size:3,home:[-56,62],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VSAV 2',size:3,home:[-56,72],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VSAV 3',size:3,home:[-56,82],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VTU',size:2,home:[-84,82],kind:'VTU',name:'Véhicule tout usage · premiers secours'},{id:'VLCG',size:1,home:[-84,87],kind:'VLCG',dedicated:true,name:'Vous · capitaine / chef de centre'},{id:'CCFS 2',size:4,home:[-84,72],kind:'CCF',tankCapacity:8000,longChassis:true,name:'CCFS · citerne 8 000 L'},{id:'EPA',size:2,home:[-84,92],kind:'EPA',name:'Échelle pivotante automatique'},{id:'VSAV 4',size:3,home:[-56,92],kind:'VSAV',name:'Secours et assistance aux victimes'}];

export function hourWeight(minute){const h=minute/60%24;return h<6?.22:h<8?.5:h<10?.8:h<18?1:h<22?.75:.35;}
export function continueShift(s){s.shiftNoDispatch=0;s.shiftStart=s.minute;s.shiftEnd=s.minute+SHIFT.duration;s.ended=false;s.paused=false;s.conditions=newShiftConditions();setDensity(s,s.density);}

export const victimCountFor=casualtyProfile;
