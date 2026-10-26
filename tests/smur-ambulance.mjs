import assert from 'node:assert/strict';
import './game-environment.mjs';
let seed=55;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const {state,engines,onCall,selectIncident,engageUnits,tickEngines,returnEngine,vehicleObstacles,camera,controls,district}=await import('../dist/scene.js');
const {assessMeans}=await import('../dist/means-assessment.js');
const {tickMedical}=await import('../dist/nursing.js');
const {saveGuard,readGuard}=await import('../dist/guard-save.js');
const {vehicle}=await import('../dist/models.js');
const {footprint,overlaps}=await import('../dist/vehicle-spacing.js');
const smur=engines.find(e=>e.id==='SMUR 1'),ambulance=engines.find(e=>e.id==='SMUR 2');
assert(ambulance.external&&ambulance.medicalAmbulance&&ambulance.medicalTransport);
assert.equal(smur.model.userData.bodyStyle,'hilux-pickup');assert.equal(ambulance.model.userData.bodyStyle,'renault-cell-ambulance');assert.equal(ambulance.model.userData.kind,'SAMU');assert.equal(ambulance.model.userData.rearDoors.length,2);
const marks=[];ambulance.model.traverse(o=>{if(o.userData.signText)marks.push(o.userData.signText);});assert(marks.includes('SAMU 41')&&marks.includes('SMUR 2'));assert(!marks.some(m=>/POMPIERS|CIS CENTRE/.test(m)));
// Les deux médecins traitent des victimes distinctes ; le transport ne vole pas celle d'un VSAV.
const teams=[{id:'A',kind:'SAMU',call:99,status:'scene'},{id:'B',kind:'SAMU',call:99,status:'scene',medicalTransport:true}],multi={id:99,reconComplete:true,patients:[{severe:true,assignedTo:'VSAV 1'},{severe:true}]};
for(const e of teams)tickMedical(e,multi,3,()=>{},teams);
assert.deepEqual(multi.patients.map(p=>p.medicalUnit),['A','B']);assert.deepEqual(multi.patients.map(p=>p.medicalProgress),[.5,.5]);assert.equal(multi.patients[0].assignedTo,'VSAV 1');assert.equal(multi.patients[1].assignedTo,'B');
for(const e of teams)tickMedical(e,multi,3,()=>{},teams);assert(multi.patients.every(p=>p.medicalComplete));
const handoff={id:99,reconComplete:true,patients:[{severe:true,assignedTo:'VSAV 1'}]};tickMedical(teams[1],handoff,6,()=>{},teams);assert.equal(handoff.patients[0].assignedTo,'VSAV 1');
state.schedule=[];state.shiftEnd=100000;smur.status='doctorTransit';smur.doctorAway=true;
const c={id:1,type:'SUAP',name:'Personne inconsciente',requires:'VSAV',at:state.minute,status:'waiting',duration:32,progress:0,victimCount:1,patients:[{severe:true,health:65,evacuated:false,assignedTo:null,transportRequired:true}]};state.calls.push(c);onCall(c);selectIncident(c.id);
assert.match(engageUnits([ambulance.id]),/Notifier SMUR/);const staff=state.freeStaff;
const seen=new Set(),step=()=>{state.minute+=.25;tickEngines(.25);seen.add(ambulance.status);assert.equal(state.freeStaff,staff,'External SMUR crew does not consume CIS staff');for(const other of vehicleObstacles())if(other!==ambulance.model&&other.visible!==false)assert(!overlaps(footprint(ambulance.model),footprint(other)),`SMUR 2 collision at ${ambulance.model.position.x},${ambulance.model.position.z}`);};
const until=(fn,label)=>{for(let i=0;i<6000&&!fn();i++)step();assert(fn(),label+' '+JSON.stringify({status:ambulance.status,at:[ambulance.model.position.x,ambulance.model.position.z],patient:c.patients[0],wait:ambulance.controlWaiting}));};
until(()=>ambulance.status==='departing','Automatic fallback dispatch');assert.equal(ambulance.call,c.id);assert.equal(assessMeans({...c,reconComplete:true},[ambulance]).key,'enroute');assert.equal(ambulance.crew,3);assert.equal(smur.status,'doctorTransit');
until(()=>c.patients[0].medicalComplete,'Autonomous medical care');assert.equal(c.patients[0].medicalUnit,ambulance.id);assert.equal(c.patients[0].assignedTo,ambulance.id);assert.equal(ambulance.status,'scene');returnEngine(ambulance);assert.equal(ambulance.status,'scene','Player cannot order ambulance return');
until(()=>ambulance.status==='transport','Medicalized transport without VSAV');assert.notEqual(c.status,'closed');assert(c.patients[0].health>=80);assert.equal(ambulance.call,c.id);assert(ambulance.path.length>5,'Real road transport');
const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};assert.equal(saveGuard(state,engines,district.hydrants,camera,controls,storage),null);const saved=readGuard(storage).specs.find(e=>e.id===ambulance.id);assert(saved.medicalAmbulance&&saved.medicalTransport);const rebuilt=vehicle(new (await import('three')).Group(),saved.kind,undefined,saved);assert.equal(rebuilt.userData.kind,'SAMU');assert(rebuilt.userData.medicalAmbulance,'Saved ambulance reconstructs its model');
until(()=>ambulance.status==='hospital','Physical arrival at CH');assert(c.patients[0].hospitalAt!=null);assert(c.patients[0].deliveredAt==null);until(()=>c.status==='closed','15 minute medical handover');assert(c.patients[0].deliveredAt>=c.patients[0].hospitalAt+15);assert.equal(state.completed,1);
until(()=>ambulance.status==='ready','Physical return to hospital parking');assert(Math.hypot(ambulance.model.position.x-ambulance.home[0],ambulance.model.position.z-ambulance.home[1])<.1);assert.equal(ambulance.call,null);for(const phase of ['departing','enroute','scene','transport','hospital','returning','ready'])assert(seen.has(phase),phase);
console.log('PASS SMUR 2 ambulance, distinct medical care, no patient theft, autonomous fallback, medicalized transport, CH handover, save model, crew independence and physical collision-free return');

