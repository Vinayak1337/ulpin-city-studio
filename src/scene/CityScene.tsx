import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import { NavigationControls } from './NavigationControls';
import FloorInterior from './FloorInterior';
import { buildArchitecture } from './architecture';
import { useSurfaceMaps, EnvironmentLighting, Grounding } from './Appearance';
import UtilityMeasure from './UtilityMeasure';
import type { MapControls } from 'three/addons/controls/MapControls.js';
import * as THREE from 'three';
import { district, computeFindings } from '../data/district';
import type { Building, CameraCommand, Layers } from '../types';

type Item={p:[number,number,number];s:[number,number,number];c:string;r?:[number,number,number];owner?:string};
type Parts=Record<string,Item[]>;
const add=(a:Item[],x:number,y:number,z:number,w:number,h:number,d:number,c:string,owner?:string,r?:[number,number,number])=>a.push({p:[x,y,z],s:[w,h,d],c,owner,r});
const noRay=()=>{};

// Alpha-cut foliage keeps fine silhouettes without shipping external textures.
function foliageAssets(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;
  let seed=528;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.lineCap='round';
  for(let k=0;k<9;k++){const a=k*2.399;ctx.strokeStyle='#78835a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(128,142);ctx.quadraticCurveTo(128+Math.cos(a)*37,128+Math.sin(a)*34,128+Math.cos(a)*96,128+Math.sin(a)*93);ctx.stroke();}
  for(let i=0;i<1500;i++){
    const angle=r()*Math.PI*2,rad=Math.sqrt(r())*(94+14*Math.sin(angle*7));const x=128+Math.cos(angle)*rad,y=128+Math.sin(angle)*rad;
    const shade=Math.round(205+r()*45+(128-y)*.1);ctx.fillStyle=`rgb(${Math.round(shade*.94)},${shade},${Math.round(shade*.78)})`;ctx.beginPath();ctx.ellipse(x,y,2+r()*3,1+r()*2,r()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  const positions:number[]=[],uvs:number[]=[],normals:number[]=[];
  const triangles=[0,1,2,0,2,3],uv=[[0,0],[1,0],[1,1],[0,1]];
  for(let k=0;k<6;k++){
    const rotation=new THREE.Euler(k===4?Math.PI/2:k===5?Math.PI/4:0,k*Math.PI/4,k===5?Math.PI/4:0);
    const verts=[new THREE.Vector3(-1.15,-1.15,0),new THREE.Vector3(1.15,-1.15,0),new THREE.Vector3(1.15,1.15,0),new THREE.Vector3(-1.15,1.15,0)].map(v=>v.applyEuler(rotation));
    for(const i of triangles){positions.push(...verts[i].toArray());uvs.push(...uv[i]);const n=verts[i].clone().normalize();normals.push(...n.toArray());}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  return {texture,geometry};
}
const foliage=foliageAssets();
function Batch({items,kind='box',hidden,opacity=1,onPick,onHover,cast=true,roughness=.86,map,wire=false}:{items:Item[];kind?:'box'|'crown'|'cylinder';hidden?:string;opacity?:number;onPick?:(id:string)=>void;onHover?:(id:string|null)=>void;cast?:boolean;roughness?:number;map?:THREE.Texture;wire?:boolean}) {
  const ref=useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(()=>{
    const o=new THREE.Object3D(),color=new THREE.Color();
    items.forEach((a,i)=>{o.position.set(...a.p);o.rotation.set(...(a.r||[0,0,0]));o.scale.set(...(hidden!==undefined&&a.owner===hidden?[0,0,0] as [number,number,number]:a.s));o.updateMatrix();ref.current.setMatrixAt(i,o.matrix);ref.current.setColorAt(i,color.set(a.c));});
    ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();
  },[items,hidden]);
  function picked(e:ThreeEvent<MouseEvent>){if(e.instanceId!==undefined&&e.delta<5){e.stopPropagation();const id=items[e.instanceId]?.owner;if(id)onPick?.(id);}}
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow={cast&&opacity===1} receiveShadow frustumCulled={false} onClick={onPick?picked:undefined} onPointerMove={onHover?(e)=>{e.stopPropagation();onHover(items[e.instanceId||0]?.owner||null);}:undefined} onPointerOut={onHover?()=>onHover(null):undefined} raycast={onPick?undefined:noRay}>
    {kind==='box'?<boxGeometry/>:kind==='crown'?<primitive object={foliage.geometry} attach="geometry"/>:<cylinderGeometry args={[.5,.5,1,10]}/>}
    {wire?<meshBasicMaterial wireframe transparent opacity={opacity} depthWrite={false}/>:<meshStandardMaterial roughness={roughness} metalness={roughness<.6?.12:0} transparent={opacity<1} opacity={opacity} depthWrite={opacity>.6} map={kind==='crown'?foliage.texture:map} alphaTest={kind==='crown'?.45:0} side={kind==='crown'?THREE.DoubleSide:THREE.FrontSide}/>}
  </instancedMesh>;
}

const architectureData=buildArchitecture(district.buildings);

function Architecture({selected,hidden,underground,onSelect,onHover}:{selected:string|undefined;hidden:string|undefined;underground:boolean;onSelect:(id:string)=>void;onHover:(id:string|null)=>void}){
  const {camera,gl}=useThree();
  const maps=useSurfaceMaps();
  const [region,setRegion]=useState({x:0,z:0,r:160});const regionRef=useRef(region),elapsed=useRef(0);
  useFrame((state,delta)=>{
    elapsed.current+=delta;if(elapsed.current<.4)return;elapsed.current=0;
    const controls=state.controls as unknown as {target?:THREE.Vector3}|null;
    const t=controls?.target;if(!t)return;
    const r=camera.zoom<1.65?0:Math.min(310,Math.max(70,Math.max(gl.domElement.clientWidth,gl.domElement.clientHeight)/camera.zoom*.72));
    const old=regionRef.current;
    if(Math.abs(t.x-old.x)>22||Math.abs(t.z-old.z)>22||Math.abs(r-old.r)>15){const next={x:t.x,z:t.z,r};regionRef.current=next;setRegion(next);}
  });
  const parts=useMemo(()=>Object.entries(architectureData).filter(([name])=>!underground||name==='body').map(([name,items])=>({name,items:name==='body'||name==='roof'?items:items.filter(a=>a.owner===selected||(region.r>0&&(a.p[0]-region.x)**2+(a.p[2]-region.z)**2<region.r**2))})),[selected,region,underground]);
  return <>{parts.map(({name,items})=><Batch key={`${name}-${underground}`} items={items} kind={name==='tanks'?'cylinder':'box'} hidden={hidden} opacity={underground?.3:1} wire={underground} onPick={name==='body'?onSelect:undefined} onHover={name==='body'?onHover:undefined} cast={name!=='windows'&&name!=='solar'} roughness={name==='windows'?.38:.87} map={name==='roof'?maps.roof:(name==='body'||name==='frames')?maps.concrete:undefined}/>)}</>;
}

function makeTexture(kind:'grass'|'asphalt') {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
  c.fillStyle=kind==='grass'?'#9eab86':'#606a6b';c.fillRect(0,0,256,256);
  let s=710;for(let i=0;i<14000;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const x=(s>>>16)%256;s=(Math.imul(s,1664525)+1013904223)>>>0;const y=(s>>>16)%256;const light=(s>>>11)%2===0;c.fillStyle=kind==='grass'?(light?'rgba(213,216,151,.14)':'rgba(45,71,40,.13)'):(light?'rgba(231,226,210,.05)':'rgba(17,26,25,.08)');c.fillRect(x,y,kind==='grass'?2:1,kind==='grass'?3:1);}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='grass'?100:65,kind==='grass'?100:65);t.anisotropy=8;return t;
}

function streets():Parts {
  const a:Parts={sidewalk:[],lots:[],markings:[],edges:[],cars:[],carGlass:[],tyres:[]};
  for(let row=0;row<8;row++)for(let col=0;col<8;col++)add(a.sidewalk,(col-3.5)*104,.12,(row-3.5)*104,92,.24,92,'#b9b9a8');
  for(const b of district.buildings)add(a.lots,b.parcel.x,.255,b.parcel.z,21.8,.06,21.8,(Number(b.id.slice(-2))%3===0)?'#c4c7a8':'#c9cbb1',b.id);
  for(let i=0;i<=8;i++){
    const p=-416+i*104;
    for(let q=-407;q<408;q+=8){if(Math.min(...Array.from({length:9},(_,j)=>Math.abs(q-(-416+j*104))))<11)continue;add(a.markings,q,.11,p,3.5,.025,.15,'#dddcc7');add(a.markings,p,.115,q,.15,.025,3.5,'#dddcc7');}
    for(let k=0;k<8;k++){
      const mid=-364+k*104;
      for(const s of [-1,1]){add(a.edges,mid,.115,p+s*5.5,87,.035,.16,'#e4e2d4');add(a.edges,p+s*5.5,.115,mid,.16,.035,87,'#e4e2d4');}
    }
    for(let j=0;j<=8;j++){
      const q=-416+j*104;
      for(const s of [-1,1])for(let stripe=-4;stripe<=4;stripe+=1.5){add(a.markings,q+stripe,.13,p+s*9,.72,.035,3.7,'#e5e3d8');add(a.markings,p+s*9,.13,q+stripe,3.7,.035,.72,'#e5e3d8');}
    }
  }
  const carColors=['#e4e4dc','#b0b6b0','#547580','#a4afa5','#966b53','#d2cdb8','#4f6164'];
  for(let i=0;i<200;i++){
    const road=district.roads[(i*7)%district.roads.length];const off=-391+(i*47)%774;const lane=i%2?-3.5:3.5;
    if(Math.min(...Array.from({length:9},(_,j)=>Math.abs(off-(-416+j*104))))<13)continue;
    const x=road.axis==='x'?off:road.x+lane,z=road.axis==='x'?road.z+lane:off;const r:[number,number,number]=[0,road.axis==='x'?Math.PI/2:0,0];
    add(a.tyres,x,.43,z,1.85,.5,3.8,'#343d3b',undefined,r);add(a.cars,x,.83,z,1.9,.76,4.15,carColors[i%7],undefined,r);add(a.carGlass,x,1.39,z-.15,1.57,.55,2.1,'#495d61',undefined,r);add(a.cars,x,1.69,z-.12,1.62,.11,1.2,carColors[i%7],undefined,r);
  }
  return a;
}
const streetData=streets();
function trees(){
  const trunks:Item[]=[],crowns:Item[]=[];let n=0;
  const tree=(x:number,z:number,scale=1)=>{n++;const h=(4.7+(n%5)*.38)*scale;add(trunks,x,h*.3,z,.32*scale,h*.6,.32*scale,'#766b50');const palettes=['#819a5b','#77945a','#698653','#96a969','#749159','#879c60'];for(let k=0;k<4;k++){const angle=(k*2.2+n)*1.4;add(crowns,x+Math.cos(angle)*scale*1.1,h*.7+(k%2)*scale*.65,z+Math.sin(angle)*scale*1.1,scale*(1.6+(n+k)%3*.18),scale*1.8,scale*1.7,palettes[(n+k)%palettes.length],undefined,[n*.6,k*.7,.15]);}};
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){const x=(col-3.5)*104,z=(row-3.5)*104;for(let p=-37;p<=38;p+=12.5){tree(x+p,z-44,1.05);tree(x+p,z+44,1.05);tree(x-44,z+p,1.05);tree(x+44,z+p,1.05);}}
  for(const p of district.parks){for(let i=0;i<110;i++){const x=p.x-40+(i*17.23)%80,z=p.z-40+(i*31.71)%80;const dx=Math.abs(x-p.x),dz=Math.abs(z-p.z);if(dx<4||dz<4||Math.hypot(dx,dz)<11||(x>p.x+10&&x<p.x+39&&z>p.z+10&&z<p.z+30))continue;tree(x,z,1.05+(i%3)*.25);}}
  return {trunks,crowns};
}
const treeData=trees();

function Parcels({visible}:{visible:boolean}) {
  const geometry=useMemo(()=>{const pts:number[]=[];for(const b of district.buildings){const p=b.parcel,l=p.x-p.width/2,r=p.x+p.width/2,t=p.z-p.depth/2,bt=p.z+p.depth/2;pts.push(l,.33,t,r,.33,t,r,.33,t,r,.33,bt,r,.33,bt,l,.33,bt,l,.33,bt,l,.33,t);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));return g;},[]);
  return <lineSegments geometry={geometry} visible={visible} raycast={noRay}><lineBasicMaterial color="#f7f5e7" transparent opacity={.72}/></lineSegments>;
}
function Surface({layers,underground,onSelect}:{layers:Layers;underground:boolean;onSelect:(id:string)=>void}) {
  const grass=useMemo(()=>makeTexture('grass'),[]),asphalt=useMemo(()=>makeTexture('asphalt'),[]);
  const lawn=useMemo(()=>{const t=makeTexture('grass');t.repeat.set(5,5);return t;},[]);
  if(underground)return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-6,0]} raycast={noRay}><planeGeometry args={[8000,8000]}/><meshBasicMaterial color="#d5dfd9"/></mesh>
    <gridHelper args={[844,32,'#b6c8c0','#c3d1ca']} position={[0,-5.95,0]}/>
    <Parcels visible={layers.parcels}/>
  </group>;
  return <group>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.06,0]} raycast={noRay}><planeGeometry args={[8000,8000]}/><meshStandardMaterial map={grass} color="#c1c5a2"/></mesh>
    {layers.roads&&<mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} raycast={noRay}><planeGeometry args={[844,844]}/><meshStandardMaterial map={asphalt} transparent={underground} opacity={underground?.2:1} depthWrite={!underground}/></mesh>}
    <Batch items={streetData.sidewalk} opacity={underground?.17:1} cast={false}/><Batch items={streetData.lots} opacity={underground?.12:1} cast={false} map={lawn} onPick={layers.parcels?onSelect:undefined}/>
    {layers.roads&&<><Batch items={streetData.markings} opacity={underground?.25:1} cast={false}/><Batch items={streetData.edges} opacity={underground?.25:1} cast={false}/>{!underground&&<><Batch items={streetData.tyres}/><Batch items={streetData.cars}/><Batch items={streetData.carGlass}/></>}</>}
    {district.parks.map(p=><group key={p.id} position={[p.x,0,p.z]}>
      <mesh receiveShadow position={[0,.3,0]} rotation={[-Math.PI/2,0,0]} raycast={noRay}><planeGeometry args={[89,89]}/><meshStandardMaterial map={lawn} color="#cbd2af" transparent={underground} opacity={underground?.12:1}/></mesh>
      {!underground&&<>
        <mesh receiveShadow position={[0,.345,0]} raycast={noRay}><boxGeometry args={[3,.05,87]}/><meshStandardMaterial color="#d7d0b5"/></mesh>
        <mesh receiveShadow position={[0,.345,0]} raycast={noRay}><boxGeometry args={[87,.05,3]}/><meshStandardMaterial color="#d7d0b5"/></mesh>
        <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.37,0]} raycast={noRay}><circleGeometry args={[9,40]}/><meshStandardMaterial color="#cdc6aa"/></mesh>
        <mesh receiveShadow position={[0,.7,0]} raycast={noRay}><cylinderGeometry args={[4.6,4.8,.65,40]}/><meshStandardMaterial color="#b9bdac"/></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,1.04,0]} raycast={noRay}><circleGeometry args={[4.25,40]}/><meshStandardMaterial color="#789f97" roughness={.2} metalness={.15}/></mesh>
        <mesh receiveShadow position={[25,.38,20]} raycast={noRay}><boxGeometry args={[25,.05,14]}/><meshStandardMaterial color="#8c9b81"/></mesh>
        <Line points={[[13,.45,14],[37,.45,14],[37,.45,26],[13,.45,26],[13,.45,14]]} color="#dedcc7" lineWidth={1}/>
        <Line points={[[25,.45,14],[25,.45,26]]} color="#dedcc7" lineWidth={1}/>
      </>}
    </group>)}
    {layers.greenery&&!underground&&<><Batch items={treeData.trunks} kind="cylinder"/><Batch items={treeData.crowns} kind="crown"/></>}
    <Parcels visible={layers.parcels}/>
  </group>;
}

