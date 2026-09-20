// Gameplay values: one shared pump, finite stock, fair distribution between tanks.
export const TANKER_FLOW=1000,TANKER_RANGE=80;
export function tickTankers(engines,minutes,emit=()=>{}){
 for(const t of engines)t.suppliedBy=null;
 for(const e of engines.filter(e=>e.kind==='CCGC')){
  e.supplying=[];e.flow=0;if(e.status!=='scene'||!e.call||minutes<=0)continue;
  if(e.hydrant)e.water=Math.min(e.capacity,e.water+1000*minutes);
  const targets=engines.filter(t=>['FPT','CCF'].includes(t.kind)&&t.status==='scene'&&t.call===e.call&&t.water<t.capacity&&!t.hydrant&&Math.hypot(t.model.position.x-e.model.position.x,t.model.position.z-e.model.position.z)<=TANKER_RANGE);
  let budget=Math.min(e.water,TANKER_FLOW*minutes),remaining=targets.slice(),sent=0;
  while(budget>1e-6&&remaining.length){const share=budget/remaining.length;for(const t of remaining){const amount=Math.min(share,t.capacity-t.water);t.water+=amount;if(amount>0)t.suppliedBy=e.id;sent+=amount;budget-=amount;if(amount>0&&!e.supplying.includes(t.id))e.supplying.push(t.id);}remaining=remaining.filter(t=>t.capacity-t.water>1e-6);}
  e.water=Math.max(0,e.water-sent);e.flow=sent/minutes;
  if(e.water<=.01&&!e.emptyReported){e.emptyReported=true;emit(e,'Citerne vide. Retour au CIS pour refaire le plein ou alimentation sur un poteau.');}
  if(e.water>100)e.emptyReported=false;
 }
}
export function tankerStatus(e){return e.water<=.01?'Citerne vide · ravitaillement nécessaire':e.supplying?.length?'Ravitaille '+e.supplying.join(', '):'Réserve d’eau · '+Math.round(e.water)+' L';}
