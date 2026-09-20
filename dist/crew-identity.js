import {escapeHtml,GRADES} from './player-profile.js';
const names=['Alexandre','Camille','Julien','Sarah','Thomas','Léa','Hugo','Emma','Lucas','Manon','Antoine','Julie','Maxime','Chloé','Nicolas','Élodie','Baptiste','Clara','Romain','Marine','Adrien','Lucie','Benjamin','Pauline','Mathieu','Anaïs','Quentin','Laura','Simon','Alice','Florian','Margaux','Clément','Mélanie','Valentin','Justine','Guillaume','Audrey','Raphaël','Céline','Dylan','Inès','Pierre','Océane','Vincent','Maëlle','Louis','Amandine','Théo','Charlotte'];
const grades=['Sergent','Caporal','Sapeur','Adjudant','Caporal-chef','Sapeur'];
export function crewIdentity(p,profile){
 if(p.role==='captain')return {name:profile?.name||p.name||'Vous',grade:GRADES[profile?.grade||p.grade]||'Capitaine',rank:10};
 if(p.role==='nurse')return {name:names[(p.id-1)%names.length],grade:'Infirmier',rank:0};
 const i=(p.id-1)%grades.length;return {name:names[(p.id-1)%names.length],grade:grades[i],rank:[3,1,0,4,2,0][i]};
}
export function engineCrew(e,state){return(e.crewIds||[]).map(id=>state.roster.find(p=>p.id===id&&p.engine===e.id)).filter(Boolean).map(p=>({...p,...crewIdentity(p,state.playerProfile)}));}
// Simplified chest insignia, independently drawn from the FNSPF grade chart.
export function rankBadge(grade){
 const red='#f04b48',silver='#edf2f4',gold='#efc76b';let marks='';
 const diagonal=(count,color,border='#101a24')=>Array.from({length:count},(_,i)=>{const x=(40-(count*7+8))/2+i*7;return `<path d="M${x} 32h6l10-24h-6Z" fill="${color}" stroke="${border}" stroke-width="1.2"/>`;}).join('');
 if(grade==='Sergent')marks=diagonal(1,silver,red);
 else if(grade==='Caporal')marks=diagonal(2,red);
 else if(grade==='Caporal-chef')marks=diagonal(3,red);
 else if(grade==='Adjudant')marks=`<path d="M6 16h28v8H6Z" fill="${gold}"/><path d="M6 20h28" stroke="${red}" stroke-width="2"/>`;
 else if(grade==='Infirmier')marks='<path d="M17 10h6v7h7v6h-7v7h-6v-7h-7v-6h7Z" fill="#89cdda"/>';
 else {const count={Lieutenant:2,Capitaine:3,Commandant:4,'Lieutenant-colonel':5,Colonel:5}[grade]||0;marks=Array.from({length:count},(_,i)=>`<path d="M7 ${20-(count-1)*2.5+i*5}h26" stroke="${grade==='Lieutenant-colonel'&&i%2?gold:silver}" stroke-width="3"/>`).join('');}
 return `<svg class="crewRank" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="1" y="1" width="38" height="38" rx="4" fill="#202c38" stroke="#62717a"/>${marks}</svg>`;
}
export function crewPanel(e,state){const crew=engineCrew(e,state);if(!crew.length)return '';const leader=crew.reduce((a,b)=>b.rank>a.rank?b:a);return `<section class="crewRoster" data-crew="${escapeHtml(e.id)}"><div class="crewHeading">Équipage · ${crew.length} personnel${crew.length>1?'s':''}</div><ul>${crew.map(p=>`<li>${rankBadge(p.grade)}<div><b>${escapeHtml(p.grade)} ${escapeHtml(p.name)}</b><small>${p.role==='captain'?'Chef de centre':p.role==='nurse'?'Soins':p.id===leader.id?'Chef d’agrès':''}</small></div></li>`).join('')}</ul></section>`;}
