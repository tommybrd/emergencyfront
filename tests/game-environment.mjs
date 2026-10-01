// Integration scenarios advance the clock explicitly in quarter-minute steps; render callbacks keep their fixed ×60 scale. Adaptive timing has separate coverage.

const els=new Map();const el=()=>({textContent:'',innerHTML:'',style:{},dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=String(v);},getAttribute(k){return this.attributes[k]??null;},className:'',classList:{toggle(){},add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},querySelectorAll(){return[]},showModal(){},close(){},remove(){},scrollHeight:0,scrollTop:0,clientHeight:0,getContext(){return{fillRect(){},fillText(){}}}});globalThis.document={createElement:el,getElementById(id){if(!els.has(id))els.set(id,el());return els.get(id);},querySelector:()=>el()};globalThis.window={addEventListener(){}};globalThis.innerWidth=1400;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=f=>globalThis.frame=(...args)=>{document.getElementById('speed').onchange?.({target:{value:'60'}});return f(...args);};globalThis.Audio=class{pause(){}play(){return Promise.resolve()}};


export {els};
