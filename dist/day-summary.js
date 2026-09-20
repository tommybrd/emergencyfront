export function dayActivity(s){
 const calls=s.calls.filter(c=>c.at>=s.shiftStart),hours=Math.max(2,(s.minute-s.shiftStart)/60),rate=calls.length/hours;
 const label=rate<.12?'Trop calme':rate<.25?'Calme':rate<.6?'Normal':rate<1?'Intense':'Très intense';
 return {count:calls.length,label,score:Math.min(100,Math.round(rate/1.2*100))};
}
export function daySummary(s){const a=dayActivity(s);return `<span>Bilan de garde</span><strong>${a.count} <small>intervention${a.count>1?'s':''}</small></strong><div class="dayIntensity" title="Rythme des appels depuis le début de garde, rapporté au temps écoulé (minimum 2 h). Indicateur d’activité, pas une note de performance."><b>${a.label}</b><span>${a.score}/100</span></div><meter min="0" max="100" value="${a.score}" aria-label="Intensité de la garde"></meter>`;}
