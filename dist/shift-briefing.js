import {weatherEffects} from './operational-environment.js';

export function momentAtmosphere(minute){
 const h=Math.floor(minute/60)%24;
 if(h<7)return 'Valmont dort encore. Les rues sont calmes, avec une vigilance renforcée sur les trajets nocturnes.';
 if(h<10)return 'La ville s’éveille. Les déplacements augmentent autour du centre, des écoles et des axes principaux.';
 if(h<14)return 'La matinée est bien installée. Commerces, équipements publics et circulation donnent du mouvement au secteur.';
 if(h<18)return 'L’après-midi anime les quartiers, le stade et les zones de promenade.';
 if(h<22)return 'La fin de journée charge les grands axes tandis que les lieux publics restent fréquentés.';
 return 'La ville ralentit. Les rues se vident, mais les départs de nuit peuvent demander davantage de reconnaissance.';
}

export function shiftBrief(state){
 const density=state.density||8,load=density<=6?{level:1,label:'Sollicitation faible',detail:'La pression opérationnelle annoncée est faible.'}:density<=10?{level:2,label:'Sollicitation habituelle',detail:'Le niveau de sollicitation annoncé reste habituel.'}:density<=15?{level:3,label:'Forte sollicitation',detail:'Le centre pourrait être beaucoup sollicité aujourd’hui.'}:{level:4,label:'Très forte sollicitation',detail:'Une journée dense est annoncée : conservez des équipages et des moyens en réserve.'},condition=state.conditions||{label:'Conditions ordinaires',detail:'Activité habituelle dans les quartiers.',risk:'Aucun risque particulier annoncé à la prise de garde.'};
 return {...load,condition:condition.label,conditionDetail:condition.detail,risk:condition.risk,operationalEffect:weatherEffects(condition).label,atmosphere:momentAtmosphere(state.minute),surprise:'Ces conditions orientent la garde sans la raconter : des appels inattendus, complications et indisponibilités restent possibles.'};
}

export function fleetBrief(engines){
 const visible=engines.filter(e=>!e.external&&!e.mutualAid&&e.kind!=='VLCG');
 const count=kinds=>visible.filter(e=>kinds.includes(e.kind)).length;
 return {total:visible.length,medical:count(['VSAV','VLI']),fire:count(['FPT','VSR','CCF']),support:count(['EPA','VTU','VPL']),unavailable:visible.filter(e=>['maintenance','refilling'].includes(e.status)).length};
}

// Une icône de niveau et un seul libellé, sans répéter les conditions.
export function shiftBriefHtml(state){
 const b=shiftBrief(state),bars=[6,10,14,18].map((height,i)=>`<rect x="${2+i*6}" y="${22-height}" width="4" height="${height}" rx="1" opacity="${i<b.level?1:.2}"/>`).join('');
 return `<section class="shiftBrief" aria-label="Tendance du jour"><div class="briefHeading"><div class="briefMood" data-level="${b.level}"><svg class="briefTrendIcon" viewBox="0 0 26 26" aria-hidden="true">${bars}</svg><b>${b.label}</b></div><button data-close aria-label="Fermer le brief">×</button></div><div class="actions"><button class="briefStart" data-brief-start>${state.minute-state.shiftStart<15?'Commencer la garde':'Reprendre la garde'}</button></div></section>`;
}
