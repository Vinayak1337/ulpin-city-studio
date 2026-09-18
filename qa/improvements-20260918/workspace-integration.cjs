const fs=require('fs');let s=fs.readFileSync('src/components/RecordModal.tsx','utf8');
s=s.replace("import { useDialog } from './useDialog';","import { useDialog } from './useDialog';\nimport RegisterOverview from './RegisterOverview';");
s=s.replace('<div className="rec-backdrop"','<div className={`rec-backdrop ${kind===\'register\'?\'register-workspace\':\'\'}`}');
const start=s.indexOf('        {!showDoc?<>'),end=s.indexOf('        </>:<>',start);if(start<0||end<0)throw Error('Register body markers');
s=s.slice(0,start)+`        {!showDoc?<RegisterOverview b={b} unit={unit} floor={floor} onFloor={setFloor} onUnit={u=>{setUnit(u);setFloor(u.floor);}} onDocument={u=>openDocument('lease',u)} onMap={f=>{onFloor(f);onClose();}}/>:<>
`+s.slice(end+'        </>:<>'.length);
s=s.replace('<span className="demo-label">SYNTHETIC DEMO</span><button','<span className="demo-label">SYNTHETIC DEMO</span>{kind===\'register\'&&<button className="back-to-map" onClick={onClose}>Back to map <ArrowUpRight size={14}/></button>}<button');
s=s.replace('</main></div>}',`</main>{kind==='register'&&!showDoc&&<aside className="register-evidence">
+        <section><header><h3>Evidence & documents</h3><span>Demo records</span></header>
+          <button onClick={()=>openDocument('land')}><Landmark size={20}/><div><strong>Land & parcel record</strong><small>{b.parcelId}</small></div><ArrowUpRight size={13}/></button>
+          <button onClick={()=>openDocument('plan')}><Layers3 size={20}/><div><strong>Floor plans</strong><small>G through floor {b.floors-1} · metre-based</small></div><ArrowUpRight size={13}/></button>
+          <button onClick={()=>openDocument('lease',unit)}><FileText size={20}/><div><strong>Occupancy record</strong><small>Selected unit {unit.number}</small></div><ArrowUpRight size={13}/></button>
+          <button onClick={()=>downloadDocument('aerial',b)}><Map size={20}/><div><strong>District overview</strong><small>Download the full-area PDF</small></div><Download size={13}/></button>
+        </section>
+        <section><header><h3>Issues & discrepancies</h3><span>{findings.length} findings</span></header>{findings.length?findings.map(f=><div className="register-issue" key={f.id}><div><strong>{f.title}</strong><b>{f.value} {f.unit}</b></div><p>{f.description}</p></div>):<p className="register-empty-findings">No geometry findings for this demo footprint.</p>}</section>
+        <section><header><h3>Fixture provenance</h3></header><div className="register-history"><p><i/>Land record fixture<span>{b.registeredOn}</span></p><p><i/>Occupancy period begins<span>2026-04-01</span></p><p><i/>Geometry checks<span>Computed in this session</span></p></div><p className="ins-note">These are synthetic record dates, not a real approval or ownership history.</p></section>
+      </aside>}</div>}`.replace(/^\+/gm,''));
fs.writeFileSync('src/components/RecordModal.tsx',s);
let app=fs.readFileSync('src/App.tsx','utf8');app=app.replace("import DialogSection from './components/DialogSection';","import DialogSection from './components/DialogSection';\nimport UtilitySection from './components/UtilitySection';");app=app.replace("move('district');setMode('3d');","move('district');");
app=app.replace('<div className="minimap">',`{selected&&tab==='utilities'&&<section className="map-section-card" aria-label="Utility section overlay"><header><strong>Section · ground to pipe</strong><button onClick={()=>setTab('overview')} aria-label="Close utility section"><X size={16}/></button></header><UtilitySection building={selected}/><p>Horizontal clearance and centre depth shown separately. Synthetic inspection geometry.</p></section>}
+        <div className="minimap">`.replace(/^\+/gm,''));
fs.writeFileSync('src/App.tsx',app);
let pdf=fs.readFileSync('src/data/documents.ts','utf8');pdf=pdf.replace("import { district, computeFindings } from './district';","import { district, computeFindings } from './district';\nimport { getFloorLayout, roomPalette } from './floorLayout';");
const x=pdf.indexOf("    if(kind==='plan'){"),y=pdf.indexOf("    if(kind==='register'){",x);if(x<0||y<0)throw Error('PDF plan markers');
pdf=pdf.slice(0,x)+`    if(kind==='plan'){
      const layout=getFloorLayout(b,floor),scale=Math.min(146/b.width,156/b.depth),hh=b.depth*scale;
      ensure(hh+34);
      doc.setTextColor(40,88,73);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(\`Floor \${floor===0?'G':floor} / shared room layout - synthetic\`,17,y);y+=10;
      const sx=(width-b.width*scale)/2,sy=y;
      const X=(x:number)=>sx+(x+b.width/2)*scale,Z=(z:number)=>sy+(z+b.depth/2)*scale;
      doc.setDrawColor(77,107,88);doc.setLineWidth(.35);doc.setFillColor('#c7cec9');doc.rect(sx,sy,b.width*scale,b.depth*scale,'FD');
      doc.setFillColor('#f0efe6');doc.rect(X(-.8),Z(-layout.corridor.depth/2),1.6*scale,layout.corridor.depth*scale,'F');
      for(const {unit,rooms}of layout.units){
        for(const r of rooms){
          doc.setFillColor(roomPalette[r.kind]);doc.setDrawColor(124,146,130);doc.setLineWidth(.25);doc.rect(X(r.x-r.width/2),Z(r.z-r.depth/2),r.width*scale,r.depth*scale,'FD');
          if(r.kind==='bedroom'){doc.setFillColor('#afc0b1');doc.rect(X(r.x-r.width/2+.3),Z(r.z-r.depth/2+.35),Math.min(1.55,r.width-.5)*scale,2*scale,'F');}
          doc.setTextColor(71,95,81);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(r.label,X(r.x),Z(r.z+r.depth*.3),{align:'center'});
        }
      }
      doc.setFontSize(9);doc.setTextColor(76,101,85);doc.text(\`\${b.width.toFixed(1)} m\`,width/2,sy-2,{align:'center'});
      doc.setFontSize(8);doc.text(\`Depth: \${b.depth.toFixed(1)} m / corridor: 1.6 m\`,sx,sy+hh+5);
      y=sy+hh+13;
      for(const {unit}of layout.units){ensure(9);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(\`Unit \${unit.number}: \${unit.bedrooms} bedroom(s), \${unit.area.toFixed(2)} m2 net room area\`,17,y);y+=8;}
    }
`+pdf.slice(y);fs.writeFileSync('src/data/documents.ts',pdf);
