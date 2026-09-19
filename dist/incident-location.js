import {block,roads,projectRoad} from './roads.js';
import {BEACH} from './beach-layout.js';
const roadAccess=p=>roads.filter(r=>!r.trail&&!r.express&&!r.name.includes('(simulation)')).map(r=>({road:r,point:projectRoad(p,r)})).sort((a,b)=>Math.hypot(a.point[0]-p[0],a.point[1]-p[1])-Math.hypot(b.point[0]-p[0],b.point[1]-p[1]))[0];
const sideOfRoad=(point,r,distance)=>{const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],length=Math.hypot(dx,dz)||1;return[point[0]+dz/length*distance,point[1]-dx/length*distance];};
export function locateIncident(c,random=Math.random){
 if(c.waterRescue)return;
 // Older incidents without metadata retain their supplied road coordinates.
 if(!c.setting&&(c.type==='AVP'||c.name==='Feu de véhicule'||c.name==='Branche sur la chaussée'||c.requires==='CCF'))return;
 const setting=c.setting||(c.name==='Blessure au stade'?'stadium':/commercial|commerce/.test(c.name)?'mall':/Ascenseur|appartement/.test(c.name)?'tower':'home');
 if(setting==='beach'){c.target=BEACH.spots[Math.min(BEACH.spots.length-1,Math.floor(random()*BEACH.spots.length))].slice();c.actionPoint=c.target.slice();c.accessTarget=BEACH.access.slice();c.address=BEACH.name+' · sur le sable';c.site={kind:'beach',height:0,position:c.target.slice()};return;}
 if(['road','express'].includes(setting)){c.site={kind:'road',height:0};return;}
 if(setting==='forest'){
  const r=roads.filter(r=>r.trail).map(r=>({r,p:projectRoad(c.target,r)})).sort((a,b)=>Math.hypot(a.p[0]-c.target[0],a.p[1]-c.target[1])-Math.hypot(b.p[0]-c.target[0],b.p[1]-c.target[1]))[0];
  c.accessTarget=r.p;c.actionPoint=sideOfRoad(r.p,r.r,9);c.site={kind:'forest',height:0,position:c.actionPoint.slice()};return;
 }
 if(['sidewalk','roadside'].includes(setting)){
  const access=roadAccess(c.target),r=access.road;
  c.accessTarget=access.point;c.target=sideOfRoad(access.point,r,setting==='sidewalk'?7.2:6.8);c.actionPoint=c.target.slice();
  c.site={kind:setting,height:0,position:c.target.slice(),yaw:Math.atan2(r.b[0]-r.a[0],r.b[1]-r.a[1])};c.address=r.name;return;
 }
 if(setting==='stadium'){c.target=[325,95];c.actionPoint=c.target.slice();const access=roadAccess(c.target);c.accessTarget=access.point;c.address='Stade municipal · terrain de sport';c.site={kind:'stadium',height:0};return;}
 const styles={home:['house','town'],garden:['house'],mall:['mall'],tower:['tower'],office:['civic'],shop:['town']}[setting]||['house','town'];
 const candidates=block.buildings.filter(b=>styles.includes(b.style));
 const b=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];if(!b)return;
 const position=[b.x,b.z],access=roadAccess(position),dx=access.point[0]-b.x,dz=access.point[1]-b.z;
 const k=1/Math.max(Math.abs(dx)/(b.w/2),Math.abs(dz)/(b.d/2),.001),edge=[b.x+dx*k,b.z+dz*k],len=Math.hypot(dx,dz)||1;
 c.target=position;c.accessTarget=access.point;c.actionPoint=[edge[0]+dx/len,edge[1]+dz/len];
 const place=setting==='garden'?'Jardin de l’habitation':/cave/.test(c.name)?'Cave du bâtiment':/garage|Garage/.test(c.name)?'Garage de l’habitation':/Ascenseur/.test(c.name)?'Ascenseur de l’immeuble':setting==='office'?'Bureaux':setting==='shop'?'Local commercial':b.style==='mall'?'Centre commercial':b.style==='tower'?'Immeuble':'Habitation';
 c.site={kind:setting==='garden'?'garden':'building',height:Math.min(27,b.levels*3),style:b.style,position,width:b.w,depth:b.d,yaw:Math.atan2(dx,dz)};c.address=place+' · '+access.road.name;
}
