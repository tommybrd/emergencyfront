// Trois postes de jeu : ce que le rôle ne gère pas reste confié à l'IA. Sans rôle, le joueur garde toutes les commandes.
export const ROLES={
 salle:{label:'Chef de salle',scope:'Je gère la ville',detail:'Qualifier les appels, engager les moyens de tous les centres, coordonner police et SAMU. Les chefs d’agrès IA mènent les interventions.',hands:['qualify','dispatch','police','smur']},
 caserne:{label:'Chef de caserne',scope:'Je gère ma caserne',detail:'Décider qui part parmi vos engins, rappeler du personnel, gérer l’escalade et les renforts. La salle qualifie les appels et engage les autres centres.',hands:['dispatch','recall']},
 agres:{label:'Chef d’agrès',scope:'Je gère mon intervention',detail:'Monter dans votre engin, rouler, puis mener la scène : reconnaissance, bilan, binômes et placement.',hands:['scene']}
};
export const ROLE_KEY='valmont.role';
export const ANY_ENGINE='tous';
const AGRES_KINDS=['FPT','VSAV','CCF','VTU','EPA','VSR'];
export const isRole=role=>Object.hasOwn(ROLES,role);
export const hasRole=s=>isRole(s?.role);
// Sans rôle choisi (anciennes gardes, mode complet), le joueur tient tous les postes.
export const handles=(s,job)=>!hasRole(s)||ROLES[s.role].hands.includes(job);
export const ownEngine=e=>!e.external&&!e.mutualAid&&!e.localVolunteer;
export const agresChoices=engines=>engines.filter(e=>ownEngine(e)&&AGRES_KINDS.includes(e.kind));
export function loadRole(storage=globalThis.localStorage){try{const raw=JSON.parse(storage?.getItem(ROLE_KEY)||'null');return isRole(raw?.role)?{role:raw.role,engine:raw.engine||ANY_ENGINE}:null;}catch{return null;}}
export function saveRole(role,engine=ANY_ENGINE,storage=globalThis.localStorage){try{storage?.setItem(ROLE_KEY,JSON.stringify({role,engine}));}catch{}}
export function chooseRole(s,role,engine=ANY_ENGINE){if(role!=null&&!isRole(role))return false;s.role=role;s.agresChoice=role==='agres'?engine:null;s.playerEngine=role==='agres'&&engine!==ANY_ENGINE?engine:null;return true;}

// Le chef de caserne n'engage que ses engins ; le chef de salle les engage tous ; le chef d'agrès n'engage rien.
export function engageRefusal(s,units){
 if(!hasRole(s))return null;
 if(s.role==='agres')return 'La salle décide des départs : vous partez quand votre engin est déclenché.';
 if(s.role==='caserne'&&units.some(e=>!ownEngine(e)))return 'Les autres centres sont engagés par la salle.';
 return null;
}
export const playerRuns=(s,e)=>!hasRole(s)||s.role==='agres'&&e?.id===s.playerEngine;
export const playerAtCall=(s,c,engines)=>s.role==='agres'&&engines.some(e=>e.id===s.playerEngine&&e.call===c.id);
// Commandes retirées de l'interface selon le rôle : le contrôle est refait au clic pour un bouton encore affiché.
const SCENE='#move,#extinguish,[data-nozzle],[data-hydrant],[data-lance-select],[data-lance-open],[data-lance-move],[data-lance-jet],[data-lance-flow],[data-foam],[data-noria],[data-aerial-action],[data-ladder],[data-support-action],[data-lake-supply],[data-zone-light],[data-rescue],[data-placement],[data-placement-choice],[data-manual-place],[data-work]';
const DISPATCH='#return,[data-cis],[data-choose],[data-confirm],[data-departure-engage],[data-departure-edit],[data-recall],[data-captain-go],[data-abandon-incident]';
const POLICE='[data-police],[data-specialist]',SMUR='[data-notify-smur]',QUALIFY='[data-answer]';
export function roleRefusal(s,target,selected=null){
 if(!hasRole(s))return null;
 const hit=selector=>target?.closest?.(selector);
 if(hit(SCENE)&&!playerRuns(s,selected))return s.role==='agres'?'Cet engin est commandé par son propre chef d’agrès.':'Les chefs d’agrès IA mènent cette intervention.';
 if(hit(DISPATCH)&&!handles(s,'dispatch'))return 'La salle décide des engagements.';
 if(hit(POLICE)&&!handles(s,'police'))return 'La salle coordonne la police et les équipes spécialisées.';
 if(hit(SMUR)&&!handles(s,'smur'))return 'La salle gère la régulation médicale.';
 if(hit(QUALIFY)&&!handles(s,'qualify'))return 'Les opérateurs de la salle qualifient les appels.';
 return null;
}
export const roleLabel=s=>hasRole(s)?ROLES[s.role].label:null;
export function rolePicker(selected,engines,engine=ANY_ENGINE){
 const card=(id,r)=>`<label class="roleCard"><input type="radio" name="playerRole" value="${id}" ${selected===id?'checked':''}><b>${r.label}</b><small>${r.scope}</small><span>${r.detail}</span></label>`;
 const options=agresChoices(engines).map(e=>`<option value="${e.id}" ${engine===e.id?'selected':''}>${e.id}</option>`).join('');
 return `<fieldset class="rolePicker"><legend>Votre poste pour cette garde</legend>${Object.entries(ROLES).map(([id,r])=>card(id,r)).join('')}<label class="roleEngine">Votre engin <select id="roleEngine"><option value="${ANY_ENGINE}" ${engine===ANY_ENGINE?'selected':''}>Tous : je pars sur le prochain déclenchement</option>${options}</select></label><label class="roleFull"><input type="radio" name="playerRole" value="" ${selected?'':'checked'}> Tout gérer moi-même</label></fieldset>`;
}
