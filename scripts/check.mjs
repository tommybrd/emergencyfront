import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {resolve, dirname, relative, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
function files(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)]);
}
function localLink(file, value) {
  if (/^(?:https?:|data:|#|mailto:)/.test(value)) return;
  assert(!value.startsWith('/'), `Chemin absolu : ${relative(root, file)}`);
  const target = resolve(dirname(file), value.split(/[?#]/)[0]);
  assert(target === dist || target.startsWith(dist + '/'), `Hors du site : ${value}`);
  assert(existsSync(target), `Ressource manquante : ${relative(root, file)} → ${value}`);
}
for (const file of files(dist)) {
  const extension = extname(file);
  if (!['.js', '.html', '.css', '.json'].includes(extension)) continue;
  const text = readFileSync(file, 'utf8');
  assert(!/appgprj_|\/Users\/|github_pat_|gh[pousr]_[A-Za-z0-9]{30}/.test(text), `Contenu privé : ${relative(root, file)}`);
  if (extension === '.js') {
    const result = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    for (const [, specifier] of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)) {
      if (specifier === 'three') continue;
      if (specifier.startsWith('.')) localLink(file, specifier);
    }
    if (!file.includes('/vendor/')) {
      for (const [, value] of text.matchAll(/(?:new URL|fetch)\(\s*['"]([^'"]+)['"]/g)) localLink(file, value);
    }
  }
  if (extension === '.html') {
    for (const [, value] of text.matchAll(/(?:href|src)="([^"]+)"/g)) localLink(file, value);
  }
}
const siren = readFileSync(resolve(dist, 'deux-tons.mp3'));
assert(siren.length > 10000, 'Fichier du deux-tons absent ou incomplet');
assert(siren.subarray(0,3).toString('ascii') === 'ID3' || siren[0] === 0xff, 'Deux-tons MP3 invalide');
console.log('PASS syntaxe, ressources relatives, audio et périmètre public');

const tests = ['ui-input','station-refill','noria','guard-life',
  'immersion-updates', 'station-config', 'means-crew', 'vehicle-care', 'foam', 'scene-geometry', 'volunteer-night',
  'aerial-operations', 'aerial-integration', 'field-controls', 'building-actions', 'road-clearance', 'radio-voice', 'scene-perimeter', 'perimeter-integration', 'incident-aftermath', 'traffic-control', 'tactical-placement', 'reactive-traffic', 'incident-events', 'hose-deployment', 'incident-location',
  'incident-catalog', 'reinforcement-alerts', 'catalog-integration',
  'traffic-integration', 'manual-recovery', 'water-supply', 'elevator-rescue', 'rescue-integration', 'water-rescue-integration',
  'nursing-integration', 'fleet-layout', 'fire-water', 'audit-regressions',
  'player-profile', 'player-home', 'volunteer-travel', 'next-call', 'ambulance-mission', 'beach-integration'
];
for (const test of tests) {
  const result = spawnSync(process.execPath, [
    '--no-warnings', '--experimental-loader', './tests/runtime-loader.mjs', `tests/${test}.mjs`
  ], {cwd: root, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`PASS ${tests.length} scénarios de vérification`);
for (const [test, loader] of [['standalone', null], ['ambulance-mission', './tests/standalone-loader.mjs']]) {
  const args = ['--no-warnings', ...(loader ? ['--experimental-loader', loader] : []), `tests/${test}.mjs`];
  const result = spawnSync(process.execPath, args, {cwd:root, stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('PASS lancement et mission sanitaire avec les modules du HTML autonome');
