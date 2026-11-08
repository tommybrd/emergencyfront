// Berces en remise : le porteur (VPCE) charge au départ celle dont l'intervention a besoin.
// Volumes et durées relèvent de l'équilibrage de jeu.
import {foamIncident} from './foam.js';
export const BERCES={
 alim:{label:'Berce alimentation',short:'ALIMENTATION',detail:'Tuyaux pour une longue alimentation depuis un poteau'},
 emul:{label:'Berce émulseur',short:'ÉMULSEUR',detail:'Réserve d’émulseur pour ravitailler les engins en mousse',foam:1000}
};
export const BERCE_LOAD_MINUTES=3;
export const berceFor=c=>foamIncident(c)?'emul':'alim';
export function initBerce(e){if(e.kind!=='VPCE')return;if(!BERCES[e.berce])e.berce='alim';if(!(e.berceFoam>=0))e.berceFoam=BERCES.emul.foam;}
// Au CIS, l'équipage change de berce avant de partir : le choix du joueur prime sur la recommandation.
export function loadBerceForCall(e,c){
 initBerce(e);if(e.kind!=='VPCE'||!e.wasAtStation)return 0;
 const want=BERCES[e.berceChoice]?e.berceChoice:berceFor(c);
 if(want===e.berce)return 0;
 e.berce=want;if(want==='emul')e.berceFoam=BERCES.emul.foam;return BERCE_LOAD_MINUTES;
}
export const restockBerce=e=>{if(e.kind==='VPCE')e.berceFoam=BERCES.emul.foam;};
export function foamReceivers(carrier,engines){return engines.filter(v=>v!==carrier&&v.call===carrier.call&&v.status==='scene'&&v.foamCapacity>0&&v.foamReserve<v.foamCapacity-.5);}
// Ravitaillement direct des réserves d'émulseur des engins sur les lieux.
export function refillFoam(carrier,engines){
 if(carrier.berce!=='emul')return {error:'La berce émulseur n’est pas chargée.'};
 const targets=foamReceivers(carrier,engines);if(!targets.length)return {error:'Aucun engin à ravitailler en émulseur.'};
 if(!(carrier.berceFoam>0))return {error:'Berce émulseur vide · retour au CIS.'};
 let given=0;for(const v of targets){const n=Math.min(v.foamCapacity-v.foamReserve,carrier.berceFoam);v.foamReserve+=n;carrier.berceFoam-=n;given+=n;if(carrier.berceFoam<=0)break;}
 return {message:`Ravitaillement en émulseur : ${Math.round(given)} L transférés, ${Math.round(carrier.berceFoam)} L restants.`};
}
export function showBerce(model,berce){const cargo=model?.userData?.berceCargo;if(!cargo)return;for(const [key,group] of Object.entries(cargo))group.visible=key===(berce||'alim');}
