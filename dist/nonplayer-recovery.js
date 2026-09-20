// Wall-clock seconds of physical immobility; game pause never advances this timer.
export function nonPlayerStuck(v,seconds){
 if(!(v.personal||v.status==='traffic')||!v.path||v.model.visible===false){v.stallWatch=null;return false;}
 const p=v.model.position,w=v.stallWatch;
 if(!w||Math.hypot(p.x-w.x,p.z-w.z)>.5){v.stallWatch={x:p.x,z:p.z,seconds:0};return false;}
 w.seconds+=seconds;return w.seconds>=20;
}
