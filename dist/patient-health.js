// Gameplay state and timing only; the gauge is not a medical measurement.
export const initialHealth=p=>p.severe?65:95;
export const resolvedVictims=c=>(c.patients||[]).filter(p=>p.evacuated||p.deceased).length;
export function tickPatientHealth(c,engines,minutes,minute,emit=()=>{}){
 if(c.status==='closed'||!c.patients?.length||minutes<=0)return;
 const onsite=engines.filter(e=>e.call===c.id&&e.status==='scene'&&e.crew>0);
 const teams=onsite.filter(e=>e.kind==='VSAV'||e.kind==='VLI'||e.kind==='SAMU'||e.support);
 const available=new Set(teams);const patients=[...c.patients].sort((a,b)=>Number(!!b.assignedTo)-Number(!!a.assignedTo)||Number(b.severe)-Number(a.severe));
 for(const p of patients){
  p.health??=initialHealth(p);
  if(p.deceased){if(c.victimsKnown&&!p.deathReported){p.deathReported=true;emit(p,'Décès de la victime '+(c.patients.indexOf(p)+1)+'.');}continue;}
  if(p.evacuated||p.deliveredAt!=null){p.healthState='Prise en charge';continue;}
  const unit=!p.trapped&&!c.accessClosed&&c.reconComplete&&[...available].find(e=>e.id===p.assignedTo)||(!p.trapped&&!c.accessClosed&&c.reconComplete&&[...available][0]);
  if(unit){available.delete(unit);p.healthState='Stabilisée · soins en cours';continue;}
  p.healthState='Sans soins';
  // Stable minor complaints do not become fatal just because an ambulance is delayed.
  const exposed=p.trapped&&(c.type==='INC'||c.waterRescue),rate=p.severe?.55:exposed?.45:.04;
  p.health=Math.max(p.severe||exposed?0:55,p.health-minutes*rate);
  if(p.health<=25)p.severe=true;
  if(p.health<=25&&!p.healthAlerted&&c.victimsKnown){p.healthAlerted=true;emit(p,'Victime '+(c.patients.indexOf(p)+1)+' en état critique. Prise en charge urgente.');}
  if(p.health<=0){p.deceased=true;p.deathAt=minute;p.healthState='DCD';p.assignedTo=null;p.trapped=false;c.deceasedCount=(c.patients||[]).filter(p=>p.deceased).length;
   if(c.victimsKnown){p.deathReported=true;emit(p,'Décès de la victime '+(c.patients.indexOf(p)+1)+'.');}
  }
 }
}
export function patientHealthPanel(c){
 if(!c.victimCount)return '';
 if(!c.victimsKnown)return '<section class="patientHealth"><b>État des victimes</b><p>Bilan à confirmer à la reconnaissance.</p></section>';
 return `<section class="patientHealth"><b>État des victimes</b>${(c.patients||[]).map((p,i)=>{const hp=Math.max(0,Math.min(100,Math.round(p.health??initialHealth(p)))),dead=!!p.deceased,label=dead?'DCD':p.deliveredAt!=null?'Remise au CH':p.evacuated?(p.releasedOnSite?'Maintien sur place':'Transport CH'):hp<=25?'Critique':p.severe?'Grave':'Stable';return `<div class="patientHealthRow ${dead?'deceased':hp<=25?'critical':''}"><span>Victime ${i+1} · <strong>${label}</strong></span><span>${dead?'Décédée':hp+' / 100'}</span><meter low="25" high="60" optimum="100" min="0" max="100" value="${hp}" aria-label="État de la victime ${i+1}">${hp}</meter>${!dead&&!p.evacuated?`<small>${p.healthState||'Bilan en cours'}${p.trapped?' · accès à la victime bloqué':''}</small>`:''}</div>`;}).join('')}<small>Indicateur de jeu · les soins stabilisent l’état.</small></section>`;
}
