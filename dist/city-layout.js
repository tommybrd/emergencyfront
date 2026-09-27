// Ville fictive conçue pour une lecture claire des quartiers et des accès secours.
export const districts=[{name:'Centre-ville',target:[70,-25]},{name:'Centre commercial',target:[210,100]},{name:'Forêt & lac',target:[-130,-160]},{name:'Les Hauts · immeubles',target:[215,-35]},{name:'Stade municipal',target:[325,100]},{name:'Voie rapide',target:[170,-220]}];
const roads=[];const add=(a,b,name,zone='city',express=false)=>roads.push({a,b,name,zone,express});
for(const x of[0,140,280,360]){const zs=x===0?[-220,-90,30,105,160]:[-220,-90,30,160];for(let i=0;i<zs.length-1;i++)add([x,zs[i]],[x,zs[i+1]],x===0?'Boulevard des Tilleuls':x===140?'Avenue de la République':x===280?'Boulevard des Sports':'Avenue du Centre Hospitalier',x===280?'stadium':'city');}
for(const z of[-90,30,160])for(const [a,b]of[[0,140],[140,280],[280,360]])add([a,z],[b,z],z===-90?'Route du Lac':z===30?'Avenue des Commerces':'Boulevard du Parc',z===-90?'forest':z===160?'shopping':'city');
for(const [a,b]of[[[70,-90],[70,30]],[[0,-30],[70,-30]],[[70,-30],[140,-30]]])add(a,b,'Rue du Marché','center');
// Les intersections sont des nœuds partagés du réseau de déplacement.
const split=(a,b,p)=>{const i=roads.findIndex(r=>r.a[0]===a[0]&&r.a[1]===a[1]&&r.b[0]===b[0]&&r.b[1]===b[1]);if(i>=0){const r=roads.splice(i,1)[0];roads.push({...r,b:p},{...r,a:p});}};
split([70,-90],[70,30],[70,-30]);split([0,-90],[0,30],[0,-30]);split([140,-90],[140,30],[140,-30]);split([0,-90],[140,-90],[70,-90]);split([0,30],[140,30],[70,30]);
for(const [a,b]of[[[0,-220],[140,-220]],[[140,-220],[280,-220]],[[280,-220],[360,-220]]])add(a,b,'Voie rapide · rocade Nord','express',true);
split([140,-220],[140,-90],[140,-155]);add([140,-155],[110,-155],'Allée du Lac','forest');
// Pistes forestières sinueuses reliées à deux accès du réseau urbain.
const trail=(points,name)=>{for(let i=1;i<points.length;i++)roads.push({a:points[i-1],b:points[i],name,zone:'forest',trail:true});};
trail([[0,-90],[-35,-106],[-72,-124],[-104,-150],[-150,-163],[-190,-145],[-228,-173]],'Piste des Pins');
trail([[-72,-124],[-82,-177],[-116,-205],[-168,-207],[-190,-145]],'Piste des Crêtes');
trail([[-150,-163],[-160,-112],[-126,-86],[-80,-75],[-35,-106]],'Chemin du Bois');
split([0,-220],[0,-90],[0,-160]);trail([[-82,-177],[-38,-190],[0,-160]],'Accès forestier Est');
// Faubourg ancien et boulevard périphérique sud : des rues moins rectilignes.
for(const [a,b]of[[[0,-30],[-38,-30]],[[-38,-30],[-76,-18]],[[-76,-18],[-112,5]],[[-112,5],[-120,40]],[[-120,40],[-116,102]],[[-116,102],[-100,160]],[[-100,160],[-35,180]],[[-35,180],[0,160]]])add(a,b,'Rue des Faubourgs','center');
for(const [a,b]of[[[0,160],[40,194]],[[40,194],[104,205]],[[104,205],[175,199]],[[175,199],[235,183]],[[235,183],[280,160]]])add(a,b,'Promenade des Jardins','city');
const buildings=[];const building=(x,z,w,d,levels,style='town')=>buildings.push({points:[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2],[x-w/2,z-d/2]],levels,style,x,z,w,d});
for(const x of[22,47,93,118])for(const z of[-68,-48,-9,12])building(x,z,15+((x+z+200)%4),12+((x+200)%3),2+((x+z+201)%3),'town');
for(const x of[166,210,254])for(const z of[-65,-15,10])building(x,z,x===210?30:22,18,z===10?4:x===210?9:6,'tower');
for(const x of[25,57,93,123])for(const z of[60,93,125])building(x,z,17,15,2,'house');
for(const [x,z,w,d]of[[-35,-6,18,20],[-64,6,17,16],[-139,25,17,20],[-142,65,20,27],[-139,115,19,22],[24,220,21,17],[62,230,22,18],[110,231,25,17],[156,225,22,17]])building(x,z,w,d,2,'town');
building(-53,-63,27,23,3,'civic');
building(206,88,90,45,2,'mall');
// Subdivide dense districts and populate the vacant northern/eastern blocks.
for(const x of [186,234])add([x,-90],[x,30],'Rue des Hauts','city');
add([140,-40],[280,-40],'Rue des Érables','city');
add([75,30],[75,160],'Rue des Jardins','city');
add([0,109],[140,109],'Rue des Lilas','city');
add([210,-220],[210,-90],'Rue du Nord','city');
add([140,-155],[360,-155],'Avenue des Ateliers','city');
add([280,-30],[360,-30],'Rue des Écoles','city');
export const urbanPlots=[];
function populate(x0,x1,z0,z1,style){
 const plot={x0,x1,z0,z1};urbanPlots.push(plot);
 for(const [i,x] of [x0+(x1-x0)*.28,x0+(x1-x0)*.72].entries())
 for(const [j,z] of [z0+(z1-z0)*.28,z0+(z1-z0)*.72].entries())
 building(x,z,style==='tower'?20:18,16,style==='tower'?4+(i+j)%3:2+(i+j)%2,style);
}
for(const [x0,x1] of [[140,210],[210,280],[280,360]])
 for(const [z0,z1] of [[-220,-155],[-155,-90]])populate(x0,x1,z0,z1,x0===210?'tower':'town');
