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
const healthIcon='<svg class="patientHealthIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M4 12h4l2-4 3 8 2-4h5"/></svg>';
export function patientHealthPanel(c,{compact=false}={}){
 if(!c.victimCount)return '';
 const tag=compact?'div':'section',classes='patientHealth'+(compact?' patientHealthCompact':''),heading=`<b class="patientHealthHeading">${healthIcon} Santé des victimes</b>`;
 if(!c.victimsKnown||!c.patients?.length)return `<${tag} class="${classes}">${heading}<p class="patientHealthUnknown">${compact?'Bilan à confirmer':'Bilan à confirmer à la reconnaissance.'}</p></${tag}>`;
 const rows=c.patients.map((p,i)=>{
  const dead=!!p.deceased,hp=dead?0:Math.max(0,Math.min(100,Math.round(p.health??initialHealth(p)))),condition=dead?'deceased':hp<=25?'critical':p.severe?'serious':'stable';
  const label=dead?'DCD':p.deliveredAt!=null?'Remise au CH':p.evacuated?(p.releasedOnSite?'Maintien sur place':'Transport CH'):hp<=25?'Critique':p.severe?'Grave':'Stable';
  return `<div class="patientHealthRow ${condition}"><span class="patientHealthLabel">Victime ${i+1} · <strong>${label}</strong></span><span class="patientHealthValue">${dead?'Décédée':hp+' / 100'}</span><meter low="25" high="60" optimum="100" min="0" max="100" value="${hp}" aria-label="Santé de la victime ${i+1} : ${dead?'décédée':hp+' sur 100'}">${hp}</meter>${!compact&&!dead&&!p.evacuated?`<small>${p.healthState||'Bilan en cours'}${p.trapped?' · accès à la victime bloqué':''}</small>`:''}</div>`;
 }).join('');
 return `<${tag} class="${classes}">${heading}${rows}${compact?'':'<small>Indicateur de jeu · les soins stabilisent l’état.</small>'}</${tag}>`;
}
