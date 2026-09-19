export const PROFILE_KEY='valmont.player-profile.v1';
export const GRADES={lieutenant:'Lieutenant',captain:'Capitaine',commandant:'Commandant',lieutenantColonel:'Lieutenant-colonel',colonel:'Colonel'};
export const OUTFITS={station:'Tenue de caserne',command:'Gilet de commandement',fire:'Tenue de feu'};
export const PLAYER_VEHICLES={van:'Camionnette',car:'Voiture de service'};
export const DEFAULT_PROFILE=Object.freeze({name:'',grade:'captain',outfit:'command',vehicle:'van'});

export function normalizeProfile(value){
 const p=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const pick=(choices,key,fallback)=>Object.hasOwn(choices,key)?key:fallback;
 return {name:typeof p.name==='string'?Array.from(p.name.replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim()).slice(0,32).join(''):'',grade:pick(GRADES,p.grade,DEFAULT_PROFILE.grade),outfit:pick(OUTFITS,p.outfit,DEFAULT_PROFILE.outfit),vehicle:pick(PLAYER_VEHICLES,p.vehicle,DEFAULT_PROFILE.vehicle)};
}
export function loadProfile(){try{return normalizeProfile(JSON.parse(globalThis.localStorage.getItem(PROFILE_KEY)));}catch{return {...DEFAULT_PROFILE};}}
export function saveProfile(profile){try{globalThis.localStorage.setItem(PROFILE_KEY,JSON.stringify(normalizeProfile(profile)));return true;}catch{return false;}}
export function playerLabel(profile=DEFAULT_PROFILE){return `${GRADES[profile.grade]||GRADES.captain}${profile.name?' '+profile.name:''}`;}
export function escapeHtml(text){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function profileForm(profile,atStation){
 const p=normalizeProfile(profile),options=(items,selected)=>Object.entries(items).map(([id,label])=>`<option value="${id}" ${id===selected?'selected':''}>${label}</option>`).join('');
 return `<form id="playerProfileForm" class="playerProfile"><div class="profileHeading"><div><span class="eyebrow">VOTRE PERSONNAGE</span><h2>Chef de centre</h2></div><button type="button" data-close aria-label="Fermer le profil">×</button></div><label for="playerName">Nom</label><input id="playerName" name="playerName" type="text" maxlength="32" value="${escapeHtml(p.name)}" placeholder="Votre nom" autocomplete="off"><div class="profileFields"><div><label for="playerGrade">Grade</label><select id="playerGrade" name="playerGrade">${options(GRADES,p.grade)}</select></div><div><label for="playerOutfit">Tenue</label><select id="playerOutfit" name="playerOutfit">${options(OUTFITS,p.outfit)}</select></div></div><fieldset><legend>Votre véhicule</legend><div class="profileVehicles">${Object.entries(PLAYER_VEHICLES).map(([id,label])=>`<label class="profileVehicle"><input type="radio" name="playerVehicle" value="${id}" ${p.vehicle===id?'checked':''}><span><b>${label}</b><small>${id==='van'?'Utilitaire compact':'Sans flocage · gyrophare amovible'}</small></span></label>`).join('')}</div></fieldset><p class="profileNote">${atStation?'Un véhicule dédié au chef de centre, avec le même rôle de commandement.':'Le véhicule sera changé à votre retour en remise.'} La tenue s’applique à votre personnage au CIS et sur les lieux.</p><p class="profileSaveNote">Choix conservés dans ce navigateur. La garde est en pause.</p><div class="actions"><button type="button" data-close>Annuler</button><button class="profileSave" type="submit">Enregistrer</button></div></form>`;
}
