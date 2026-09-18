const fs=require('fs');let s=fs.readFileSync('src/scene/CityScene.tsx','utf8');
s=s.replace("import { useSurfaceMaps, EnvironmentLighting, Grounding } from './Appearance';","import { useSurfaceMaps, EnvironmentLighting, Grounding } from './Appearance';\nimport UtilityMeasure from './UtilityMeasure';");
s=s.replace("paused?:boolean;onUnit?", "paused?:boolean;inspectUtilities?:boolean;onUnit?");
s=s.replace('onCamera,onReady,onUnit}=props','onCamera,onReady,onUnit,inspectUtilities}=props');
s=s.replace('selected.x-(compact?0:14)','selected.x-(compact?0:5)').replace('selected.z-(compact?3:11)','selected.z-(compact?3:6)');
s=s.replace('<Utilities layers={layers} underground={underground}/>',"<Utilities layers={layers} underground={underground}/>\n    {selected&&inspectUtilities&&layers.water&&<UtilityMeasure building={selected} underground={underground}/>}");
fs.writeFileSync('src/scene/CityScene.tsx',s);
s=fs.readFileSync('src/App.tsx','utf8').replace('<CityScene paused={modal!==null}','<CityScene inspectUtilities={tab===\'utilities\'} paused={modal!==null}');fs.writeFileSync('src/App.tsx',s);
fs.appendFileSync('src/refinements.css',`\n.utility-map-callout{background:#fff8ee;border:1px solid #e1b277;border-radius:7px;box-shadow:0 3px 12px #59432930;padding:7px 10px;text-align:center;white-space:nowrap;pointer-events:none}.utility-map-callout strong{display:block;font-size:14px;color:#a36828}.utility-map-callout span{display:block;font-size:9px;color:#ab8255;margin-top:3px}\n`);
