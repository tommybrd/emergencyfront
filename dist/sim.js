import {initCrew} from './crew.js';
export const SHIFT={start:8*60,duration:1440,minCalls:5,maxCalls:20};
import {INCIDENTS,isNight,familyFor,pickIncident,casualtyProfile} from './incident-catalog.js';
export {INCIDENTS};
let rnd=Math.random;
export function createShift(){const s={shiftStart:SHIFT.start,shiftEnd:SHIFT.start+SHIFT.duration,minute:SHIFT.start,speed:60,paused:false,ended:false,schedule:[],next:0,calls:[],incoming:[],logs:[],received:0,completed:0,selected:'FPTSR',spv:false,recallAt:null,freeStaff:12,density:8,phoneSerial:0,noDispatch:0,shiftNoDispatch:0};initCrew(s);setDensity(s,8);return s;}
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
  const night=isNight(at),type=familyFor(at,rnd),template=pickIncident(type,at,rnd,recent.slice(-2));
  s.schedule.push({...template,catalogId:template.id,id:undefined,at,limitedInfo:night&&rnd()<.65});recent.push(template.id);
 }
 const falseCount=remaining?Math.max(1,Math.round(remaining*.2)):0;
 for(let i=0;i<falseCount;i++)s.schedule.push({at:s.minute+10+rnd()*Math.max(1,s.shiftEnd-s.minute-20),noDispatch:true});
 s.schedule.sort((a,b)=>a.at-b.at);
}
export function time(m){const n=Math.floor(m)%1440;return`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
// Bring one scheduled call forward without advancing journeys, care or the clock.
export function requestNextCall(s,onPhone=()=>{}){
 if(s.ended||s.minute>=s.shiftEnd||s.next>=s.schedule.length)return false;
 const planned=s.schedule[s.next++],c={...planned,at:s.minute,phoneId:++s.phoneSerial,answerAt:s.minute+2+Math.random()*3};
 s.incoming.push(c);onPhone(c);return true;
}
export function tickShift(s,dt,onCall,onPhone=()=>{},onNoDispatch=()=>{}){if(s.paused||s.ended)return;s.minute=Math.min(s.shiftEnd,s.minute+dt*s.speed/60);while(s.next<s.schedule.length&&s.schedule[s.next].at<=s.minute){const c={...s.schedule[s.next++],phoneId:++s.phoneSerial,answerAt:s.minute+2+Math.random()*3};s.incoming.push(c);onPhone(c);}for(const c of [...s.incoming]){if(c.answerAt>s.minute)continue;s.incoming.splice(s.incoming.indexOf(c),1);if(c.noDispatch){s.noDispatch++;s.shiftNoDispatch++;onNoDispatch(c);continue;}Object.assign(c,{id:++s.received,status:'waiting',progress:0,engine:null});s.calls.push(c);onCall(c);}if(s.minute>=s.shiftEnd)s.ended=true;}
export const fleet=[{id:'VLI 1',size:1,home:[-56,52],kind:'VLI',dedicated:true,name:'Véhicule léger infirmier · soutien au VSAV'},{id:'FPTL 1',size:4,home:[-84,57],kind:'FPT',lightPump:true,tankCapacity:2000,name:'Fourgon pompe-tonne léger · 2 000 L'},{id:'CCF 3',size:4,home:[-84,77],kind:'CCF',name:'Camion-citerne feux de forêts · 4 000 L'},{id:'VPL 1',size:3,home:[-84,52],kind:'VPL',name:'Plongeurs · bateau de sauvetage'},{id:'FPTSR',size:6,home:[-84,62],kind:'FPT',name:'Fourgon pompe-tonne de secours routier'},{id:'CCF 1',size:4,home:[-84,67],kind:'CCF',name:'Camion-citerne feux de forêts'},{id:'VSAV 1',size:3,home:[-56,62],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VSAV 2',size:3,home:[-56,72],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VSAV 3',size:3,home:[-56,82],kind:'VSAV',name:'Secours et assistance aux victimes'},{id:'VTU',size:2,home:[-84,82],kind:'VTU',name:'Véhicule tout usage · premiers secours'},{id:'VLCG',size:1,home:[-84,87],kind:'VLCG',dedicated:true,name:'Vous · capitaine / chef de centre'},{id:'CCF 2',size:4,home:[-84,72],kind:'CCF',tankCapacity:8000,longChassis:true,name:'CCF 8000 · citerne 8 000 L'},{id:'EPA',size:2,home:[-84,92],kind:'EPA',name:'Échelle pivotante automatique'},{id:'VSAV 4',size:3,home:[-56,92],kind:'VSAV',name:'Secours et assistance aux victimes'}];

export function hourWeight(minute){const h=minute/60%24;return h<6?.22:h<8?.5:h<10?.8:h<18?1:h<22?.75:.35;}
export function continueShift(s){s.shiftNoDispatch=0;s.shiftStart=s.minute;s.shiftEnd=s.minute+SHIFT.duration;s.ended=false;s.paused=false;setDensity(s,s.density);}

export const victimCountFor=casualtyProfile;
