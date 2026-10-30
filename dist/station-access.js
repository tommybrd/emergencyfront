import {MAIN_BAYS} from './station-layout.js';
// Geometry and walking share the same openings. Dimensions are in world metres.
export const STAFF_LOCKER=[-54,51],STAFF_SIDE_GATE=[-30,54];
export const STAFF_ENTRY_ROUTE=[[-28,114],[-28,54],[-32,54],[-46.5,52],[-49,52],STAFF_LOCKER];
export const STAFF_DOORS=[{x:-48,z:52,axis:'z',width:2.4},{x:-54,z:56,axis:'x',width:2.4},{x:-70,z:56,axis:'x',width:2.4},{x:-77,z:39.5,axis:'x',width:2.4},{x:-59,z:39.5,axis:'x',width:2.4}];
const wall=(x,z,w,d,h=3.8)=>({x,z,w,d,h});
export const LIVING_WALLS=[wall(-70,12,44,.45),wall(-92,34,.45,44),wall(-48,31.4,.45,38.8),wall(-48,54.6,.45,2.8),...splitWall(-92,-48,56,[-70,-54],2.4,3.8)];
export const ROOM_WALLS=[...splitWall(-92,-48,39.5,[-77,-59],2.4,3.5),wall(-60,48,.22,12,3.5)];
function splitWall(start,end,z,doors,width,h){const result=[];let x=start;for(const door of doors){result.push(wall((x+door-width/2)/2,z,door-width/2-x,.22,h));x=door+width/2;}result.push(wall((x+end)/2,z,end-x,.22,h));return result;}
export const STATION_FENCES=[[[ -110,10],[-110,103]],[[-110,10],[-30,10]],[[-30,10],[-30,52.5]],[[-30,55.5],[-30,103]],[[-110,103],[-78,103]],[[-62,103],[-41,103]],[[-37,103],[-30,103]]];
export const bayStaffDoor=bay=>[bay.x+1.95,59];
export function rearBayWalls(bay){const x=bay.x;return[wall(x-.7,59,4,.3,5.6),wall(x+2.65,59,.1,.3,5.6)];}
// Closed shutters, walls and parked vehicle envelopes are impassable to people.
export const STATION_WALK_OBSTACLES=[...LIVING_WALLS,...ROOM_WALLS,
 ...STATION_FENCES.map(([a,b])=>wall((a[0]+b[0])/2,(a[1]+b[1])/2,Math.max(.1,Math.abs(a[0]-b[0])),Math.max(.1,Math.abs(a[1]-b[1])))),
 ...MAIN_BAYS.flatMap(b=>[...rearBayWalls(b),wall(b.x,77.5,5.4,.2),wall(b.x,70,2.65,12),...[-1,1].map(side=>wall(b.x+side*2.7,68.25,.16,18.5))])];
const radius=.30,boxes=STATION_WALK_OBSTACLES.map(b=>[b.x-b.w/2-radius,b.z-b.d/2-radius,b.x+b.w/2+radius,b.z+b.d/2+radius]);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const inside=(p,b)=>p[0]>b[0]&&p[0]<b[2]&&p[1]>b[1]&&p[1]<b[3];
function crosses(a,b,r){let lo=0,hi=1;for(let i=0;i<2;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-9){if(a[i]<=r[i]||a[i]>=r[i+2])return false;}else{let p=(r[i]-a[i])/d,q=(r[i+2]-a[i])/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>=hi)return false;}}return hi>0&&lo<1;}
export const stationWalkClear=(a,b)=>!boxes.some(r=>crosses(a,b,r));
let network;
function graph(){if(network)return network;const points=[];for(const r of boxes)for(const p of[[r[0]-.025,r[1]-.025],[r[0]-.025,r[3]+.025],[r[2]+.025,r[1]-.025],[r[2]+.025,r[3]+.025]])if(!boxes.some(b=>inside(p,b))&&!points.some(q=>distance(p,q)<.01))points.push(p);const links=points.map(()=>[]);for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)if(stationWalkClear(points[i],points[j])){const d=distance(points[i],points[j]);links[i].push([j,d]);links[j].push([i,d]);}return network={points,links};}
export function stationWalkRoute(from,to){
 if(distance(from,to)<.001)return[from.slice(),to.slice()];if(stationWalkClear(from,to))return[from.slice(),to.slice()];
 const {points,links}=graph(),start=points.length,end=start+1,nodes=[...points,from,to],cost=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set(),extra=[[],[]];
 for(let i=0;i<points.length;i++){if(stationWalkClear(from,points[i]))extra[0].push([i,distance(from,points[i])]);if(stationWalkClear(to,points[i]))extra[1].push([i,distance(to,points[i])]);}
 const ends=new Map(extra[1]);cost[start]=0;
 while(done.size<nodes.length){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||cost[i]<cost[u]))u=i;if(u<0||!Number.isFinite(cost[u]))break;if(u===end){const route=[];for(let v=end;v>=0;v=prev[v])route.unshift(nodes[v].slice());return route;}done.add(u);const adjacent=u===start?extra[0]:[...links[u],...(ends.has(u)?[[end,ends.get(u)]]:[])];for(const [v,d]of adjacent)if(cost[u]+d<cost[v]){cost[v]=cost[u]+d;prev[v]=u;}}
 throw Error(`Passage piéton du CIS inaccessible : ${from} → ${to}`);
}
// Old guards may have saved a person inside a wall that used to be traversed.
export function stationWalkStart(point){if(stationWalkClear(point,point))return point.slice();const candidates=[];for(const r of boxes){const x=Math.max(r[0],Math.min(r[2],point[0])),z=Math.max(r[1],Math.min(r[3],point[1]));candidates.push([r[0]-.025,z],[r[2]+.025,z],[x,r[1]-.025],[x,r[3]+.025]);}const safe=candidates.filter(p=>stationWalkClear(p,p)).sort((a,b)=>distance(a,point)-distance(b,point))[0];if(!safe)throw Error('Aucun accès piéton libre au CIS');return safe;}
export function boardingAccess(e){const point=e.basePoint||e.home,bay=MAIN_BAYS.find(b=>Math.hypot(b.x-point[0],b.z-point[1])<1);return bay?[bay.x+1.95,point[1]+1]:[point[0]-2.35,point[1]+1];}
export function stationBoardingRoute(from,e){const target=boardingAccess(e),bay=MAIN_BAYS.find(b=>Math.hypot(b.x-e.home[0],b.z-e.home[1])<1),prefix=[...stationWalkRoute(from,[-54,55]),[-54,57.5]];return bay&&!e.cisParked?[...prefix,[bay.x+1.95,57.5],[bay.x+1.95,61],target]:[...prefix,[-31.1,57.5],[-31.1,80.5],...stationWalkRoute([-31.1,80.5],target).slice(1)];}
export function walkDistance(path){return path.slice(1).reduce((n,p,i)=>n+distance(path[i],p),0);}
