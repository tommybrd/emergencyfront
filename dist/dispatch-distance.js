import {stationPath} from './station-routing.js';
import {streetRoute} from './roads.js';
const cache=new WeakMap();
export function dispatchDistance(e,c){
 const from=[e.model.position.x,e.model.position.z],to=c.accessTarget||c.actionPoint||c.target;if(!to)return null;
 const prior=cache.get(e),key=[c.id,...to,e.status,e.atResidence].join(':');
 if(prior?.key===key&&Math.hypot(from[0]-prior.from[0],from[1]-prior.from[1])<5)return prior.distance;
 const path=stationPath(e,from,to,'enroute',streetRoute),distance=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
 cache.set(e,{key,from,distance});return distance;
}
export function distanceLabel(e,c){const n=dispatchDistance(e,c);return n==null?'Distance inconnue':`≈ ${n>=1000?(n/1000).toFixed(1).replace('.',',')+' km':Math.round(n/10)*10+' m'} par la route`;}
