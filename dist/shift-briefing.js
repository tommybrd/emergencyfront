const operational=s=>s.schedule.slice(s.next).filter(c=>!c.noDispatch&&c.at<s.shiftEnd);

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
 const calls=operational(state),density=state.density||calls.length,counts={SUAP:0,INC:0,AVP:0,OD:0};
 calls.forEach(c=>counts[c.type]=(counts[c.type]||0)+1);
 const activity=density<=6?{level:1,label:'Garde plutôt calme',detail:'Des périodes disponibles sont probables pour la vie du centre.'}:density<=10?{level:2,label:'Rythme normal',detail:'Une garde équilibrée, avec des départs répartis dans la journée.'}:density<=15?{level:3,label:'Garde soutenue',detail:'Gardez une réserve d’équipage et plusieurs moyens armables.'}:{level:4,label:'Forte activité attendue',detail:'La disponibilité des équipages demandera une attention régulière.'};
 const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
 const focus={SUAP:'Le secours à personne devrait donner le ton.',INC:'Le risque incendie mérite une réserve hydraulique disponible.',AVP:'Les axes routiers pourraient mobiliser les moyens de secours routier.',OD:'Les opérations diverses devraient ponctuer la garde.'}[dominant]||'Aucune dominante nette ne se dégage.';
 const phases=[['matin',8*60,13*60],['après-midi',13*60,19*60],['soirée',19*60,24*60],['nuit',0,8*60]].map(([label,a,b])=>[label,calls.filter(c=>{const m=c.at%1440;return m>=a&&m<b;}).length]).sort((a,b)=>b[1]-a[1]);
 return {...activity,atmosphere:momentAtmosphere(state.minute),focus,tempo:phases[0]?.[1]?`Le créneau ${phases[0][0]} semble être le plus animé.`:'Le tempo reste difficile à lire.',surprise:'Le tableau reste volontairement incomplet : un appel inattendu, une complication ou une indisponibilité peut changer le programme.'};
}

export function fleetBrief(engines){
 const visible=engines.filter(e=>!e.external&&!e.mutualAid&&e.kind!=='VLCG');
 const count=kinds=>visible.filter(e=>kinds.includes(e.kind)).length;
 return {total:visible.length,medical:count(['VSAV','VLI']),fire:count(['FPT','VSR','CCF']),support:count(['EPA','VTU','VPL']),unavailable:visible.filter(e=>['maintenance','refilling'].includes(e.status)).length};
}

export function shiftBriefHtml(state,engines,guardSize){
 const b=shiftBrief(state),f=fleetBrief(engines);
 return `<section class="shiftBrief"><div class="briefHeading"><div><span class="eyebrow">PRISE DE GARDE · ACTION CAPITAINE</span><h2>Brief de la journée</h2></div><button data-close aria-label="Fermer le brief">×</button></div><div class="briefMood" data-level="${b.level}"><small>AMBIANCE DU MOMENT</small><b>${b.label}</b><p>${b.atmosphere}</p></div><div class="briefSignals"><p><b>Rythme</b><span>${b.detail} ${b.tempo}</span></p><p><b>Tendance</b><span>${b.focus}</span></p><p class="briefSurprise"><b>Part d’inattendu</b><span>${b.surprise}</span></p></div><div class="briefResources"><div><small>EFFECTIF DE GARDE</small><b>${guardSize} personnels</b><label>Ajuster <input data-brief-staff type="number" min="4" max="30" value="${guardSize}"></label><button data-brief-apply>Appliquer l’effectif</button></div><div><small>MOYENS AU CIS</small><b>${f.total} engins</b><span>${f.medical} sanitaires · ${f.fire} incendie/secours routier · ${f.support} appui${f.unavailable?` · ${f.unavailable} indisponible${f.unavailable>1?'s':''}`:''}</span><button data-brief-fleet>Configurer les moyens</button></div></div><p class="briefFeedback" role="status">Les prévisions donnent une tendance, jamais le détail des interventions.</p><div class="actions"><button class="briefStart" data-brief-start>${state.minute-state.shiftStart<15?'Commencer la garde':'Reprendre la garde'}</button></div></section>`;
}
