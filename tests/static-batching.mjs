import assert from 'node:assert/strict';
import * as T from 'three';
import {referencedObjects,snapshotStatic,batchStatic,pruneShadowCasters} from '../dist/static-batching.js';
import {person,mat} from '../dist/models.js';

// Une carrosserie : trois pièces fixes de même matériau, une roue référencée, une pièce nommée, une pièce animée.
const root=new T.Group(),body=new T.Group();root.add(body);body.position.set(10,0,5);
const paint=mat('#c33'),parts=[0,1,2].map(i=>{const m=new T.Mesh(new T.BoxGeometry(1,1,1),paint);m.position.set(i*2,1,0);body.add(m);return m;});
const wheel=new T.Mesh(new T.CylinderGeometry(.4,.4,.3),paint);body.add(wheel);body.userData.wheels=[wheel];
const named=new T.Mesh(new T.BoxGeometry(1,1,1),paint);named.name='Porte';body.add(named);
const moving=new T.Mesh(new T.BoxGeometry(1,1,1),paint);body.add(moving);
const walker=person(root,0,0);const walkerParts=walker.children.length;
root.updateMatrixWorld(true);
const before=new T.Box3().setFromObject(body);
const refs=referencedObjects(root),shots=snapshotStatic(root,refs);
moving.position.x=8;// animée par le jeu entre la photo et la fusion
const result=batchStatic(root,refs,shots);
assert.equal(result.removed,3,'seules les trois pièces fixes anonymes sont fusionnées');
assert.equal(result.added,1);
assert(body.children.includes(wheel)&&body.children.includes(named)&&body.children.includes(moving),'roue référencée, pièce nommée et pièce animée restent séparées');
assert(!parts.some(p=>p.parent),'les pièces fusionnées quittent la scène');
const merged=body.children.find(o=>o.userData.staticBatch);assert.equal(merged.material,paint,'le matériau partagé est conservé');
root.updateMatrixWorld(true);
assert.deepEqual([...new T.Box3().setFromObject(merged).min.toArray()].map(v=>+v.toFixed(4)),[9.5,.5,4.5].map(v=>+v.toFixed(4)),'géométrie fusionnée à la même place');
assert(before.max.x>=new T.Box3().setFromObject(merged).max.x,'aucun débordement');
assert.equal(walker.children.length,walkerParts,'les personnages articulés ne sont jamais fusionnés');
body.position.x=50;root.updateMatrixWorld(true);assert(new T.Box3().setFromObject(merged).min.x>49,'le bloc suit son parent');

// Ombres : un marquage au sol ne projette plus d'ombre, un mur garde la sienne.
const ground=new T.Group(),mark=new T.Mesh(new T.BoxGeometry(3,.02,.2),paint),wall=new T.Mesh(new T.BoxGeometry(4,3,.2),paint);
mark.castShadow=wall.castShadow=true;ground.add(mark,wall);
assert.equal(pruneShadowCasters(ground),1);assert.equal(mark.castShadow,false);assert.equal(wall.castShadow,true);
console.log('PASS fusion des pièces fixes : références, noms, animations et personnages préservés ; ombres des pièces plates retirées');
