# 3D ULPIN — City Studio

A separate, self-contained interactive district built around the supplied 3D property-map mockups. This project does not read or modify the existing `3d-ulpin` repositories or databases.

**18 September refinement:** the existing project now has stable held-drag/touch navigation, a compact mobile property sheet and accessible layer drawer, context-preserving documents and units, a shared room-layout model, and an expanded interactive register workspace. This was an in-place correction, not another replacement project. See `QA.md` for verified coverage and limits.

## Start on this computer

```powershell
cd E:\Projects\ulpin-city-studio
npm run dev
```

Open **http://127.0.0.1:5175**. The current session already has the development server running on this port. A second server will refuse to start instead of silently choosing another port.

For a clean checkout or another computer:

```powershell
cd path\to\ulpin-city-studio
npm ci
npm run dev
```

Node.js 24 was used for this build. Chrome or Edge with WebGL 2 and hardware acceleration is recommended. There is no database setup, Docker requirement, Cesium token, map API key, or external tile service. Installed dependencies are pinned by `package-lock.json`.

## What is here

The **832 × 832 metre synthetic district** contains **944 individually selectable buildings**, 944 linked rectangular parcels, 5 parks, 18 road corridors and 36 utility segments. Every building has a unique 14-digit **demo** reference, an owner fixture, a floor schedule and two occupancy records per floor.

The map uses actual 3D geometry: window reveals, glazing, floor bands, projecting balconies, parapets, stair housings, roof tanks, solar panels, roads, markings, crossings, cars, trees, paths and fountains. The right-hand thumbnail is captured from the live scene. It is not a pasted mockup. Terrain and leaf textures are generated locally; there are no stock-image or external-asset dependencies.

### Map controls

| Action | Control |
| --- | --- |
| Pan | Left-button drag |
| Orbit / tilt | Right-button drag |
| Zoom | Mouse wheel or + / − |
| Touch pan / zoom | One-finger pan; two-finger pinch. In 3D, two-finger movement can orbit. |
| Keyboard pan | Focus the map canvas, then use the arrow keys. |
| Inspect a property | Click a building, parcel, property-list row, or minimap footprint |
| Find by identifier, address, owner or occupant | Header search; Ctrl/Cmd + K focuses it |
| View all 944 buildings | **Fit district** |
| Return to the selected neighbourhood | **Fit block** |
| Inspect a close-up | Crosshair / **Focus selected building** |
| See a cadastral-style plan | **2D**, then switch Buildings off |
| See buried networks | **Underground**, then enable water / sewer / electric layers |
| Inspect interiors | Inspector → **Floors** → **Explode floors**, or select one floor |
| Expand the map | Maximise button hides the side panels; click again to restore |
| Mobile layers | **Layers** opens a dismissible drawer without covering the map permanently. |
| Mobile property details | Tap the compact bottom property sheet to expand or collapse it. |

### Repeatable showcase

1. Search for **11007500003527**, the Lake View Residence at 12, Lake View Road.
2. Inspect its parcel and overview. The computed footprint difference is **32 m²**; its road intersection is **16 m²**.
3. Open **Utilities**. The nearest water pipe is **1.8 m horizontally from the footprint**, with its centre **2.6 m below grade**. These are different measurements.
4. Open **Floors**, explode the building and select individual levels.
5. Open the **register**. Each unit has a fictional occupant, occupancy status, area and, where rented, sample rent and lease dates.
6. Inspect a rent agreement, land record or floor plan, and download the PDF.
7. Open **Overview** for the entire district's aerial-style diagram, then download its PDF.
8. Choose **Fit district** to explore the wider area. **Check** recomputes district findings; **Findings** filters them by category.

The register now places a live exploded model beside the floor/unit table, with evidence and findings alongside it. Select a unit in the model, table or floor plan to keep that unit in context. **Inspect record** opens its occupancy document; **View in map** returns to its floor in the district. Opening Unit 101 directly from the inspector opens Unit 101, not a generic list beginning at the top floor.

The **Utilities** tab shows the nearest water asset, a separate horizontal-clearance annotation on the map and a ground-to-pipe section. A 2D view stays top-down when selecting another property, using Fit Block or focusing a property. The ruler selects a distance whose pixel width corresponds to the current camera scale rather than capping the width while leaving an incorrect label.

### Exports

The Export dialog produces a complete linked JSON dataset, a 944-parcel GeoJSON, a district overview PDF, and an image of the current map camera view. Record dialogs also produce land-record, rental-occupancy, floor-plan and complete-register PDFs. Documents visibly identify themselves as synthetic specimens and include no official seals, signatures or real identity numbers.

## Data and geometry truth

