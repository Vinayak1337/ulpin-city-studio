import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { district } from '../data/district';

function texture(kind:'concrete'|'roof'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle=kind==='concrete'?'#f2f0e9':'#d5d8d1';ctx.fillRect(0,0,512,512);
  let seed=171;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let n=0;n<27000;n++){const x=rand()*512,y=rand()*512,v=rand();ctx.fillStyle=v>.5?'rgba(54,64,54,.035)':'rgba(255,255,250,.15)';ctx.fillRect(x,y,1+rand()*2,1+rand()*2);}
  if(kind==='roof'){
    ctx.strokeStyle='rgba(117,134,122,.16)';ctx.lineWidth=1;
    for(let i=0;i<=512;i+=85){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,512);ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}
    for(let i=0;i<19;i++){const x=rand()*512,y=rand()*512,r=15+rand()*60;const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(79,96,76,.06)');gradient.addColorStop(1,'rgba(79,96,76,0)');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(kind==='roof'?1:2,kind==='roof'?1:3);tex.anisotropy=8;return tex;
}
export function useSurfaceMaps(){
  const maps=useMemo(()=>({concrete:texture('concrete'),roof:texture('roof')}),[]);
  useEffect(()=>()=>{maps.concrete.dispose();maps.roof.dispose();},[maps]);
  return maps;
}
export function EnvironmentLighting(){
  const {scene,gl}=useThree();
  useEffect(()=>{
    const faces=Array.from({length:6},(_,i)=>{
      const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
      const gradient=ctx.createLinearGradient(0,0,0,128);
      gradient.addColorStop(0,i===3?'#b2b59b':'#dbe6ef');gradient.addColorStop(.55,'#f3f1e4');gradient.addColorStop(1,i===2?'#e1ebf1':'#a8b59c');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return c;
    });
    const cube=new THREE.CubeTexture(faces);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;
    const generator=new THREE.PMREMGenerator(gl),environment=generator.fromCubemap(cube);
    const old=scene.environment,oldIntensity=scene.environmentIntensity;
    scene.environment=environment.texture;scene.environmentIntensity=.32;
    return()=>{scene.environment=old;scene.environmentIntensity=oldIntensity;environment.dispose();generator.dispose();cube.dispose();};
  },[scene,gl]);
  return null;
}
export function Grounding(){
  const ref=useRef<THREE.InstancedMesh>(null!);
  const map=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
    const image=ctx.createImageData(128,128);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){const dx=Math.abs(x-64)/64,dz=Math.abs(y-64)/64,d=Math.max(dx,dz),alpha=Math.max(0,Math.min(1,(1-d)/.32));const i=(y*128+x)*4;image.data[i]=39;image.data[i+1]=53;image.data[i+2]=41;image.data[i+3]=Math.round(alpha*alpha*92);}
    ctx.putImageData(image,0,0);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  },[]);
  useLayoutEffect(()=>{const o=new THREE.Object3D();district.buildings.forEach((b,i)=>{o.position.set(b.x,.301,b.z);o.rotation.set(-Math.PI/2,0,0);o.scale.set(b.width+5,b.depth+5,1);o.updateMatrix();ref.current.setMatrixAt(i,o.matrix);});ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();},[]);
  return <instancedMesh ref={ref} args={[undefined,undefined,district.buildings.length]} raycast={()=>{}}><planeGeometry/><meshBasicMaterial map={map} transparent depthWrite={false} opacity={.7}/></instancedMesh>;
}
