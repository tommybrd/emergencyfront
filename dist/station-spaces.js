import * as T from 'three';
import {box,cylinder,sign} from './models.js';
import {batchStatic} from './batching.js';
export function stationSpaces(parent){
 const root=new T.Group();root.name='Espaces de vie et tour de manœuvre';parent.add(root);
 // Dormitory separated from living rooms by a corridor and two door openings.
 for(const [x,w]of[[-87,10],[-68,20],[-50,4]])box(root,w,3.5,.22,'#d4d9c9',x,1.95,39.5);
 for(const x of[-77,-59]){for(const side of[-1,1])box(root,.15,2.5,.35,'#647d76',x+side*1.2,1.5,39.5);box(root,2.55,.15,.35,'#647d76',x,2.8,39.5);}
 box(root,.22,3.5,12,'#c8d2c2',-60,1.95,48);
 for(const x of[-87,-81,-75,-69,-63,-57]){box(root,3.4,1.5,.12,'#527575',x,2.4,12.3);box(root,3.7,.1,.3,'#e5eadf',x,1.6,12.4);}
 for(const [label,x,z]of[['DORTOIR',-70,38.9],['RÉFECTOIRE',-70,54],['VESTIAIRES',-54,54]]){const plaque=sign(root,label,label==='VESTIAIRES'?8:11,.6,x,3,z,'#345e5d');plaque.name=label;}
 box(root,44,.2,3,'#728a80',-70,4.25,13.5);box(root,44,.2,3,'#728a80',-70,4.25,54.5);
 for(const x of[-91.8,-48.2])box(root,2, .2,40,'#728a80',x,4.25,34);
 const tower=new T.Group();root.add(tower);tower.position.z=-27;
 // Training tower: four landings, open drill windows and a roof guardrail.
 box(tower,13,.18,17,'#8f9d91',-103,.2,63);box(tower,9.5,20,9,'#aab9ae',-103,10.2,59);
 for(let level=0;level<4;level++){const y=2.6+level*4.5;for(const x of[-105,-101]){box(tower,1.5,2.2,.08,'#263d42',x,y,63.55);box(tower,1.9,.16,.35,'#dde3d2',x,y-1.13,63.65);}box(tower,9.9,.25,9.4,'#788e86',-103,5+level*4.5,59);}
 box(tower,10,.25,9.5,'#657e75',-103,20.4,59);
 for(const x of[-107.7,-98.3])box(tower,.1,1.1,9.3,'#d1d9cd',x,21,59);
 for(const z of[54.4,63.6])box(tower,9.5,1.1,.1,'#d1d9cd',-103,21,z);
 for(const x of[-107,-105.9])cylinder(tower,.045,.045,19,'#c3ceca',x,10,64.1,6);
 for(let i=0;i<38;i++)box(tower,1.2,.055,.08,'#c3ceca',-106.45,.7+i*.5,64.1);
 sign(tower,'TOUR DE MANŒUVRE',10,.65,-103,4.2,63.85,'#a83d32');
 for(const [x,z]of[[-107,71],[-101,71]]){box(tower,1.4,.16,1.4,'#ba4a35',x,.3,z);cylinder(tower,.25,.3,.8,'#d8a155',x,.8,z,8);}
 batchStatic(root);return root;
}
