// One continuous facade; every vehicle faces south toward the court and road.
export const MAIN_BAYS=Array.from({length:14},(_,index)=>({index,x:Math.round((-105+index*5.4)*10)/10,z:71,group:index<9?'fire':'medical'}));
export const MAIN_GATE=[-70,105];
export const isMedicalBay=e=>['VSAV','VLI'].includes(e.kind);
export function oldBayIndex(home){
 if(!home)return -1;const [x,z]=home;
 const side=x===-84||x===-91?'fire':x===-56||x===-49?'medical':null;
 if(!side)return -1;
 const original=x===-84||x===-56,medical=side==='medical';
 const i=(z-(original?52:60))/(original?(medical?10:5):(medical?9:4.5));
 return Number.isInteger(i)&&i>=0&&i<(medical?5:9)?i+(medical?9:0):-1;
}
export function migrateMainBay(e){
 if(e.external)return false;const index=oldBayIndex(e.home);if(index<0)return false;
 const bay=MAIN_BAYS[index];e.home=[bay.x,bay.z];e.baseYaw=0;return true;
}
