import {describe,it,expect} from 'vitest';
import {district,computeFindings,getBuilding,intersect,exportGeoJSON} from '../src/data/district';
describe('synthetic district integrity',()=>{
it('contains 944 distinct buildings and 5 parks',()=>{expect(district.buildings.length).toBe(944);expect(district.parks.length).toBe(5);expect(new Set(district.buildings.map(b=>b.id)).size).toBe(944);});
it('has unique 14 digit synthetic strings',()=>{expect(new Set(district.buildings.map(b=>b.ulpin)).size).toBe(944);for(const b of district.buildings)expect(b.ulpin).toMatch(/^\d{14}$/);});
it('has coherent floor and unit areas',()=>{for(const b of district.buildings){expect(b.units.length).toBe(b.floors*2);expect(b.height).toBe(b.floors*b.floorHeight);expect(b.units.reduce((s,u)=>s+u.area,0)).toBeLessThan(b.width*b.depth*b.floors);for(const u of b.units)expect(u.floor).toBeLessThan(b.floors);}});
it('computes showcase findings from actual rectangles',()=>{const f=computeFindings(getBuilding(district.defaultBuildingId));expect(f.find(x=>x.type==='Parcel')?.value).toBe(32);expect(f.find(x=>x.type==='Road')?.value).toBe(16);expect(f.find(x=>x.type==='Utility')?.value).toBe(1.8);});
it('parks contain no buildings',()=>{for(const p of district.parks)for(const b of district.buildings)expect(intersect(p,b)).toBeNull();});
it('utilities are actually below grade',()=>{for(const u of district.utilities)for(const p of u.points)expect(p[1]).toBe(-u.depth);});
it('exports explicit synthetic closed polygon coordinates',()=>{const g=exportGeoJSON();expect(g.features.length).toBe(944);for(const f of g.features){const r=f.geometry.coordinates[0];expect(r[0]).toEqual(r[4]);expect(r[0][0]).toBeGreaterThan(76);expect(r[0][1]).toBeGreaterThan(28);expect(f.properties.synthetic).toBe(true);}});
});
