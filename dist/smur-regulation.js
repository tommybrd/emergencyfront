// Règles de jeu : le SMUR décide de son engagement et conserve son équipage CH.
// La notification du joueur ouvre une évaluation, jamais un départ forcé.
export const smurEligible=c=>c&&c.status!=='closed'&&c.siteCompletedAt==null&&(['SUAP','AVP'].includes(c.type)||c.victimsKnown&&c.victimCount>0);
export const reportedMedicalEmergency=c=>c.reportedMedicalEmergency??/inconscien|détresse vitale|arrêt cardio|arrêt cardiaque|noyade/i.test(c.name||'');
export function smurNeeded(c){
 if(!smurEligible(c))return false;
 if(!c.reconComplete)return reportedMedicalEmergency(c);
 return !!c.patients?.some(p=>!p.evacuated&&!p.deceased&&!p.medicalComplete&&p.severe);
}
const assessmentKey=c=>`${!!c.reconComplete}:${smurNeeded(c)}`;
export function createSmurRegulation({state,engines,dispatch,release,emit}){
 const say=(c,message)=>emit(c,'Régulation SMUR',message);
 function review(c,notified=false){
  const current=c.smurRequest,key=assessmentKey(c);
  if(current&&(['reviewing','waiting','engaged'].includes(current.phase)||current.key===key))return false;
  c.smurRequest={phase:'reviewing',at:state.minute,reviewAt:state.minute+1,key,notified};
  return true;
 }
 function notify(c){
  if(!smurEligible(c))return 'Notification SMUR indisponible pour cette intervention.';
  if(review(c,true))say(c,'Notification reçue, évaluation en cours.');
  return null;
 }
 function tick(){
  const unit=engines.find(e=>e.kind==='SAMU');if(!unit)return;
  if(unit.call!=null){
   const c=state.calls.find(c=>c.id===unit.call);
   if(!c||c.status==='closed'||c.siteCompletedAt!=null||c.reconComplete&&!smurNeeded(c)){
    if(c){c.smurRequest={...c.smurRequest,phase:'finished',key:assessmentKey(c)};say(c,unit.status==='scene'?'Prise en charge médicale terminée, retour au CH.':'Engagement annulé après actualisation du bilan, retour au CH.');}
    release(unit);
   }else if(c.smurRequest?.phase!=='engaged')c.smurRequest={...c.smurRequest,phase:'engaged',unitId:unit.id,key:assessmentKey(c)};
  }
  const requests=[];
  for(const c of state.calls){
   if(!smurEligible(c)){if(c.smurRequest&&['reviewing','waiting'].includes(c.smurRequest.phase))c.smurRequest.phase='finished';continue;}
   if(smurNeeded(c)&&!engines.some(e=>e.kind==='SAMU'&&e.call===c.id))review(c);
   const r=c.smurRequest;if(!r||!['reviewing','waiting'].includes(r.phase)||state.minute<r.reviewAt)continue;
   r.key=assessmentKey(c);
   if(!smurNeeded(c)){r.phase='declined';say(c,c.reconComplete?'Bilan reçu : pas de départ SMUR retenu.':'Pas de départ SMUR retenu à ce stade. Réévaluation au bilan sur place.');continue;}
   requests.push(c);
  }
  requests.sort((a,b)=>Number(reportedMedicalEmergency(b))-Number(reportedMedicalEmergency(a))||a.smurRequest.at-b.smurRequest.at||a.id-b.id);
  for(const c of requests){const r=c.smurRequest;
   if(unit.status==='ready'&&!unit.doctorAway&&unit.call==null){
    const error=dispatch(unit,c);
    if(!error){r.phase='engaged';r.unitId=unit.id;say(c,`${unit.id} engagé sur décision médicale.`);continue;}
   }
   if(r.phase!=='waiting'){r.phase='waiting';say(c,'Indication médicale retenue, équipe SMUR déjà occupée.');}
  }
 }
 return {notify,tick};
}
export function smurNotificationPanel(c){
 if(!smurEligible(c))return '';
 const r=c.smurRequest;
 if(r?.phase==='engaged'||r?.phase==='finished')return '';
 const text={reviewing:'SMUR · évaluation en cours',waiting:'SMUR · équipe occupée',declined:'SMUR · pas de départ retenu'}[r?.phase];
 if(text)return `<p class="smurDecision" role="status">${text}</p>`;
 return '<button class="notifySmur" data-notify-smur title="Transmettre l’intervention à la régulation médicale">Notifier SMUR</button>';
}
