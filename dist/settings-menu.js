import {setDensity} from './sim.js';
const $=id=>document.getElementById(id);

// Create controls on each opening so they reflect the current guard and map.
export function installSettings({state,modal,actions,sectorsVisible,toggleSectors}){
 function show(){
  modal(`<span class="eyebrow">VALMONT · PRÉFÉRENCES</span><h2>Réglages</h2>
   <div class="settingsGrid">
    <section class="settingsGroup"><h3>Garde</h3>
     <button id="guardTools"><b>Votre partie <span>›</span></b><small>Sauvegarde, reprise et entraînement</small></button>
     <button id="briefShift"><b>Brief de garde <span>›</span></b><small>Conditions et effectif disponible</small></button>
    </section>
    <section class="settingsGroup"><h3>Caserne</h3>
     <button id="composeStation"><b>Composer les CIS <span>›</span></b><small>Engins, livrées et équipements</small></button>
     <label class="settingsDensity" for="density">Interventions par garde <b id="densityValue">${state.density}</b><input id="density" type="range" min="5" max="20" value="${state.density}"><small>De 5 à 20 interventions</small></label>
    </section>
    <section class="settingsGroup"><h3>Préférences</h3>
     <button id="editPlayerProfile"><b>Mon profil <span>›</span></b><small>Nom, grade, tenue et véhicule</small></button>
     <button id="soundSettings"><b>Sons et radio <span>›</span></b><small>Volume, voix et essais sonores</small></button>
     <button id="sectors" aria-pressed="${sectorsVisible()}"><b>Secteurs sur la carte <span>${sectorsVisible()?'Activés':'Masqués'}</span></b></button>
    </section>
    <section class="settingsGroup"><h3>Aide</h3>
     <button id="help"><b>Comment jouer <span>›</span></b><small>Commandes et conseils</small></button>
     <button id="debug"><b>Diagnostic <span>›</span></b><small>Rapport à joindre en cas de problème</small></button>
    </section>
   </div><div class="actions settingsFooter"><button data-close>Fermer les réglages</button></div>`);
  // Reuse the open dialog: closing it here would fire the next page's pause-restoration listener.
  for(const [id,action] of Object.entries(actions))$(id).onclick=action;
  $('density').oninput=ev=>{setDensity(state,Number(ev.target.value));$('densityValue').textContent=state.density;};
  $('sectors').onclick=()=>{toggleSectors();const active=sectorsVisible();$('sectors').setAttribute('aria-pressed',String(active));$('sectors').querySelector('span').textContent=active?'Activés':'Masqués';};
 }
 $('settings').onclick=show;
 return show;
}
