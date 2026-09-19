export const INCIDENT_STATES={
 waiting:{label:'À engager',icon:'!'},
 engaged:{label:'Préparation',icon:'…'},
 enroute:{label:'En route',icon:'→'},
 onsite:{label:'Sur place',icon:'●'},
 transport:{label:'Transport / CH',icon:'↗'},
 closed:{label:'Terminée',icon:'✓'}
};
const stage=(key,detail='')=>({key,...INCIDENT_STATES[key],detail});

export function incidentState(c,engines){
 if(c.status==='closed')return stage('closed');
 const units=engines.filter(e=>e.call===c.id);
 // An order or reinforcement request does not erase the arrival of the first units.
 if(units.some(e=>['scene','positioning'].includes(e.status))){
  const detail=c.stabilized?'Premiers secours · VSAV attendu':
   c.type==='INC'&&c.progress>=1?'Feu éteint · secours à terminer':
   !c.reconComplete?'Reconnaissance en cours':
   c.type==='INC'&&!units.some(e=>e.flow>0)?'Dispositif sur place':'Intervention en cours';
  return stage('onsite',detail);
 }
 const transports=units.filter(e=>['transport','hospital'].includes(e.status));
 if(transports.length&&c.siteCompletedAt!=null)return stage('transport',transports.map(e=>e.id+(e.status==='hospital'?' · remise de la victime au CH':' → Centre hospitalier')).join(' · '));
 if(units.some(e=>e.status==='enroute'))return stage('enroute','Moyens en route vers les lieux');
 if(units.some(e=>e.status==='departing'))return stage('engaged','Équipages mobilisés · départ à venir');
 return stage('waiting','Aucun moyen engagé');
}

export function incidentBadge(s){return `<span class="missionBadge" data-state="${s.key}"><span aria-hidden="true">${s.icon}</span>${s.label}</span>`;}
export function incidentLegend(){return Object.entries(INCIDENT_STATES).filter(([key])=>key!=='closed').map(([key,s])=>`<span class="missionLegendItem" data-state="${key}"><i aria-hidden="true">${s.icon}</i>${s.label}</span>`).join('');}
