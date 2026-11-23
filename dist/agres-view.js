// Poste de chef d'agrès : où se trouve le personnage et ce qu'il peut faire à chaque étape de sa mission.
import {boardingPosition} from './crew.js';
import {crewLeader} from './crew-identity.js';
import {escapeHtml} from './player-profile.js';
import {fireCapable} from './operations.js';
import {nozzleCount,nozzleLimit} from './hydraulics.js';
import {ANY_ENGINE,callLead} from './player-role.js';

const MUSTER=[-73,82],RECON_WALK=14;
export function agresPhase(e,c){
 if(!e)return 'attente';
 if(e.status==='departing')return 'montee';
 if(e.status==='enroute'||e.status==='positioning')return 'route';
 if(e.status==='scene'&&c)return 'scene';
 if(['transport','hospital','returning'].includes(e.status))return 'retour';
 return 'attente';
}
const PHASE_LABELS={attente:'En attente de déclenchement',montee:'Je monte dans l’engin',route:'En route',scene:'Sur les lieux',retour:'Retour'};
export function agresPose(e,c,minute){
 const phase=agresPhase(e,c);
 if(!e)return {visible:true,point:MUSTER};
 const p=e.model.position;
 if(phase==='montee'){
  const b=e.boarding?.[0];if(!b?.path?.length)return {visible:false};
  const fraction=(minute-e.alertAt-b.delay)/((b.duration-b.delay)||1);
  return fraction>=1?{visible:false}:{visible:true,point:boardingPosition(b,Math.max(0,fraction)).point};
 }
 if(phase==='scene'){
  const dx=c.target[0]-p.x,dz=c.target[1]-p.z,distance=Math.hypot(dx,dz)||1,walk=Math.min(distance-1,RECON_WALK)*Math.max(0,Math.min(1,c.reconComplete?1:c.reconProgress||0));
  return {visible:true,point:[p.x+2.4+dx/distance*Math.max(0,walk),p.z+dz/distance*Math.max(0,walk)]};
 }
 if(phase==='attente')return {visible:true,point:[p.x+3,p.z+3]};
 return {visible:false};
}
// Le joueur incarne le chef d'agrès de l'engin : son nom n'est connu qu'une fois l'équipage constitué.
export function agresLabel(s,e){const chief=e&&crewLeader(e,s);return chief?`${chief.grade} ${chief.name}`:'Chef d’agrès';}
const step=(done,label,body='',current=false)=>`<li class="${done?'done':current?'current':''}"><b><i aria-hidden="true">${done?'✓':''}</i>${label}</b>${body}</li>`;
const act=(action,label,{primary=false,disabled=false,title=''}={})=>`<button class="${primary?'agresPrimary':''}" data-agres="${action}" ${disabled?'disabled':''} ${title?`title="${escapeHtml(title)}"`:''}>${label}</button>`;
// Panneau unique du chef d'agrès : en-tête (engin et phase), fiche de l'intervention, étapes, puis actions.
// options.next : état du bouton « Prochain départ » ; options.callCard : fiche détaillée préparée par la scène.
function agresScreen(s,e,c,engines,options={}){
 const phase=agresPhase(e,c),name=e?.id||(s.agresChoice===ANY_ENGINE?'Prochain engin déclenché':s.agresChoice);
 const head=`<div class="agresHead"><div class="agresHeadTop"><span class="agresEyebrow">Chef d’agrès</span><span class="agresPhase phase-${phase}">${PHASE_LABELS[phase]}</span></div><b class="agresEngine">${escapeHtml(name)}</b></div>`;
 const card=c?(options.callCard||`<section class="agresCall"><div class="agresCallTitle"><span class="incidentIdentifier">I${String(c.id).padStart(2,'0')}</span><b>${escapeHtml(c.name||'')}</b>${c.playerReinforced?'<span class="reinforceBadge" title="Renfort demandé">R</span>':''}</div></section>`):'';
 const open=c&&c.siteCompletedAt==null;
 const tools=e&&c?`<div class="agresTools">${act('console',`Commandes de l’engin`)}${open?act('reinforce','R · Renforts',{title:'Demander des renforts au CODIS'}):''}${phase==='scene'?act('walk','Déplacer mon personnage'):''}</div>`:'';
 if(phase==='attente'||!c){
  const n=options.next||{};
  return head+`<section class="agresWait"><p>Le CODIS déclenche votre engin : le bipeur sonne au départ.</p>${act('next','☎ » Prochain départ',{primary:true,disabled:!!n.blocked,title:n.blocked||'Avancer jusqu’au prochain déclenchement de votre engin'})}${n.blocked?`<small>${escapeHtml(n.blocked)}</small>`:''}</section>`;
 }
 if(phase!=='scene')return head+card+tools;
 const lead=callLead(c,engines),leads=!lead||lead.id===e.id;
 const orders=!leads?`<p class="agresLead">${lead.kind==='VLCG'?'Le VLCG dirige l’intervention : vous exécutez ses ordres.':`${escapeHtml(lead.id)} est référent de l’intervention : vous exécutez ses ordres.`}</p>`:(lead?'<p class="agresLead">Vous êtes le référent : vous dirigez l’intervention.</p>':'');
 const fire=e.capacity&&fireCapable(e,c)&&!c.fireContained&&c.reconComplete,started=c.reconLaunched||c.reconComplete||c.reconProgress>0;
 const lanes=(e.hoses||[]).filter(x=>x.index<nozzleCount(e)).map(x=>`<button class="agresLane" data-agres-lance="${x.index}" title="Régler le binôme ${x.index+1} : débit, jet, position, ouverture">Binôme ${x.index+1}<span>${x.flow} L/min ›</span></button>`).join('');
 const lances=fire?`<div class="agresActions agresCounter"><button data-agres="lance-" ${nozzleCount(e)?'':'disabled'} aria-label="Retirer un binôme">−</button><span>${nozzleCount(e)} / ${nozzleLimit(e)} binômes</span><button data-agres="lance+" ${nozzleCount(e)<nozzleLimit(e)?'':'disabled'} aria-label="Engager un binôme">+</button></div>${lanes?`<div class="agresLanes">${lanes}</div>`:''}<div class="agresActions">${act('hydrant',e.hydrant?'Replier l’alimentation':'Alimenter sur poteau')}</div>`:`<small>${c.reconComplete?(c.victimCount?'L’équipage prend les victimes en charge.':'Aucune lance nécessaire.'):'Après la reconnaissance.'}</small>`;
 const recon=step(c.reconComplete,'Reconnaissance',started?(c.reconComplete?'':`<small>${Math.round((c.reconProgress||0)*100)} %</small>`):`<div class="agresActions">${act('recon','Partir en reconnaissance',{primary:true})}</div>`,!c.reconComplete);
 const bilan=step(c.bilanSent,'Bilan à la salle',c.reconComplete&&!c.bilanSent?`<div class="agresActions">${act('bilan','Transmettre le bilan',{primary:true})}</div>`:'',c.reconComplete&&!c.bilanSent);
 const access=c.accessClosed&&c.reconComplete?step(!c.accessClosed,'Accès fermé',c.accessTask?'<small>Ouverture en cours</small>':`<div class="agresActions">${act('access','Ouvrir la porte',{primary:true})}</div>`,true):'';
 const place=step(!!e.tacticalPlacement,'Placement',`<div class="agresActions">${act('placement','Choisir le placement')}</div>`);
 return head+card+orders+`<ol class="agresSteps">${leads?recon+bilan:''}${access}${step(nozzleCount(e)>0||!fire&&c.reconComplete,'Binômes',lances,fire&&!nozzleCount(e))}${place}</ol>`+tools;
}

