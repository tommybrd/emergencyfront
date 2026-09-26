// Règles communes au panneau d’engagement et à la simulation.
export const canEngage=e=>e.capacity>0&&e.water<1?false:e.external?e.status==='ready'&&!e.doctorAway:['ready','idle','returning'].includes(e.status)||e.kind==='VLCG'&&e.status==='departing'&&!!e.commuteDestination;
export function capability(e,c){
 if(e.kind==='PC')return ['INC','AVP','OD','SUAP'].includes(c.type)?'command':null;
 if(e.kind==='VPCE')return c.type==='INC'?'supply':null;
 if(e.kind==='VLI')return ['SUAP','AVP'].includes(c.type)||(c.type==='INC'||c.scene==='elevator')&&c.victimsKnown&&c.patients?.some(p=>!p.evacuated)?'nursing':null;
 if(e.kind==='CCGC')return c.type==='INC'?'supply':null;
 if(e.kind==='VPL')return c.waterRescue?'waterRescue':null;
 if(e.kind==='SAMU')return ['SUAP','AVP'].includes(c.type)&&c.victimsKnown&&c.patients?.some(p=>p.severe&&!p.evacuated)?'medical':null;
 if(c.animalRescue&&['EPA','VTU','FPT'].includes(e.kind))return 'resolve';
 if(c.searchPerson&&!c.searchDone&&['VTU','FPT','CCF'].includes(e.kind))return 'resolve';
 if(e.kind==='EPA')return c.type==='INC'&&c.requires!=='CCF'||c.reconComplete&&c.elevatedRescue&&!c.elevatedRescue.done?'aerial':null;
 if(e.kind==='VLCG')return ['INC','AVP','SUAP','OD'].includes(c.type)?'command':null;
 if(e.kind==='VTU')return ['SUAP','AVP'].includes(c.type)?'firstAid':c.type==='OD'?'resolve':null;
 if(e.kind==='VSAV')return ['SUAP','AVP','INC'].includes(c.type)||c.scene==='elevator'?'resolve':null;
 if(e.kind==='CCF')return ['INC','OD'].includes(c.type)?'resolve':c.type==='AVP'?'command':null;
 if(e.kind==='VSR')return c.type==='AVP'?'roadRescue':null;
 if(e.kind==='FPT')return c.type==='OD'||c.type==='INC'&&c.requires!=='CCF'?'resolve':c.type==='AVP'?(e.lightPump?'command':'roadRescue'):null;
 return null;
}
export function engagementError(engines,c,staff,roster){
 if(!c||c.status==='closed')return 'Cette intervention est terminée.';
 if(c.siteCompletedAt!=null)return 'Opérations sur place terminées · remise des victimes au CH en cours.';
 if(!engines.length)return 'Sélectionnez au moins un moyen.';
 if(new Set(engines.map(e=>e.id)).size!==engines.length)return 'Un moyen ne peut pas être engagé deux fois.';
 for(const e of engines){if(e.dedicated&&!e.crew&&roster&&!roster.some(p=>p.present&&!p.engine&&p.role===(e.kind==='VLI'?'nurse':'captain')))return `${e.id} : personnel dédié indisponible.`;if(!canEngage(e))return `${e.id} n’est pas disponible.`;if(!capability(e,c))return `${e.id} n’est pas adapté à cette intervention.`;}
 const required=engines.reduce((n,e)=>n+(e.external||e.dedicated||e.crew?0:e.size),0);
 return required>staff?`Effectif insuffisant : ${required} personnels nécessaires, ${staff} disponibles.`:null;
}
