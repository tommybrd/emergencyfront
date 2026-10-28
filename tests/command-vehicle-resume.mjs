import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import './game-environment.mjs';
import {PROFILE_KEY} from '../dist/player-profile.js';
import {SAVE_KEY,RESUME_KEY,saveGuard} from '../dist/guard-save.js';
const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
globalThis.localStorage=storage;
globalThis.sessionStorage={getItem:()=>null,removeItem(){}};
const snapshot=process.argv[2];
if(snapshot){
 const data=JSON.parse(readFileSync(snapshot,'utf8'));
 memory.set(SAVE_KEY,data.guard);memory.set(PROFILE_KEY,data.profile);
 let resume=true;globalThis.sessionStorage={getItem:k=>k===RESUME_KEY&&resume?'1':null,removeItem(){resume=false;}};
 const g=await import('../dist/scene.js'),e=g.engines.find(e=>e.kind==='VLCG');
 assert.equal(e.status,'departing');assert.equal(e.model.userData.playerVehicle,data.active,'Reload preserves the vehicle physically mobilized');
 assert.equal(e.commandVehicle,data.active);assert.equal(g.state.playerProfile.vehicle,data.wanted,'Pending selection survives reload');
 const crew=e.crewIds.slice();assert(crew.length===1);assert.equal(g.state.roster.find(p=>p.id===crew[0]).engine,e.id);
 g.returnEngine(e);assert.equal(e.status,'ready');assert.equal(e.model.userData.playerVehicle,data.wanted,'Pending selection applies only after release at CIS');
 assert.equal(e.crew,0);assert.equal(Object.keys(e.playerVehicles).length,1);assert.equal(e.parkedActors.length,0);
 console.log('PASS fresh guard resume',data.active,'→ pending',data.wanted,'→ CIS switch');
}else{
 const g=await import('../dist/scene.js');g.state.schedule=[];g.state.calls=[];g.state.paused=true;g.state.shiftEnd=100000;
 const e=g.engines.find(e=>e.kind==='VLCG'),c={id:151,type:'INC',name:'Feu de véhicule',requires:'FPT',status:'waiting',at:g.state.minute,progress:0};g.state.calls.push(c);g.onCall(c);
 const directory=mkdtempSync(join(tmpdir(),'valmont-resume-'));
 try{for(const [active,wanted]of[['van','duster'],['duster','van']]){
  assert.equal(e.model.userData.playerVehicle,active);g.selectIncident(c.id);assert.equal(g.engageUnits([e.id]),null);
  assert.equal(g.applyPlayerProfile({...g.state.playerProfile,vehicle:wanted}).pending,true);
  assert.equal(saveGuard(g.state,g.engines,g.district.hydrants,g.camera,g.controls,storage),null);
  const path=join(directory,'guard.json');writeFileSync(path,JSON.stringify({guard:memory.get(SAVE_KEY),profile:memory.get(PROFILE_KEY),active,wanted}));
  const result=spawnSync(process.execPath,['--no-warnings','--experimental-loader',fileURLToPath(new URL('./runtime-loader.mjs',import.meta.url)),fileURLToPath(import.meta.url),path],{encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);process.stdout.write(result.stdout);g.returnEngine(e);
 }}finally{rmSync(directory,{recursive:true,force:true});}
}
