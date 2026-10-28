import {person,box,cylinder} from './models.js';
export function diverResponder(parent,x=0,z=0){
 const g=person(parent,x,z,'#202d35');g.name='Plongeur · combinaison et gilet de flottabilité';g.userData.uniform='diver';
 box(g,.57,.45,.37,'#e78d35',0,1.14,0);for(const x of[-.2,.2])box(g,.07,.43,.39,'#242e35',x,1.15,0);
 cylinder(g,.125,.125,.65,'#bdcccd',0,1.1,-.33,10);box(g,.34,.16,.055,'#24343b',0,1.69,.22);box(g,.25,.09,.02,'#8bafb4',0,1.71,.26);
 cylinder(g,.035,.035,.26,'#1d292f',-.14,1.34,.26,6);for(const x of[-.16,.16])box(g,.22,.06,.42,'#1c2b31',x,.11,.12);
 return g;
}
