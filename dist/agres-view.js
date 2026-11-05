// Poste de chef d'agrès : où se trouve le personnage et ce qu'il peut faire à chaque étape de sa mission.
import {boardingPosition} from './crew.js';
import {escapeHtml} from './player-profile.js';
import {fireCapable} from './operations.js';
import {nozzleCount,nozzleLimit} from './hydraulics.js';
import {ANY_ENGINE} from './player-role.js';

const MUSTER=[-73,82],RECON_WALK=14;
export function agresPhase(e,c){
 if(!e)return 'attente';
 if(e.status==='departing')return 'montee';
 if(e.status==='enroute'||e.status==='positioning')return 'route';
 if(e.status==='scene'&&c)return 'scene';
 if(['transport','hospital','returning'].includes(e.status))return 'retour';
 return 'attente';
}
const PHASE_LABELS={attente:'En attente de déclenchement',montee:'Je monte dans l’engin',route:'En route',scene:'Sur les lieux',retour:'Retour'};
export function agresPose(e,c,minute){
 const phase=agresPhase(e,c);
 if(!e)return {visible:true,point:MUSTER};
 const p=e.model.position;
 if(phase==='montee'){
  const b=e.boarding?.[0];if(!b?.path?.length)return {visible:false};
  const fraction=(minute-e.alertAt-b.delay)/((b.duration-b.delay)||1);
  return fraction>=1?{visible:false}:{visible:true,point:boardingPosition(b,Math.max(0,fraction)).point};
 }
 if(phase==='scene'){
  const dx=c.target[0]-p.x,dz=c.target[1]-p.z,distance=Math.hypot(dx,dz)||1,walk=Math.min(distance-1,RECON_WALK)*Math.max(0,Math.min(1,c.reconComplete?1:c.reconProgress||0));
  return {visible:true,point:[p.x+2.4+dx/distance*Math.max(0,walk),p.z+dz/distance*Math.max(0,walk)]};
 }
 if(phase==='attente')return {visible:true,point:[p.x+3,p.z+3]};
 return {visible:false};
}
const step=(done,label,body='')=>`<li class="${done?'done':''}"><b>${done?'✓':'○'} ${label}</b>${body}</li>`;
export function agresPanel(s,e,c,engines){
 const phase=agresPhase(e,c),name=e?.id||(s.agresChoice===ANY_ENGINE?'Prochain engin déclenché':s.agresChoice);
 const head=`<small>Chef d’agrès · ${escapeHtml(name)}</small><h2>${PHASE_LABELS[phase]}</h2>${c?`<p>${escapeHtml(c.address||'')}</p>`:''}`;
 if(phase!=='scene')return head;
 const fire=e.capacity&&fireCapable(e,c)&&!c.fireContained&&c.reconComplete,started=c.reconLaunched||c.reconComplete||c.reconProgress>0;
 const lances=fire?`<div class="agresActions"><button data-agres="lance-" ${nozzleCount(e)?'':'disabled'} aria-label="Retirer un binôme">−</button><span>${nozzleCount(e)} / ${nozzleLimit(e)}</span><button data-agres="lance+" ${nozzleCount(e)<nozzleLimit(e)?'':'disabled'} aria-label="Engager un binôme">+</button><button data-agres="hydrant">${e.hydrant?'Replier l’alimentation':'Alimenter sur poteau'}</button></div>`:`<small>${c.reconComplete?(c.victimCount?'L’équipage prend les victimes en charge.':'Aucune lance nécessaire.'):'Après la reconnaissance.'}</small>`;
 return head+`<ol class="agresSteps">${step(c.reconComplete,'Reconnaissance',started?(c.reconComplete?'':`<small>${Math.round((c.reconProgress||0)*100)} %</small>`):'<div class="agresActions"><button data-agres="recon">Partir en reconnaissance</button></div>')}${step(c.bilanSent,'Bilan à la salle',c.reconComplete&&!c.bilanSent?'<div class="agresActions"><button data-agres="bilan">Transmettre le bilan</button></div>':'')}${step(nozzleCount(e)>0||!fire&&c.reconComplete,'Binômes',lances)}${step(!!e.tacticalPlacement,'Placement','<div class="agresActions"><button data-agres="placement">Choisir le placement</button></div>')}</ol>`;
}
