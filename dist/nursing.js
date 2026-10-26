// Simple game mechanic: one nurse treats one accessible severe casualty at a time.
import {initialHealth} from './patient-health.js';
export function tickNursing(e,c,minutes,emit){e.nursingPatient=null;if(!c.reconComplete)return;const p=c.patients?.find(p=>p.severe&&!p.trapped&&!p.evacuated&&!p.deceased&&!p.nursingComplete);if(!p)return;e.nursingPatient=c.patients.indexOf(p);p.nursingUnit=e.id;p.health=Math.min(100,(p.health??initialHealth(p))+minutes);p.nursingProgress=Math.min(1,(p.nursingProgress||0)+minutes/8);if(p.nursingProgress>=1){p.nursingComplete=true;emit('Soins infirmiers terminés. La prise en charge par le VSAV est facilitée.');}}
export function tickMedical(e,c,minutes,emit,engines=[]){
 e.medicalPatient=null;if(!c.reconComplete)return;
 if(e.medicalTransport&&c.patients?.some(p=>p.assignedTo===e.id&&p.medicalComplete&&!p.evacuated&&!p.deceased))return;
 const available=p=>p.severe&&!p.trapped&&!p.evacuated&&!p.deceased&&!p.medicalComplete;
 const owned=p=>p.medicalUnit===e.id;
 const free=p=>!p.medicalUnit||engines.length>0&&!engines.some(u=>u.id===p.medicalUnit&&u.call===c.id&&['scene','enroute','departing'].includes(u.status));
 const p=c.patients?.find(p=>available(p)&&owned(p))||c.patients?.find(p=>available(p)&&free(p));
 if(!p)return;
 e.medicalPatient=c.patients.indexOf(p);p.medicalUnit=e.id;
 if(e.medicalTransport&&!p.assignedTo){p.assignedTo=e.id;e.patientAssigned=true;e.patientTransportRequired=p.transportRequired;e.patientProgress=0;}
 p.health=Math.min(100,(p.health??initialHealth(p))+minutes*2);
 p.medicalProgress=Math.min(1,(p.medicalProgress||0)+minutes/6);
 if(p.medicalProgress>=1){p.medicalComplete=true;emit(p.assignedTo===e.id?'Médicalisation terminée, préparation du transport par SMUR 2.':'Médicalisation SMUR terminée. Transport par le VSAV autorisé dès stabilisation.');}
}
export function tickMedicalTransport(e,c,minutes,finish){
 const p=c.patients?.find(p=>p.assignedTo===e.id&&!p.evacuated&&!p.deceased);
 if(!p?.medicalComplete)return;
 e.medicalPatient=c.patients.indexOf(p);e.patientAssigned=true;
 p.health=Math.min(100,(p.health??initialHealth(p))+minutes*2);
 e.patientProgress=Math.min(1,(e.patientProgress||0)+minutes/4);
 if(e.patientProgress>=1)finish(c,e);
}
export function nursingMultiplier(p){return p?.severe&&p.medicalComplete?1.55:p?.severe&&p.nursingComplete?1.25:1;}
