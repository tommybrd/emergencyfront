import * as T from 'three';
export function advanceForest(c,trees,neighbors,damage,minutes,wind=0,flow=0){
 if(c.status==='closed'||c.fireContained||c.progress>=1||minutes<=0)return;
 let fire=c.forestFire;
 if(!fire){const origin=c.actionPoint||c.target;if(!origin)return;let nearest=-1,distance=Infinity;trees.forEach((t,i)=>{const d=Math.hypot(t.x-origin[0],t.z-origin[1]);if(d<distance&&(damage[i]||0)<.98){nearest=i;distance=d;}});if(nearest<0||distance>40)return;fire=c.forestFire={cells:{[nearest]:{burn:damage[nearest]||0,heat:1}},elapsed:0};}
 const cells=fire.cells,pending=new Map(),water=Math.min(.95,flow/1400),intensity=Math.max(.05,1-(c.progress||0));
 for(const [key,cell]of Object.entries(cells)){
  if(cell.burn>=1||cell.heat<1)continue;const id=Number(key),tree=trees[id];if(!tree)continue;
  cell.burn=Math.min(1,cell.burn+minutes/28*(1-water*.6));damage[id]=Math.max(damage[id]||0,cell.burn);
  for(const other of neighbors[id]||[]){if((damage[other]||0)>=.98||cells[other]?.heat>=1)continue;const t=trees[other],dx=t.x-tree.x,dz=t.z-tree.z,d=Math.hypot(dx,dz),direction=(dx*Math.cos(c.fireFront?.direction||0)+dz*Math.sin(c.fireFront?.direction||0))/(d||1),bias=wind?Math.max(.25,1+direction*1.5):1;
   const heat=minutes*.24*Math.max(.08,1-d/14)*bias*(1-water)*intensity;
   pending.set(other,(pending.get(other)||0)+heat);
  }
 }
 for(const [id,heat]of pending){const cell=cells[id]??={burn:damage[id]||0,heat:0};cell.heat=Math.min(1,cell.heat+heat);}
 // Water cools trees that have not yet ignited; char remains after extinction.
 if(water)for(const cell of Object.values(cells))if(cell.heat<1)cell.heat=Math.max(0,cell.heat-minutes*water*.045);
 fire.burning=Object.values(cells).filter(v=>v.heat>=1&&v.burn<1).length;
 fire.consumed=Object.values(cells).filter(v=>v.burn>=1).length;
 if(!fire.burning){c.forestExhausted=true;c.progress=Math.max(c.progress||0,.85);}
}
export function createForestFire(world){
 const trees=[];world.updateMatrixWorld(true);world.traverse(o=>{if(o.userData.treeClearance&&o.position.z<-70){const p=o.getWorldPosition(new T.Vector3());trees.push({x:p.x,z:p.z,height:5*o.scale.y,model:o,parts:o.userData.fuelParts||[]});}});
 const grid=new Map(),key=(x,z)=>Math.floor(x/14)+','+Math.floor(z/14);
 trees.forEach((t,i)=>{const k=key(t.x,t.z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);});
 const neighbors=trees.map((t,i)=>{const ids=[],x=Math.floor(t.x/14),z=Math.floor(t.z/14);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const j of grid.get((x+dx)+','+(z+dz))||[])if(j!==i&&Math.hypot(t.x-trees[j].x,t.z-trees[j].z)<14)ids.push(j);return ids;});
 const flames=new T.InstancedMesh(new T.ConeGeometry(1,4,5),new T.MeshBasicMaterial({color:'#ff9435',transparent:true,opacity:.9}),Math.max(1,trees.length));flames.count=0;flames.frustumCulled=false;world.add(flames);
 const smoke=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#47483f',transparent:true,opacity:.55}),Math.max(1,trees.length));smoke.count=0;smoke.frustumCulled=false;world.add(smoke);
 const scorch=new T.InstancedMesh(new T.CircleGeometry(1,8),new T.MeshBasicMaterial({color:'#302d24',transparent:true,opacity:.65,depthWrite:false}),Math.max(1,trees.length));scorch.count=0;scorch.frustumCulled=false;world.add(scorch);
 const dummy=new T.Object3D(),color=new T.Color(),matrix=new T.Matrix4(),scale=new T.Vector3(),shown=new Map();
 function tick(state,engines,minutes){state.forestDamage??={};for(const c of state.calls){if(c.type!=='INC'||!(c.requires==='CCF'||['forest','vegetation'].includes(c.scene)))continue;c.forestTick=(c.forestTick||0)+minutes;if(c.forestTick<.5)continue;const dt=c.forestTick;c.forestTick=0;advanceForest(c,trees,neighbors,state.forestDamage,dt,state.conditions?.key==='wind'?1:0,engines.filter(e=>e.call===c.id&&e.status==='scene').reduce((n,e)=>n+(e.flow||0),0));}}
 let lastTime=-1,lastActive="";
 function visuals(state,time){
  let dirty=false;
  for(const [key,burn]of Object.entries(state.forestDamage||{})){if(shown.get(key)===burn)continue;shown.set(key,burn);dirty=true;const t=trees[Number(key)];if(!t)continue;
   color.setRGB(1-burn*.88,1-burn*.92,1-burn*.92);
   for(const p of t.parts){p.mesh.setColorAt(p.index,color);p.mesh.instanceColor.needsUpdate=true;const shrink=p.crown?Math.max(.001,1-burn):1-burn*.28;matrix.copy(p.base).scale(scale.set(shrink,shrink,shrink));p.mesh.setMatrixAt(p.index,matrix);p.mesh.instanceMatrix.needsUpdate=true;}
  }
  if(dirty){let groundCount=0;for(const [key,burn]of Object.entries(state.forestDamage||{})){const t=trees[Number(key)];if(!t)continue;dummy.position.set(t.x,.2,t.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(t.height*.45*Math.sqrt(burn));dummy.updateMatrix();scorch.setMatrixAt(groundCount++,dummy.matrix);}scorch.count=groundCount;scorch.instanceMatrix.needsUpdate=true;}
  const active=state.calls.map(c=>[c.id,c.status,c.fireContained,c.forestFire?.burning,c.forestFire?.consumed].join(":" )).join("|");
  if(!dirty&&time===lastTime&&active===lastActive)return;lastTime=time;lastActive=active;
  let count=0;const visible=new Set();for(const c of state.calls){if(c.status==='closed'||c.fireContained)continue;for(const [key,cell]of Object.entries(c.forestFire?.cells||{})){const id=Number(key),t=trees[id];if(!t||cell.heat<1||cell.burn>=1||visible.has(id))continue;visible.add(id);const life=1-cell.burn,pulse=.85+Math.sin(time*7+id)*.15;
   dummy.position.set(t.x,t.height*.45,t.z);dummy.rotation.set(0,time*.25+id,0);dummy.scale.set(1.2*pulse,Math.max(.2,t.height*.3*life),1.2*pulse);dummy.updateMatrix();flames.setMatrixAt(count,dummy.matrix);
   const drift=(time*.35+id*.13)%1;dummy.position.set(t.x+(state.conditions?.key==='wind'?drift*8:0),t.height+drift*8,t.z);dummy.scale.setScalar(1+drift*2);dummy.updateMatrix();smoke.setMatrixAt(count,dummy.matrix);count++;
  }}flames.count=smoke.count=count;flames.instanceMatrix.needsUpdate=true;smoke.instanceMatrix.needsUpdate=true;
 }
 return {tick,visuals,trees,neighbors};
}
