const fs=require('fs');
function edit(file, replacements){let s=fs.readFileSync(file,'utf8');for(const [a,b]of replacements){if(!s.includes(a))throw new Error('Missing pattern in '+file+': '+a.slice(0,100));s=s.replace(a,b);}fs.writeFileSync(file,s);}
edit('src/components/Visuals.tsx',[["export function FloorPlan({b,floor=0}","function LegacyFloorPlan({b,floor=0}"]]);fs.appendFileSync('src/components/Visuals.tsx','\nexport { default as FloorPlan } from "./FloorPlan";\n');
edit('src/scene/CityScene.tsx',[["import { NavigationControls } from './NavigationControls';","import { NavigationControls } from './NavigationControls';\nimport FloorInterior from './FloorInterior';"]]);
let s=fs.readFileSync('src/scene/CityScene.tsx','utf8');
const start=s.indexOf('function CutawayBuilding('),end=s.indexOf('\nfunction Selection(',start);if(start<0||end<0)throw Error('Cutaway markers');
s=s.slice(0,start)+`function CutawayBuilding({b,exploded,floor,onFloor,onUnit}:{b:Building;exploded:boolean;floor:number|null;onFloor:(n:number|null)=>void;onUnit?:(id:string)=>void}) {
  return <group position={[b.x,.4,b.z]}>{Array.from({length:b.floors},(_,f)=>{
    if(floor!==null&&f>floor&&!exploded)return null;
    const active=floor===null||floor===f;
    return <group key={f} position={[0,f*(exploded?5.9:b.floorHeight),0]}>
      <FloorInterior b={b} floor={f} active={active} onFloor={onFloor} onUnit={onUnit}/>
      {(exploded||floor===f)&&<Html position={[b.width/2+2,1,0]} center zIndexRange={[15,0]}><button className={\`floor-label \${active?'active':''}\`} onClick={()=>onFloor(f)}>{f===0?'Ground':\`Floor \${f}\`}<span>{(f*b.floorHeight).toFixed(1)} m</span></button></Html>}
    </group>;
  })}</group>;
}
`+s.slice(end);
s=s.replace('function Selection({b,exploded,floor,onFloor,layers}:','function Selection({b,exploded,floor,onFloor,layers,onUnit}:').replace('onFloor:(n:number|null)=>void;layers:Layers}) {','onFloor:(n:number|null)=>void;layers:Layers;onUnit?:(id:string)=>void}) {');
s=s.replace('<CutawayBuilding b={b} exploded={exploded} floor={floor} onFloor={onFloor}/>','<CutawayBuilding b={b} exploded={exploded} floor={floor} onFloor={onFloor} onUnit={onUnit}/>');
s=s.replace("mode:'2d'|'3d';command:CameraCommand;","mode:'2d'|'3d';paused?:boolean;onUnit?:(id:string)=>void;command:CameraCommand;");
s=s.replace('mode,command,onSelect,onFloor,onCamera,onReady}=props','mode,command,onSelect,onFloor,onCamera,onReady,onUnit}=props');
s=s.replace('<Selection b={selected} exploded={exploded} floor={floor} onFloor={onFloor} layers={layers}/>','<Selection b={selected} exploded={exploded} floor={floor} onFloor={onFloor} layers={layers} onUnit={onUnit}/>');
s=s.replace('return <Canvas orthographic shadows=',"return <Canvas frameloop={props.paused?'never':'always'} orthographic shadows=");
fs.writeFileSync('src/scene/CityScene.tsx',s);
edit('src/App.tsx',[
["import type { Building, CameraCommand, InspectorTab, Layers, ModalKind } from './types';","import type { Building, CameraCommand, InspectorTab, Layers, ModalKind, RecordContext } from './types';\nimport { mapScale } from './data/mapScale';\nimport DialogSection from './components/DialogSection';\nimport './refinements.css';"],
["const searchRef=useRef<HTMLInputElement>(null)","const [recordContext,setRecordContext]=useState<RecordContext>({}),[mobileLayers,setMobileLayers]=useState(false),[mobileExpanded,setMobileExpanded]=useState(false);\n  const openModal=useCallback((kind:ModalKind,context:RecordContext={})=>{setRecordContext(context);setModal(kind);},[]);\n  const searchRef=useRef<HTMLInputElement>(null)"],
["const select=useCallback((id:string)=>{setSelectedId(id);setExploded(false);setFloor(null);setTab('overview');},[]);","const select=useCallback((id:string)=>{setSelectedId(id);setExploded(false);setFloor(null);setTab('overview');setMobileExpanded(false);setMobileLayers(false);},[]);"],
["const handleCamera=useCallback((v:{x:number;z:number;zoom:number;heading:number})=>setCamera(v),[]);","const handleCamera=useCallback((v:{x:number;z:number;zoom:number;heading:number})=>setCamera(old=>Math.abs(old.x-v.x)+Math.abs(old.z-v.z)+Math.abs(old.zoom-v.zoom)+Math.abs(old.heading-v.heading)<.0005?old:v),[]);\n  const scale=mapScale(camera.zoom);"],
["<aside className={`sidebar ${collapsed?'collapsed':''}`} aria-label=", "<aside className={`sidebar ${collapsed?'collapsed':''} ${mobileLayers?'mobile-open':''}`} aria-label="],
["{collapsed?<div className=", "<button className=\"mobile-layer-close\" aria-label=\"Close layers\" onClick={()=>setMobileLayers(false)}><X size={18}/></button>\n        {collapsed?<div className="],
["<main className=\"map-viewport\"", "{mobileLayers&&<button className=\"mobile-layer-scrim\" aria-label=\"Close layer menu\" onClick={()=>setMobileLayers(false)}/>}\n      <main className=\"map-viewport\""],
["<CityScene selected={selected}","<CityScene paused={modal!==null} onUnit={id=>openModal('register',{unitId:id,floor:selected?.units.find(u=>u.id===id)?.floor})} selected={selected}"],
["<div className=\"map-toolbar\"><div", "<button className=\"mobile-layers-button\" aria-expanded={mobileLayers} onClick={()=>{setCollapsed(false);setMobileLayers(v=>!v);}}><Layers3 size={17}/>Layers</button>\n        <div className=\"map-toolbar\"><div"],
["move('block');setMode('3d');", "move('block');"],
["move('district');setMode('3d');", "move('district');"],
["<span style={{width:`${Math.min(140,Math.max(40,Math.round((camera.zoom>2?25:100)*camera.zoom)))}px`}}/><small>{camera.zoom>2?'25':'100'} m</small>","<span data-metres={scale.metres} style={{width:`${scale.pixels}px`}}/><small>{scale.label}</small>"],
["onFocus={focus} onModal={setModal}","onFocus={focus} onModal={openModal}"],
["floor={floor} preview={preview}/>","floor={floor} preview={preview} mobileExpanded={mobileExpanded} onToggleMobile={()=>setMobileExpanded(v=>!v)}/>"],
["<RecordModal kind={modal}","<RecordModal key={`${modal}-${recordContext.unitId||''}-${recordContext.doc||''}`} context={recordContext} preview={preview} kind={modal}"],
["<section role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"export-title\" className=\"export-dialog\">","<DialogSection onClose={()=>setModal(null)} labelledBy=\"export-title\" className=\"export-dialog\">"],
["</p></div></section></div>}","</p></div></DialogSection></div>}"]
]);
