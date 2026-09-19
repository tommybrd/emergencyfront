import {aerialBusy} from './aerial-operations.js';
import {buildingActionsBusy} from './building-actions.js';
import {playerLabel} from './player-profile.js';
// Occasional, contextual gameplay events. Values are game balancing, not doctrine.
const eligible=new Set(['Feu de cuisine','Feu dans un commerce','Feu d’appartement']);
export function initComplication(c,random=Math.random){
 c.complication=null;c.complicationPlan=null;
 if(c.allowComplications===false||c.type!=='INC'||!eligible.has(c.name))return;
 if(random()<.35)c.complicationPlan={delay:6+Math.floor(random()*7)};
}
const onsite=(c,engines)=>engines.filter(e=>e.call===c.id&&e.status==='scene');
const fireUnit=e=>['FPT','CCF'].includes(e.kind);
export function rescueOptions(c,engines){const units=onsite(c,engines),pump=units.find(fireUnit),epa=units.find(e=>e.kind==='EPA');return[
 {id:'interior',label:'Sauvetage intérieur',hint:'≈ 20 min de garde · attaque du feu ralentie',unit:pump},
 {id:'aerial',label:'Sauvetage par EPA',hint:epa?'≈ 10 min de garde · attaque maintenue':'EPA nécessaire sur place',unit:epa},
 {id:'protect',label:'Sécuriser l’accès',hint:'Attaquer le feu, puis évacuer · risque d’attente',unit:pump}
];}
export function chooseRescue(c,choice,engines,minute,emit){
 const event=c?.complication;if(!event||event.status==='resolved')return 'Aucune décision de sauvetage en attente.';
 const option=rescueOptions(c,engines).find(o=>o.id===choice);if(!option?.unit)return 'Le moyen nécessaire doit être sur place.';
 if(choice==='aerial'&&aerialBusy(option.unit))return 'Repliez la lance sur nacelle avant le sauvetage par EPA.';
 if(event.choice===choice&&event.unitId===option.unit.id){if(choice==='aerial')option.unit.ladderDeployed=true;return null;}
 event.choice=choice;event.unitId=option.unit.id;event.status='active';event.resumeAt=minute+2;event.waiting='Mise en place de l’équipe';
 if(choice==='aerial')option.unit.ladderDeployed=true;
 if(c.radioAlert?.kind==='decision')c.radioAlert=null;
 emit(playerLabel(engines.find(e=>e.kind==='VLCG')?.playerProfile),`${option.label} confié au ${option.unit.id}.`,false);
 return null;
}
export function tickComplication(c,engines,minutes,minute,emit,mayStart=true){
 if(c.status==='closed'||!c.reconComplete)return;
 const units=onsite(c,engines),plan=c.complicationPlan;
 if(plan&&!c.complication){
  plan.at??=minute+plan.delay;
  if(c.progress>=.75){c.complicationPlan=null;return;}
  if(minute<plan.at||!units.some(fireUnit)||!mayStart)return;
  const patient={severe:false,evacuated:false,assignedTo:null,trapped:true,fromComplication:true};
  c.patients??=[];c.patients.push(patient);c.victimCount=c.patients.length;c.evacuated??=0;c.victimsKnown=true;
  c.complication={status:'decision',choice:null,unitId:null,progress:0,exposure:0,at:minute,waiting:'Votre ordre est attendu'};
  c.complicationPlan=null;c.finishBudget+=55;c.reinforcementReported=true;
  emit('Chef d’agrès','Une personne est bloquée à l’étage. Accès intérieur encore praticable : ordre de sauvetage demandé. Prévoir un VSAV.',true);
 }
 const event=c.complication;if(!event||event.status==='resolved')return;
 const patient=c.patients.find(p=>p.fromComplication&&!p.evacuated);if(!patient)return;
 event.exposure+=minutes*Math.max(.15,1-(c.progress||0));
 if(event.exposure>=35&&!patient.severe){patient.severe=true;emit('Chef d’agrès','L’attente dans les fumées aggrave l’état de la victime. Sauvetage prioritaire.',false);}
 if(!event.choice)return;
 const unit=units.find(e=>e.id===event.unitId);
 if(!unit){event.waiting='Moyen retiré · choisissez une autre équipe';return;}
 if(minute<event.resumeAt){event.waiting='Mise en place de l’équipe';return;}
 if(event.choice==='aerial'&&!unit.ladderDeployed){event.waiting='Échelle repliée · redéployez-la ou changez d’ordre';return;}
 if(event.choice==='protect'&&c.progress<.6){event.waiting='Protection de l’accès · poursuivre l’extinction';return;}
 event.waiting='Sauvetage en cours';event.progress=Math.min(1,event.progress+minutes/(event.choice==='aerial'?10:event.choice==='protect'?14:20));
 if(event.progress>=1-1e-9){event.progress=1;patient.trapped=false;event.status='resolved';event.resolvedAt=minute;event.waiting=null;emit(unit.id,'Personne mise en sécurité. Prise en charge et transport par VSAV nécessaires.',false);}
}
export function rescueFireFactor(c,e){const event=c.complication;if(!event||event.status!=='active'||event.unitId!==e.id)return 1;return event.choice==='interior'?.5:event.choice==='protect'&&c.progress>=.6?.7:1;}
export function fireMissionComplete(c){return c.progress>=1&&!buildingActionsBusy(c)&&(!c.complication||c.complication.status==='resolved')&&!(c.patients||[]).some(p=>!p.evacuated);}
export function complicationPanel(c,engines){const event=c.complication;if(!event)return '';if(event.status==='resolved')return '<p class="eventResolved">✓ Personne mise en sécurité · '+((c.patients||[]).some(p=>!p.evacuated)?'prise en charge VSAV à terminer':'victime évacuée')+'</p>';
 return `<section class="eventDecision" aria-label="Décision de sauvetage"><b>⚠ Personne bloquée à l’étage</b><p>${event.waiting}${event.unitId?' · '+event.unitId:''}${event.progress?' · '+Math.round(event.progress*100)+' %':''}</p><div class="eventChoices">${rescueOptions(c,engines).map(o=>`<button data-rescue="${o.id}" ${!o.unit?'disabled':''} aria-pressed="${event.choice===o.id}" title="${o.hint}">${o.label}<small>${o.hint}</small></button>`).join('')}</div><small>Le sauvetage se déroule automatiquement après votre ordre. Engagez les renforts dans les moyens ci-dessous.</small></section>`;
}
