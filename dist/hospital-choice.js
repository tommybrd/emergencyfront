// Orientation des victimes : le CH de Valmont, ou le CHU régional (traumatologie, pédiatrie) hors de la ville.
// Proportion d'enfants, trajet et délais relèvent de l'équilibrage de jeu.
export const HOSPITALS={ch:{label:'CH de Valmont',short:'CH'},chu:{label:'CHU régional',short:'CHU',detail:'traumatologie et pédiatrie spécialisées'}};
// Sortie de ville par la rocade Nord : l'aller-retour hors carte s'ajoute à la remise.
export const CHU_EXIT=[0,-220],CHU_TRIP_MINUTES=24;
const hash=n=>{let h=2166136261;for(const ch of String(n)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
// Déterministe, sans consommer le hasard partagé des appels.
export const isChild=(c,i)=>c?.type==='SUAP'&&hash(`${c.seed??c.id}:child:${i}`)<.12;
export function patientNeed(c,p){
 if(!p?.severe)return null;const i=(c?.patients||[]).indexOf(p);
 if(isChild(c,i))return 'pediatrie';
 if(c?.type==='AVP'||c?.trauma||/chute|défenestr|tombé/i.test(c?.name||''))return 'trauma';
 return null;
}
export const needLabel=need=>need==='pediatrie'?'enfant grave · pédiatrie':'polytraumatisé · traumatologie';
export const advisedDestination=(c,patients)=>patients.some(p=>patientNeed(c,p))?'chu':'ch';
// Choix du joueur pour l'intervention, sinon l'avis de la régulation.
export const destinationFor=(c,patients)=>advisedDestination(c,patients)==='chu'?(c?.orientation||'chu'):'ch';
export function orientationPanel(c){
 const graves=(c?.patients||[]).filter(p=>patientNeed(c,p)&&!p.evacuated&&!p.deceased);if(!graves.length)return '';
 const need=patientNeed(c,graves[0]),current=c.orientation||'chu',pick=key=>`<button data-orientation="${key}" aria-pressed="${current===key}">${HOSPITALS[key].label}${key==='chu'?' · conseillé':''}</button>`;
 return `<div class="policePanel"><div class="meansLabel">ORIENTATION · ${needLabel(need)}</div><p class="securityStatus">Le CHU prend mieux en charge cette victime, mais le VSAV quitte la ville environ ${CHU_TRIP_MINUTES} min de plus.</p><div class="policeButtons">${pick('chu')}${pick('ch')}</div></div>`;
}
