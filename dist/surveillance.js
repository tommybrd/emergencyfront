// Dispositifs de surveillance : moyens prépositionnés sur une manifestation, à la demande du maire.
// Horaires, préavis et incidents : équilibrage de jeu. Planning propre à la garde, sans hasard partagé.
export const NOTICE_MINUTES=120,UNSTAFFED_LIMIT=30,HELD_THANKS=.8;
export const EVENTS=[
 {id:'surv-tournoi',name:'Tournoi au stade municipal',setting:'stadium',start:360,length:180,slot:'day',incident:'Joueur blessé pendant le tournoi'},
 {id:'surv-braderie',name:'Braderie au centre commercial',setting:'mall',start:330,length:180,slot:'day',incident:'Malaise pendant la braderie'},
 {id:'surv-plage',name:'Animation à la plage',setting:'beach',start:390,length:150,slot:'day',incident:'Malaise pendant l’animation'},
 {id:'surv-concert',name:'Concert au stade municipal',setting:'stadium',start:750,length:150,slot:'evening',incident:'Malaise dans le public du concert'},
 {id:'surv-feu',name:'Feu d’artifice sur la plage',setting:'beach',start:825,length:90,slot:'evening',incident:'Spectateur blessé au feu d’artifice'}
];
const hash=n=>{let h=2166136261;for(const ch of String(n)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
const pick=(list,seed)=>list[Math.floor(hash(seed)*list.length)];
export function planSurveillance(state){
 const seed=`${state.citySeed??0}:${state.shiftStart}:surveillance`,slots=['evening',...(hash(seed+':day')<.55?['day']:[])];
 return slots.map(slot=>{
  const event=pick(EVENTS.filter(e=>e.slot===slot),seed+slot),from=state.shiftStart+event.start,to=from+event.length,count=1+Math.floor(hash(seed+slot+':n')*2);
  return {kind:event.id,from,to,noticeAt:from-NOTICE_MINUTES,key:`${state.shiftStart}:${slot}`,incidents:Array.from({length:count},(_,i)=>from+Math.floor(event.length*(.2+.6*hash(seed+slot+':i'+i))))};
 }).sort((a,b)=>a.from-b.from);
}
export function dueSurveillance(state){
 state.surveillancePlan??=planSurveillance(state);state.surveillanceDone??=[];
 const due=[];
 for(const slot of state.surveillancePlan){
  if(state.minute<slot.noticeAt||state.minute>=slot.from||state.minute>=state.shiftEnd||state.surveillanceDone.includes(slot.key))continue;
  state.surveillanceDone.push(slot.key);
  const event=EVENTS.find(e=>e.id===slot.kind);
  due.push({type:'OD',catalogId:'surveillance',name:'Dispositif · '+event.name,setting:event.setting,requires:'VSAV',duration:event.length,prevention:true,allowComplications:false,at:state.minute,surveillance:{from:slot.from,to:slot.to,incidents:slot.incidents.slice(),incident:event.incident,held:0}});
 }
 return due;
}
const hhmm=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;
export const mayorRequest=c=>`Demande du maire : ${c.name.replace('Dispositif · ','')}, ${hhmm(c.surveillance.from)} à ${hhmm(c.surveillance.to)}. Prépositionnez un VSAV ou un VTU.`;
export const surveillanceBlocksWork=c=>!!c?.surveillance&&!c.surveillance.ended;
const incidentCall=(c,minute,name)=>({type:'SUAP',catalogId:'surveillance-incident',name,setting:c.setting,scene:'patient',requires:'VSAV',duration:22,severity:.12,casualties:'single',allowComplications:false,at:minute,fromSurveillance:c.id});
// Avance le dispositif : présence tenue, incidents sur place, fin. Renvoie messages, incidents à créer et fin éventuelle.
export function tickSurveillance(c,engines,minute,minutes){
 const s=c.surveillance,result={messages:[],incidents:[],finished:false};
 if(!s||c.status==='closed'||s.ended)return result;
 const present=engines.some(e=>e.call===c.id&&e.status==='scene');
 if(minute>=s.from&&!s.opened){s.opened=true;result.messages.push(present?{text:'Dispositif en place, début de la manifestation.'}:{urgent:true,text:'La manifestation commence sans moyens en place.'});}
 if(minute>=s.from&&minute<s.to&&present){s.held+=minutes;s.staffed=true;}
 if(!s.staffed&&minute>=s.from+UNSTAFFED_LIMIT&&!engines.some(e=>e.call===c.id)){s.ended=true;c.status='closed';c.closedAt=minute;c.postponed=true;result.messages.push({urgent:true,text:'Dispositif non tenu faute de moyens : le maire est informé.'});return result;}
 while(s.incidents.length&&s.incidents[0]<=minute){s.incidents.shift();result.incidents.push(incidentCall(c,minute,s.incident));}
 if(minute>=s.to){s.ended=true;s.share=Math.min(1,s.held/(s.to-s.from));result.finished=true;result.messages.push({text:`Fin de la manifestation, dispositif tenu ${Math.round(s.share*100)} % du temps. ${s.share>=HELD_THANKS?'Le maire remercie les équipes.':'Le maire regrette un dispositif dégarni.'}`});}
 return result;
}
export function surveillanceStatus(c,minute){
 const s=c.surveillance;if(!s)return '';
 const span=`${hhmm(s.from)} à ${hhmm(s.to)}`;
 if(minute<s.from)return `Manifestation de ${span} · à prépositionner avant le début`;
 return `Manifestation jusqu’à ${hhmm(s.to)} · tenu ${Math.round(100*s.held/Math.max(1,Math.min(minute,s.to)-s.from))} % du temps`;
}
