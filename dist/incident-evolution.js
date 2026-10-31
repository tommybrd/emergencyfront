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
 if(['Situation non stabilisée','Opération étendue'].includes(c?.evolutionState))c.evolutionState=null;
 if(!active(c)||c.firstArrival)return[];
 const age=elapsed(c,minute),impact=c.type==='INC'?14:c.type==='AVP'?16:c.type==='SUAP'?18:21,events=[];
 if(age<impact||c.evolutionImpact)return events;
 c.evolutionImpact=true;
 if(c.type==='INC'){
  const weather=kind(condition),boost=weather==='wind'?.35:weather==='hot'?.26:.18;c.spread=Math.min(1.5,(c.spread||0)+boost);c.fireLoad=Math.max(c.fireLoad||1,1+c.spread);
  // Pénalité silencieuse : le feu grossit, sans alerte ni badge (choix du joueur).
  c.spreadBeforeArrival=weather==='wind'?'wind':'spread';c.evolutionState=null;
 }else if(c.type==='AVP'){
  c.trafficEscalated=true;c.evolutionState='Axe fortement perturbé';events.push({urgent:true,message:'La file s’étend : fermeture complète et déviation des civils nécessaires.'});
 }else if(c.type==='SUAP'){
  const patient=c.patients?.find(p=>!p.evacuated&&!p.deceased);if(patient){patient.health=Math.max(20,(patient.health??(patient.severe?65:95))-10);if(patient.health<=70)patient.severe=true;patient.healthState='Aggravation avant arrivée';}
  c.evolutionState='État de la victime aggravé';events.push({urgent:true,message:'Aggravation signalée par le requérant avant l’arrivée des secours.'});
 }else{
  // Pénalité silencieuse : l'opération dure plus longtemps sur place, sans alerte ni badge (choix du joueur).
  c.duration=(c.duration||20)+8;c.evolutionState=null;
 }
 return events;
}
