// Shared shoreline coordinates keep the scenery, victims and rescue routes aligned.
export const LAKE={center:[70,-158],radius:[35,25]};
export function lakeEdge(angle,scale=1){const r=(1+Math.sin(angle*3)*.1)*scale;return[LAKE.center[0]+Math.cos(angle)*LAKE.radius[0]*r,LAKE.center[1]+Math.sin(angle)*LAKE.radius[1]*r];}
export const BEACH={
 name:'Plage de l’Étang',access:[120,-155],dock:[104,-155],handover:[116,-162],
 swimmingVictim:[91,-146],spots:[[105,-139],[91,-128],[110,-167]],
 parking:[{target:[120,-148.9],entry:[131,-152.9],approach:[125,-148.9],exit:[112,-152.9],yaw:-Math.PI/2},
          {target:[120,-138.7],entry:[134,-152.9],approach:[127,-138.7],exit:[110,-148],yaw:-Math.PI/2}]
};
export const beachOpen=minute=>{const hour=((minute/60)%24+24)%24;return hour>=9&&hour<20;};
export function onBeach([x,z],margin=0){const dx=(x-70)/35,dz=(z+158)/25,a=Math.atan2(dz,dx),r=Math.hypot(dx,dz)/(1+Math.sin(a*3)*.1);return a>=-.65-margin&&a<=1.8+margin&&r>=.99-margin&&r<=1.45+margin;}
export function inLake([x,z]){const dx=(x-70)/35,dz=(z+158)/25,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)<.94*(1+Math.sin(a*3)*.1);}
