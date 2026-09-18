# Verification record — in-place refinement

Latest complete browser run: **2026-09-17 21:15 UTC / 18 September 2026, 02:45 IST**. Evidence: `qa/improvements-20260918/browser-results.json`.

This supersedes the earlier click-only validation in `qa/browser-results.json`. The assessment in `qa/assessment-20260918/` remains preserved. Before editing, the source, tests, configuration and original documentation were checkpointed in `qa/checkpoint-before-improvements-20260918-020155.zip`.

## Verified results

| Check | Result |
| --- | --- |
| TypeScript + production build | Passed |
| Data/geometry tests | 12 passed |
| Browser regression groups | 21 passed |
| Browser page/console errors captured | 0 |
| Downloaded PDF specimens rendered and checked | 4 files, 6 pages |
| App HTTP response after validation | 200 on port 5175 |

The gesture suite uses actual mouse input and Chrome DevTools Protocol touch emulation, not a listener-removal workaround. A separate desktop-tool drag in the user's open Chrome window also moved the map after the correction. Physical-phone and physical-trackpad testing remains outstanding.

## Confirmed defects and their corrections

### Controls lifecycle

The previous Drei `MapControls` wrapper disposed its active listeners when the changing inline `onStart` callback caused an effect cleanup. Camera-status updates could therefore sever a held drag's movement and release listeners.

`NavigationControls.tsx` now owns the installed native Three.js map control connection per camera/canvas. Changing React state does not reconnect it. A callback ref preserves the latest start behavior without changing lifecycle dependencies. Native pointer capture, explicit cancellation/blur handling, canvas focus and keyboard controls are included. Static labels do not intercept map gestures.

The revised suite verifies a 650 ms held left press before moving, repeated sustained drags, held right orbit, wheel after dragging, one-finger pan, two-finger pinch, touch cancellation followed by another gesture, and window-blur recovery.

### Navigation and accessibility

- Selecting a property or fitting/focusing it in 2D retains a top-down camera and matching UI state.
- Mobile uses a compact property sheet and an explicit Layers drawer. Its zoom button was checked with hit-testing to ensure the inspector does not cover it.
- The ruler chooses an appropriate distance and an exact corresponding pixel width. Tests check several zoom levels rather than checking only the label.
- Record and export dialogs move focus inside, contain Tab/Shift-Tab navigation and restore focus to the opener.
- Inspector tab changes reset the relevant scroll position. The register scrolls the selected unit row into its table's visible region.

### Exact record context and shared room geometry

- Evidence → Floor plans opens the plan, not the land record.
- Inspector Unit 101 opens occupancy record `BLD-0413/F1/U1`; switching back to the register preserves that selection.
- Model, table and plan selections retain unit/floor context. Returning to the district focuses the selected floor.
- `floorLayout.ts` drives the register's net room areas, SVG plan, exported PDF and 3D interiors. Every unit's bedroom count and area are tested against that source.
- The default two-bedroom unit's former 132 m² placeholder is now **116.22 m² net room area**, calculated from the actual fixture rooms. Gross footprint and floor-area metrics remain distinct.

## Visual changes inspected

The same project now has recessed facade bays, separate window framing and piers, balcony rails and planters, varied concrete palettes, rooftop detail, local surface textures, environment lighting and grounding. Selected-property emphasis and road labels were increased. The panels and findings tray use larger text, clearer contrast and proportions closer to the supplied reference layouts.

The register is an expanded workspace with a live exploded model, floor/unit table, summary metrics and evidence/findings sidebar. The utility view includes a measured clearance callout and a separate schematic of horizontal clearance versus pipe centre depth.

Final screenshots were visually inspected for the desktop map, register, utility overlay, mobile map, mobile document viewer and mobile register. The six rendered PDF pages were inspected for readable layout and disclaimers. The floor-plan PDF also passes explicit checks for four bedrooms across two default units and the shared net unit-area value.

**The rendering is still procedural architectural visualization, not a pixel-identical or photogrammetric reproduction of the reference.** The inspection layout and details are closer; no claim that it exceeds the mockups' photorealism is made.

## Data totals retained

944 buildings and linked parcels; 8,454 unit records; 5 parks; 18 road corridors; 36 utility segments; 24 computed findings across 17 buildings. Default findings remain 32 m² outside the recorded parcel, 16 m² intersecting the road corridor, and 1.8 m horizontal clearance to a water pipe whose centre is 2.6 m below grade.

The 16 m² road intersection is part of the 32 m² parcel-overhang region; these are not disjoint areas to sum. All people, records, identifiers and geometry are synthetic. The 2 m review threshold is demonstrative, not an asserted regulation. Decorative building details do not constitute comprehensive surveyed 3D clash geometry.

## Repeat verification

```powershell
cd E:\Projects\ulpin-city-studio
npm run build
npm test
node tests/browser-integration.mjs
python tests/render-pdfs.py
```

The browser runner expects the app already running on port 5175 and Google Chrome installed. It sequentially runs `interaction-regression.mjs` and `inspection-regression.mjs`, then writes an aggregate result. PDF rendering uses the project-local `.qa-python` PyMuPDF installation. QA outputs are excluded from the Vite watcher to avoid Windows file-lock failures during downloads.

## Evidence files

- `qa/improvements-20260918/interaction-results.json`: 10 gesture/mobile/scale groups, measured before/after camera states.
- `qa/improvements-20260918/inspection-results.json`: 11 selection, check/filter/search, document/register/export, focus and layout groups.
- `qa/improvements-20260918/browser-results.json`: combined completed run.
- `qa/improvements-20260918/pdf-results.json` and `pdf-renders/`: four downloaded PDF specimens, six checked pages.
- Numbered PNGs in the same folder: actual browser screenshots at 1672 × 941, 1280 × 800 and 390 × 844.

## Remaining limits

The bundler reports a size warning for the main approximately 1.66 MB bundle (about 478 KB gzip); the build succeeds. This is a local synthetic inspection application, not a backend registry, an authenticated administration service, a real-document ingestion pipeline or an official government integration. Physical touch hardware and every GPU/browser combination are not certified by these tests. Schematic room fixtures are not sanctioned plans. No frame-rate guarantee is inferred from successful gesture tests or static screenshots.
