import {setDensity} from './sim.js';
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Quatre onglets : chaque réglage n'apparaît qu'à un seul endroit.
export const SETTINGS_TABS=[['partie','Partie'],['affichage','Affichage'],['son','Son'],['caserne','Caserne']];
const row=(label,hint,control)=>`<div class="settingsRow"><span>${label}${hint?`<small>${hint}</small>`:''}</span>${control}</div>`;
const button=(id,label,attrs='')=>`<button type="button" class="settingsButton" id="${id}" ${attrs}>${label}</button>`;
const toggle=(id,on,label,hint='',disabled=false)=>row(label,hint,`<button type="button" class="settingsSwitch" role="switch" id="${id}" aria-checked="${!!on}" aria-label="${label}" ${disabled?'disabled':''}></button>`);

// Create controls on each opening so they reflect the current guard and map.
export function installSettings({state,modal,actions,sectorsVisible,toggleSectors,guard={},sound={}}){
 let tab='partie';
 const options=()=>guard.options||{};
 function pane(id){
  if(id==='partie'){const saved=guard.savedLabel?.();return `<h3 class="settingsLabel">Sauvegarde</h3>${row('Garde en cours',saved?`Sauvegarde disponible · ${escapeHtml(saved)}`:'Aucune sauvegarde',`<span class="settingsButtons">${button('saveGuard','Sauvegarder','data-primary')}${button('resumeGuard','Reprendre',saved?'':'disabled')}</span>`)}${row('Nouvelle journée ou entraînement','',button('chooseDay','Choisir ›'))}${row('Rejouer cette journée','',button('replayDay','Rejouer',guard.canReplay?.()?'':'disabled'))}${row('Album et bilan','',button('openAlbum','Ouvrir ›'))}<h3 class="settingsLabel">Rythme</h3>${row('Interventions par garde','De 5 à 20',`<span class="settingsRange"><input id="density" type="range" min="5" max="20" value="${state.density}" aria-label="Interventions par garde"><b id="densityValue">${state.density}</b></span>`)}${toggle('opt-autoPause',options().autoPause,'Pause aux appels urgents','Appels et renforts urgents')}${toggle('opt-guidance',options().guidance,'Conseils pendant le jeu')}`;}
  if(id==='affichage')return toggle('sectors',sectorsVisible(),'Secteurs sur la carte')+toggle('miniMap',guard.miniVisible?.(),'Mini-carte et couverture')+toggle('closeCamera',guard.closeCamera?.(),'Vue au niveau de l’engin')+row('Mode photo','Cache l’interface',button('photoMode','Lancer'));
  if(id==='son'){const voice=!!sound.voiceSupported;return row('Volume','',`<input id="volume" type="range" min="0" max="1" step=".05" value="${sound.volume?.()??1}" aria-label="Volume sonore">`)+toggle('radioVoice',voice&&!sound.voiceMuted?.(),'Radio parlée',voice?'':'Indisponible sur ce navigateur',!voice)+toggle('opt-radioFocus',options().radioFocus,'Radio de l’intervention choisie seulement','Les urgences passent toujours')+toggle('opt-ambience',options().ambience,'Ambiances de proximité')+`<h3 class="settingsLabel">Essayer</h3><div class="settingsButtons">${button('testTwoTone','Deux-tons')}${button('testPager','Bipeur SPV')}${button('testCaptainPager','Bipeur commandant')}${button('testRadio','Radio',voice?'':'disabled')}</div>`;}
  return row('Brief de garde','Tendance du jour',button('briefShift','Ouvrir ›'))+row('Composer les CIS','Engins, livrées, équipements',button('composeStation','Ouvrir ›'))+row('Mon profil','Nom, grade, tenue, véhicule',button('editPlayerProfile','Ouvrir ›'));
 }
 const on=(id,handler,event='onclick')=>{const el=$(id);if(el)el[event]=handler;return el;};
 const bindSwitch=(id,get,set)=>on(id,()=>{set(!get());$(id).setAttribute('aria-checked',String(!!get()));});
 // Une sous-page ouverte depuis les réglages propose « ‹ Réglages » pour revenir à l'onglet d'origine.
 function subpage(action,from){return()=>{action();const content=$('modalContent');if(!content?.insertAdjacentHTML||content.querySelector?.('#settingsBack'))return;content.insertAdjacentHTML('afterbegin','<button type="button" class="settingsBack" id="settingsBack">‹ Réglages</button>');on('settingsBack',()=>show(from));};}
 function bind(){
  for(const [id]of SETTINGS_TABS)on('tab-'+id,()=>show(id));
  for(const id of['help','debug'])on(id,subpage(actions[id],tab));
  if(tab==='partie'){
   on('saveGuard',()=>{guard.save?.();show('partie');});on('resumeGuard',()=>guard.resume?.());on('chooseDay',subpage(()=>guard.openDay?.(),'partie'));on('replayDay',()=>guard.replay?.());on('openAlbum',subpage(()=>guard.album?.(),'partie'));
   on('density',ev=>{setDensity(state,Number(ev.target.value));$('densityValue').textContent=state.density;},'oninput');
   for(const key of['autoPause','guidance'])bindSwitch('opt-'+key,()=>options()[key],value=>guard.setOption?.(key,value));
  }
  if(tab==='affichage'){bindSwitch('sectors',sectorsVisible,toggleSectors);bindSwitch('miniMap',()=>guard.miniVisible?.(),()=>guard.toggleMini?.());bindSwitch('closeCamera',()=>guard.closeCamera?.(),()=>guard.toggleCloseCamera?.());on('photoMode',()=>guard.photo?.());}
  if(tab==='son'){
   on('volume',ev=>sound.setVolume?.(Number(ev.target.value)),'oninput');
   bindSwitch('radioVoice',()=>!sound.voiceMuted?.(),value=>sound.setVoiceMuted?.(!value));
   for(const key of['radioFocus','ambience'])bindSwitch('opt-'+key,()=>options()[key],value=>guard.setOption?.(key,value));
   for(const id of['testTwoTone','testPager','testCaptainPager','testRadio'])on(id,()=>sound[id]?.());
  }
  if(tab==='caserne'){for(const id of['briefShift','editPlayerProfile'])on(id,subpage(actions[id],'caserne'));on('composeStation',actions.composeStation);}
 }
 function show(next=tab){
  tab=SETTINGS_TABS.some(([id])=>id===next)?next:'partie';
  modal(`<div class="settingsHead"><h2>Réglages</h2><button type="button" data-close aria-label="Fermer les réglages">×</button></div><div class="settingsTabs" role="tablist" aria-label="Rubriques des réglages">${SETTINGS_TABS.map(([id,label])=>`<button type="button" role="tab" id="tab-${id}" aria-selected="${id===tab}" aria-controls="settingsPane">${label}</button>`).join('')}</div><div class="settingsPane" id="settingsPane" role="tabpanel" aria-labelledby="tab-${tab}">${pane(tab)}</div><div class="settingsFooter"><span>${button('help','Comment jouer','data-link')}${button('debug','Diagnostic','data-link')}</span><button type="button" data-close>Fermer</button></div>`);
  // Reuse the open dialog: closing it here would fire the next page's pause-restoration listener.
  bind();
 }
 $('settings').onclick=()=>show();
 return show;
}
