import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const scope='https://example.test/emergencyfront/',listeners=new Map(),stored=new Map(),deleted=[],precached=[];
let offline=false,lastFetch,claimed=false,skipped=false,opened;
const cache={addAll:async requests=>{precached.push(...requests);},put:async(request,response)=>stored.set(request.url,response),match:async request=>stored.get(typeof request==='string'?new URL(request,scope).href:request.url)};
const caches={open:async name=>{opened=name;return cache;},keys:async()=>[opened,opened+'-previous','unrelated-project-cache'],delete:async name=>{deleted.push(name);return true;}};
class ScopedRequest extends Request{constructor(url,options){super(new URL(url,scope),options);}}
vm.runInNewContext(readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),{self:{registration:{scope},addEventListener:(type,handler)=>listeners.set(type,handler),skipWaiting:async()=>{skipped=true;},clients:{claim:async()=>{claimed=true;}}},caches,Request:ScopedRequest,Response,fetch:async(request,options)=>{lastFetch={request,options};if(offline)throw new TypeError('offline');return new Response('fresh-network',{status:200});}});
async function lifecycle(type){const work=[];listeners.get(type)({waitUntil:p=>work.push(p)});await Promise.all(work);}
async function request(url,mode='cors',method='GET'){let result;const work=[];listeners.get('fetch')({request:{url,method,mode},respondWith:p=>{result=p;},waitUntil:p=>work.push(p)});if(!result)return null;const response=await result;await Promise.all(work);return response;}
await lifecycle('install');assert(skipped);assert(precached.length>100);assert(precached.every(r=>r.cache==='reload'&&r.url.startsWith(scope)),'new releases bypass stale HTTP cache during preloading');
await lifecycle('activate');assert(claimed);assert.equal(deleted.length,1);assert(deleted[0].startsWith(opened));assert(!deleted.includes('unrelated-project-cache'));
stored.set(scope+'audio.js',new Response('stale-audio'));
assert.equal(await (await request(scope+'audio.js')).text(),'fresh-network');assert.equal(lastFetch.options.cache,'no-cache','network reads must revalidate an HTTP-cached module');assert.equal(await stored.get(scope+'audio.js').clone().text(),'fresh-network');
offline=true;assert.equal(await (await request(scope+'audio.js')).text(),'fresh-network','the newly validated resource remains available offline');stored.set(scope+'index.html',new Response('offline-game'));assert.equal(await (await request(scope+'some-page','navigate')).text(),'offline-game');assert.equal((await request(scope+'missing.js')).type,'error');assert.equal(await request('https://example.test/other-project/audio.js'),null);assert.equal(await request(scope+'save','cors','POST'),null);
console.log('PASS fresh release cache, HTTP revalidation, offline game fallback, missing resource failure and project isolation');