**Everything is synthetic.** The number field is a 14-digit demo identifier, **not an officially issued ULPIN**. Owners, tenants, land records and rental documents are fictional. The model is not a scan of Delhi, a cadastral survey, photogrammetry, drone imagery, or evidence of actual ownership. The visual direction follows the supplied mockups, but it is not a pixel-identical recreation of their photorealistic rendering.

Internal coordinates are local planar metres: X is east, negative Z is north, and Y is elevation. Building height is floor count × 3.2 m, plus separately modelled roof details. Exploded floors are visually separated for inspection; their listed real model elevations remain unchanged. Pipes use actual negative Y coordinates in underground mode; their displayed thickness is exaggerated for readability.

Floor plans, PDFs, the register and the 3D cutaway all use `src/data/floorLayout.ts`. Bedroom counts and usable unit areas come from that shared room geometry. The default two-bedroom unit has **116.22 m² of net room area**; the earlier 132 m² placeholder was replaced by a calculated value. A central corridor, exterior walls and partition gaps are excluded from this net figure. Drawings remain schematic fixtures, not sanctioned architectural plans.

GeoJSON uses a clearly labelled, approximate synthetic placement around 28.62 N, 77.05 E, converted from the local coordinates. That placement is **not surveyed** and must not be interpreted as real Delhi property boundaries.

Findings are deterministic geometry calculations, not prewritten metrics:

- Parcel finding: footprint area minus footprint/parcel intersection area.
- Road finding: footprint/road-corridor rectangle intersection area.
- Utility finding: shortest horizontal footprint-to-pipe-surface distance below a **2 m demonstration threshold**. This threshold is not a legal or municipal rule.

For the default building, the 16 m² road overlap lies within its 32 m² parcel-overhang area. **Do not add these two figures as if they were disjoint conflict areas.** Floors and interior layouts are generated inspection fixtures, not automatically recovered from a 2D parcel or approved building plan.

Spatial checks operate on the recorded rectangular ground footprint. Decorative facade projections, balcony rails and roof equipment are not separate surveyed cadastral geometry and are not claimed as comprehensive 3D clash analysis.

The aerial document is an orthographic vector overview generated from the same district geometry, **not an actual aerial photograph**.

## Architecture

```text
src/data/district.ts             Seeded geometry, records, findings and GeoJSON
src/data/floorLayout.ts          Shared room geometry, bedroom counts and net areas
src/data/mapScale.ts             Exact pixel-to-distance ruler selection
src/scene/CityScene.tsx          District scene, camera commands and detail selection
src/scene/NavigationControls.tsx Stable native control lifecycle and gesture recovery
src/scene/architecture.ts        Detailed instanced facade and rooftop geometry
src/scene/Appearance.tsx         Local materials, environment lighting and grounding
src/scene/FloorInterior.tsx      Shared room geometry rendered in 3D
src/scene/RegisterModel.tsx      Interactive register model
src/App.tsx                     Selection, layer state, record context and mobile shell
src/components/                 Inspector, register, evidence, plans and dialog focus
src/data/documents.ts           Browser-generated PDF specimens
src/refinements.css             Visual and responsive refinement, loaded after styles
tests/                          Data, gesture and inspection regression suites
qa/improvements-20260918/        Current screenshots, downloaded specimens and results
```

Rendering uses instanced meshes and distance-based facade detail rather than one full React component tree per building feature. Distant district views keep the building masses while nearby views resolve windows, balconies and rooftop equipment. The viewer needs no PostGIS, Shapely or Cesium backend for this synthetic local inspection use case. There is no hidden claim of live government integration, authentication, document upload, permanent edits, or automatic legal registration. Reloading restores the deterministic demo.

## Build and test

```powershell
npm run build
npm test
node tests/browser-integration.mjs
python tests/render-pdfs.py
```

The browser integration entry point runs `interaction-regression.mjs` and `inspection-regression.mjs`. It expects the application on port 5175 and an installed Google Chrome. Tests include 650 ms held drags, repeated gestures, orbit, wheel-after-drag, touch pan/pinch/cancel, 2D state, mobile control accessibility, exact document/unit routing, focus containment and downloaded files. Evidence goes under `qa/improvements-20260918/`. No listener-removal monkeypatches are used to make gesture tests pass.

The optional `tests/render-pdfs.py` uses a project-local PyMuPDF installation in `.qa-python` to render the newly downloaded sample PDFs. It checks page-boundary text bounds, every page's synthetic disclaimer, and the shared plan's bedroom/area values. This is QA tooling only; it is not needed to run the app. Touch tests use Chrome emulation, not a physical phone or physical trackpad.

Production preview:

```powershell
npm run build
npm run preview
```

Stop the existing port-5175 development server before running the production preview on the same port.
