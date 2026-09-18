import type { Building } from '../types';
import { district } from '../data/district';
export function BuildingPreview({b}:{b:Building}) {
  const floors=Math.min(b.floors,6);const h=floors*18;const y=155-h;
  return <svg className="building-preview" viewBox="0 0 330 188" role="img" aria-label={`Illustrated ${b.floors}-floor building`}>
    <defs><linearGradient id="preview-sky" x2="0" y2="1"><stop stopColor="#e0e9e1"/><stop offset="1" stopColor="#c9d3bd"/></linearGradient><filter id="preview-shadow"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <rect width="330" height="188" fill="url(#preview-sky)"/><path d="M0 140L170 67L330 124L148 211Z" fill="#adb891"/><path d="M0 178L139 116L330 184" stroke="#7d8980" strokeWidth="30" fill="none"/><path d="M0 178L139 116L330 184" stroke="#e0dfcb" strokeWidth="1" strokeDasharray="9 8" fill="none"/>
    <path d="M60 158L183 107L277 140L146 195Z" fill="#42583a" opacity=".2" filter="url(#preview-shadow)"/>
    <path d={`M117 ${y+20}L179 ${y-3}L229 ${y+17}V148L168 170L117 150Z`} fill="#bda996"/>
    <path d={`M117 ${y+20}L168 ${y+42}V170L117 150Z`} fill="#d8c9b3"/>
    <path d={`M168 ${y+42}L229 ${y+17}V148L168 170Z`} fill="#b5b4a4"/>
    <path d={`M115 ${y+19}L178 ${y-7}L232 ${y+16}L169 ${y+42}Z`} fill="#e7e4d7" stroke="#f5f2e9" strokeWidth="3"/>
    <path d={`M128 ${y+19}L178 ${y-1}L219 ${y+16}L169 ${y+35}Z`} fill="#c3c9bd"/>
    {Array.from({length:floors},(_,f)=>[0,1,2].map(c=><g key={`${f}-${c}`}>
      <path d={`M${175+c*16} ${y+51+f*18-c*6.5}l9 -3.6v10l-9 3.6Z`} fill="#586e6d"/>
      {c<2&&<path d={`M${124+c*20} ${y+39+f*18+c*8}l12 5v10l-12 -5Z`} fill="#526b69"/>}
    </g>))}
    <path d={`M167 ${y+42}V170M117 150L168 170L229 148`} stroke="#e88765" strokeWidth="2.5" fill="none"/>
    <path d={`M115 ${y+19}L178 ${y-7}L232 ${y+16}L169 ${y+42}Z`} fill="#df6b57" opacity=".17"/>
    {[ [64,141],[84,105],[258,132],[281,158],[42,168],[275,96] ].map(([x,z],i)=><g key={i}><path d={`M${x} ${z}v14`} stroke="#7a7357" strokeWidth="3"/><circle cx={x} cy={z-4} r={10+i%3} fill={i%2?'#758d52':'#607c48'}/><circle cx={x-4} cy={z-8} r="7" fill="#8c9f65"/></g>)}
  </svg>;
}
export function AerialMap({selected,className='',onSelect}:{selected?:string;className?:string;onSelect?:(id:string)=>void}) {
  return <svg className={className} viewBox="-430 -430 860 860" role="img" aria-label="Synthetic orthographic overview of the complete district">
    <rect x="-430" y="-430" width="860" height="860" fill="#7e8980"/>
    {Array.from({length:64},(_,i)=>{const col=i%8,row=Math.floor(i/8);return <rect key={i} x={(col-3.5)*104-46} y={(row-3.5)*104-46} width="92" height="92" rx="2" fill="#b6bd9f"/>;})}
    {district.parks.map(p=><g key={p.id}><rect x={p.x-44} y={p.z-44} width="88" height="88" fill="#88a16b"/><path d={`M${p.x-42} ${p.z}h84M${p.x} ${p.z-42}v84`} stroke="#c9c5a5" strokeWidth="2"/><circle cx={p.x} cy={p.z} r="7" fill="#9eb09b"/></g>)}
    {district.buildings.map(b=><g key={b.id} onClick={()=>onSelect?.(b.id)} style={{cursor:onSelect?'pointer':'default'}}><rect x={b.parcel.x-b.parcel.width/2} y={b.parcel.z-b.parcel.depth/2} width={b.parcel.width} height={b.parcel.depth} fill="none" stroke="#eceddb" strokeWidth=".6"/><rect x={b.x-b.width/2+1.1} y={b.z-b.depth/2+1.7} width={b.width} height={b.depth} fill="#5e6758" opacity=".28"/><rect x={b.x-b.width/2} y={b.z-b.depth/2} width={b.width} height={b.depth} fill={b.id===selected?'#dd745c':b.color} stroke={b.id===selected?'#a53623':'#a2aa9a'} strokeWidth={b.id===selected?2:.5}/></g>)}
    <g transform="translate(393,-387)"><circle r="18" fill="#ffffff" opacity=".9"/><path d="M0 -12L-5 9L0 6L5 9Z" fill="#315b4b"/><text y="-24" textAnchor="middle" fontSize="17" fill="#fff" fontFamily="Arial">N</text></g>
  </svg>;
}
function LegacyFloorPlan({b,floor=0}:{b:Building;floor?:number}){
  return <svg viewBox="0 0 600 430" role="img" aria-label={`Illustrative floor ${floor} plan`} className="floor-plan">
    <defs><pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dfe6de" strokeWidth=".7"/></pattern></defs><rect width="600" height="430" fill="#f9faf5"/><rect width="600" height="430" fill="url(#plan-grid)"/>
    <path d="M98 62H502V370H98Z" fill="#f0eddd" stroke="#55755e" strokeWidth="7"/><path d="M300 62V370M98 201H270M330 201H502M222 62V168M378 62V168" fill="none" stroke="#64806b" strokeWidth="5"/>
    <path d="M98 93V144M98 241V292M502 94V145M502 242V293M145 62H202M403 62H460M149 370H211M391 370H454" stroke="#a1b9bd" strokeWidth="9"/>
    {[ [130,91],[405,91] ].map(([x,y],i)=><g key={i}><rect x={x} y={y} width="62" height="82" rx="3" fill="#c4ceba" stroke="#7b9378"/><rect x={x+5} y={y+5} width="52" height="16" fill="#ecebdd"/><path d={`M${x} ${y+37}h62`} stroke="#8c9f89"/></g>)}
    <path d="M125 247H162V319H125ZM437 247H474V319H437Z" fill="#b5c6b7" stroke="#789784" strokeWidth="2"/>
    <rect x="194" y="275" width="49" height="37" rx="4" fill="#d9c6a4" stroke="#ad9472"/><rect x="357" y="275" width="49" height="37" rx="4" fill="#d9c6a4" stroke="#ad9472"/>
    <g fontFamily="Arial" fill="#47614f" fontSize="12" textAnchor="middle"><text x="160" y="189">BEDROOM</text><text x="438" y="189">BEDROOM</text><text x="262" y="124">BATH</text><text x="340" y="124">BATH</text><text x="207" y="235">LIVING / KITCHEN</text><text x="393" y="235">LIVING / KITCHEN</text><text x="200" y="344">UNIT {floor===0?'G01':`${floor}01`}</text><text x="397" y="344">UNIT {floor===0?'G02':`${floor}02`}</text><text x="300" y="34">{b.width.toFixed(1)} m</text><text x="46" y="220" transform="rotate(-90 46 220)">{b.depth.toFixed(1)} m</text></g>
    <path d="M98 42V31M502 42V31M98 37H502M63 62H75M63 370H75M69 62V370" stroke="#728272" fill="none"/>
    <text x="300" y="408" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#879182">SYNTHETIC LAYOUT · NOT A SANCTIONED BUILDING PLAN</text>
  </svg>;
}

export { default as FloorPlan } from "./FloorPlan";
