import {escapeHtml,GRADES} from './player-profile.js';
const names=['Alexandre','Camille','Julien','Sarah','Thomas','Léa','Hugo','Emma','Lucas','Manon','Antoine','Julie','Maxime','Chloé','Nicolas','Élodie','Baptiste','Clara','Romain','Marine','Adrien','Lucie','Benjamin','Pauline','Mathieu','Anaïs','Quentin','Laura','Simon','Alice','Florian','Margaux','Clément','Mélanie','Valentin','Justine','Guillaume','Audrey','Raphaël','Céline','Dylan','Inès','Pierre','Océane','Vincent','Maëlle','Louis','Amandine','Théo','Charlotte'];
const grades=['Sergent','Caporal','Sapeur','Adjudant','Caporal-chef','Sapeur'];
export function crewIdentity(p,profile){
 if(p.role==='captain')return {name:profile?.name||p.name||'Vous',grade:GRADES[profile?.grade||p.grade]||'Capitaine',rank:10};
 if(p.role==='nurse')return {name:names[(p.id-1)%names.length],grade:'Infirmier',rank:0};
 const i=(p.id-1)%grades.length;return {name:names[(p.id-1)%names.length],grade:grades[i],rank:[3,1,0,4,2,0][i]};
}
export function engineCrew(e,state){return(e.crewIds||[]).map(id=>state.roster.find(p=>p.id===id&&p.engine===e.id)).filter(Boolean).map(p=>({...p,...crewIdentity(p,state.playerProfile)}));}
export function crewPanel(e,state){const crew=engineCrew(e,state);if(!crew.length)return '';const leader=crew.reduce((a,b)=>b.rank>a.rank?b:a);return `<details class="crewRoster" data-crew="${escapeHtml(e.id)}"><summary>Équipage · ${crew.length} personnel${crew.length>1?'s':''}</summary><ul>${crew.map(p=>`<li><b>${escapeHtml(p.grade)} ${escapeHtml(p.name)}</b><small>${p.kind}${p.role==='captain'?' · Chef de centre':p.role==='nurse'?' · Soins':p.id===leader.id?' · Chef d’agrès':''}</small></li>`).join('')}</ul></details>`;}
