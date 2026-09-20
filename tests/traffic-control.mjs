import assert from 'node:assert/strict';
import {createTrafficControl} from '../dist/traffic-control.js';
import {clearMove,footprint,overlaps} from '../dist/vehicle-spacing.js';
const model=(x,z,yaw,length,kind)=>({position:{x,z},rotation:{y:yaw},userData:{length,kind},scale:{x:1},visible:true});
const routes=[[[2.1,65],[2.1,-65]],[[-2.1,-65],[-2.1,65]],[[-65,2.1],[65,2.1]],[[65,-2.1],[-65,-2.1]]];
const actors=routes.map(([a,b],i)=>({id:i,status:'enroute',segment:1,path:[a,b],model:model(...a,Math.atan2(b[0]-a[0],b[1]-a[1]),[9.05,8.4,6.25,4.45][i],['CCF','EPA','VSAV','VLCG'][i])}));
const control=createTrafficControl([[0,0]]),order=[];
for(let tick=0;tick<1200&&actors.some(v=>v.path);tick++){
 control.update(actors,tick*.1);
 for(const v of actors){if(!v.path)continue;const p=v.model.position,t=v.path[1],d=Math.hypot(t[0]-p.x,t[1]-p.z),step=Math.min(1,d),x=p.x+(t[0]-p.x)*step/d,z=p.z+(t[1]-p.z)*step/d;
 if(control.reason(v,x,z)||!clearMove(v.model,x,z,v.model.rotation.y,actors.map(v=>v.model)))continue;
 p.x=x;p.z=z;if(d<=step){order.push(v.id);v.path=null;}
 }
 for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++)assert(!overlaps(footprint(actors[i].model),footprint(actors[j].model)));
}
assert.equal(order.length,4,'Four approaches must all clear the junction without recovery');
const a={id:'A',status:'departing',wasAtStation:true,departAt:0,model:model(-84,62,Math.PI/2,9.05,'CCF')},b={id:'B',status:'departing',wasAtStation:true,departAt:0,model:model(-84,92,Math.PI/2,8.4,'EPA')};
control.update([a,b],1);assert(control.stationGranted(a));a.status='ready';control.update([a,b],1);assert(control.stationGranted(b),'Cancellation releases the reservation');b.status='ready';control.update([a,b],1);assert(!control.stationGranted(b));
const normal={id:'civil',status:'traffic',segment:1,path:[[-40,2.1],[40,2.1]],model:model(-40,2.1,Math.PI/2,4.45,'car')};
const urgent={id:'VSAV 1',status:'enroute',beacons:true,segment:1,path:[[2.1,-40],[2.1,40]],model:model(2.1,-40,0,6.25,'VSAV')};
const priorityControl=createTrafficControl([[0,0]]);priorityControl.update([normal],0);assert.equal(priorityControl.records.get('junction-0').owner,normal);
priorityControl.update([normal,urgent],1);assert.equal(priorityControl.records.get('junction-0').owner,urgent,'An emergency vehicle using blue lights takes the junction before waiting civilian traffic');
console.log('PASS four conflicting approaches, no overlap, emergency junction priority, FIFO station queue and cancellation');
