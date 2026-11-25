// VL CODIS : voiture du chef de salle, stationnée devant la salle opérationnelle. Elle est
// distincte du VLCG : ni le même véhicule, ni le même personnage, ni le même équipage.
import {vehicle,captain,sign,box,setInterventionHelmet} from './models.js';
import {setHighVisibility} from './crew-insignia.js';
import {operationsRoom} from './operations-room.js';
import {roads,projectRoad} from './roads.js';

export const SALLE_VEHICLE='VL CODIS';
export const isSalleVehicle=e=>e?.kind==='VLCS';
// Place de stationnement entre la façade et la rue la plus proche, nez vers la rue.
export function salleParking(room=operationsRoom()){
 const b=room.building,c=[b.x,b.z];
 const street=roads.filter(r=>!r.trail&&!r.ramp&&!r.name.includes('(simulation)')).map(r=>projectRoad(c,r)).sort((p,q)=>Math.hypot(p[0]-c[0],p[1]-c[1])-Math.hypot(q[0]-c[0],q[1]-c[1]))[0];
 const d=Math.hypot(street[0]-c[0],street[1]-c[1]),dir=[(street[0]-c[0])/d,(street[1]-c[1])/d];
 return {point:[street[0]-dir[0]*10.5,street[1]-dir[1]*10.5],yaw:Math.atan2(dir[0],dir[1]),street,dir};
}
export function salleSpec(){const p=salleParking();return {id:SALLE_VEHICLE,kind:'VLCS',size:1,home:p.point,baseYaw:p.yaw,external:true,salleOnly:true,base:'CODIS',mobilization:1,name:'Voiture du chef de salle · commandement sur place'};}
export function salleModel(world){
 const g=vehicle(world,'VLCG','#e9ecea',{serviceCar:true});
 Object.assign(g.userData,{kind:'VLCS',playerVehicle:undefined});g.name='VL CODIS · chef de salle';
 // Berline blanche à bande rouge et bleue : aucune confusion avec le VLCG rouge.
 for(const side of[-1,1]){
  box(g,.02,.16,3.3,'#a3242c',side*.955,.82,-.1);box(g,.02,.06,3.3,'#1d4f91',side*.955,.71,-.1);
  const plate=sign(g,'CODIS 41',1.3,.26,side*.972,.98,-.15,'#a3242c','#f4efe6');plate.rotation.y=side*Math.PI/2;
 }
 return g;
}
export function buildSalleParking(world){
 const p=salleParking(),yaw=p.yaw,pad=box(world,3.4,.04,14,'#6d7574',p.point[0]+p.dir[0]*3,.1,p.point[1]+p.dir[1]*3);pad.rotation.y=yaw;pad.castShadow=false;
 const mark=sign(world,'CODIS',2.2,.7,p.point[0]-p.dir[0]*2.9,.14,p.point[1]-p.dir[1]*2.9,'#a3242c','#f4efe6');mark.rotation.set(-Math.PI/2,0,yaw);
}
// Intervention que le chef de salle mène sur place : seulement une fois arrivé.
export const salleCallOf=(state,engines)=>state.role==='salle'?engines.find(e=>isSalleVehicle(e)&&e.status==='scene'&&e.call!=null)?.call??null:null;
export function syncSalle(state,engines){
 const e=engines.find(isSalleVehicle);if(!e)return;
 e.salleActive=state.role==='salle';state.salleCall=salleCallOf(state,engines);
}
// Le chef de salle, gilet blanc, se tient près de sa voiture sur les lieux.
export function updateSalleOfficer(world,state,engines){
 const e=engines.find(isSalleVehicle);if(!e)return;
 const here=e.status==='scene'&&state.calls.some(c=>c.id===e.call&&c.status!=='closed');
 if(!e.officer&&!here)return;
 e.officer??=captain(world,0,0,{name:'Chef de salle',grade:'captain',outfit:'station'});
 e.officer.visible=here;if(!here)return;
 setHighVisibility(e.officer,true,'white');setInterventionHelmet(e.officer,true);
 e.officer.position.set(e.model.position.x+2.6,.3,e.model.position.z+1.6);
}
