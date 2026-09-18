# Current-project assessment ? 3D ULPIN City Studio

## Decision
Improve the existing project in place. The assessment does not justify a new repository, new framework or replacement map engine. There are reproducible interaction and workflow defects in the current implementation, as well as substantial visual gaps from the supplied mockups.

Assessment only: application source, tests, dependency manifests and configuration were not edited. SHA-256 verification checked 21 existing files; changed files: 0. New evidence files are confined to this QA folder. The diagnostic browser-only listener experiment was discarded, not applied to the application.

## 1. Critical: held mouse/touch gestures lose their event listeners

### Reproduction
On the map, hold the left mouse button for 600 ms, then drag. The camera does not move. An immediate sustained drag can move a short distance before stalling. Holding the right button before moving also fails to orbit. One-finger pan and two-finger pinch reproduced the same failure using Chrome DevTools touch input.

Actual desktop input was also exercised on the user's open Chrome window, with no visible movement after a held drag. Touch results are browser emulation, not certification on a physical phone or trackpad.

### Measured results
The pixel measure is displacement of a fixed building's projected screen position; it is not a frame-rate measurement. The same building remained selected.

| Test | Projected displacement | Zoom delta | Drag listener removed while held? |
| --- | ---: | ---: | --- |
| Mouse: left hold 600 ms, then drag | 0 px | 0 | Yes |
| Mouse: immediate sustained left drag | 24.62 px | 0 | Yes |
| Mouse: right hold 600 ms, then orbit | 0 px | 0 | Yes |
| Wheel zoom on fresh page | 5.88 px | 0.32105 | No |
| Wheel zoom after interrupted held drag | 0 px | 0 | Yes |
| Isolation A/B: same held drag with ONLY in-memory listener removal deferred | 162.77 px | 0 | No |
| Touch: one-finger held pan | 0 px | 0 | Yes |
| Touch: two-finger pinch | 0 px | 0 | Yes |
| Isolation A/B: one-finger pan with ONLY in-memory listener removal deferred | 121.48 px | 0 | No |

### Confirmed mechanism
- src/scene/CityScene.tsx:265 calls onCamera approximately every quarter second, even when the camera is stationary.
- src/App.tsx:39 puts that new object into React state, causing the scene subtree to render again.
- src/scene/CityScene.tsx:280 passes an inline onStart callback to MapControls. Each render creates a new function reference. Hover-state changes can cause additional renders.
- In the installed node_modules/@react-three/drei/core/MapControls.js:27?42, onStart is an effect dependency. Its change triggers controls.dispose() and reconnects the control.
- node_modules/three-stdlib/controls/OrbitControls.js:306?320 removes document-level pointermove and pointerup listeners on disposal. Reconnecting attaches pointerdown, cancel and wheel, but does not restore an already active gesture's document listeners.
- The interrupted gesture can miss its release as well as movement. The wheel then stops working after the failed left-drag sequence, although it worked on a fresh page.

The capture shows the canvas receiving pointer input: the main desktop failure is not explained by an invisible full-map overlay. In one recorded run, the listener was removed 234 ms after pointer-down while the button was still held.

For causal isolation, a disposable browser experiment deferred ONLY those active document-listener removals. With the same scene and dataset, the held mouse drag moved about 163 px and the emulated one-finger drag about 121 px, instead of zero. That is evidence for a targeted control-lifecycle fix, not a production patch to retain permanently.

Required correction: stable controls callbacks and lifecycle, separation of camera/HUD state updates from control setup, and deliberate pointer-up/cancel recovery. Test repeated sustained gestures through ordinary UI renders; do not merely test camera buttons.

## 2. High: mobile layout obstructs the map

At 390 ? 844 CSS pixels, the inspector occupies 300 px of the 390 px map width, leaving only 90 px exposed. It covers the zoom and expand-map controls. Hit-testing their centres finds inspector content instead of those controls.

The layers/properties sidebar is display:none below the responsive breakpoint, without a visible replacement navigation button. Closing the inspector reveals the camera buttons but does not restore a way to open layers.

Required correction: a closable/reopenable sheet or drawer, accessible layer controls, and camera controls that are not covered by the inspector. Test default, closed and reopened states.

## 3. High: 2D state and camera disagree

Reproduction: choose 2D, then select a property from the left list. The selected property flies into an oblique 3D camera view while the 2D button and footer still claim a 2D plan.

Source: src/App.tsx:27 always sends the block camera command; src/scene/CityScene.tsx:253 always gives that command an oblique camera. The 2D/3D mode is not honoured consistently across navigation. The mode prop also does not impose a top-down rotation lock.

Required correction: camera commands must preserve the active mode, or intentionally change both camera and UI together. A 2D plan must remain top-down through selection, focus and navigation.

## 4. High: document and unit entry points lose context

Evidence -> Floor plans opens the Land record tab and the Land record & parcel reference document. The floor-plan thumbnail follows the same generic documents action. The occupancy entry point also does not carry its requested document type.

