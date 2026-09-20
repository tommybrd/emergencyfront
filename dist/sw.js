// Scoped to this deployment so other GitHub Pages projects keep their own cache.
const PREFIX = 'valmont-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + 'd7ea4d58e933c6d5';
const FILES = ["./", "./.nojekyll", "./aerial-operations.js", "./aerial-visuals.js", "./ambulance-loading.js", "./audio.js", "./automatic-siren.js", "./batching.js", "./beach-layout.js", "./beach-scenery.js", "./bipeur.mp3", "./building-actions.js", "./city-layout.js", "./city-scenery.js", "./civilian-routing.js", "./command.js", "./credits.html", "./crew-config.js", "./crew-identity.js", "./crew.js", "./data/departures-reference.json", "./day-summary.js", "./deux-tons.wav", "./dispose.js", "./dynamic-tube.js", "./effects.js", "./elevator-rescue.js", "./extrication-visuals.js", "./extrication.js", "./fire-status.js", "./fleet-maintenance.js", "./fleet-sidebar.css", "./foam-visuals.js", "./foam.js", "./garage.js", "./hospital-reception.js", "./hospital-routing.js", "./hydraulics.js", "./incident-aftermath.js", "./incident-catalog.js", "./incident-events.js", "./incident-location.js", "./incident-props.js", "./incident-state.js", "./index.html", "./lake-supply.js", "./means-assessment.js", "./mission-status.css", "./models.js", "./motifs.html", "./motifs.js", "./nonplayer-recovery.js", "./noria.js", "./nursing.js", "./operations.js", "./parking.js", "./placement-markers.js", "./player-home-model.js", "./player-home.js", "./player-profile.js", "./player-vehicle.js", "./police.js", "./radio-voice.js", "./reactive-traffic.js", "./real-neighborhood.js", "./reinforcements.js", "./response-visuals.js", "./road-clearance.js", "./roads.js", "./rotary-beacons.js", "./route3d.js", "./scene-lighting.js", "./scene-perimeter.js", "./scene.js", "./signalling.js", "./sim.js", "./simulation-clock.js", "./sources.html", "./staff-status.js", "./station-config.js", "./station-life.js", "./station-live.js", "./station-menu.js", "./station-refill.js", "./station-routing.js", "./style.css", "./supply-crew.js", "./tactical-placement.js", "./traffic-control.js", "./traffic-recovery.js", "./urban-detail.js", "./vehicle-console.css", "./vehicle-console.js", "./vehicle-spacing.js", "./vendor/LICENSE", "./vendor/OrbitControls.js", "./vendor/three.core.js", "./vendor/three.module.js", "./ventilation.js", "./volunteer-models.js", "./volunteer-travel.js", "./walking-patient.js", "./water-models.js", "./water-rescue.js", "./water-supply.js"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(event.request)) ||
      (event.request.mode === 'navigate' ? await cache.match('./index.html') : null) || Response.error();
  }));
});