function RoadText({text,x,z,vertical=false,size=4.6,color='#f0f1e8'}:{text:string;x:number;z:number;vertical?:boolean;size?:number;color?:string}) {
  const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d')!;ctx.font='500 65px Arial';ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;},[text,color]);
  return <mesh rotation={[-Math.PI/2,0,vertical?Math.PI/2:0]} position={[x,.39,z]} raycast={noRay}><planeGeometry args={[size*8,size]}/><meshBasicMaterial map={texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2}/></mesh>;
}
function Labels(){const group=useRef<THREE.Group>(null!);useFrame(({camera})=>{group.current.visible=camera.zoom>1.4;});return <group ref={group}>{district.roads.flatMap(r=>[-260,-52,52,260].map(p=><RoadText key={`${r.id}-${p}`} text={r.name} x={r.axis==='x'?p:r.x} z={r.axis==='z'?p:r.z} vertical={r.axis==='z'}/>))}{district.parks.map(p=><RoadText key={p.id} text={p.name} x={p.x} z={p.z+11} size={3.5} color="#f9f8ed"/>)}</group>;}

function Utilities({layers,underground}:{layers:Layers;underground:boolean}) {
  return <group>{district.utilities.filter(u=>(u.kind==='Water'&&layers.water)||(u.kind==='Sewer'&&layers.sewer)||(u.kind==='Electric'&&layers.electric)).map(u=>{
    const color=u.kind==='Water'?'#369acb':u.kind==='Sewer'?'#b89251':'#c681cb';
    const p=u.points.map(v=>[v[0],underground?v[1]:.45,v[2]] as [number,number,number]);
    return <group key={`${u.id}-${underground}`}><Line points={p} color={color} lineWidth={underground?5:2.2} dashed={!underground} dashSize={2.3} gapSize={1.1} transparent opacity={underground?1:.8} depthTest={!underground}/>{[-208,0,208].map((v,i)=>{const x=u.points[0][0]===u.points[1][0]?p[0][0]:v,z=u.points[0][2]===u.points[1][2]?p[0][2]:v;return <mesh position={[x,p[0][1],z]} key={i} raycast={noRay}><sphereGeometry args={[underground?.9:.58,10,8]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.25} depthTest={!underground}/></mesh>;})}</group>;
  })}</group>;
}

