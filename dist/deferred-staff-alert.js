export const STAFF_ALERT_DELAY=15000;
// Temps réel : une garde accélérée ne doit pas superposer les deux bipeurs.
export function createDeferredStaffAlert({now=()=>performance.now(),deliver,delay=STAFF_ALERT_DELAY}){
 let pending=null,quietUntil=0;
 return {
  postpone(){quietUntil=now()+delay;if(pending)pending.due=Math.max(pending.due,quietUntil);},
  queue(payload){pending={...payload,due:Math.max(now()+delay,quietUntil)};},
  tick(){if(!pending||now()<pending.due)return;const alert=pending;pending=null;deliver(alert);},
  clear(){pending=null;}
 };
}
