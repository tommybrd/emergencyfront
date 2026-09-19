export function conciseRadio(message){
 const text=String(message).replace(/victime\(s\)/g,'victimes').replace(/grave\(s\)/g,'graves').replace(/engagé\(s\)/g,'engagés')
  .replace(/^prend le départ(?: — en route sur les lieux)?\./i,'Départ, en route sur les lieux.')
  .replace(/^arrivé au CH — transmission au service des urgences\./i,'Au CH, transmission aux urgences.')
  .replace(/^rentré au CIS — disponible en remise\./i,'Au CIS, disponible.')
  .replace(/ Engagez (?:le VLI si disponible|VPL 1)\./g,'').replace('Établissez les lances et l’alimentation.','Établissement nécessaire.')
  .replace('Aucun feu constaté. Vérifications en cours, pas de lance nécessaire.','Aucun feu constaté. Vérifications en cours.')
  .replace('Objectif de prise en charge ajusté au bilan : ','Bilan reçu : ').replace('Mise en sécurité effectuée : ','Énergies : ')
  .replace('Évacuation préventive demandée. Regroupement des occupants hors de la zone menacée.','Évacuation demandée. Regroupez les occupants à l’abri.')
  .replace(/\s+/g,' ').trim();
 const parts=text.match(/[^.!?]+[.!?]?/g)||[text],short=parts.slice(0,2).join('').trim();return short.charAt(0).toUpperCase()+short.slice(1);
}
export function formatRadio(intervention,sender,message){
 const unit=/^(?:Capitaine|Lieutenant|Commandant|Colonel)/.test(sender)?'VLCG':sender;
 const address=unit==='Centre'?'Moyens engagés, ici Centre de secours':'Centre de secours, ici '+unit;
 return `${address}, intervention ${intervention}. ${conciseRadio(message)}`;
}
// Short radio traffic, never a second reading of the entire incident file.
export function spokenRadio(message){
 let text='';
 if(message.startsWith('Radio · '))text=message.replace(/^Radio · /,'').replace(/ · n°\s*(\d+)\s*:/,' pour intervention $1.');
 else if(/prend le départ|transport vers|vers le CH|arrivé au CH|rentré au CIS|victime.*au CH|intervention n°\d+ terminée/i.test(message))text=message;
 else if(/^(Rappel (?:niveau|astreinte)|Appel général|18 \/ 112)/.test(message))text=message.replace(/^18 \/ 112 — /,'Nouvelle intervention. ');
 if(!text)return null;
 text=text.replace(/n°\s*/g,'numéro ').replace(/victime\(s\)/g,'victimes').replace(/grave\(s\)/g,'graves').replace(/engagé\(s\)/g,'engagés')
  .replace(/\bVSAV\b/g,'V S A V').replace(/\bFPTSR\b/g,'F P T S R').replace(/\bFPTL\b/g,'F P T léger')
  .replace(/\b(CCF|EPA|VLI|VPL|VTU|VLCG|SPV|CIS)\b/g,m=>m.split('').join(' ')).replace(/\bCH\b/g,'centre hospitalier')
  .replace(/[·—]/g,',').replace(/\s+/g,' ').trim();
 const sentences=text.match(/[^.!?]+[.!?]?/g)||[text];let short='';
 for(const sentence of sentences){if(short.length+sentence.length>230&&short)break;short+=sentence;}
 return short.trim().slice(0,260);
}

export function createRadioVoice({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,now=()=>Date.now(),enabled=()=>true,volume=()=>.45,onSpeaking=()=>{}}={}){
 let unlocked=false,muted=false,paused=false,current=null,queue=[],serial=0,lastText='',lastAt=0;
 const supported=!!(synth&&Utterance);
 function stop(clear=true){serial++;if(supported)synth.cancel();current=null;if(clear)queue=[];onSpeaking(false);}
 function pump(){
  if(!supported||!unlocked||muted||!enabled()||current)return;
  if(paused&&!queue[0]?.preview)return;
  queue=queue.filter(item=>now()-item.at<45000);const item=queue.shift();if(!item)return;
  const utterance=new Utterance(item.text),voices=synth.getVoices();
  utterance.voice=voices.find(v=>/^fr[-_]FR$/i.test(v.lang)&&v.localService)||voices.find(v=>/^fr\b/i.test(v.lang))||null;
  utterance.lang='fr-FR';utterance.rate=1.08;utterance.pitch=.95;utterance.volume=Math.min(1,volume()*1.45);
  const token=++serial;current={utterance,at:now(),preview:item.preview};
  const done=()=>{if(token!==serial)return;current=null;onSpeaking(false);pump();};
  utterance.onstart=()=>{if(token===serial)onSpeaking(true);};utterance.onend=done;utterance.onerror=done;
  try{synth.speak(utterance);}catch{done();}
 }
 function enqueue(message,urgent=false,preview=false){
  const text=spokenRadio(message);if(!text||!supported||muted||!enabled())return false;
  if(text===lastText&&now()-lastAt<15000||queue.some(item=>item.text===text))return false;
  lastText=text;lastAt=now();const item={text,at:now(),preview};
  if(urgent)queue.unshift(item);else queue.push(item);
  if(queue.length>5)queue.splice(urgent?5:0,queue.length-5);
  pump();return true;
 }
 return{supported,enqueue,activate(){unlocked=true;pump();},stop,
  setMuted(value){muted=value;if(muted)stop();else pump();},isMuted:()=>muted,
  sync(isPaused=false){paused=isPaused;if(current&&(!enabled()||muted||paused&&!current.preview))stop(false);if(!enabled())queue=[];if(current&&now()-current.at>18000)stop(false);pump();},
  pending:()=>queue.length,speaking:()=>!!current};
}
