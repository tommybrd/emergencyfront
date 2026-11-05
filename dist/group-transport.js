// Transport groupé : deux victimes légères assises dans un même VSAV, sur décision du centre.
import {transportReady} from './patient-health.js';
export const GROUP_HANDOVER_MINUTES=5;
const light=p=>!p.severe&&!p.deceased&&!p.evacuated&&!p.trapped&&p.transportRequired!==false&&transportReady(p);
const groupable=c=>(c.patients||[]).filter(p=>light(p)&&!p.assignedTo);
// Proposé seulement quand au moins deux victimes légères attendent encore un VSAV.
export const canGroupTransport=c=>!!c?.victimsKnown&&c.status!=='closed'&&c.siteCompletedAt==null&&(c.patients||[]).filter(light).length>=2;
export function groupPartner(c,patient,e){
 if(!c.groupTransport||e.kind!=='VSAV'||e.firstAid||patient.releasedOnSite||patient.severe)return null;
 return groupable(c).find(p=>p!==patient)||null;
}
// VSAV encore nécessaires : les victimes légères partent par deux quand le groupement est décidé.
export function ambulancesNeeded(c,patients){
 const transport=patients.filter(p=>p.transportRequired!==false),lightCount=transport.filter(light).length;
 return c.groupTransport?transport.length-Math.floor(lightCount/2):transport.length;
}
export const aboard=(c,e)=>(c?.patients||[]).filter(p=>p.assignedTo===e.id&&p.evacuated&&!p.releasedOnSite&&p.deliveredAt==null);