Clicking Unit 101 in the inspector opens the general building register at Unit 401, without selecting or focusing Unit 101. This is not a linked unit-inspection flow, despite the clicked unit existing in the dataset.

Sources: src/components/Inspector.tsx:37,42?43; src/components/RecordModal.tsx:9?14. The modal interface receives the building but no requested document type, selected floor or selected unit context.

Required correction: carry building, floor, unit and document identifiers through navigation and restore the exact context when returning to the map.

## 5. High for inspection accuracy: the map scale is misleading

In the top-down view after zooming, the ruler still says 25 m, but its 140 px length represents approximately 11.72 m at the measured 11.95 screen pixels per metre. The measurement used two equal-height buildings and their known coordinate separation, not an assumed screenshot scale.

Source: src/App.tsx:91 clamps the bar length to 140 px while keeping the label fixed. The minimap's viewport indicator similarly uses a rough zoom-only box rather than a projection of the actual view.

Required correction: choose a readable distance and compute both ruler label and screen length together. Derive the minimap extent from the camera rather than presenting a guessed coverage box.

## 6. Medium: modal keyboard focus is not managed

Opening the register leaves focus on the background Open register button. The next Tab focuses the background Inspect floors button before entering the dialog. The dialog has aria-modal but no focus transfer, trap or background inertness.

Required correction: move focus into the dialog, keep keyboard navigation inside it, restore focus on close, and preserve Escape behaviour.

## 7. Medium: plan drawings and room records disagree

A sample unit record says 132 m? and 2 bedrooms. The two-unit floor-plan illustration shows only one bedroom per unit. The drawing template is fixed-size while its text dimensions vary, and the 3D cutaway is another separately written generic layout.

Sources: src/data/district.ts:47; src/components/Visuals.tsx:32?42; src/scene/CityScene.tsx:205?224.

These are labelled synthetic, which is appropriate, but synthetic inspection records should still agree with their drawings. Use one layout/room model to drive the plan, 3D cutaway, unit schedule and exported specimen.

## 8. Visual assessment

The current scene remains visibly below the block-map reference: too many nearly identical building forms, flat materials, repetitive planting, weak local shading and insufficient emphasis on the selected building. The generic floor/register modal also differs from the reference workspace containing a large exploded building, floor table and evidence/issues columns.

Typography is a usability problem as well as a visual mismatch. Current measured samples at the reference viewport include 10.5 px property identifiers, 9 px addresses, 10 px inspector tabs and 8 px findings descriptions. Pale green text further reduces readability. The reference uses stronger text hierarchy and clearer contrasting overlays.

These improvements can be made within the current scene and components. Retain the district and property linkage while upgrading building variants, materials, lighting, planting, camera framing, overlays and UI tokens. No evidence suggests that switching to Cesium or adding PostGIS would itself solve these defects.

## 9. What is worth keeping

The app already has an actual rendered scene, instanced building geometry, deterministic district/parcel/unit fixtures, stable string identifiers, geometric intersection calculations, search/selection, floor visibility, and document/export components. These are useful foundations, not proof that the whole product is functionally acceptable.

The earlier browser suite exercised short clicks, toolbar camera commands, visibility switches and downloads. It did NOT exercise sustained mouse-down/move/up sequences, touch/pinch, gesture recovery, mobile hit-testing, correct document routing, or unit-context preservation. Therefore its passing result did not validate the interaction claims that failed here.

## 10. Correction order and acceptance

1. Repair the control lifecycle and verify sustained/repeated mouse pan, orbit, touch pan and pinch, release/cancel recovery, dragging across buildings, and wheel operation after all of those gestures. Preserve application state during input.
2. Repair 2D camera state, mobile panel access, document/unit context, ruler correctness and modal keyboard behaviour. Reconcile floor data and drawings.
3. Improve the same current map and inspection components visually, checking matched camera framing and viewport size against the supplied mockups. Measure interaction performance before adding heavier visual effects.

Do not declare completion from a build, a screenshot or a list of passing button-click tests. For this project, basic map manipulation and correct linked inspection flows are release blockers.

## Evidence files

- interaction-assessment.json: measured gestures and in-memory causal isolation.
- 1-events.json through 9-events.json: listener/event timelines.
- workflow-assessment.json: document routing, unit context, modal focus, layout and typography observations.
- scale-measurement.json: geometric screen-scale measurement.
- source-integrity-final.json: 21 existing files checked, no edits.
- desktop-baseline.png, 2d-label-with-oblique-camera.png, wrong-floor-plan-entry.png, unit-context-lost.png, mobile-default.png, mobile-inspector-closed.png, scale-mismatch.png: screenshots.

Limitations: physical-phone and physical-trackpad testing remains outstanding. No frame-rate certification or full-product/security audit is implied. No application fixes were applied in this assessment.
