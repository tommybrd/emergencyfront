// Banc de fluidité : engage des secours aux heures chargées et mesure trajets, arrêts et attentes.
// Usage : node --no-warnings --experimental-loader ./tests/runtime-loader.mjs scripts/traffic-bench.mjs [graine]
import '../tests/game-environment.mjs';
let seed=Number(process.argv[2]||process.env.TEST_SEED||7);Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=await import('../dist/scene.js');
const {state,engines,onCall,selectIncident,engageUnits,tickEngines}=game;
const {roads}=await import('../dist/roads.js');
const {requestVolunteers,tickVolunteers}=await import('../dist/reinforcements.js');
state.schedule=[];state.next=0;state.shiftEnd=100000;state.minute=16.5*60;requestVolunteers(state,3);state.minute+=30;tickVolunteers(state,()=>{});
// Laisse la circulation civile se mettre en place avant les départs.
for(let i=0;i<40;i++){state.minute+=.25;tickEngines(.25);}
const home=[-68,90],far=roads.filter(r=>!r.trail&&Math.hypot((r.a[0]+r.b[0])/2-home[0],(r.a[1]+r.b[1])/2-home[1])>220);
const pick=()=>{const r=far[Math.floor(Math.random()*far.length)];return[(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2];};
const plans=[['INC','FPT',['FPTSR','VSAV 1']],['AVP','VSAV',['VSAV 2','VTU','FPTL 1']],['SUAP','VSAV',['VSAV 3','VLI 1']],['INC','CCF',['CCFM 1']]];
plans.forEach(([type,requires,units],i)=>{const target=pick(),c={id:i+1,type,name:'Banc '+type,requires,target,at:state.minute,status:'waiting',duration:5000,progress:0,allowComplications:false};state.calls.push(c);onCall(c);Object.assign(c,{target,accessTarget:target,actionPoint:target,duration:5000});selectIncident(c.id);const refused=engageUnits(units);if(refused)console.log('refus',units,refused);});
const watched=engines.filter(e=>e.call!=null),stats=new Map(watched.map(e=>[e.id,{start:state.minute,travel:null,wait:0,stopped:0,stops:0,moving:false,reasons:{},maxWait:0,run:0,depart:0,last:e.model.position.clone()}]));
const logStart=state.logs.length,owners={};let civilianStopped=0,civilianSamples=0;const civilLast=new Map();
for(let t=0;t<4*150&&watched.some(e=>stats.get(e.id).travel==null);t++){
 state.minute+=.25;tickEngines(.25);
 for(const e of watched){const s=stats.get(e.id);if(s.travel!=null)continue;
  if(['scene','working'].includes(e.status)||e.status!=='departing'&&e.status!=='enroute'&&state.minute-s.start>1){s.travel=state.minute-s.start;continue;}
  const moved=e.model.position.distanceTo(s.last);s.last.copy(e.model.position);
  if(e.status==='departing'){s.depart+=.25;if(e.controlWaiting)s.reasons['départ · '+e.controlWaiting]=(s.reasons['départ · '+e.controlWaiting]||0)+.25;continue;}
  if(e.status!=='enroute')continue;
  const still=moved<.05;if(still){s.stopped+=.25;s.run+=.25;s.maxWait=Math.max(s.maxWait,s.run);if(s.moving)s.stops++;}else s.run=0;s.moving=!still;
  const why=e.controlWaiting||(e.trafficWaiting?'Circulation':null)||(still?'Arrêt sans motif':null);if(why&&still){s.wait+=.25;s.reasons[why]=(s.reasons[why]||0)+.25;}if(why==='Priorité au carrefour'&&still){const r=[...game.trafficControl.records.values()].find(r=>r.queue.has(e)&&r.owner!==e);const o=r?.owner;const k=!o?'aucun':o.status==='traffic'?'civil':o.beacons?'secours prioritaire':'secours '+o.status;owners[k]=(owners[k]||0)+.25;}
 }
 for(const v of game.district.traffic){if(v.model.visible===false)continue;const p=civilLast.get(v);civilianSamples++;if(p&&v.model.position.distanceTo(p)<.02)civilianStopped++;civilLast.set(v,v.model.position.clone());}
}
const rows=[...stats].map(([id,s])=>({id,trajet:s.travel??'>150',arret:s.stopped,arrets:s.stops,attenteMax:s.maxWait,motifs:Object.entries(s.reasons).map(([k,v])=>k+' '+v).join(', ')}));
const recoveries=state.logs.slice(logStart).filter(l=>/recalage automatique|retour de sécurité/.test(l.message)).length;
const motifs={};for(const s of stats.values())for(const [k,v]of Object.entries(s.reasons))motifs[k]=(motifs[k]||0)+v;
const depart=[...stats.values()].reduce((a,s)=>a+s.depart,0);
const total=rows.reduce((a,r)=>a+(typeof r.trajet==='number'?r.trajet:150),0),stopped=rows.reduce((a,r)=>a+r.arret,0),stopCount=rows.reduce((a,r)=>a+r.arrets,0);
console.table(rows);
console.log(JSON.stringify({graine:Number(process.argv[2]||process.env.TEST_SEED||7),trajetTotal:total,arretTotal:stopped,arrets:stopCount,recalages:recoveries,depart,motifs,owners,civilsArretes:+(civilianStopped/Math.max(1,civilianSamples)).toFixed(3)}));
process.exit(0);
