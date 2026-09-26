import {composedFleet,modelKey,ccfLabel} from './station-config.js';
const slotKey=e=>e.home.join(':');
const signature=e=>JSON.stringify([modelKey(e),e.signalStyle||'standard',e.signalFront||e.signalStyle||'standard',e.signalRear||e.signalStyle||'standard',e.foamEnabled!==false,e.lightingEnabled!==false]);
export function canRefreshStationEngine(e){return e.status==='ready'&&!e.call&&!e.path&&!e.crew&&Math.hypot(e.model.position.x-e.home[0],e.model.position.z-e.home[1])<1;}
export function applyStationComposition(engines,fleet,rows,{create,remove,replace=()=>{}}){
 const wanted=composedFleet(fleet,rows).filter(e=>e.kind!=='VLCG'),slots=fleet.filter(e=>e.kind!=='VLCG');let changed=0,pending=0;
 for(const slot of slots){const old=engines.find(e=>e.kind!=='VLCG'&&slotKey(e)===slotKey(slot)),spec=wanted.find(e=>slotKey(e)===slotKey(slot));if(!old&&!spec||old&&spec&&signature(old)===signature(spec))continue;
  if(old&&!canRefreshStationEngine(old)){pending++;continue;}
  let next=null;if(spec){const prefix=spec.kind==='CCF'?ccfLabel(spec):spec.kind==='FPT'?(spec.lightPump?'FPTL':'FPTSR'):spec.kind;let id=old&&modelKey(old)===modelKey(spec)?old.id:prefix+' 1',n=1;if(['FPTSR','VSR','EPA','VTU'].includes(prefix))id=prefix;while(engines.some(e=>e!==old&&e.id===id))id=prefix+' '+(++n);next=create({...spec,id});if(!next){pending++;continue;}}
  if(old){remove(old);engines.splice(engines.indexOf(old),1,...(next?[next]:[]));}else if(next)engines.push(next);replace(old,next);changed++;
 }
 return{changed,pending};
}
