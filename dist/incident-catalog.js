// Departmental departure grids provide the motives, not occurrence statistics.
// Every source ID resolves in data/departures-reference.json. All frequencies,
// durations and severity values below are game balancing for a 24-minute shift.
import {beachOpen} from './beach-layout.js';
export const FAMILY_SHARES={
 day:{SUAP:.50,INC:.23,AVP:.17,OD:.10},
 night:{SUAP:.50,INC:.33,AVP:.12,OD:.05}
};
export const isNight=minute=>{const hour=((minute/60)%24+24)%24;return hour<7||hour>=22;};
const sap=(id,name,setting,duration,day,night,severity,sources,extra={})=>({id,type:'SUAP',name,setting,scene:'patient',requires:'VSAV',duration,weight:{day,night},severity,casualties:'single',sources,...extra});
const avp=(id,name,scene,duration,day,night,casualties,sources,extra={})=>({id,type:'AVP',name,setting:'road',scene,requires:'VSAV',duration,weight:{day,night},severity:.3,casualties,sources,...extra});
const fire=(id,name,setting,scene,duration,day,night,sources,extra={})=>({id,type:'INC',name,setting,scene,requires:setting==='forest'?'CCF':'FPT',duration,weight:{day,night},sources,...extra});
const od=(id,name,setting,scene,duration,day,night,sources)=>({id,type:'OD',name,setting,scene,requires:'FPT',duration,weight:{day,night},sources});
export const INCIDENTS=[
 sap('sap-malaise-domicile','Malaise à domicile','home',24,19,30,.12,['31-49-17','76-80-08'],{aerialEvacuationChance:.12}),
 sap('sap-chute-escalier','Chute dans un escalier','home',30,11,18,.10,['31-49-06'],{aerialEvacuationChance:.18}),
 sap('sap-blesse-stade','Blessure au stade','stadium',22,5,0,.08,['31-49-07']),
 sap('sap-inconscient','Personne inconsciente','home',32,8,14,.75,['31-49-18','76-80-08']),
 sap('sap-malaise-commerce','Malaise au centre commercial','mall',26,8,1,.15,['31-50-01']),
 sap('sap-accident-domestique','Accident domestique','home',24,9,14,.12,['31-49-06']),
 sap('sap-noyade','Personne en difficulté dans le lac','lake',24,1.5,.5,.55,['76-81-04','31-50-04'],{requires:'VPL',waterRescue:true}),
 sap('sap-malaise-rue','Malaise sur la voie publique','sidewalk',26,9,10,.18,['31-50-03']),
 sap('sap-malaise-sport','Malaise pendant une activité sportive','stadium',28,3,0,.25,['31-49-19']),
 sap('sap-malaise-travail','Malaise sur le lieu de travail','office',26,5,1,.15,['31-50-02']),
 sap('sap-blesse-travail','Blessure sur le lieu de travail','shop',30,4,1,.18,['31-49-11']),
 sap('sap-blesse-commerce','Blessure dans un commerce','mall',24,3,0,.08,['31-49-10']),
 sap('sap-chute-rue','Chute sur le trottoir','sidewalk',24,4,3,.10,['31-49-12']),
 sap('sap-brulure','Brûlure domestique','home',30,2,2,.15,['31-49-06']),
 sap('sap-relevage','Relevage à domicile','home',18,2,5.5,.02,['76-80-01','31-49-05'],{transportChance:.25}),

 sap('sap-malaise-plage','Malaise sur la plage','beach',26,2,0,.15,['31-49-17','76-80-08'],{beachHours:true}),
 sap('sap-blessure-plage','Blessure sur la plage','beach',24,2,0,.08,['31-49-07'],{beachHours:true}),
 sap('sap-baignade-sortie','Baigneur sorti de l’eau','beach',32,1,0,.6,['76-81-04','31-50-04'],{beachHours:true}),
 sap('sap-noyade-plage','Noyade près de la plage','beach-water',28,1.5,0,.65,['76-81-04','31-50-04'],{requires:'VPL',waterRescue:true,beachHours:true}),

 avp('avp-collision','Collision entre deux voitures','collision',30,48,52,'collision',['76-82-01']),
 avp('avp-deux-roues','Accident deux-roues','motorcycle',28,18,12,'two-wheeler',['76-82-01']),
 avp('avp-sortie','Sortie de route','single-car',35,21,27,'solo',['76-82-01']),
 avp('avp-carambolage','Carambolage sur la voie rapide','pileup',40,2,2,'pileup',['31-43-11','76-82-01'],{setting:'express',severity:.4}),
 avp('avp-cycliste','Accident de circulation avec un cycliste','bicycle',28,6,2,'single',['76-82-01']),
 avp('avp-pieton','Piéton heurté par une voiture','pedestrian',32,5,5,'single',['76-82-01'],{severity:.4}),

 fire('inc-cuisine','Feu de cuisine','home','kitchen',50,16,18,['76-78-10']),
 fire('inc-commerce','Feu dans un commerce','mall','shop',90,9,6,['76-78-03','31-45-15']),
 fire('inc-vehicule','Feu de véhicule','roadside','vehicle',40,15,19,['76-77-04','31-46-16']),
 fire('inc-local-poubelles','Feu de local poubelles','tower','bin-room',45,8,10,['31-45-10']),
 fire('inc-appartement','Feu d’appartement','tower','apartment',100,14,20,['76-78-07','31-45-08']),
 fire('inc-vegetation','Feu de végétation','forest','vegetation',120,7,1,['76-77-07']),
 fire('inc-poubelle','Feu de poubelle en plein air','sidewalk','bin',25,7,8,['31-44-10','76-77-06']),
 fire('inc-deux-roues','Feu de deux-roues','roadside','motorcycle',25,3,3,['31-46-16']),
 fire('inc-maison','Feu de maison','home','house',100,5,6,['76-78-10','31-45-11']),
 fire('inc-cheminee','Feu de cheminée','home','chimney',45,5,4,['76-78-08','31-45-09']),
 fire('inc-garage','Feu de garage attenant','home','garage',60,3,1,['76-78-10']),
 fire('inc-broussailles','Feu d’herbes et de broussailles','forest','vegetation',85,2,0,['76-77-07','31-46-04']),
 fire('inc-foret','Feu de sous-bois','forest','forest',150,2,0,['76-77-07','31-46-05']),
 fire('inc-alarme','Alarme incendie sans signe visible','mall','shop',12,2,2,['76-77-01','31-44-08'],{inspection:true,confirmationChance:.15,confirmedDuration:70,allowComplications:false}),
 fire('inc-fumee','Odeur de brûlé dans un immeuble','tower','apartment',15,2,2,['31-45-01','31-45-02'],{inspection:true,confirmationChance:.5,confirmedDuration:80,allowComplications:false}),

 od('od-branche','Branche sur la chaussée','road','branch',25,6,4,['76-83-14','31-47-15']),
 od('od-debris','Débris encombrant la chaussée','road','debris',20,12,10,['76-83-14']),
 od('od-ascenseur','Ascenseur bloqué','tower','elevator',25,24,15,['76-84-05','31-47-12']),
 od('od-cave','Inondation de cave','home','flood',45,24,32,['76-84-03','31-47-17']),
 od('od-garage','Garage inondé','home','flood-garage',40,12,14,['76-84-03','31-47-17']),
 od('od-toiture','Toiture endommagée','home','roof',35,10,5,['31-47-13']),
 od('od-animal','Animal en difficulté','garden','animal',25,6,4,['76-83-13','31-47-01']),
 od('od-carburant','Fuite de carburant sur véhicule','roadside','fuel',30,6,16,['76-83-01','31-47-16'])
].map(c=>({...c,target:c.waterRescue?[120,-155]:[0,0],address:'À préciser'}));

