export function tickMaintenance(s,engines,emit,random=Math.random){
 for(const e of engines)if(e.status==='maintenance'&&s.minute>=e.maintenanceUntil){e.status='ready';e.maintenanceUntil=null;emit(`${e.id} — de nouveau disponible.`);}
 s.nextMaintenanceAt??=s.minute+180+random()*180;if(s.minute<s.nextMaintenanceAt)return;
 s.nextMaintenanceAt=s.minute+240+random()*240;
 if(random()>.35)return;
 const candidates=engines.filter(e=>e.status==='ready'&&!e.external&&!e.dedicated&&!e.call&&engines.some(o=>o!==e&&o.kind===e.kind&&o.status!=='maintenance'));
 if(!candidates.length)return;const e=candidates[Math.floor(random()*candidates.length)];e.status='maintenance';e.maintenanceReason=random()<.65?'Maintenance':'Panne';e.maintenanceUntil=s.minute+30+random()*60;
 emit(`${e.id} — ${e.maintenanceReason.toLowerCase()}, indisponible environ ${Math.round(e.maintenanceUntil-s.minute)} min.`,true);
}
