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
 if(!patch){patch=new T.Mesh(geometry(grade).clone(),material);patch.userData.grade=grade;patch.name='Galon de poitrine';patch.position.set(.085,1.25,.19);model.add(patch);model.userData.rankPatch=patch;}
 if(patch.userData.grade!==grade){patch.geometry.dispose();patch.geometry=geometry(grade).clone();patch.userData.grade=grade;}
 patch.visible=true;model.userData.personId=person.id;model.userData.personGrade=grade;
}
export function applyEngineInsignia(model,engine,index=0){
 const ids=engine?.crewIds||[],id=ids[index%Math.max(1,ids.length)],person=(engine?.localVolunteer?engine.localCrew:state?.roster)?.find(p=>p.id===id);
 applyPersonInsignia(model,person);
}
