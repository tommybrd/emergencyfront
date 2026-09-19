// Test the actual embedded modules; only the GPU and camera DOM are mocked.
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../Jouer-Valmont.html', import.meta.url), 'utf8');
const {imports} = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
export async function resolve(specifier, context, next) {
  if (specifier === 'three' || specifier === 'valmont/vendor/three.module.js') {
    return {url:new URL('./mock-three.mjs', import.meta.url).href, shortCircuit:true};
  }
  if (specifier.endsWith('/OrbitControls.js')) {
    return {url:new URL('./mock-orbit.mjs', import.meta.url).href, shortCircuit:true};
  }
  if (imports[specifier]) return {url:imports[specifier], shortCircuit:true};
  if (specifier.startsWith('../dist/') && !specifier.includes('/vendor/')) {
    const key = 'valmont/' + specifier.slice('../dist/'.length);
    if (imports[key]) return {url:imports[key], shortCircuit:true};
  }
  return next(specifier, context);
}
