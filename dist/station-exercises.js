// Shared positions keep the displayed exercise and the real departure origin aligned.
const mix=(a,b,f)=>a.map((n,i)=>n+(b[i]-n)*f);
const yaw=(a,b)=>Math.atan2(b[0]-a[0],b[1]-a[1]);
export function footballPoint(minute){const targets=[[309,84],[326,90],[321,107],[309,104]],t=((minute-640)*.48%4+4)%4,i=Math.floor(t);return mix(targets[i],targets[(i+1)%4],t-i);}
export function footballPosition(slot,minute){const ball=footballPoint(minute),home=[309+(slot%4)*5,81+(Math.floor(slot/4)%4)*7],f=slot%4===Math.floor((minute-640)*.48)%4?.7:.2;return mix(home,ball,f);}
export function exercisePose(slot,minute,sport=false){
 const t=minute*(sport?1.3:.65)+(slot%2)*.2,phase=((t%8)+8)%8;
 if(sport){
  if(slot%3===0){const a=t*Math.PI*.25,point=[-85+Math.sin(a)*3,39+Math.cos(a)*3];return{point,yaw:a+Math.PI/2,leg:Math.sin(t*8)*.65,arm:-Math.sin(t*8)*.55,body:0,label:'Course sur circuit'};}
  if(slot%3===1)return{point:[-88+(slot%4)*2,34+Math.floor(slot/4)*2],yaw:0,leg:0,arm:-1.5+Math.sin(t*3)*1.2,body:0,label:'Échauffement articulaire'};
  return{point:[-88+(slot%4)*2,44+Math.floor(slot/4)*2],yaw:Math.PI/2,leg:Math.sin(t*2)*.4,arm:-.6,body:-.35-Math.sin(t*2)*.3,label:'Renforcement'};
 }
 const station=Math.floor(slot/2)%3,lane=-83+station*6,head=slot%2===0;
 if(station===0){const f=phase<3?phase/3:phase>6?(8-phase)/2:1,point=[lane+(head?0:.8),74+f*9];return{point,yaw:f===1?0:phase>6?Math.PI:0,leg:f===1?0:Math.sin(t*8)*.4,arm:f===1?-1.05:-.4,body:0,label:f===1?'Tenue de lance en binôme':'Établissement / repli'};}
 if(station===1){const center=trainingStretcher(minute),direction=[Math.sin(center.yaw),Math.cos(center.yaw)],point=center.point.map((n,i)=>n+direction[i]*(head?1.45:-1.45));return{point,yaw:center.yaw+(head?Math.PI:0),leg:Math.sin(minute*6)*.35,arm:-1.05,body:0,label:'Portage coordonné'};}
 const point=[lane+(head?-.7:.7),79];return{point,yaw:head?Math.PI/2:-Math.PI/2,leg:0,arm:-.8+Math.sin(t*4)*.22,body:-.18,label:'Contrôle du matériel / secourisme'};
}

export function trainingStretcher(minute){const a=[-78,76],b=[-76,82],phase=((minute*.65%8)+8)%8,f=phase<4?phase/4:(8-phase)/4;return{point:mix(a,b,f),yaw:yaw(phase<4?a:b,phase<4?b:a)};}
