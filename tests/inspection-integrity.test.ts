import { describe,it,expect } from 'vitest';
import { district,getBuilding } from '../src/data/district';
import { getFloorLayout } from '../src/data/floorLayout';
import { mapScale } from '../src/data/mapScale';

describe('shared inspection geometry',()=>{
  it('gives every unit its recorded bedrooms and exact net room area',()=>{
    for(const b of district.buildings)for(let f=0;f<b.floors;f++){
      const plan=getFloorLayout(b,f);expect(plan.units).toHaveLength(2);
      for(const {unit,rooms,boundary} of plan.units){
        expect(rooms.filter(r=>r.kind==='bedroom')).toHaveLength(unit.bedrooms);
        expect(rooms.reduce((s,r)=>s+r.area,0)).toBeCloseTo(unit.area,2);
        for(const r of rooms){expect(r.width).toBeGreaterThan(0);expect(r.depth).toBeGreaterThan(0);expect(Math.abs(r.x-boundary.x)+r.width/2).toBeLessThanOrEqual(boundary.width/2+.0001);expect(Math.abs(r.z)+r.depth/2).toBeLessThanOrEqual(boundary.depth/2+.0001);}
      }
    }
  });
  it('has four bedrooms across the two default floor units, not two',()=>{const b=getBuilding(district.defaultBuildingId);expect(getFloorLayout(b,1).units.flatMap(u=>u.rooms).filter(r=>r.kind==='bedroom')).toHaveLength(4);});
  it('keeps room interiors disjoint within a unit',()=>{
    const b=getBuilding(district.defaultBuildingId);
    for(const {rooms}of getFloorLayout(b,0).units)for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){
      const a=rooms[i],c=rooms[j];const overlapX=Math.min(a.x+a.width/2,c.x+c.width/2)-Math.max(a.x-a.width/2,c.x-c.width/2);const overlapZ=Math.min(a.z+a.depth/2,c.z+c.depth/2)-Math.max(a.z-a.depth/2,c.z-c.depth/2);expect(overlapX<=0||overlapZ<=0).toBe(true);
    }
  });
});
describe('honest map scale',()=>{
  it('never caps line length without changing the labelled distance',()=>{for(const zoom of [.42,.8,1.6,3.4,6.1,8.05,11.95012589,17,20]){const s=mapScale(zoom);expect(s.pixels).toBeLessThanOrEqual(120);expect(s.pixels/zoom).toBeCloseTo(s.metres,8);}});
  it('rejects invalid scale values',()=>{expect(mapScale(NaN).metres).toBe(0);expect(mapScale(0).pixels).toBe(0);});
});
