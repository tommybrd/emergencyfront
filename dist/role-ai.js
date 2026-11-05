// L'IA tient les postes que le joueur n'a pas choisis : salle, caserne et chefs d'agrès.
import {handles,hasRole,ownEngine,playerRuns,playerAtCall,ANY_ENGINE,agresChoices} from './player-role.js';
import {assessMeans} from './means-assessment.js';
import {missingKinds} from './departure-types.js';
import {planDeparture} from './guard-campaign.js';
import {fireCapable,firstAidFire} from './operations.js';
import {nozzleLimit,nozzleCount,setNozzle,equipmentBusy} from './hydraulics.js';
import {rescueOptions} from './incident-events.js';
import {foamError,toggleFoam} from './foam.js';
import {smurNeeded} from './smur-regulation.js';
import {findHydrantSupply} from './water-supply.js';
import {recallCapacity,requestVolunteers} from './reinforcements.js';

// Secondes réelles : à vitesse élevée, une attente en minutes de garde ne laisserait pas le temps de cliquer.
export const AI_DISPATCH_SECONDS=4,OTHER_CENTRES_SECONDS=25,OFFICE_SECONDS=60,PLAYER_SCENE_SECONDS=30;
const REQUIREMENT_KINDS=[[/VSAV/,'VSAV'],[/VLI/,'VLI'],[/VSR/,'VSR'],[/EPA/,'EPA'],[/VPL/,'VPL'],[/CCF/,'CCF'],[/incendie/,'FPT'],[/VTU/,'VTU'],[/adapté/,'VTU']];
export function reinforcementKinds(c,engines){
 const kinds=[];for(const r of assessMeans(c,engines).requirements||[]){if(!r.missing)continue;const kind=REQUIREMENT_KINDS.find(([pattern])=>pattern.test(r.label))?.[1];if(kind)for(let i=0;i<r.missing;i++)kinds.push(kind);}
 return kinds;
}
export const needsDispatch=c=>c.status!=='closed'&&!c.policeOnly&&c.siteCompletedAt==null&&!c.noDispatch;
// Le chef de caserne a la main sur ses engins : la salle ne complète qu'avec les autres centres, puis engage d'office.
export function salleSelection(state,c,ids,engines,waited){
 const units=ids.map(id=>engines.find(e=>e.id===id)).filter(Boolean);
 if(state.role!=='caserne')return ids;
 if(waited>=OFFICE_SECONDS)return ids;
 if(waited>=OTHER_CENTRES_SECONDS)return units.filter(e=>!ownEngine(e)).map(e=>e.id);
 return [];
}
export function createRoleAI({state,engines,dispatch,hydrants,toggleHydrant,toggleNoria,requestAerial,chooseRescue,notifySmur,police,specialists,announce}){
 const unitsAt=c=>engines.filter(e=>e.call===c.id);
 function waited(c,dt){c.roleWait=(c.roleWait||0)+dt;return c.roleWait;}
 function salle(c,dt){
  if(c.specialty&&!handles(state,'police')&&!specialists.units.some(v=>!v.retired&&v.call===c.id))specialists.request(state,c);
  if(c.policeOnly){if(!handles(state,'police')&&!police.units.some(v=>v.call===c.id&&!v.retired)&&c.security?.force&&!c.roleForce){c.roleForce=true;police.request(state,c,c.security.force);}return;}
  if(!needsDispatch(c))return;
  if(!handles(state,'smur')&&smurNeeded(c)&&!c.smurRequest)notifySmur(c);
  const held=playerAtCall(state,c,engines)&&!c.bilanSent&&(c.playerWait||0)<PLAYER_SCENE_SECONDS,kinds=c.reconComplete&&!held?reinforcementKinds(c,engines):missingKinds(c,engines),wait=waited(c,dt);
  if(!kinds.length){c.roleWait=0;return;}
  if(wait<(state.role==='caserne'?0:AI_DISPATCH_SECONDS))return;
  const plan=planDeparture(c,engines,state,kinds);
  if(plan.unavailable.length&&!handles(state,'recall')&&recallCapacity(state)&&!c.roleRecalled){c.roleRecalled=true;if(requestVolunteers(state,1))announce(c,'Caserne','Rappel des personnels demandé pour compléter le départ.');}
  if(handles(state,'dispatch')&&state.role!=='caserne')return;
  const ids=salleSelection(state,c,plan.ids,engines,wait);
  if(!ids.length)return;
  if(state.role==='caserne')announce(c,'Salle',wait>=OFFICE_SECONDS?`Sans réponse de la caserne, engagement d’office : ${ids.join(', ')}.`:`Renfort des autres centres : ${ids.join(', ')}.`);
  if(!dispatch(ids,c))c.roleWait=0;
 }
 function work(e,c){
  if(c.complication&&c.complication.status!=='resolved'&&!c.complication.choice){const option=rescueOptions(c,engines).find(o=>o.unit);if(option)chooseRescue(c,option.id);}
  if(e.kind==='EPA'&&c.elevatedRescue&&!c.elevatedRescue.done&&!e.aerial?.mode)requestAerial(e,c,'rescue');
  if(c.type!=='INC'&&c.scene!=='fuel')return;
  if(!e.capacity||!fireCapable(e,c)||c.fireContained||c.inspection&&c.fireConfirmed!==true||e.noria)return;
  if(c.scene==='fuel'&&!e.foamOn&&!foamError(e,c))toggleFoam(e,c);
  if(e.firstAid&&!firstAidFire(c))return;
  if(!e.hydrant&&!(e.supplyProgress>0)&&findHydrantSupply(e,hydrants,engines))toggleHydrant(e);
  const lances=Math.min(2,nozzleLimit(e));if(nozzleCount(e)<lances)setNozzle(e,'lance',lances);
  if(!e.hydrant&&e.water<e.capacity*.2&&!equipmentBusy(e)&&!e.noria)toggleNoria(e,c);
 }
 function scene(c){
  if(!c.reconComplete)return;
  for(const e of unitsAt(c))if(e.status==='scene'&&!playerRuns(state,e))work(e,c);
 }
 // « Tous » : le chef d'agrès monte dans le prochain engin déclenché, et redevient libre quand il rentre.
 function agresDeparture(){
  if(state.role!=='agres')return;
  const mine=engines.find(e=>e.id===state.playerEngine);
  if(state.agresChoice===ANY_ENGINE&&mine&&mine.call==null&&['ready','returning'].includes(mine.status))state.playerEngine=null;
  if(state.agresChoice!==ANY_ENGINE||state.playerEngine)return;
  const next=agresChoices(engines).find(e=>e.call!=null&&e.status==='departing');
  if(next)state.playerEngine=next.id;
 }
 function tick(dt){
  if(!hasRole(state))return;
  agresDeparture();
  for(const c of [...state.calls]){
   if(c.status==='closed')continue;
   // La reconnaissance attend le chef d'agrès ; passé le délai, l'équipage la lance sans lui.
   const mine=playerAtCall(state,c,engines)&&engines.some(e=>e.id===state.playerEngine&&e.status==='scene');if(mine)c.playerWait=(c.playerWait||0)+dt;
   c.reconHeld=playerAtCall(state,c,engines)&&!c.reconLaunched&&(c.playerWait||0)<PLAYER_SCENE_SECONDS;
   salle(c,dt);scene(c);
  }
 }
 return {tick};
}
