export const AMBER_PATTERNS=[['alternate','Alterné'],['left','← Gauche'],['right','Droite →'],['outward','← Écartement →'],['flash','Simultané']];
// Orange par défaut : motif choisi sur les lieux, flash simultané pendant un départ prioritaire ; un choix manuel prime.
export function amberDefault(e){if(e.amber!=null)return !!e.amber;if(['scene','reconditioning','transport'].includes(e.status))return true;return !!e.beacons&&['departing','enroute'].includes(e.status);}
export function amberPatternFor(e){return e.amber==null&&e.beacons&&['departing','enroute'].includes(e.status)?'flash':e.amberPattern||'alternate';}
// Gauche/droite correspondent à la vue depuis l’arrière du véhicule.
export function amberLit(mode,index,count,ms){const step=Math.floor(ms/120),phase=step%(count+3);if(mode==='left')return phase<count&&index<=phase;if(mode==='right')return phase<count&&index>=count-1-phase;if(mode==='outward'){const ring=Math.floor(Math.abs(index-(count-1)/2));return step%(Math.ceil(count/2)+2)===ring;}if(mode==='flash')return ms%800<120||(ms%800>=220&&ms%800<340);return Math.floor(ms/300)%2===index%2;}
