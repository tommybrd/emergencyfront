
const els=new Map();const el=()=>({textContent:'',innerHTML:'',style:{},dataset:{},className:'',classList:{toggle(){},add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},querySelectorAll(){return[]},showModal(){},close(){},remove(){},scrollHeight:0,scrollTop:0,clientHeight:0,getContext(){return{fillRect(){},fillText(){}}}});globalThis.document={createElement:el,getElementById(id){if(!els.has(id))els.set(id,el());return els.get(id);},querySelector:()=>el()};globalThis.window={addEventListener(){}};globalThis.innerWidth=1400;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=f=>globalThis.frame=f;globalThis.Audio=class{pause(){}play(){return Promise.resolve()}};


export {els};
