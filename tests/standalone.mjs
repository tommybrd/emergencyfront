import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const html = readFileSync(new URL('../Jouer-Valmont.html', import.meta.url), 'utf8');
const {imports} = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
assert(Object.keys(imports).length > 50);
assert(html.includes('import "valmont/scene.js";'));
assert(!/<script[^>]+src=|<link rel="stylesheet"/.test(html), 'No external script or stylesheet file');
for (const [key, value] of Object.entries(imports)) {
  assert(value.startsWith('data:text/javascript;base64,'));
  const source = Buffer.from(value.split(',')[1], 'base64').toString('utf8');
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, specifier] of uncommented.matchAll(/\b(?:from|import)\s*['"]([^'"\n]+)['"]/g)) {
    assert(imports[specifier], `${key} → ${specifier}`);
  }
  assert(!/import\.meta\.url|serviceWorker\.register/.test(source), key);
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], {input:source, encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
}
const audio = Buffer.from(imports['valmont/audio.js'].split(',')[1], 'base64').toString('utf8');
assert.equal((audio.match(/data:audio\/mpeg;base64,/g) || []).length, 1);
assert.equal((audio.match(/data:audio\/wav;base64,/g) || []).length, 2);
const credits = JSON.parse(html.match(/<script type="application\/json" id="valmont-credits">([\s\S]*?)<\/script>/)[1]);
assert(credits.threeLicense.includes('Permission is hereby granted'));
assert(credits.credits.includes('Guillaume P.'));
console.log('PASS HTML autonome : modules résolus, audio intégré, syntaxe et notices');
