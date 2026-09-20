import {setNozzle,waterMinutes} from './hydraulics.js';

// Simplified game equipment: automatic dosing, not a professional operating guide.
export const FOAM={dose:.03,flow:250,coverageLitres:160,decayMinutes:180};
export const foamIncident=c=>!!c&&((c.type==='INC'&&['vehicle','motorcycle'].includes(c.scene))||(c.type==='OD'&&c.scene==='fuel'));
export function initFoam(e){e.foamCapacity=e.foamEnabled!==false&&['FPT','CCF'].includes(e.kind)?(e.kind==='FPT'?120:60):0;e.foamReserve=e.foamCapacity;e.foamOn=false;e.foamFlow=0;}
export function foamError(e,c){
 if(!e.foamCapacity)return 'Équipement à ajouter dans Composer';
 if(e.status!=='scene'||e.call!==c?.id)return 'Mousse disponible sur les lieux';
 if(!foamIncident(c))return 'Disponible pour feu de véhicule ou fuite de carburant';
 if(!c.reconComplete)return 'Reconnaissance en cours';
 if(c.status==='closed'||c.fireContained||c.progress>=1)return 'Action terminée';
 if(!(e.foamReserve>0))return 'Émulseur épuisé · retour au CIS';
 return null;
}
export function toggleFoam(e,c){
 if(e.foamOn){e.foamOn=false;e.foamFlow=0;return null;}
 const error=foamError(e,c);if(error)return error;
 setNozzle(e,'small',Math.max(1,e.nozzles.small));e.foamOn=true;return null;
}
// tickWater already accounts for all water. Only the first small nozzle receives
// foam; the LDT, other ground nozzles and EPA remain on water.
export function tickFoam(e,c,minutes,notify=()=>{}){
 e.foamFlow=0;
 if(!e.foamOn)return;
 if(foamError(e,c)||!e.nozzles.small){e.foamOn=false;return;}
 if(!e.hoses?.some(h=>h.key==='small'&&h.index===0&&h.progress>=1))return;
 const requested=e.hoses.reduce((n,h)=>n+(h.progress>=1&&h.index<e.nozzles[h.key]?{ldt:150,small:250,large:500}[h.key]:0),0);
 const waterFlow=requested?e.flow*FOAM.flow/requested:0,volume=waterMinutes(minutes)*waterFlow;
 if(!(volume>0))return;
 const used=Math.min(e.foamReserve,volume*FOAM.dose);
 e.foamFlow=waterFlow*(used/(volume*FOAM.dose));e.foamReserve=Math.max(0,e.foamReserve-used);
 c.foamCoverage=Math.min(1,(c.foamCoverage||0)+volume*(used/(volume*FOAM.dose))/FOAM.coverageLitres);
 if(e.foamReserve<=1e-8){e.foamReserve=0;e.foamOn=false;notify('Émulseur épuisé, poursuite à l’eau.');}
}
export function decayFoam(c,minutes){if(c.foamCoverage>0)c.foamCoverage=Math.max(0,c.foamCoverage-minutes/FOAM.decayMinutes);}
export const foamPower=c=>foamIncident(c)?1+.2*(c.foamCoverage||0):1;