export function familyFor(minute,random=Math.random){
 let value=random();
 const shares=FAMILY_SHARES[isNight(minute)?'night':'day'];
 for(const [family,share]of Object.entries(shares))if((value-=share)<0)return family;
 return 'OD';
}

export function pickIncident(type,minute,random=Math.random,recent=[]){
 const period=isNight(minute)?'night':'day';
 const choices=INCIDENTS.filter(c=>c.type===type&&c.weight[period]>0&&(!c.beachHours||beachOpen(minute)));
 // A repeated motive is less likely, never replaced by an unsupported category.
 const weights=choices.map(c=>c.weight[period]*(recent.includes(c.id)?.2:1));
 let value=random()*weights.reduce((sum,v)=>sum+v,0);
 return choices.find((c,i)=>(value-=weights[i])<0)||choices.at(-1);
}

export function applyIncidentTemplate(c){
 const template=INCIDENTS.find(t=>t.id===c.catalogId||t.name===c.name);
 if(template)for(const [key,value]of Object.entries(template))if(key!=='id'&&c[key]===undefined)c[key]=value;
 c.catalogId??=template?.id;
}

export function casualtyProfile(c,random=Math.random){
 const profile=c.casualties||({'Accident deux-roues':'two-wheeler','Sortie de route':'solo','Carambolage sur la voie rapide':'pileup'}[c.name]);
 if(c.type==='SUAP'||profile==='single')return 1;
 if(c.type!=='AVP')return 0;
 const r=random();
 if(profile==='two-wheeler')return r<.9?1:2;
 if(profile==='solo')return r<.7?1:r<.95?2:3;
 if(profile==='pileup')return 3+Math.floor(random()*4);
 return r<.4?1:r<.85?2:r<.97?3:4;
}

export function createPatients(c,random=Math.random){
 return Array.from({length:c.victimCount},()=>{
  const severe=random()<(c.severity??(c.type==='AVP'?.4:.2));
  return {severe,evacuated:false,assignedTo:null,transportRequired:severe||random()<(c.transportChance??1)};
 });
}

export function inspectFire(c,random=Math.random){
 if(!c.inspection||!c.reconComplete||c.fireConfirmed!==null)return false;
 c.fireConfirmed=c.inspectionResult??random()<c.confirmationChance;
 if(c.fireConfirmed){const previous=c.duration;c.duration=c.confirmedDuration;c.finishBudget+=c.duration-previous;}
 return true;
}
