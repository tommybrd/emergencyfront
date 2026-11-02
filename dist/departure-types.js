// Départs types par motif : équilibrage de jeu inspiré des grilles départementales, modifiable par le joueur.
import {INCIDENTS} from './incident-catalog.js';
export const DEPARTURE_KINDS=['VSAV','FPT','VSR','CCF','EPA','VTU','VLCG','VLI','VPL','PC'];
export const DEPARTURE_LABELS={VSR:'FPT secours routier'};
export const DEPARTURE_TYPES={
 'sap-inconscient':['VSAV','VLI'],'sap-noyade':['VPL','VSAV'],'sap-noyade-plage':['VPL','VSAV'],
 'avp-collision':['VSAV','VSR'],'avp-sortie':['VSAV','VSR'],'avp-deux-roues':['VSAV','FPT'],'avp-carambolage':['VSAV','VSAV','VSR','VLCG'],'avp-cycliste':['VSAV'],'avp-pieton':['VSAV'],
 'inc-appartement':['FPT','EPA','VSAV','VLCG'],'inc-commerce':['FPT','EPA','VLCG'],'inc-maison':['FPT','VSAV'],'inc-cuisine':['FPT','VSAV'],'inc-cheminee':['FPT','EPA'],'inc-fumee':['FPT','EPA'],
 'inc-garage':['FPT'],'inc-vehicule':['FPT'],'inc-deux-roues':['FPT'],'inc-poubelle':['FPT'],'inc-local-poubelles':['FPT'],'inc-alarme':['FPT'],
 'inc-vegetation':['CCF'],'inc-broussailles':['CCF','CCF'],'inc-foret':['CCF','CCF','VLCG'],
 'od-carburant':['FPT'],'od-ascenseur':['VTU'],search:['VTU','VSAV'],prevention:['VTU'],animal:['EPA','VTU']
};
const FAMILY={SUAP:['VSAV'],AVP:['VSAV','VSR'],OD:['VTU']};
const KEY='valmont.departureTypes';
// Avant la reconnaissance, le départ suit le motif qualifié au téléphone, même s'il est erroné.
export function motifOf(c){return (c.declaredId&&!c.qualificationRevealed?c.declaredId:null)||c.catalogId||INCIDENTS.find(t=>t.name===c.name)?.id||(c.searchPerson?'search':c.animalRescue?'animal':null);}
export function loadDepartureOverrides(storage=globalThis.localStorage){try{const raw=JSON.parse(storage?.getItem(KEY)||'{}');return raw&&typeof raw==='object'?Object.fromEntries(Object.entries(raw).filter(([,v])=>Array.isArray(v)&&v.every(k=>DEPARTURE_KINDS.includes(k)))):{};}catch{return {};}}
export function saveDepartureOverride(motif,kinds,storage=globalThis.localStorage){const all=loadDepartureOverrides(storage);if(kinds)all[motif]=kinds.filter(k=>DEPARTURE_KINDS.includes(k));else delete all[motif];try{storage?.setItem(KEY,JSON.stringify(all));}catch{}return all;}
// The motif grid, then what reconnaissance revealed: victims call for a VSAV, a high building for the EPA.
export function departureKinds(c,overrides=loadDepartureOverrides()){
 const motif=motifOf(c),base=[...(overrides[motif]||DEPARTURE_TYPES[motif]||(c.type==='INC'?[c.requires==='CCF'?'CCF':'FPT']:FAMILY[c.type]||['VTU']))];
 if(c.type==='INC'&&c.site?.height>8&&!base.includes('EPA'))base.push('EPA');
 if(c.type==='INC'&&c.victimsKnown&&c.victimCount&&!base.includes('VSAV'))base.push('VSAV');
 return base;
}
export const matchesKind=(e,kind)=>e.kind===kind||kind==='VSR'&&e.kind==='FPT'&&!e.lightPump&&e.roadRescueEquipment!==false;
// Kinds already covered by engaged units are not proposed again; only the missing part of the grid remains.
export function missingKinds(c,engines,kinds=departureKinds(c)){
 const engaged=engines.filter(e=>e.call===c.id&&!['returning','ready'].includes(e.status)),left=[];
 for(const kind of kinds){const i=engaged.findIndex(e=>matchesKind(e,kind));if(i>=0)engaged.splice(i,1);else left.push(kind);}
 return left;
}
