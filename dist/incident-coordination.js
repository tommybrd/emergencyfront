// Operational sectors are orders, not extra personnel or free water.
export const SECTORS={attack:'Attaque',contain:'Protection',rescue:'Secours',supply:'Alimentation'};
export function commandAvailable(c,engines){return engines.some(e=>e.kind==='PC'&&e.call===c.id&&e.status==='scene'&&e.crew>=2);}
export function assignSector(c,e,sector,engines){
 if(!commandAvailable(c,engines)||e.call!==c.id||e.status!=='scene'||!SECTORS[sector]||['PC','VLCG'].includes(e.kind))return false;
 if(['attack','contain'].includes(sector)&&!e.capacity)return false;
 if(sector==='rescue'&&!['VSAV','VLI','EPA','VSR','FPT','VTU','VPL'].includes(e.kind))return false;
 if(sector==='supply'&&!e.capacity&&e.kind!=='VPCE')return false;
 (c.sectors??={})[e.id]=sector;return true;
}
export function coordination(c,engines){
 if(!commandAvailable(c,engines))return {containment:1,rescue:1};
 const units=engines.filter(e=>e.call===c.id&&e.status==='scene');
 const protection=units.some(e=>c.sectors?.[e.id]==='contain'&&e.flow>0);
 const rescue=units.some(e=>c.sectors?.[e.id]==='rescue'&&e.crew>0);
 return {containment:protection?.72:1,rescue:rescue?1.1:1};
}
export function tickFireFront(c,minutes,weather){
 if(c.type!=='INC'||!(c.requires==='CCF'||['forest','vegetation'].includes(c.scene))||c.fireContained||c.forestExhausted||c.progress>=1||c.fireConfirmed===false)return;
 const wind=weather?.key==='wind',direction=Number.isFinite(weather?.windDirection)?weather.windDirection:0;
 const f=c.fireFront??={downwind:5,upwind:5,flank:5,direction};f.direction=direction;
 const rate=Math.max(0,1-(c.progress||0))*(.12+(c.spread||0)*.22)*(weather?.key==='rain'?.5:weather?.key==='hot'?1.4:1);
 f.downwind=Math.min(65,f.downwind+minutes*rate*(wind?2.8:1));
 f.upwind=Math.min(35,f.upwind+minutes*rate*(wind?.35:1));
 f.flank=Math.min(35,f.flank+minutes*rate*(wind?.8:1));
 const origin=c.actionPoint||c.target;if(origin){const offset=(f.downwind-f.upwind)/2;c.fireTarget=[origin[0]+Math.cos(direction)*offset,origin[1]+Math.sin(direction)*offset];}
}