// Renfort réel : deux victimes graves mobilisent les deux équipes autonomes.
smur.status='ready';smur.doctorAway=false;
const reinforced={id:2,type:'SUAP',name:'Deux personnes en détresse vitale',requires:'VSAV',at:state.minute,status:'waiting',duration:24,progress:0,victimCount:2,patients:Array.from({length:2},()=>({severe:true,health:65,evacuated:false,assignedTo:null,transportRequired:true}))};
state.calls.push(reinforced);onCall(reinforced);reinforced.reconComplete=true;reinforced.victimsKnown=true;
until(()=>[smur,ambulance].every(e=>e.call===2),'Both SMUR teams dispatched');
until(()=>reinforced.patients.every(p=>p.medicalComplete),'Two distinct medicalizations');
assert.equal(new Set(reinforced.patients.map(p=>p.medicalUnit)).size,2);assert.equal(reinforced.patients.filter(p=>p.assignedTo===ambulance.id).length,1);
until(()=>ambulance.status==='transport','Reinforcement transports its own patient');assert.notEqual(reinforced.status,'closed');
selectIncident(reinforced.id);const vsav=engines.find(e=>e.id==='VSAV 1');assert.equal(engageUnits([vsav.id]),null);
// Le VSAV mobilise légitimement trois personnels du CIS ; vérifier le transport commun.
for(let i=0;i<6000&&reinforced.status!=='closed';i++){state.minute+=.25;tickEngines(.25);}
assert.equal(reinforced.status,'closed');assert(reinforced.patients.every(p=>p.deliveredAt!=null));assert.equal(new Set(reinforced.patients.map(p=>p.assignedTo)).size,2);
console.log('PASS two autonomous SMUR reinforcements, separate victims, ambulance plus VSAV transport and closure only after both CH handovers');
