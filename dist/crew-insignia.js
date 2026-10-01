import * as T from 'three';
import {crewIdentity} from './crew-identity.js';
let state;
const geometries=new Map(),material=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.85});material.userData.shared=true;
export function setInsigniaState(value){state=value;}
// Independently drawn chest patches, based on DGSCGC annex A.1 (2017).
function geometry(grade){
 if(geometries.has(grade))return geometries.get(grade);
 const positions=[],colors=[],silver='#e4e9eb',red='#d5443d',gold='#dec477';
 const polygon=(points,color,z=0)=>{const c=new T.Color(color);for(let i=1;i<points.length-1;i++)for(const [x,y]of[points[0],points[i],points[i+1]]){positions.push((x-.5)*.13,(y-.5)*.13,z);colors.push(c.r,c.g,c.b);}};
 const rect=(x,y,w,h,c,z=.001)=>polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c,z);
 rect(0,0,1,1,'#1f2b39',0);
 const diagonal=(n,c)=>{for(let i=0;i<n;i++){const x=.14+i*.21;polygon([[x,.15],[x+.12,.15],[x+.43,.85],[x+.31,.85]],c,.001);}};
 if(grade==='Sergent'){diagonal(1,red);polygon([[.165,.18],[.235,.18],[.515,.82],[.445,.82]],silver,.002);}
 else if(grade==='Caporal')diagonal(2,red);
 else if(grade==='Caporal-chef')diagonal(3,red);
 else if(grade==='Adjudant'){rect(.12,.39,.76,.22,gold);rect(.12,.485,.76,.035,red,.002);}
 else {const n={Infirmier:1,Lieutenant:2,Capitaine:3,Commandant:4,'Lieutenant-colonel':5,Colonel:5}[grade]||0;for(let i=0;i<n;i++)rect(.12,.5+(i-(n-1)/2)*.15-.04,.76,.08,grade==='Lieutenant-colonel'&&i%2?gold:silver);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();geometries.set(grade,g);return g;
}
export function applyPersonInsignia(model,person,profile=state?.playerProfile){
 if(!model||!person){if(model?.userData.rankPatch)model.userData.rankPatch.visible=false;return;}
 const identity=crewIdentity(person,profile),grade=identity.grade;let patch=model.userData.rankPatch;
 if(!patch){patch=new T.Mesh(geometry(grade).clone(),material);patch.userData.grade=grade;patch.name='Galon de poitrine';patch.position.set(.085,1.25,.245);model.add(patch);model.userData.rankPatch=patch;}
 if(patch.userData.grade!==grade){patch.geometry.dispose();patch.geometry=geometry(grade).clone();patch.userData.grade=grade;}
 patch.visible=true;model.userData.personId=person.id;model.userData.personGrade=grade;
}
export function applyEngineInsignia(model,engine,index=0){
 const ids=engine?.crewIds||[],roster=engine?.localVolunteer?engine.localCrew:state?.roster;
 const command=['FPT','CCF','EPA'].includes(engine?.kind);
 const hasChief=engine?.kind&&!['VLCG','VLI'].includes(engine.kind);
 let ordered=ids;if(hasChief&&ids.length){const key=ids.join(':');if(engine.commandCrewKey!==key){const leader=ids.reduce((best,id)=>{const a=roster?.find(p=>p.id===best),b=roster?.find(p=>p.id===id);return b&&(!a||crewIdentity(b,state?.playerProfile).rank>crewIdentity(a,state?.playerProfile).rank)?id:best;},ids[0]);engine.commandCrewOrder=[leader,...ids.filter(id=>id!==leader)];engine.commandCrewKey=key;}ordered=engine.commandCrewOrder;}
 const id=ordered[index%Math.max(1,ordered.length)],person=roster?.find(p=>p.id===id);
 if(command&&index===0)markChief(model);
 applyPersonInsignia(model,person);
 const color=person?.role==='captain'||engine?.kind==='VLCG'?'white':hasChief&&index===0?'yellow':'orange';
 setHighVisibility(model,state?.calls?.some(c=>c.id===engine?.call&&c.status!=='closed'),color);
}

const vestMaterials={white:new T.MeshStandardMaterial({color:'#f0f1e9',roughness:.85}),yellow:new T.MeshStandardMaterial({color:'#dbe83d',roughness:.85}),orange:new T.MeshStandardMaterial({color:'#ef832a',roughness:.85}),stripe:new T.MeshStandardMaterial({color:'#e4e9df',roughness:.55})};
for(const m of Object.values(vestMaterials))m.userData.shared=true;
export function setHighVisibility(model,enabled,color='yellow'){
 if(!model)return;let vest=model.userData.highVisibility;
 if(!vest&&enabled){vest=new T.Group();vest.name='Gilet haute visibilité';model.add(vest);model.userData.highVisibility=vest;
 const add=(w,h,d,x,y,z,material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);vest.add(mesh);return mesh;};
 vest.userData.body=add(.57,.59,.42,0,1.1,0,vestMaterials[color]);
 for(const y of [.91,1.05])add(.585,.055,.435,0,y,0,vestMaterials.stripe);
 for(const x of [-.18,.18])for(const z of [-.217,.217])add(.045,.27,.01,x,1.245,z,vestMaterials.stripe);
 }
 if(vest){vest.visible=!!enabled;vest.userData.body.material=vestMaterials[color]||vestMaterials.yellow;vest.userData.color=color;}
 if(model.userData.rankPatch)model.userData.rankPatch.position.z=.245;
}

// Game convention: yellow command helmet and a radio, retaining actual rank/EPI.
const chiefYellow=new T.MeshStandardMaterial({color:'#e6b830',roughness:.45});chiefYellow.userData.shared=true;
const chiefBlack=new T.MeshStandardMaterial({color:'#253139',roughness:.8});chiefBlack.userData.shared=true;
function markChief(model){
 if(!model||model.userData.chiefMarked)return;model.userData.chiefMarked=true;model.userData.operationalRole='chef-agres';model.name='Chef d’agrès';
 const helmet=model.userData.interventionHelmet;
 if(helmet){const shell=helmet.children[0]?.material;for(const part of helmet.children)if(part.isMesh&&part.material===shell)part.material=chiefYellow;}
 const add=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);model.add(o);return o;};
 add(.15,.23,.09,-.17,1.22,.205,chiefBlack).name='Radio chef d’agrès';add(.018,.18,.018,-.21,1.42,.205,chiefBlack);
 for(const x of[-.2,.2])add(.14,.035,.3,x,1.425,0,chiefYellow).name='Repère de fonction';
}
