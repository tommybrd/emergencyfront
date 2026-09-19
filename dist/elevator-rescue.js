// Occasional medical complication, revealed on scene. Frequency is game balance.
export function initElevator(c){
 if(c.scene!=='elevator')return;
 c.elevator={checked:false,released:false};c.victimCount=0;c.victimsKnown=false;c.evacuated=0;c.patients=[];
}
export function revealElevator(c,random=Math.random){
 if(!c.elevator||c.elevator.checked||!c.reconComplete)return;
 c.elevator.checked=true;
 if(random()>=(c.medicalChance??.2))return;
 c.victimCount=1;c.victimsKnown=true;c.patients=[{severe:false,trapped:true,evacuated:false,assignedTo:null,transportRequired:true,fromElevator:true}];
 c.finishBudget+=35;
}
export function releaseElevator(c){
 if(!c.elevator||c.elevator.released||c.progress<1)return false;
 c.elevator.released=true;
 for(const p of c.patients)if(p.fromElevator)p.trapped=false;
 return true;
}
export function elevatorStatus(c){
 if(!c.reconComplete)return 'Reconnaissance en cours.';
 if(!c.elevator.released)return c.victimCount?'Une personne présente un malaise dans la cabine. Dégagement en cours.':'Occupants indemnes. Dégagement en cours.';
 return c.victimCount?'Personne sortie de la cabine. Relais VSAV.':'Occupants libérés, sans blessé.';
}