function CutawayBuilding({b,exploded,floor,onFloor,onUnit}:{b:Building;exploded:boolean;floor:number|null;onFloor:(n:number|null)=>void;onUnit?:(id:string)=>void}) {
  return <group position={[b.x,.4,b.z]}>{Array.from({length:b.floors},(_,f)=>{
    if(floor!==null&&f>floor&&!exploded)return null;
    const active=floor===null||floor===f;
    return <group key={f} position={[0,f*(exploded?5.9:b.floorHeight),0]}>
      <FloorInterior b={b} floor={f} active={active} onFloor={onFloor} onUnit={onUnit}/>
      {(exploded||floor===f)&&<Html position={[b.width/2+2,1,0]} center zIndexRange={[15,0]}><button className={`floor-label ${active?'active':''}`} onClick={()=>onFloor(f)}>{f===0?'Ground':`Floor ${f}`}<span>{(f*b.floorHeight).toFixed(1)} m</span></button></Html>}
    </group>;
  })}</group>;
}

function Selection({b,exploded,floor,onFloor,layers,onUnit}:{b:Building;exploded:boolean;floor:number|null;onFloor:(n:number|null)=>void;layers:Layers;onUnit?:(id:string)=>void}) {
  const findings=computeFindings(b),bad=findings.some(f=>f.severity==='critical'),color=bad?'#eb4a40':'#2a826d';
  const p=b.parcel;
  return <group>
    <Line points={[[p.x-p.width/2,.49,p.z-p.depth/2],[p.x+p.width/2,.49,p.z-p.depth/2],[p.x+p.width/2,.49,p.z+p.depth/2],[p.x-p.width/2,.49,p.z+p.depth/2],[p.x-p.width/2,.49,p.z-p.depth/2]]} color={bad?'#e4a046':'#3d8e70'} lineWidth={2}/>
    {(exploded||floor!==null)?<CutawayBuilding b={b} exploded={exploded} floor={floor} onFloor={onFloor} onUnit={onUnit}/>:<mesh position={[b.x,b.height/2+.42,b.z]} raycast={noRay}>
      <boxGeometry args={[b.width+.14,b.height+.1,b.depth+.14]}/><meshStandardMaterial color={color} transparent opacity={bad?.34:.12} depthWrite={false}/><Edges color={color} lineWidth={2}/>
    </mesh>}
    {layers.findings&&findings.filter(f=>f.geometry).map(f=><mesh key={f.id} position={[f.geometry!.x,.5,f.geometry!.z]} rotation={[-Math.PI/2,0,0]} raycast={noRay}><planeGeometry args={[f.geometry!.width,f.geometry!.depth]}/><meshBasicMaterial color={f.type==='Road'?'#e87943':'#f0b64b'} transparent opacity={.85} side={THREE.DoubleSide}/></mesh>)}
    {layers.labels&&<Html wrapperClass="map-label-wrapper" position={[b.x,(exploded?b.floors*6.2:b.height)+6,b.z]} center zIndexRange={[20,0]}><div className={`building-pin ${bad?'issue':''}`}><span className="pin-dot"/>{b.name}<small>{b.ulpin}</small></div></Html>}
  </group>;
}

