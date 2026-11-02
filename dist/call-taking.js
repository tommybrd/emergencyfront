// Prise d'appel CTA : l'appelant décrit, l'opérateur relance, puis qualifie le motif.
// Chaque question coûte du temps ; un motif mal choisi n'est corrigé qu'à la reconnaissance.
import {INCIDENTS} from './incident-catalog.js';
export const QUESTION_MINUTES=.5;
const NONE='none';
const hash=(...parts)=>{let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
const PLACES={home:'chez moi, dans une maison',tower:'dans un immeuble',mall:'au centre commercial',sidewalk:'dans la rue, sur le trottoir',office:'au bureau',shop:'dans un atelier',stadium:'au stade',beach:'sur la plage','beach-water':'au bord de l’eau, à la plage',lake:'au bord du lac',road:'sur la route',roadside:'au bord de la route',express:'sur la voie rapide',forest:'près du bois',garden:'dans un jardin'};
const OPENINGS={
 SUAP:'Allô ? Il faut venir vite, quelqu’un ne va pas bien !',
 AVP:'Allô ? Il y a eu un accident, venez vite !',
 INC:'Allô les pompiers ? Il y a quelque chose qui brûle, ça sent fort !',
 OD:'Bonjour, on a un problème, on a besoin d’aide.'
};
// Ce que l'appelant raconte quand on lui demande ce qui s'est passé : indice fort, jamais le libellé du motif.
const STORIES={
 'sap-malaise-domicile':'Mon père s’est senti mal d’un coup, il est tout pâle.',
 'sap-chute-escalier':'Ma mère a raté une marche, elle est en bas de l’escalier.',
 'sap-blesse-stade':'Un joueur s’est tordu la cheville pendant le match.',
 'sap-inconscient':'Il est par terre, il ne bouge plus du tout.',
 'sap-malaise-commerce':'Une cliente s’est effondrée près des caisses.',
 'sap-accident-domestique':'Il s’est coupé en bricolant, ça saigne.',
 'sap-noyade':'Quelqu’un se débat dans le lac, il appelle à l’aide.',
 'sap-malaise-rue':'Un monsieur s’est assis par terre, il a l’air mal.',
 'sap-malaise-sport':'Un coureur s’est arrêté, il se tient la poitrine.',
 'sap-malaise-travail':'Une collègue a fait un malaise à son poste.',
 'sap-blesse-travail':'Un ouvrier s’est blessé avec une machine.',
 'sap-blesse-commerce':'Une étagère est tombée sur un client.',
 'sap-chute-rue':'Une dame a glissé sur le trottoir, elle a mal au poignet.',
 'sap-brulure':'Il s’est renversé de l’eau bouillante dessus.',
 'sap-relevage':'Mon mari est tombé, il n’est pas blessé mais je n’arrive pas à le relever.',
 'sap-malaise-plage':'Une personne a fait un malaise au soleil.',
 'sap-blessure-plage':'Un enfant s’est ouvert le pied sur un rocher.',
 'sap-baignade-sortie':'On vient de sortir un baigneur de l’eau, il tousse beaucoup.',
 'sap-noyade-plage':'Quelqu’un a coulé près de la plage !',
 'avp-collision':'Deux voitures se sont rentrées dedans au carrefour.',
 'avp-deux-roues':'Un scooter a percuté une voiture, le conducteur est au sol.',
 'avp-sortie':'Une voiture est partie dans le fossé toute seule.',
 'avp-carambolage':'Plusieurs voitures se sont percutées sur la voie rapide.',
 'avp-cycliste':'Un vélo a été renversé par une voiture.',
 'avp-pieton':'Un piéton s’est fait faucher sur le passage.',
 'inc-cuisine':'Une poêle a pris feu dans la cuisine.',
 'inc-commerce':'Ça brûle dans une boutique, il y a de la fumée partout.',
 'inc-vehicule':'Une voiture garée est en feu.',
 'inc-local-poubelles':'Ça fume du local à poubelles en bas de l’immeuble.',
 'inc-appartement':'Il y a des flammes à une fenêtre d’un appartement !',
 'inc-vegetation':'L’herbe brûle le long du chemin, ça avance.',
 'inc-poubelle':'Une poubelle brûle sur le trottoir.',
 'inc-deux-roues':'Un scooter est en train de brûler.',
 'inc-maison':'La maison du voisin est en feu !',
 'inc-cheminee':'Il sort des flammes de la cheminée sur le toit.',
 'inc-garage':'Le garage collé à la maison est en feu.',
 'inc-broussailles':'Des broussailles brûlent, la fumée est épaisse.',
 'inc-foret':'Il y a de la fumée sous les arbres dans le bois.',
 'inc-alarme':'L’alarme incendie sonne, mais on ne voit rien.',
 'inc-fumee':'Ça sent le brûlé dans la cage d’escalier.',
 'od-branche':'Une grosse branche est tombée sur la route.',
 'od-debris':'Il y a plein de débris sur la chaussée.',
 'od-ascenseur':'Je suis bloqué dans l’ascenseur.',
 'od-cave':'Ma cave est inondée.',
 'od-garage':'Le garage est plein d’eau.',
 'od-toiture':'Des tuiles se sont envolées, le toit est abîmé.',
 'od-animal':'Un animal est coincé, il n’arrive pas à sortir.',
 'od-carburant':'Une voiture perd de l’essence sur la route.'
};
const VAGUE='Je ne sais pas, je suis juste de passage…';
export const CALL_QUESTIONS=[
 {key:'story',label:'Que s’est-il passé ?'},
 {key:'place',label:'Où êtes-vous exactement ?'},
 {key:'victims',label:'Y a-t-il des blessés ?',types:['SUAP','AVP','INC']},
 {key:'state',label:'La personne parle-t-elle ? Respire-t-elle ?',types:['SUAP','AVP']},
 {key:'trapped',label:'Quelqu’un est-il coincé dans un véhicule ?',types:['AVP']},
 {key:'fire',label:'Voyez-vous des flammes ou seulement de la fumée ?',types:['INC']},
 {key:'building',label:'Quel bâtiment, quel étage ?',types:['INC']}
];
export function callQuestions(c){return c.noDispatch?CALL_QUESTIONS.slice(0,2):CALL_QUESTIONS.filter(q=>!q.types||q.types.includes(c.type));}
export function callerOpening(c){return c.noDispatch?'Bonjour, excusez-moi de vous déranger…':OPENINGS[c.type]||OPENINGS.OD;}
export function callerAnswer(c,key){
 const vague=c.limitedInfo&&hash(c.phoneId,key)<.45;
 if(c.noDispatch)return key==='story'?'Je voulais juste savoir quelle pharmacie est de garde ce soir.':'Je suis chez moi, tout va bien.';
 if(vague&&key!=='place')return VAGUE;
 if(key==='story')return STORIES[c.catalogId]||`C’est… ${String(c.name||'').toLowerCase()}.`;
 if(key==='place')return 'Je suis '+(PLACES[c.setting]||'pas loin, dans le quartier')+'.';
 if(key==='victims'){if(c.type==='INC')return c.scene==='apartment'||c.scene==='house'?'Je ne sais pas si les voisins sont sortis.':'Non, personne n’est blessé je crois.';return c.casualties==='pileup'||c.casualties==='collision'?'Oui, il y a plusieurs personnes touchées.':'Oui, une personne.';}
 if(key==='state')return (c.severity||0)>=.5?'Il ne répond plus, je ne sais pas s’il respire !':(c.severity||0)>=.25?'Il respire, mais il est très confus.':'Oui, il parle, il a mal.';
 if(key==='trapped')return ['pileup','solo'].includes(c.casualties)?'Oui, le conducteur n’arrive pas à sortir.':'Non, ils sont sortis des voitures.';
 if(key==='fire')return c.inspection?'Je ne vois pas de flammes, juste une odeur.':['vegetation','forest'].includes(c.scene)?'Des flammes et beaucoup de fumée.':'Oui, je vois des flammes.';
 if(key==='building')return c.setting==='tower'?'Un immeuble de plusieurs étages, plutôt en haut.':c.setting==='home'?'Une maison, au rez-de-chaussée.':c.setting==='mall'?'Le centre commercial, au niveau des boutiques.':'Ce n’est pas dans un bâtiment.';
 return VAGUE;
}
// Le vrai motif et trois voisins de la même famille, de préférence dans le même type de lieu.
export function motifChoices(c){
 const choice=id=>({id,name:INCIDENTS.find(t=>t.id===id)?.name||id});
 const none={id:NONE,name:'Pas de départ · renseignement ou conseil'};
 if(c.noDispatch){const pool=INCIDENTS.filter(t=>t.type==='SUAP').sort((a,b)=>hash(c.phoneId,a.id)-hash(c.phoneId,b.id)).slice(0,3).map(t=>choice(t.id));return [...pool,none].sort((a,b)=>hash(c.phoneId,'o',a.id)-hash(c.phoneId,'o',b.id));}
 const truth=c.catalogId,family=INCIDENTS.filter(t=>t.type===c.type&&t.id!==truth);
 const near=family.filter(t=>t.setting===c.setting||t.scene===c.scene).sort((a,b)=>hash(c.phoneId,a.id)-hash(c.phoneId,b.id));
 const far=family.filter(t=>!near.includes(t)).sort((a,b)=>hash(c.phoneId,a.id)-hash(c.phoneId,b.id));
 const ids=[...(truth&&INCIDENTS.some(t=>t.id===truth)?[truth]:[]),...near,...far].map(t=>t.id||t).slice(0,4);
 return [...ids.map(choice).sort((a,b)=>hash(c.phoneId,'o',a.id)-hash(c.phoneId,'o',b.id)),none];
}
// Applique la qualification du joueur sur l'appel encore en ligne ; il sera créé au prochain pas de garde.
export function qualifyCall(c,motifId,minute,asked=0){
 c.qualifiedBy='player';c.questionsAsked=asked;c.answerAt=minute+asked*QUESTION_MINUTES;
 if(motifId===NONE){if(c.noDispatch)return 'Appel clos sans départ.';c.answerAt=minute+3;c.callBack=true;return 'Appel clos sans départ… le requérant rappellera si besoin.';}
 if(c.noDispatch){c.declaredNoDispatch=motifId;return 'Levée de doute : aucun besoin de secours, pas de départ.';}
 if(c.catalogId&&motifId!==c.catalogId){c.declaredId=motifId;c.declaredName=INCIDENTS.find(t=>t.id===motifId)?.name||motifId;}
 return null;
}
export const displayName=c=>c.declaredId&&!c.qualificationRevealed?c.declaredName:c.name;
export const declaredMotif=c=>c.declaredId&&!c.qualificationRevealed?c.declaredId:null;
// À la reconnaissance, l'écart entre le motif déclaré et la situation réelle apparaît.
export function revealQualification(c){
 if(!c.declaredId||c.qualificationRevealed||c.firstArrival==null)return null;
 c.qualificationRevealed=true;
 return `Reconnaissance n°${c.id} : il s’agit de « ${c.name} », et non de « ${c.declaredName} ». Ajustez le départ.`;
}
