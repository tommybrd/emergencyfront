// Materials from the palette are shared by vehicles, crew and buildings.
export function disposeObject(root){
 if(!root)return;
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m&&!m.userData?.shared)materials.add(m);});
 root.removeFromParent();
 for(const g of geometries)g.dispose();
 for(const m of materials){m.map?.dispose();m.dispose();}
}
