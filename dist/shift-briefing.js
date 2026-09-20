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
 return {...load,condition:condition.label,conditionDetail:condition.detail,risk:condition.risk,atmosphere:momentAtmosphere(state.minute),surprise:'Ces conditions orientent la garde sans la raconter : des appels inattendus, complications et indisponibilités restent possibles.'};
}

export function fleetBrief(engines){
 const visible=engines.filter(e=>!e.external&&!e.mutualAid&&e.kind!=='VLCG');
 const count=kinds=>visible.filter(e=>kinds.includes(e.kind)).length;
 return {total:visible.length,medical:count(['VSAV','VLI']),fire:count(['FPT','VSR','CCF']),support:count(['EPA','VTU','VPL']),unavailable:visible.filter(e=>['maintenance','refilling'].includes(e.status)).length};
}

export function shiftBriefHtml(state,engines,guardSize){
 const b=shiftBrief(state),f=fleetBrief(engines);
 return `<section class="shiftBrief"><div class="briefHeading"><div><span class="eyebrow">PRISE DE GARDE · ACTION CAPITAINE</span><h2>Brief de la journée</h2></div><button data-close aria-label="Fermer le brief">×</button></div><div class="briefMood" data-level="${b.level}"><small>CONDITIONS DU JOUR</small><b>${b.condition}</b><p>${b.conditionDetail} ${b.risk}</p></div><div class="briefSignals"><p><b>Ambiance actuelle</b><span>${b.atmosphere}</span></p><p><b>Densité annoncée</b><span>${b.label}. ${b.detail}</span></p><p class="briefSurprise"><b>Part d’inattendu</b><span>${b.surprise}</span></p></div><div class="briefResources"><div><small>EFFECTIF DE GARDE</small><b><span data-brief-total>${guardSize}</span> personnels</b><span>Capitaine et infirmier inclus · <span data-brief-operational>${Math.max(2,guardSize-2)}</span> équipiers armables</span><div class="briefStepper" aria-label="Ajuster l’effectif"><button data-brief-minus aria-label="Retirer un personnel">−</button><output data-brief-count>${guardSize}</output><button data-brief-plus aria-label="Ajouter un personnel">+</button></div></div><div><small>MOYENS AU CIS</small><b>${f.total} engins</b><span>${f.medical} sanitaires · ${f.fire} incendie/secours routier · ${f.support} appui${f.unavailable?` · ${f.unavailable} indisponible${f.unavailable>1?'s':''}`:''}</span><button data-brief-fleet>Ajouter, retirer ou remplacer un moyen</button></div></div><p class="briefFeedback" role="status">Les conditions influencent les risques, sans révéler les interventions.</p><div class="actions"><button class="briefStart" data-brief-start>${state.minute-state.shiftStart<15?'Commencer la garde':'Reprendre la garde'}</button></div></section>`;
}
