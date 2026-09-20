import {capability} from './operations.js';
import {escapeHtml} from './player-profile.js';
export function assessMeans(c,engines){
 if(!c.reconComplete)return {key:'pending',label:'Moyens à confirmer après reconnaissance',detail:''};
 if(c.siteCompletedAt!=null)return {key:'sufficient',label:'Opérations sur place terminées',detail:'Transport / remise au CH en cours'};
 const units=engines.filter(e=>e.call===c.id&&['scene','enroute','departing','positioning'].includes(e.status));
 const needs=[];
 const require=(label,count,match)=>{const relevant=units.filter(match),here=relevant.filter(e=>e.status==='scene').length;if(here<count)needs.push({label,count:count-here,pending:relevant.length>=count});};
 const patients=(c.patients||[]).filter(p=>!p.evacuated),transport=patients.filter(p=>p.transportRequired!==false).length;
 if(patients.length)require('VSAV',Math.max(1,transport),e=>e.kind==='VSAV');
 if(patients.some(p=>p.severe&&!p.nursingComplete))require('VLI',1,e=>e.kind==='VLI');
 if(c.extrication&&!c.extrication.done&&c.extrication.progress<1)require('VSR / FPTSR',1,e=>e.kind==='VSR'||e.kind==='FPT'&&!e.lightPump);
 if(c.elevatedRescue&&!c.elevatedRescue.done)require('EPA',1,e=>e.kind==='EPA');
 if(c.waterRescue&&!c.nautical?.done)require('VPL',1,e=>e.kind==='VPL');
 if(c.type==='INC'&&!c.fireContained&&c.fireConfirmed!==false)require(c.requires==='CCF'?'CCF':'Engin incendie',c.fireLevel>=3?2:1,e=>['FPT','CCF'].includes(e.kind)&&capability(e,c)==='resolve');
 if(c.type==='OD'&&!patients.length)require('Moyen adapté',1,e=>capability(e,c)==='resolve');
 const missing=needs.filter(n=>!n.pending),waiting=needs.filter(n=>n.pending);
 return {key:missing.length?'insufficient':waiting.length?'enroute':'sufficient',label:missing.length?'Renfort nécessaire':waiting.length?'Renfort engagé · arrivée attendue':'Moyens suffisants',detail:needs.map(n=>`${n.count} ${n.label}${n.pending?' en route':' à engager'}`).join(' · ')};
}
export function meansPanel(c,engines){const a=assessMeans(c,engines);return `<div class="meansAssessment ${a.key}" role="status"><small>${c.reconComplete?'Bilan du chef d’agrès':'Reconnaissance'}</small><b>${a.key==='sufficient'?'✓':a.key==='insufficient'?'⚠':'◷'} ${a.label}</b>${a.detail?`<small>${escapeHtml(a.detail)}</small>`:''}</div>`;}
