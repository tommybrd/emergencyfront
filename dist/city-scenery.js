import * as T from 'three';
import {createBeach} from './beach-scenery.js';
import {lakeEdge,onBeach} from './beach-layout.js';
import {box,cylinder,sign,mat,tree,vehicle} from './models.js';
export function cityScenery(root){
box(root,13,.12,5,'#a7a58b',110,.22,-155);sign(root,'MISE À L’EAU',5,.7,116,1.7,-159,'#315b6b','#ffffff');
// Place centrale : terrasses, fontaine et petits commerces.
for(const x of[35,105]){box(root,24,.1,5,'#c9c0a8',x,.28,-20);cylinder(root,2.4,2.6,.55,'#bdbaa7',x,.6,-20,24);cylinder(root,2.1,2.1,.09,'#6bacae',x,.92,-20,24);}
for(const x of[22,93,118]){const s=sign(root,x===22?'BOULANGERIE':x===93?'CAFÉ DE LA PLACE':'PHARMACIE',14,.8,x,3,-.8,x===118?'#4f7963':'#796051');for(let i=0;i<2;i++){cylinder(root,.9,.9,.15,'#b68e62',x-4+i*7,.95,1,12);box(root,1.1,.1,.7,'#746d58',x-4+i*7,.55,2.3);}}
// Quartiers résidentiels : toits inclinés et balcons des immeubles.
for(const x of[25,57,93,123])for(const z of[60,93,125]){if(x===25&&z===125)continue;const shape=new T.Shape();shape.moveTo(-9,0);shape.lineTo(0,3.3);shape.lineTo(9,0);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:16,bevelEnabled:false}),m=new T.Mesh(geo,mat('#976b54'));m.position.set(x,6.1,z-8);root.add(m);box(root,22,.07,22,'#a0aa79',x,.04,z);tree(root,x+10,z+8,.7,1);}
// Centre commercial : grandes vitrines, enseigne, parking et chariots.
sign(root,'LES TERRASSES • CENTRE COMMERCIAL',78,2.7,206,6.8,111,'#356671');box(root,87,3.2,.2,'#3c6570',206,2,110.7);for(let x=165;x<250;x+=8)box(root,.18,3.3,.4,'#c1d0c9',x,2,111);box(root,103,.12,29,'#697374',209,.16,135);for(let x=164;x<254;x+=6){for(const z of[124,145]){box(root,.12,.025,7,'#e5e0bc',x,.24,z);if((x+z)%4===0){const car=vehicle(root,'VLCG',['#728b8f','#b6b1a1','#965c4c'][Math.floor(x)%3]);car.position.set(x+2.5,.3,z);car.scale.setScalar(.85);car.userData.beacons.forEach(b=>b.visible=false);}}}box(root,12,2.5,3,'#6c9094',256,1.4,112);sign(root,'ENTRÉE',9,1,206,3,111.3,'#477e84');
// Lac aux contours irréguliers, sentier et forêt dense.
const lakeShape=new T.Shape();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;const [x,z]=lakeEdge(a);i?lakeShape.lineTo(x,-z):lakeShape.moveTo(x,-z);}const shore=new T.Mesh(new T.ShapeGeometry(lakeShape),mat('#c2b795'));shore.rotation.x=-Math.PI/2;shore.position.y=.1;root.add(shore);const water=shore.clone();water.material=new T.MeshStandardMaterial({color:'#4d909c',roughness:.24,metalness:.35});water.scale.set(.94,.94,1);water.position.set(4.2,.16,-9.48);root.add(water);box(root,4,.25,15,'#997a55',77,.5,-131);for(const x of[75.3,78.7])for(const z of[-137,-130])cylinder(root,.1,.12,1.7,'#79614b',x,.9,z,6);
for(let i=0;i<180;i++){const x=-95+((i*47)%225),z=-200+((i*31)%99);if(((x-70)/45)**2+((z+158)/34)**2<1.2||Math.abs(x)<11||Math.abs(x-140)<10||onBeach([x,z],.25)||(x>110&&x<135&&z>-175&&z<-125))continue;tree(root,x,z,1+((i*7)%10)/12,i%4);}
// Stade : terrain rayé, marquage réglementaire stylisé, cages et tribunes.
box(root,63,.15,108,'#a57865',320,.1,96);box(root,53,.15,91,'#527f4e',320,.2,96);for(let i=0;i<10;i++)box(root,50,.03,8.5,i%2?'#659553':'#56864e',320,.3,56+i*8.6);for(const x of[295,345])box(root,.15,.025,86,'#eef0da',x,.34,96);for(const z of[53,96,139])box(root,50,.025,.15,'#eef0da',320,.34,z);const ring=new T.Mesh(new T.RingGeometry(7.4,7.6,48),new T.MeshBasicMaterial({color:'#eef0da',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(320,.35,96);root.add(ring);for(const z of[53,139]){for(const x of[317,323])box(root,.12,2.6,.12,'#efeee0',x,1.6,z);box(root,6,.12,.12,'#efeee0',320,2.9,z);for(const x of[310,330])box(root,.13,.025,13,'#eef0da',x,.35,z===53?59.5:132.5);box(root,20,.025,.13,'#eef0da',320,.35,z===53?66:126);}for(let j=0;j<4;j++)box(root,45,1+j*.8,2,'#b2b5a6',320,.6+j*.4,144+j*2);box(root,48,.25,9,'#52747c',320,6,148);sign(root,'STADE MUNICIPAL',27,1.4,320,2,151.06,'#3f6d66');
// Rocade : deux chaussées, terre-plein et glissières.
for(const z of[-226,-214])box(root,360,.06,5.7,'#505b61',180,.29,z);box(root,360,.15,1.5,'#8e9a80',180,.32,-220);for(const z of[-229,-211])box(root,360,.45,.14,'#a2b3b3',180,.9,z);for(let x=8;x<355;x+=9)for(const z of[-225,-215])box(root,4,.025,.13,'#e8e5ce',x,.34,z);sign(root,'ROCADE NORD →',32,2,210,5,-218,'#34776c');for(const x of[194,226])box(root,.2,5,.2,'#91a5a1',x,2.5,-218);
return createBeach(root);
}
