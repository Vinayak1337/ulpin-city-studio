import type { Building, District, Finding, Park, Rect, Road, Unit, Utility } from '../types';
import { unitUsableArea } from './floorLayout';

// Seeded, local-metre inspection fixtures. Nothing here is a surveyed or issued record.
function random(seed:number) { let s=seed>>>0; return () => { s=(Math.imul(1664525,s)+1013904223)>>>0; return s/4294967296; }; }
const rng=random(260917);
const pick=<T,>(a:T[])=>a[Math.floor(rng()*a.length)];
const names=['Aarav Mehta','Kavya Sethi','Rohan Batra','Diya Malhotra','Ishaan Verma','Ananya Rao','Neel Kapoor','Meera Arora','Arjun Sinha','Tara Khanna','Vihaan Joshi','Nisha Anand','Kabir Nair','Riya Saxena','Dev Ahuja','Sana Gill'];
const colors=['#e2ddd2','#e8e6df','#d2cfbf','#e1d2bc','#d1d8d6','#e6ddd0','#c8c7c0','#efe8d9'];
const horizontal=['South Avenue','Palm Avenue','Garden Street','5th Main Road','Lake View Road','School Road','Market Street','North Avenue','Ridge Road'];
const vertical=['West Avenue','Cedar Lane','Maple Lane','Gulmohar Lane','Park Lane','Ashoka Lane','Temple Lane','Orchard Lane','East Avenue'];
const roads:Road[]=[];
const utilities:Utility[]=[];
for(let i=0;i<=8;i++) {
  const p=-416+i*104;
  roads.push({id:`R-H${i}`,name:horizontal[i],x:0,z:p,width:844,depth:12,axis:'x',widthMeters:12});
  roads.push({id:`R-V${i}`,name:vertical[i],x:p,z:0,width:12,depth:844,axis:'z',widthMeters:12});
  utilities.push({id:`WP-H${i}`,kind:'Water',points:[[-416,-2.6,p-3.05],[416,-2.6,p-3.05]],depth:2.6,diameter:300,operator:'Demo Water Network'});
  utilities.push({id:`WP-V${i}`,kind:'Water',points:[[p-3.05,-2.6,-416],[p-3.05,-2.6,416]],depth:2.6,diameter:300,operator:'Demo Water Network'});
  utilities.push({id:`SW-H${i}`,kind:'Sewer',points:[[-416,-3.8,p+2.5],[416,-3.8,p+2.5]],depth:3.8,diameter:600,operator:'Demo Sewer Network'});
  utilities.push({id:`EL-V${i}`,kind:'Electric',points:[[p+4,-1.2,-416],[p+4,-1.2,416]],depth:1.2,diameter:100,operator:'Demo Distribution Grid'});
}
const parkCells=new Map([['3,3','Central Park'],['1,5','Community Gardens'],['6,2','Ashoka Park'],['5,6','Neighbourhood Green'],['1,1','Cedar Gardens']]);
const parks:Park[]=[];
const buildings:Building[]=[];
let count=0;
let defaultBuildingId='';
for(let row=0;row<8;row++) for(let col=0;col<8;col++) {
  const cx=(col-3.5)*104,cz=(row-3.5)*104;
  const park=parkCells.get(`${col},${row}`);
  if(park){parks.push({id:`PARK-${col}-${row}`,name:park,x:cx,z:cz,width:90,depth:90});continue;}
  for(let iz=0;iz<4;iz++) for(let ix=0;ix<4;ix++) {
    count++;
    const id=`BLD-${String(count).padStart(4,'0')}`;
    const parcel={x:cx+(ix-1.5)*22.5,z:cz+(iz-1.5)*22.5,width:22.5,depth:22.5};
    const special=col===4&&row===3&&ix===0&&iz===3;
    let width=12+Math.floor(rng()*6),depth=13+Math.floor(rng()*6),floors=3+Math.floor(rng()*4);
    let x=parcel.x+(rng()-.5)*1.2,z=parcel.z+(rng()-.5)*1.2;
    if(count%53===0){x+=5.6;}
    if(special){width=16;depth=18;floors=5;x=18.25;z=-14;defaultBuildingId=id;}
    const owner=special?'Aarav Mehta':pick(names);
    const blockId=`${String.fromCharCode(65+row)}${col+1}`;
    const use=col===5&&iz===3?'Mixed use':count%31===0?'Commercial':'Residential';
    const units:Unit[]=[];
    for(let floor=0;floor<floors;floor++) for(let u=1;u<=2;u++) {
      const tenure=floor===0&&u===1?'Owner occupied':rng()<.17?'Vacant':'Rented';
      const number=floor===0?`G0${u}`:`${floor}0${u}`;
      units.push({id:`${id}/F${floor}/U${u}`,number,floor,area:unitUsableArea(width,depth,width*depth>225?2:1),occupant:tenure==='Vacant'?'Unoccupied':tenure==='Owner occupied'?owner:pick(names),tenure,rent:tenure==='Rented'?(10+Math.floor(rng()*17))*1000:0,leaseStart:'2026-04-01',leaseEnd:'2027-03-31',bedrooms:width*depth>225?2:1});
    }
    buildings.push({id,ulpin:special?'11007500003527':`110075${String(count+10000000).padStart(8,'0')}`,parcelId:`PAR-${blockId}-${ix+1}${iz+1}`,blockId,name:special?'Lake View Residence':`${pick(['Cedar','Parkside','Ashoka','Gulmohar','Garden','Palm','Maple','Orchard'])} ${use==='Commercial'?'Plaza':'Residence'}`,address:special?'12, Lake View Road':`${(iz*4+ix+1)*2}, ${horizontal[row+1]}, Block ${blockId}`,floors,floorHeight:3.2,height:floors*3.2,use,owner,parcel,color:special?'#dbd2c5':pick(colors),roofColor:pick(['#c4c6bf','#d1cec2','#babeb9','#c9c7bd']),variant:Math.floor(rng()*4),units,registeredOn:'2025-06-12',surveyNumber:`DEMO/${blockId}/${count}`,x,z,width,depth});
  }
}
export const district:District={name:'Lake View District',extent:832,buildings,parks,roads,utilities,defaultBuildingId,coordinateNote:'Synthetic local-metre district. Approximate demo placement near Delhi (28.62 N, 77.05 E); not surveyed, issued or authoritative.'};
export const intersect=(a:Rect,b:Rect):Rect|null=>{
  const l=Math.max(a.x-a.width/2,b.x-b.width/2),r=Math.min(a.x+a.width/2,b.x+b.width/2),t=Math.max(a.z-a.depth/2,b.z-b.depth/2),bt=Math.min(a.z+a.depth/2,b.z+b.depth/2);
  return r>l&&bt>t?{x:(l+r)/2,z:(t+bt)/2,width:r-l,depth:bt-t}:null;
};
const area=(r:Rect|null)=>r?r.width*r.depth:0;
const round=(n:number)=>Math.round(n*100)/100;
export function utilityClearance(b:Rect,u:Utility):number {
  let min=Infinity;
  for(let i=1;i<u.points.length;i++) {
    const a=u.points[i-1],c=u.points[i];
    const dx=Math.max(b.x-b.width/2-Math.max(a[0],c[0]),Math.min(a[0],c[0])-(b.x+b.width/2),0);
    const dz=Math.max(b.z-b.depth/2-Math.max(a[2],c[2]),Math.min(a[2],c[2])-(b.z+b.depth/2),0);
    min=Math.min(min,Math.max(0,Math.hypot(dx,dz)-u.diameter/2000));
  }
  return round(min);
}
export function computeFindings(b:Building):Finding[] {
  const findings:Finding[]=[];
  const outside=round(area(b)-area(intersect(b,b.parcel)));
  if(outside>.01){
    const south=b.z+b.depth/2-(b.parcel.z+b.parcel.depth/2);
    const east=b.x+b.width/2-(b.parcel.x+b.parcel.width/2);
    const geometry=south>0?{x:b.x,z:b.z+b.depth/2-south/2,width:b.width,depth:south}:east>0?{x:b.x+b.width/2-east/2,z:b.z,width:east,depth:b.depth}:undefined;
    findings.push({id:`${b.id}-parcel`,buildingId:b.id,type:'Parcel',title:'Outside parcel boundary',value:outside,unit:'m²',severity:'critical',description:'Footprint area minus its intersection with the recorded demo parcel. Geometry-derived; not a legal determination.',geometry});
  }
  for(const road of roads){const geometry=intersect(b,road);if(geometry) findings.push({id:`${b.id}-${road.id}`,buildingId:b.id,type:'Road',title:`Road overlap · ${road.name}`,value:round(area(geometry)),unit:'m²',severity:'critical',description:`The building footprint intersects the ${road.widthMeters} m synthetic road corridor.`,geometry});}
  const water=utilities.filter(u=>u.kind==='Water').map(u=>({u,gap:utilityClearance(b,u)})).sort((a,c)=>a.gap-c.gap)[0];
  if(water.gap<2) findings.push({id:`${b.id}-utility`,buildingId:b.id,type:'Utility',title:'Water pipeline clearance',value:water.gap,unit:'m',severity:'warning',description:`Horizontal footprint-to-pipe-surface distance is ${water.gap} m; below the 2 m DEMO threshold. Pipe centre depth ${water.u.depth} m. This threshold is not a municipal regulation.`});
  return findings;
}
export const allFindings=buildings.flatMap(computeFindings);
export const getBuilding=(id:string)=>buildings.find(b=>b.id===id||b.ulpin===id)||buildings.find(b=>b.id===defaultBuildingId)!;
function coordinates(r:Rect){const p=(x:number,z:number)=>[77.05+x/(111320*Math.cos(28.62*Math.PI/180)),28.62-z/111320];return [[p(r.x-r.width/2,r.z-r.depth/2),p(r.x-r.width/2,r.z+r.depth/2),p(r.x+r.width/2,r.z+r.depth/2),p(r.x+r.width/2,r.z-r.depth/2),p(r.x-r.width/2,r.z-r.depth/2)]];}
export function exportGeoJSON(){return {type:'FeatureCollection',name:'SYNTHETIC_Lake_View_Parcels',properties:{synthetic:true,disclaimer:district.coordinateNote,notOfficialULPIN:true},features:buildings.map(b=>({type:'Feature',id:b.parcelId,geometry:{type:'Polygon',coordinates:coordinates(b.parcel)},properties:{synthetic:true,ulpin_demo:b.ulpin,building_id:b.id,parcel_id:b.parcelId,owner_fictional:b.owner,floors:b.floors,height_m:b.height,parcel_area_m2:area(b.parcel),footprint_m2:area(b)}}))};}
