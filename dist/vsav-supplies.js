// Lots de matériel du VSAV : un lot par victime prise en charge, recomplété au CIS. Dotation et rythme : équilibrage de jeu.
export const KIT_CAPACITY=3,RESTOCK_MINUTES=6;
export const tracksKits=e=>e?.kind==='VSAV'&&!e.external;
export const kitsLeft=e=>tracksKits(e)?e.kits??KIT_CAPACITY:Infinity;
export const outOfKits=e=>kitsLeft(e)<=0;
export function useKits(e,count=1,emit=()=>{}){
 if(!tracksKits(e))return;
 e.kits=Math.max(0,kitsLeft(e)-count);
 if(e.kits===0)emit(`${e.id} — matériel épuisé : retour au CIS obligatoire avant tout nouveau départ.`);
 else if(e.kits===1)emit(`${e.id} — plus qu’un lot de matériel à bord.`);
}
// Le recomplètement se fait en remise, sans immobiliser un VSAV à qui il reste du matériel.
export function tickRestock(e,minutes,emit=()=>{}){
 if(!tracksKits(e)||e.status!=='ready'||e.call!=null||kitsLeft(e)>=KIT_CAPACITY)return;
 e.restock=(e.restock||0)+minutes;
 while(e.restock>=RESTOCK_MINUTES&&kitsLeft(e)<KIT_CAPACITY){
  const empty=outOfKits(e);e.restock-=RESTOCK_MINUTES;e.kits=kitsLeft(e)+1;
  if(empty)emit(`${e.id} — matériel recomplété, de nouveau engageable.`);
 }
 if(kitsLeft(e)>=KIT_CAPACITY)e.restock=0;
}
export function kitsStatus(e){
 if(!tracksKits(e)||kitsLeft(e)>=KIT_CAPACITY)return '';
 const n=kitsLeft(e);
 return n?`Matériel ${n}/${KIT_CAPACITY}`:`Matériel épuisé · réappro au CIS`;
}
