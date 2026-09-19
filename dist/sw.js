// Scoped to this deployment so other GitHub Pages projects keep their own cache.
const PREFIX = 'valmont-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + '821062761d1fb409';
const FILES = ["./", "./.nojekyll", "./ambulance-loading.js", "./audio.js", "./automatic-siren.js", "./batching.js", "./beach-layout.js", "./beach-scenery.js", "./bipeur.mp3", "./building-actions.js", "./city-layout.js", "./city-scenery.js", "./civilian-routing.js", "./command.js", "./credits.html", "./crew.js", "./data/departures-reference.json", "./deux-tons.wav", "./dispose.js", "./dynamic-tube.js", "./effects.js", "./fire-status.js", "./fleet-sidebar.css", "./garage.js", "./hospital-routing.js", "./hydraulics.js", "./incident-aftermath.js", "./incident-catalog.js", "./incident-events.js", "./incident-location.js", "./incident-props.js", "./incident-state.js", "./index.html", "./mission-status.css", "./models.js", "./motifs.html", "./motifs.js", "./nursing.js", "./operations.js", "./parking.js", "./placement-markers.js", "./player-home-model.js", "./player-home.js", "./player-profile.js", "./player-vehicle.js", "./radio-voice.js", "./reactive-traffic.js", "./real-neighborhood.js", "./reinforcements.js", "./response-visuals.js", "./road-clearance.js", "./roads.js", "./rotary-beacons.js", "./route3d.js", "./scene-lighting.js", "./scene-perimeter.js", "./scene.js", "./signalling.js", "./sim.js", "./sources.html", "./staff-status.js", "./station-life.js", "./station-routing.js", "./style.css", "./supply-crew.js", "./tactical-placement.js", "./traffic-control.js", "./traffic-recovery.js", "./urban-detail.js", "./vehicle-console.css", "./vehicle-console.js", "./vehicle-spacing.js", "./vendor/LICENSE", "./vendor/OrbitControls.js", "./vendor/three.core.js", "./vendor/three.module.js", "./volunteer-models.js", "./volunteer-travel.js", "./water-models.js", "./water-rescue.js"];
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
