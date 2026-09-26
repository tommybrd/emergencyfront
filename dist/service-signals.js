import {configureBlueZones,configureAmber} from './models.js';
import {installRotaryBeacons,installBlueLedEffects,installAmberEffects} from './rotary-beacons.js';
import {disposeObject} from './dispose.js';
export const SERVICE_SIGNALS_KEY='valmont.service-signals.v1';
const choices=['standard','none','short','wide','round'],labels={standard:'Origine',none:'Aucun',short:'LED · rampe courte',wide:'LED · rampe large',round:'Ronds · rotatifs'};
export function loadServiceSignals(storage=globalThis.localStorage){let raw;try{raw=JSON.parse(storage?.getItem(SERVICE_SIGNALS_KEY)||'{}')}catch{}return Object.fromEntries(['van','car','police'].map(key=>[key,Object.fromEntries(['signalFront','signalRear','signalAmber'].map(zone=>[zone,choices.includes(raw?.[key]?.[zone])?raw[key][zone]:'standard']))]));}
export function applyServiceSignals(model,key,config=loadServiceSignals()){
 const wanted=config[key],signature=JSON.stringify(wanted);if(!wanted||model.userData.serviceSignalSignature===signature)return;
 if(!model.userData.serviceSignalOriginal){model.userData.serviceSignalOriginal={parts:[...new Set([...(model.userData.blueParts||model.userData.beacons||[]),...(model.userData.rearAmber||[])])],beacons:model.userData.beacons,rearAmber:model.userData.rearAmber,amberParts:model.children.filter(p=>p.userData.amberPart||(model.userData.rearAmber||[]).includes(p)),frontBlue:model.userData.frontBlue,rearBlue:model.userData.rearBlue};}
 if(Object.values(wanted).every(v=>v==='standard')&&!model.userData.serviceSignalSignature){model.userData.serviceSignalSignature=signature;return;}
 for(const key of ['blueLedEffects','amberEffects']){if(model.userData[key])disposeObject(model.userData[key].group);delete model.userData[key];}
 for(const b of model.userData.rotaryBeacons||[]){disposeObject(b.ring);disposeObject(b.rotor);}delete model.userData.rotaryBeacons;
 configureBlueZones(model,model.userData.kind,wanted);
 if(wanted.signalAmber==='standard'){
  configureAmber(model,model.userData.kind,'none');const original=model.userData.serviceSignalOriginal;for(const part of original.amberParts||[])model.add(part);model.userData.rearAmber=original.rearAmber||[];model.userData.signalAmber='standard';
 }else configureAmber(model,model.userData.kind,wanted.signalAmber);
 model.userData.serviceSignalSignature=signature;installRotaryBeacons(model);installBlueLedEffects(model);installAmberEffects(model);
}
export function openServiceSignals(onSave=()=>{}){
 const config=loadServiceSignals(),dialog=document.createElement('dialog');dialog.className='stationComposer';document.body.append(dialog);
 dialog.innerHTML=`<div class="composerHead"><h2>Gyrophares · VLCG et police</h2><button data-close>×</button></div><p>Réglages indépendants pour les deux VLCG. La police reste autonome.</p>${[['van','VLCG · pick-up Hilux'],['car','VLCG · voiture de service'],['police','Police · toutes les patrouilles']].map(([key,label])=>`<fieldset><legend>${label}</legend><div class="guardChoices">${[['signalFront','Bleus avant'],['signalRear','Bleus arrière'],['signalAmber','Orange arrière']].map(([zone,label])=>`<label>${label}<select data-owner="${key}" data-zone="${zone}">${choices.map(v=>`<option value="${v}" ${config[key][zone]===v?'selected':''}>${labels[v]}</option>`).join('')}</select></label>`).join('')}</div></fieldset>`).join('')}<p data-feedback></p><div class="actions"><button data-save>Enregistrer</button><button data-cancel>Annuler</button></div>`;
 dialog.querySelector('[data-close]').onclick=dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 dialog.querySelector('[data-save]').onclick=()=>{dialog.querySelectorAll('[data-owner]').forEach(el=>config[el.dataset.owner][el.dataset.zone]=el.value);try{localStorage.setItem(SERVICE_SIGNALS_KEY,JSON.stringify(config));onSave(config);dialog.close();}catch{dialog.querySelector('[data-feedback]').textContent='Enregistrement impossible dans ce navigateur.';}};dialog.showModal();
}