for(const [z0,z1] of [[-90,-30],[-30,30]])populate(280,360,z0,z1,'town');
// Each crossing is split into shared graph nodes, including existing T junctions.
const segments=roads.splice(0),crossings=segments.flatMap(r=>[r.a,r.b]);
for(const a of segments)for(const b of segments){
 const ax=a.b[0]-a.a[0],az=a.b[1]-a.a[1],bx=b.b[0]-b.a[0],bz=b.b[1]-b.a[1],den=ax*bz-az*bx;
 if(Math.abs(den)<1e-8)continue;
 const dx=b.a[0]-a.a[0],dz=b.a[1]-a.a[1],t=(dx*bz-dz*bx)/den,u=(dx*az-dz*ax)/den;
 if(t>=0&&t<=1&&u>=0&&u<=1)crossings.push([a.a[0]+t*ax,a.a[1]+t*az]);
}
for(const r of segments){
 const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],len2=dx*dx+dz*dz;
 const cuts=[0,1,...crossings.filter(p=>Math.abs((p[0]-r.a[0])*dz-(p[1]-r.a[1])*dx)<1e-6).map(p=>((p[0]-r.a[0])*dx+(p[1]-r.a[1])*dz)/len2)].filter(t=>t>=0&&t<=1).sort((a,b)=>a-b);
 const unique=cuts.filter((t,i)=>!i||t-cuts[i-1]>1e-7),at=t=>[+(r.a[0]+t*dx).toFixed(6),+(r.a[1]+t*dz).toFixed(6)];
 for(let i=1;i<unique.length;i++)roads.push({...r,a:at(unique[i-1]),b:at(unique[i])});
}
export const block={name:'Valmont · ville de simulation',roads,buildings};
