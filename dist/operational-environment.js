const key=condition=>typeof condition==='string'?condition:condition?.key||'mild';

export function weatherEffects(condition){
 switch(key(condition)){
  case'hot':return{fire:1.55,travel:1,civilian:.94,pedestrian:.78,patient:1.18,label:'Chaleur · victimes et végétation plus exposées'};
  case'wind':return{fire:1.8,travel:1,civilian:.95,pedestrian:.82,patient:1.04,label:'Vent · propagation accélérée et activité extérieure réduite'};
  case'rain':return{fire:.65,travel:.82,civilian:.72,pedestrian:.42,patient:1.02,label:'Pluie · chaussées glissantes et visibilité réduite'};
  case'crowd':return{fire:1,travel:1,civilian:1.18,pedestrian:1.35,patient:1,label:'Affluence · axes et lieux publics chargés'};
  default:return{fire:1,travel:1,civilian:1,pedestrian:1,patient:1,label:'Conditions ordinaires'};
 }
}

export function trafficDensity(base,condition){return Math.max(.12,Math.min(1,base*weatherEffects(condition).civilian));}
export function pedestrianActivity(base,condition){return Math.max(0,Math.min(1.5,base*weatherEffects(condition).pedestrian));}
