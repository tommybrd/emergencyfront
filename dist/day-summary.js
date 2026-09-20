export function dayActivity(s){
 const calls=s.calls.filter(c=>c.at>=s.shiftStart),hours=Math.max(2,(s.minute-s.shiftStart)/60),rate=calls.length/hours;
 const label=rate<.12?'Trop calme':rate<.25?'Calme':rate<.6?'Normal':rate<1?'Intense':'Très intense';
 return {count:calls.length,label,score:Math.min(100,Math.round(rate/1.2*100))};
}
export function daySummary(s){const a=dayActivity(s),level=['Trop calme','Calme','Normal','Intense','Très intense'].indexOf(a.label)+1;return `<span>Bilan de garde</span><div class="dayCount"><strong>${String(a.count).padStart(2,'0')}</strong><div><b>intervention${a.count>1?'s':''}</b><small>depuis la relève</small></div><svg viewBox="0 0 50 32" aria-hidden="true"><path d="M1 22h12l5-9 6 15 7-24 5 18h13"/></svg></div><div class="dayIntensity" data-level="${level}"><b>${a.label}</b><div class="daySteps" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a.score}" aria-valuetext="${a.label}" aria-label="Rythme de la garde" title="Intensité des appels rapportée au temps écoulé, pas une note de performance.">${Array.from({length:5},(_,i)=>`<i class="${i<level?'lit':''}"></i>`).join('')}</div></div>`;}
