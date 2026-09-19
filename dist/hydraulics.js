// Water logistics runs six times slower than the guard clock for playable tank autonomy.
export const waterMinutes=guardMinutes=>guardMinutes/6;
// Débits nominaux retenus pour la simulation, en litres par minute.
export const NOZZLES={ldt:{label:'LDT',flow:150,max:1},small:{label:'Petite lance',flow:250,max:2},large:{label:'Grosse lance',flow:500,max:2}};
export const TANKS={FPT:3000,CCF:4000};
export function initWater(e){e.capacity=e.tankCapacity??TANKS[e.kind]??0;e.water=e.capacity;e.nozzles={ldt:0,small:0,large:0};e.hydrant=null;e.flow=0;e.hoses=Object.entries(NOZZLES).flatMap(([key,n])=>Array.from({length:n.max},(_,index)=>({key,index,progress:0})));e.supplyProgress=0;}
export function setNozzle(e,key,count){if(e.kind==='CCGC'||!NOZZLES[key]||e.status!=='scene'||!e.capacity)return false;e.nozzles[key]=Math.max(0,Math.min(NOZZLES[key].max,Math.floor(count)));return true;}
export function tickWater(e,minutes){const requested=Object.entries(NOZZLES).reduce((sum,[key,n])=>sum+n.flow*(e.hoses||[]).filter(h=>h.key===key&&h.index<e.nozzles[key]&&h.progress>=1).length,0);const incoming=e.hydrant&&e.supplyProgress>=1?1000:0;const available=e.water+incoming*minutes;e.flow=minutes>0?Math.min(requested,available/minutes):0;e.water=Math.max(0,Math.min(e.capacity,available-e.flow*minutes));return e.flow;}
export function stow(e){e.nozzles={ldt:0,small:0,large:0};e.hydrant=null;e.flow=0;}

export function tickEquipment(e,minutes){if(!e.hoses)return;if(e.hydrant)e.supplyAnchor=e.hydrant.position.clone();for(const h of e.hoses){const wanted=h.index<e.nozzles[h.key];h.progress=Math.max(0,Math.min(1,h.progress+minutes*(wanted?1/({ldt:12,small:20,large:28}[h.key]):-1/15)));}e.supplyProgress=Math.max(0,Math.min(1,(e.supplyProgress||0)+minutes*(e.hydrant?1/20:-1/15)));}
export function equipmentBusy(e){return e.hoses?.some(h=>h.index<e.nozzles[h.key]?h.progress<1:h.progress>0)||!!(e.hydrant?e.supplyProgress<1:e.supplyProgress>0);}
export function equipmentStatus(e){const laying=e.hoses?.some(h=>h.index<e.nozzles[h.key]&&h.progress<1),packing=e.hoses?.some(h=>h.index>=e.nozzles[h.key]&&h.progress>0);return laying?'Établissement des tuyaux et lances':packing?'Rangement des tuyaux et lances':e.hydrant&&e.supplyProgress<1?'Raccordement au poteau':!e.hydrant&&e.supplyProgress>0?'Rangement de l’alimentation':'';}
