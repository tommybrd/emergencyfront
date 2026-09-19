import {smoothRoute} from './route3d.js';

export const HOSPITAL_ENTRY=[360,-90];
export const hospitalBay=index=>[375,-141+index*10];
// One-way patient drop-off. Returning ambulances continue around the apron
// instead of turning back through the incoming lane.
export function hospitalArrival(index){return smoothRoute([HOSPITAL_ENTRY,[369,-96],[375,-102],hospitalBay(index)]);}
export function hospitalDeparture(start){return smoothRoute([start,[375,-152],[367,-152],[367,-98],HOSPITAL_ENTRY]);}
