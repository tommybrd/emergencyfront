const KEY='valmont-crew-composition-v1';
export const normalizeGuardSize=value=>Math.max(4,Math.min(30,Math.round(Number(value)||13)));
export function loadGuardSize(){try{return normalizeGuardSize(JSON.parse(localStorage.getItem(KEY))?.guardSize);}catch{return 13;}}
export function saveGuardSize(value){const guardSize=normalizeGuardSize(value);try{localStorage.setItem(KEY,JSON.stringify({guardSize}));return null;}catch{return 'Impossible d’enregistrer l’effectif.';}}
export function configureCrew(s,value){
 const guardSize=normalizeGuardSize(value);
 if(s.guardSize===guardSize){s.pendingGuardSize=null;return true;}
 if(s.roster?.some(p=>p.engine||p.atResidence||p.kind==='SPV'&&p.present)||(s.recallRequests||[]).some(r=>r.status==='enroute')||s.volunteerReturning?.length){s.pendingGuardSize=guardSize;return false;}
 const normal=guardSize-2,ids=Array.from({length:normal},(_,i)=>i<11?i+1:51+i-11),previous=new Map((s.roster||[]).map(p=>[p.id,p]));
 s.roster=ids.map((id,i)=>({...previous.get(id),id,slot:i<11?i:19+i-11,kind:'SPP',present:true,engine:null}));
 s.roster.push({...previous.get(12),id:12,slot:11,kind:'SPP',role:'nurse',present:true,engine:null},{...previous.get(13),id:13,slot:18,kind:'SPP',role:'captain',present:true,engine:null});
 s.guardSize=guardSize;s.freeStaff=normal;s.volunteerPool=undefined;s.pendingGuardSize=null;return true;
}
