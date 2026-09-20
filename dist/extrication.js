// Gameplay timing and occurrence, not operational rescue instructions.
export function initExtrication(c,random=Math.random){
 if(c.type!=='AVP'||!['collision','single-car','pileup'].includes(c.scene)||!c.patients?.length)return;
 if(c.extricationChance===0)return;
 if(random()>=(c.extricationChance??.2))return;
 const patient=c.patients.find(p=>p.severe)||c.patients[0];patient.trapped=true;
 c.extrication={patient:c.patients.indexOf(patient),progress:0,approach:0,packing:0,unitId:null,done:false};
}
export const rescueTruck=e=>e.kind==='VSR'||e.kind==='FPT'&&!e.lightPump;
export function extricationStatus(c){const r=c?.extrication;if(!r||!c.reconComplete)return '';return r.done?'Victime dégagée · relais VSAV':!r.unitId?'Victime coincée · VSR ou FPTSR nécessaire':r.approach<1?'Préparation des outils':r.progress<1?'Désincarcération · '+Math.round(r.progress*100)+' %':'Victime dégagée · rangement des outils';}
export function tickExtrications(calls,engines,minutes,emit){
 for(const e of engines)e.extricationTask=null;
 for(const c of calls){const r=c.extrication;if(!r||r.done||!c.reconComplete||c.status==='closed')continue;
  const candidates=engines.filter(e=>e.call===c.id&&e.status==='scene'&&rescueTruck(e)&&(e.crew||0)-(e.perimeterCrew||0)>=2),unit=candidates.find(e=>e.id===r.unitId)||candidates[0];
  if(!unit){r.unitId=null;r.approach=0;if(!r.requested){r.requested=true;emit(c,'Centre','Victime coincée. Renfort VSR ou FPTSR demandé.',true);}continue;}
  if(r.unitId!==unit.id){r.unitId=unit.id;r.approach=0;emit(c,unit.id,'Désincarcération engagée.',false);}
  unit.extricationTask=c.id;
  if(r.approach<1){r.approach=Math.min(1,r.approach+minutes/6);continue;}
  if(r.progress<1){r.progress=Math.min(1,r.progress+minutes/24);if(r.progress>=1){c.patients[r.patient].trapped=false;emit(c,unit.id,'Victime dégagée. Relais VSAV.',false);}continue;}
  r.packing=Math.min(1,r.packing+minutes/6);if(r.packing>=1){r.done=true;unit.extricationTask=null;}
 }
}
