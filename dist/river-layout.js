export const RIVER={name:'La Valme',x:134,halfWidth:6,bankWidth:2,z0:-385,z1:385};
export const RIVER_BRIDGES=[];
export function registerRiverBridges(roads){
 RIVER_BRIDGES.length=0;
 for(const r of roads){if(r.trail)continue;const dx=r.b[0]-r.a[0];if(!dx)continue;const t=(RIVER.x-r.a[0])/dx;if(t<0||t>1)continue;const z=r.a[1]+(r.b[1]-r.a[1])*t;if(RIVER_BRIDGES.some(b=>Math.abs(b.z-z)<.1))continue;RIVER_BRIDGES.push({z,name:r.name,express:r.express});}
 return RIVER_BRIDGES;
}
export function inRiver(point,pad=0){
 const [x,z]=point;if(z<RIVER.z0||z>RIVER.z1||Math.abs(x-RIVER.x)>=RIVER.halfWidth+pad)return false;
 return !RIVER_BRIDGES.some(b=>Math.abs(z-b.z)<(b.express?11:6.1)-pad);
}
export const riverWalkNodes=()=>RIVER_BRIDGES.flatMap(b=>[-1,1].flatMap(side=>[-1,1].map(lane=>[RIVER.x+side*(RIVER.halfWidth+RIVER.bankWidth+1),b.z+lane*(b.express?10.1:5.2)])));
