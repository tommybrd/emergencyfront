// Police sur les accidents : curieux à distance, dépistage d'alcoolémie, reconnaissance en cas de doute.
// Délais et proportions : équilibrage de jeu. Hachage local pour ne pas consommer le hasard partagé.
export const CROWD_MINUTES=3,BREATH_MINUTES=6,RECON_MINUTES=2,ONLOOKERS_FACTOR=.85;
const hash=n=>{let h=2166136261;for(const ch of String(n)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;};
const roll=(c,key)=>hash(`${c.seed??c.phoneId??0}:${c.id}:${key}`);
// Appels imprécis sur des accidents isolés : le requérant ne sait pas dire s'il reste quelqu'un.
export const doubtfulAccident=c=>c?.type==='AVP'&&['solo','two-wheeler'].includes(c.casualties)&&!c.handover&&roll(c,'doubt')<.25;
export function tickAccidentPolice(c,police,engines,minute){
 if(c.type!=='AVP'||c.status==='closed'||c.siteCompletedAt!=null)return {messages:[]};
 c.doubtful??=doubtfulAccident(c);
 const here=police.filter(v=>!v.retired&&v.call===c.id&&v.status==='scene'),out=[];
 if(c.doubtful&&!c.doubtLifted&&engines.some(e=>e.call===c.id&&e.status==='scene')){c.doubtLifted=true;}
 if(!here.length)return {messages:out};
 const a=c.policeAccident??={since:minute};
 if(c.doubtful&&!c.doubtLifted&&minute-a.since>=RECON_MINUTES){
  c.doubtLifted=true;
  if(!engines.some(e=>e.call===c.id)&&roll(c,'false')<.3)return {messages:[{text:`${here[0].id} : véhicule reparti, personne sur place. Aucun secours nécessaire.`}],falseAlarm:true};
  out.push({urgent:true,text:`${here[0].id} : accident confirmé, ${c.victimCount} victime${c.victimCount>1?'s':''} sur place. Engagez les secours.`});
 }
 if(!a.crowd&&minute-a.since>=CROWD_MINUTES){a.crowd=true;out.push({text:`${here[0].id} : curieux mis à distance, le périmètre est tenu.`});}
 if(!a.breath&&minute-a.since>=BREATH_MINUTES){a.breath=roll(c,'breath')<.18?'positive':'negative';out.push({text:`${here[0].id} : dépistage d’alcoolémie ${a.breath==='positive'?'positif, conducteur pris en charge par la police':'négatif'}.`});}
 return {messages:out};
}
// Tant que personne ne tient les curieux, le travail des secours est un peu ralenti.
export const onlookersFactor=c=>c?.type==='AVP'&&!c.policeAccident?.crowd?ONLOOKERS_FACTOR:1;
export function accidentPoliceStatus(c){
 if(c.type!=='AVP')return '';
 const a=c.policeAccident,parts=[];
 if(c.doubtful&&!c.doubtLifted)parts.push('Doute sur l’accident · une patrouille peut lever le doute');
 if(a?.crowd)parts.push('Curieux à distance');
 if(a?.breath)parts.push(`Alcoolémie ${a.breath==='positive'?'positive':'négative'}`);
 return parts.join(' · ');
}
