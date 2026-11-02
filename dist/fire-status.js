export function fireLevel(c){if(c.fireContained||c.status==='closed'||(c.progress||0)>=1||c.fireConfirmed===false)return 0;const intensity=(1+Math.max(0,c.spread||0))*(1-Math.max(0,Math.min(1,c.progress||0)));return intensity>1.85?3:intensity>1.35?2:1;}
export function fireStatus(c,engines){if(c.inspection&&c.fireConfirmed!==true)return{label:c.status==='closed'?'Levée de doute terminée':c.fireConfirmed===false?'Absence de feu · contrôle final':'Levée de doute',stage:0,value:Math.round((c.fireConfirmed===false?c.progress||0:c.reconProgress||0)*100),color:'#80bec7'};const p=Math.max(0,Math.min(1,c.progress||0)),flow=engines.some(e=>e.call===c.id&&e.status==='scene'&&e.flow>0);if(c.ventilation&&!c.ventilation.done)return{label:'Ventilation · '+Math.round(c.ventilation.progress*100)+' %',stage:4,value:100,color:'#8fd4b1'};if(c.fireContained||c.status==='closed'||p>=1)return{label:'Éteint',stage:4,value:100,color:'#8fd4b1'};if(!flow&&p>0)return{label:'Reprise possible · eau coupée',stage:0,value:Math.round(p*100),color:'#ee826b'};if(p>=.8)return{label:'Refroidissement',stage:3,value:Math.round(p*100),color:'#7dcbd4'};if(p>=.55)return{label:'Feu maîtrisé',stage:2,value:Math.round(p*100),color:'#88c697'};return{label:flow?'Combat':'Croissance',stage:flow?1:0,value:Math.round(p*100),color:flow?'#efb35f':'#ee826b'};}
export function fireBar(c,engines,compact=false){if(c.type!=='INC')return '';const s=fireStatus(c,engines);return `<div class="fireSituation ${compact?'smallFireSituation':''}" style="--fire-stage:${s.color}"><div><b>${s.label}${compact&&propagationIndex(c)?` · R ${formatR(propagationIndex(c).r)}`:''}</b><span>${s.value} %</span></div><progress max="100" value="${s.value}" aria-label="Progression approximative de la maîtrise du feu : ${s.label}"></progress>${compact?'':`<small>${c.inspection&&c.fireConfirmed!==true?'Contrôle automatique après arrivée du fourgon':c.foamCoverage>.05?`Tapis de mousse · ${Math.round(c.foamCoverage*100)} % couvert`:'Jauge = maîtrise du feu'}</small>${propagationLine(c)}`}</div>`;}

export function fireResistance(c){if(c.type!=='INC'||c.site?.kind!=='building')return 1;c.peakSpread=Math.max(c.peakSpread||0,c.spread||0);return 1.2+Math.min(1.5,c.peakSpread)*.65+(c.progress>.55?.15:0);}

// Gameplay budgets for isolated ordinary fires, not operational water requirements.
// GDO secours en milieu routier (DGSCGC, July 2025, p.133) supports a 250 L/min
// attack flow, not a fixed total volume. Battery fires and bin rooms are excluded.
export function smallFireWaterTarget(c){
 if(c.type!=='INC'||c.site?.kind==='building'||c.electricVehicle||c.batteryFire||!['bin','vehicle'].includes(c.scene))return null;
 return (c.scene==='bin'?250:1200)*(1+Math.min(1,Math.max(0,c.spread||0))*(c.scene==='bin'?.6:.8));
}
export function smallFireProgress(c,flow,totalFlow,waterMinutes){
 const target=smallFireWaterTarget(c);if(target==null)return null;
 c.smallFireWaterTarget??=target;
 const useful=Math.min(totalFlow,c.scene==='bin'?250:500);
 return totalFlow>0?Math.max(0,flow)*Math.max(0,waterMinutes)/c.smallFireWaterTarget*(useful/totalFlow):0;
}
// Intensité du feu : extension multipliée par la part encore non maîtrisée.
export const fireIntensity=c=>(1+Math.max(0,c.spread||0))*(1-Math.max(0,Math.min(1,c.progress||0)));
// Coefficient de propagation R, comme un taux de reproduction : intensité actuelle rapportée à celle d'il y a 20 min,
// lissé sur ~3 min. R = 1 : stable ; au-dessus le feu se propage ; en dessous il régresse ; vers 0, il s'éteint.
export const R_WINDOW=20;
export function updatePropagationCoefficient(c,minute){
 const i=fireIntensity(c);
 if(c.rAt==null){c.rAt=minute;c.rIntensity=i;return;}
 const dt=minute-c.rAt;if(dt<.05)return;
 const g=i<=0||c.rIntensity<=0?-1:Math.log(i/c.rIntensity)/dt,k=1-Math.exp(-dt/3);
 c.rGrowth=(c.rGrowth||0)+(g-(c.rGrowth||0))*k;c.rAt=minute;c.rIntensity=i;
}
export function propagationCoefficient(c){
 if(c.type!=='INC'||c.inspection&&c.fireConfirmed!==true)return null;
 if(fireLevel(c)===0||fireIntensity(c)<=0)return 0;
 return Math.max(0,Math.min(3,Math.exp((c.rGrowth||0)*R_WINDOW)));
}
export const formatR=r=>r.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
export function propagationIndex(c){const r=propagationCoefficient(c);if(r==null||fireLevel(c)===0)return null;const trend=r>1.05?'up':r<.95?'down':'flat',forest=c.scene==='forest'||!!c.forestFire,wide=(c.spread||0)>=.6;
 return {r,trend,exposure:forest?(wide?'Front actif en forêt':null):c.neighborProtected?'Voisins protégés':wide?'Menace sur les voisins':null};}
function propagationLine(c){const p=propagationIndex(c);if(!p)return '';const trend={up:'le feu se propage',down:'le feu régresse',flat:'stable'}[p.trend];return `<small class="propagationIndex ${p.trend}" title="R = 1 : stable · au-dessus de 1 : le feu se propage · en dessous : il régresse et tend vers l’extinction">Coefficient de propagation R = ${formatR(p.r)} · ${trend}${p.exposure?' · '+p.exposure:''}</small>`;}