type SceneProps={selected:Building|null;layers:Layers;underground:boolean;exploded:boolean;floor:number|null;mode:'2d'|'3d';paused?:boolean;inspectUtilities?:boolean;onUnit?:(id:string)=>void;command:CameraCommand;onSelect:(id:string)=>void;onFloor:(n:number|null)=>void;onCamera:(c:{x:number;z:number;zoom:number;heading:number})=>void;onReady:()=>void};
function World(props:SceneProps){
  const {selected,layers,underground,exploded,floor,mode,command,onSelect,onFloor,onCamera,onReady,onUnit,inspectUtilities}=props;
  const controls=useRef<MapControls>(null),[hover,setHover]=useState<string|null>(null);
  const {camera,gl,size}=useThree();const compact=size.width<600;const tween=useRef<{pos:THREE.Vector3;target:THREE.Vector3;zoom:number}|null>(null);const tick=useRef(0);
  const hidden=selected&&(exploded||floor!==null)?selected.id:undefined;
  useEffect(()=>{camera.lookAt(0,0,0);onReady();},[]);
  const cancelTween=useCallback(()=>{tween.current=null;},[]);
  useEffect(()=>{
    const ctl=controls.current;if(!ctl)return;
    const target=ctl.target.clone(),pos=camera.position.clone();let zoom=camera.zoom;
    const offset=new THREE.Vector3().subVectors(pos,target);
    if(command.type==='district'){target.set(0,0,0);pos.copy(target).add(new THREE.Vector3(260,460,530));zoom=Math.min(gl.domElement.clientWidth,gl.domElement.clientHeight)/1240;}
    if(command.type==='block'){target.set(selected?selected.x-(compact?0:5):0,0,selected?selected.z-(compact?3:6):0);pos.copy(target).add(new THREE.Vector3(-170,260,285));zoom=compact?Math.max(3.5,Math.min(5.6,size.width/72)):8.05;}
    if(command.type==='focus'&&selected){target.set(selected.x,(exploded?selected.height:8),selected.z);pos.copy(target).add(new THREE.Vector3(-110,180,195));zoom=compact?Math.min(8,size.width/(selected.width*2)):(exploded?11:10);}
    if(command.type==='2d'){pos.copy(target).add(new THREE.Vector3(.01,550,.01));}
    if(command.type==='3d'){pos.copy(target).add(new THREE.Vector3(-170,260,285));}
    if(command.type==='north'){const d=offset.length();pos.copy(target).add(new THREE.Vector3(0,d*.72,d*.7));}
    if(command.type==='zoomIn')zoom=Math.min(17,zoom*1.4);
    if(command.type==='zoomOut')zoom=Math.max(.42,zoom/1.4);
    // Property selection, focus and north commands must respect the active mode.
    if(mode==='2d' && command.type!=='3d'){
      target.y=0;
      pos.copy(target).add(new THREE.Vector3(0,550,.001));
    }
    tween.current={pos,target,zoom};
  },[command,compact]);
  useFrame((state,delta)=>{
    const ctl=controls.current;if(!ctl)return;
    if(tween.current){const t=tween.current,a=1-Math.exp(-delta*7);camera.position.lerp(t.pos,a);ctl.target.lerp(t.target,a);camera.zoom=THREE.MathUtils.lerp(camera.zoom,t.zoom,a);camera.updateProjectionMatrix();ctl.update();if(camera.position.distanceTo(t.pos)<.06&&Math.abs(camera.zoom-t.zoom)<.003)tween.current=null;}
    tick.current+=delta;if(tick.current>.25){tick.current=0;onCamera({x:ctl.target.x,z:ctl.target.z,zoom:camera.zoom,heading:Math.atan2(camera.position.x-ctl.target.x,camera.position.z-ctl.target.z)});}
    (window as any).__CITY_RENDERER__={calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,zoom:camera.zoom,buildings:district.buildings.length};
    (window as any).__CITY_DEBUG__={position:camera.position.toArray(),target:ctl.target.toArray(),zoom:camera.zoom,polar:ctl.getPolarAngle(),azimuth:ctl.getAzimuthalAngle(),mode,selected:selected?.id,controlConnected:ctl.domElement===gl.domElement};
    (window as any).__CITY_PROJECT__=(id:string)=>{const b=district.buildings.find(b=>b.id===id);if(!b)return null;const p=new THREE.Vector3(b.x,b.height/2,b.z).project(camera);const r=gl.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};};
  });
  const hovered=hover&&hover!==selected?.id?district.buildings.find(b=>b.id===hover):null;
  return <>
    <color attach="background" args={[underground?'#d5e0df':'#dfe5d9']}/>
    <ambientLight intensity={.32}/><hemisphereLight args={['#e8f2f6','#b7b494',.85]}/>
    <directionalLight position={[-180,340,-160]} intensity={2.1} color="#fff8eb" castShadow shadow-mapSize={[4096,4096]} shadow-camera-left={-590} shadow-camera-right={590} shadow-camera-top={590} shadow-camera-bottom={-590} shadow-camera-far={1100} shadow-normalBias={.12} shadow-bias={-.0001} shadow-radius={2.5}/>
    <EnvironmentLighting/>
    {!underground&&layers.buildings&&<Grounding/>}
    <Surface layers={layers} underground={underground} onSelect={onSelect}/>
    {layers.buildings&&<Architecture selected={selected?.id} hidden={hidden} underground={underground} onSelect={onSelect} onHover={setHover}/>}
    <Utilities layers={layers} underground={underground}/>
    {selected&&inspectUtilities&&layers.water&&<UtilityMeasure building={selected} underground={underground}/>}
    {layers.labels&&!underground&&<Labels/>}
    {selected&&layers.buildings&&<Selection b={selected} exploded={exploded} floor={floor} onFloor={onFloor} layers={layers} onUnit={onUnit}/>}
    {hovered&&<mesh position={[hovered.x,hovered.height/2+.45,hovered.z]} raycast={noRay}><boxGeometry args={[hovered.width+.2,hovered.height+.2,hovered.depth+.2]}/><meshBasicMaterial color="#f5f4db" transparent opacity={.14} depthWrite={false}/><Edges color="#fcf8d4"/></mesh>}
    <NavigationControls ref={controls} mode={mode} onStart={cancelTween}/>
  </>;
}
export default function CityScene(props:SceneProps){return <Canvas frameloop={props.paused?'never':'always'} orthographic shadows={{type:THREE.PCFShadowMap}} camera={{position:[-170,260,285],zoom:8.05,near:.1,far:2500}} dpr={[1,1.5]} gl={{antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#dfe5d9');}}><World {...props}/></Canvas>;}
