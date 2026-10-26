// Règles de jeu : les équipes SMUR décident de leur engagement et conservent leur équipage CH.
// La notification du joueur ouvre une évaluation, jamais un départ forcé.
export const smurEligible=c=>c&&c.status!=='closed'&&c.siteCompletedAt==null&&(['SUAP','AVP'].includes(c.type)||c.victimsKnown&&c.victimCount>0);
export const reportedMedicalEmergency=c=>c.reportedMedicalEmergency??/inconscien|détresse vitale|arrêt cardio|arrêt cardiaque|noyade/i.test(c.name||'');
export function smurDemand(c){
 if(!smurEligible(c))return 0;
 if(!c.reconComplete)return reportedMedicalEmergency(c)?1:0;
 return c.patients?.filter(p=>!p.evacuated&&!p.deceased&&!p.medicalComplete&&p.severe).length||0;
}
export const smurNeeded=c=>smurDemand(c)>0;
const assessmentKey=c=>`${!!c.reconComplete}:${smurDemand(c)}`;
export function createSmurRegulation({state,engines,dispatch,release,emit}){
 const say=(c,message)=>emit(c,'Régulation SMUR',message),teams=()=>engines.filter(e=>e.kind==='SAMU');
 const assigned=c=>teams().filter(e=>e.call===c.id&&!['transport','hospital'].includes(e.status));
 function review(c,notified=false){
  const current=c.smurRequest,key=assessmentKey(c);
  if(current&&(['reviewing','waiting','engaged'].includes(current.phase)||current.key===key))return false;
  c.smurRequest={phase:'reviewing',at:state.minute,reviewAt:state.minute+1,key,notified};return true;
 }
 function notify(c){
  if(!smurEligible(c))return 'Notification SMUR indisponible pour cette intervention.';
  if(review(c,true))say(c,'Notification reçue, évaluation en cours.');return null;
 }
 function tick(){
  if(!teams().length)return;
  for(const unit of teams()){
   // Une équipe qui transporte reste indisponible jusqu'à la remise au CH.
   if(unit.call==null||['transport','hospital'].includes(unit.status))continue;
   const c=state.calls.find(c=>c.id===unit.call);
   const loading=unit.medicalTransport&&c?.patients?.some(p=>p.assignedTo===unit.id&&!p.evacuated&&!p.deceased);
   if(!c||c.status==='closed'||c.siteCompletedAt!=null||c.reconComplete&&!smurNeeded(c)&&!loading){
    if(c){
     for(const p of c.patients||[])if(p.medicalUnit===unit.id&&!p.medicalComplete)p.medicalUnit=null;
     c.smurRequest={...c.smurRequest,phase:'finished',key:assessmentKey(c)};
     say(c,unit.status==='scene'?'Prise en charge médicale terminée, retour au CH.':'Engagement annulé après actualisation du bilan, retour au CH.');
    }
    release(unit);
   }
  }
  const requests=[];
  for(const c of state.calls){
   if(!smurEligible(c)){if(c.smurRequest&&['reviewing','waiting'].includes(c.smurRequest.phase))c.smurRequest.phase='finished';continue;}
   const active=assigned(c),needed=smurDemand(c);
   // Une ambulance occupée au chargement de sa victime ne compte pas pour un renfort.
   const caring=active.filter(e=>!e.medicalTransport||!c.patients?.some(p=>p.assignedTo===e.id&&p.medicalComplete&&!p.evacuated&&!p.deceased));
   if(needed>caring.length){
    if(active.length){c.smurRequest={...c.smurRequest,phase:'engaged',key:assessmentKey(c),at:c.smurRequest?.at??state.minute,reviewAt:c.smurRequest?.reviewAt??state.minute+1};}
    else review(c);
   }
   const r=c.smurRequest;if(!r)continue;
   r.unitIds=teams().filter(e=>e.call===c.id).map(e=>e.id);r.unitId=r.unitIds[0]??r.unitId;
   if(active.length&&needed<=caring.length){r.phase='engaged';r.waitingReinforcement=false;continue;}
   if(!['reviewing','waiting','engaged'].includes(r.phase)||state.minute<r.reviewAt)continue;
   r.key=assessmentKey(c);
   if(!needed){if(!active.length){r.phase='declined';say(c,c.reconComplete?'Bilan reçu : pas de départ SMUR retenu.':'Pas de départ SMUR retenu à ce stade. Réévaluation au bilan sur place.');}continue;}
   if(needed>caring.length)requests.push({c,missing:needed-caring.length});
  }
  requests.sort((a,b)=>Number(reportedMedicalEmergency(b.c))-Number(reportedMedicalEmergency(a.c))||a.c.smurRequest.at-b.c.smurRequest.at||a.c.id-b.c.id);
  for(const {c,missing} of requests){
   const r=c.smurRequest;let remaining=missing;
   for(const unit of teams().filter(e=>e.status==='ready'&&!e.doctorAway&&e.call==null)){
    if(!remaining)break;
    if(!dispatch(unit,c)){remaining--;r.phase='engaged';r.unitIds=[...new Set([...(r.unitIds||[]),unit.id])];r.unitId=r.unitIds[0];say(c,`${unit.id} engagé sur décision médicale${r.unitIds.length>1?' · renfort médical':''}.`);}
   }
   if(remaining){
    if(!r.waitingReinforcement&&r.phase!=='waiting')say(c,r.unitIds?.length?'Renfort médical demandé, équipes SMUR déjà occupées.':'Indication médicale retenue, équipe SMUR déjà occupée.');
    r.waitingReinforcement=true;if(!r.unitIds?.length)r.phase='waiting';
   }else r.waitingReinforcement=false;
  }
 }
 return {notify,tick};
}
export function smurNotificationPanel(c){
 if(!smurEligible(c))return '';
 const r=c.smurRequest;
 if(r?.phase==='engaged'||r?.phase==='finished')return '';
 const text={reviewing:'SMUR · évaluation en cours',waiting:'SMUR · équipes occupées',declined:'SMUR · pas de départ retenu'}[r?.phase];
 if(text)return `<p class="smurDecision" role="status">${text}</p>`;
 return '<button class="notifySmur" data-notify-smur title="Transmettre l’intervention à la régulation médicale">Notifier SMUR</button>';
}
