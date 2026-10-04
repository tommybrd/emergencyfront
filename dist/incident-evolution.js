const active=c=>c&&!['closed'].includes(c.status)&&c.siteCompletedAt==null;
const elapsed=(c,minute)=>minute-(c.receivedAt??c.at??minute);
const kind=condition=>typeof condition==='string'?condition:condition?.key||'mild';

export function linkScheduledEvents(schedule,condition,random=Math.random){
 const live=schedule.filter(c=>!c.noDispatch).sort((a,b)=>a.at-b.at),weather=kind(condition);
 if(live.length<2||weather==='mild')return schedule;
 const preferred=weather==='rain'?['AVP','OD']:weather==='hot'||weather==='wind'?['INC']:weather==='crowd'?['SUAP']:[];
 const primary=live.find((c,i)=>i<live.length-1&&preferred.includes(c.type))||live[0];
 const later=live.filter(c=>c!==primary&&c.at>primary.at),secondary=later.find(c=>preferred.includes(c.type))||later[0];
 if(!secondary)return schedule;
 const serial=Math.floor(random()*9000)+1000,episode=`${weather}-${serial}`;
 primary.episode=episode;primary.episodePart=1;
 secondary.episode=episode;secondary.episodePart=2;secondary.linkedCause=weather==='rain'?'Même épisode pluvieux':weather==='hot'?'Conséquence de la chaleur':weather==='wind'?'Propagation sous le vent':'Même affluence en ville';
 secondary.at=Math.min(secondary.at,primary.at+18+Math.floor(random()*18));
 schedule.sort((a,b)=>a.at-b.at);return schedule;
}

export function evolveIncident(c,minute,condition='mild'){
 if(!active(c)||c.firstArrival)return[];
 const age=elapsed(c,minute),warning=c.type==='INC'?7:c.type==='AVP'?9:c.type==='SUAP'?11:14,impact=warning+7,events=[];
 if(age>=warning&&!c.evolutionWarned){c.evolutionWarned=true;c.evolutionState='Situation non stabilisée';events.push({urgent:false,message:c.type==='INC'?'Feu sans moyen sur place : propagation possible.':c.type==='AVP'?'Accident non sécurisé : la circulation se dégrade.':c.type==='SUAP'?'Victime toujours sans équipe sur place.':'Situation non traitée : intervention susceptible de s’étendre.'});}
 if(age<impact||c.evolutionImpact)return events;
 c.evolutionImpact=true;
 if(c.type==='INC'){
  const weather=kind(condition),boost=weather==='wind'?.35:weather==='hot'?.26:.18;c.spread=Math.min(1.5,(c.spread||0)+boost);c.fireLoad=Math.max(c.fireLoad||1,1+c.spread);c.evolutionState=weather==='wind'?'Propagation sous le vent':'Feu étendu avant l’arrivée';
  events.push({urgent:true,message:`${c.evolutionState}. Renfort incendie à anticiper.`});
 }else if(c.type==='AVP'){
  c.trafficEscalated=true;c.evolutionState='Axe fortement perturbé';events.push({urgent:true,message:'La file s’étend : fermeture complète et déviation des civils nécessaires.'});
 }else if(c.type==='SUAP'){
  const patient=c.patients?.find(p=>!p.evacuated&&!p.deceased);if(patient){patient.health=Math.max(20,(patient.health??(patient.severe?65:95))-10);if(patient.health<=70)patient.severe=true;patient.healthState='Aggravation avant arrivée';}
  c.evolutionState='État de la victime aggravé';events.push({urgent:true,message:'Aggravation signalée par le requérant avant l’arrivée des secours.'});
 }else{
  c.duration=(c.duration||20)+8;c.evolutionState='Opération étendue';events.push({urgent:false,message:'La situation s’étend et demandera davantage de temps sur place.'});
 }
 return events;
}

export function episodeLabel(c){return c?.episode?`Épisode lié · ${c.episodePart||1}/2`:'';}