// Tablette du chef d'agrès : barre d'application, écran, onglets (intervention, ticket, bilan, moyens).
const TABS=[['actions','◉','Intervention'],['ticket','▤','Ticket'],['bilan','✚','Bilan'],['moyens','⛟','Moyens']];
export function agresPanel(s,e,c,engines,options={}){
 const tab=c&&options.tabs?.[options.tab]?options.tab:'actions';
 let screen=agresScreen(s,e,c,engines,options);
 const cut=screen.indexOf('</b></div>')+10,head=screen.slice(0,cut);
 if(tab!=='actions')screen=head+options.tabs[tab];
 // Statut radio en attente : le chef d'agrès le transmet lui-même (départ, SLL, transport, disponible…).
 if(options.status)screen=head+`<div class="agresStatus"><span>Statut à transmettre</span><button class="agresPrimary" data-agres="status">📻 ${escapeHtml(options.status)}</button></div>`+screen.slice(cut);
 const bar=`<div class="tabletBar"><span>TABLETTE CA · SDIS 41</span><span>${e?`<b class="tabletTag">${escapeHtml(e.id)}</b>`:''}${options.clock?` ${escapeHtml(options.clock)}`:''}</span></div>`;
 const nav=c?`<nav class="tabletTabs" aria-label="Onglets de la tablette">${TABS.map(([id,icon,label])=>`<button data-agres-tab="${id}" aria-pressed="${id===tab}"><i aria-hidden="true">${icon}</i>${label}</button>`).join('')}</nav>`:'';
 return bar+`<div class="tabletScreen">${screen}</div>`+nav;
}
