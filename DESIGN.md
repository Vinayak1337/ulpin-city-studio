# Visual contract

## Reference and scope

The supplied block-map and property-register mockups determine the composition: a quiet white/forest-green municipal workspace around a dominant oblique 3D map. Left-side layers and linked properties; right-side inspector; floating camera controls, minimap and compact computed-findings tray. Record and evidence screens retain the same visual language.

This is an independent project, not a modification of the existing 3D ULPIN implementation. The broad image pack includes other product screens; this build prioritises the map and associated inspection flow rather than pretending to implement every administration screen in the pack.

The 18 September pass improves this same `ulpin-city-studio` project in place. It retains the district, records, exports and rendering stack rather than creating a new project. A before-change checkpoint is preserved under `qa/`.

## Map

- Real orbitable orthographic scene, not an image backdrop.
- Dense, low-rise residential blocks with varied heights and warm concrete finishes.
- Visible facade frames, window recesses, balconies, roof parapets, tanks and panels.
- Fine parcel lines and clear street crossings; selected geometry uses a warm coral overlay.
- Locally generated greenery and terrain textures; no external imagery or network tile dependencies.
- Default southwest oblique camera shows the selected building beside the park and road.
- Separate district and neighbourhood camera scales. Floors can be cut away or exploded.
- Utility elevations are real negative model Y values, with visually exaggerated stroke widths.

## Current refinement

Facade geometry uses inset cores, separate piers/spandrels, recessed glazing, balcony railings, accent bays, parapet caps, roof tanks, solar-grid detail and pergolas. Local concrete and rooftop textures, an environment-lighting source and soft grounding textures add depth without an external imagery dependency. Camera composition gives the selected property more emphasis, and the active water asset has a readable clearance callout and separate section overlay.

This remains procedural architectural visualization. The new screenshots demonstrate closer layout, clearer inspection hierarchy and more detailed geometry; they do not establish pixel-identical photorealism or overall visual superiority to the supplied reference renders.

## Inspection

The displayed identifier, parcel, footprint, floor schedule, tenants, documents and findings must come from one selected building object. No unrelated thumbnail, hardcoded owner panel or fixed finding count may masquerade as that selection. The inspector thumbnail comes from the live rendered scene, with an illustrative fallback only when a scene crop is unavailable.

The register is an expanded workspace with summary metrics, an interactive exploded model, a floor/unit table and supporting evidence/findings. Document viewers preserve the chosen floor and unit. The shared metre-based room layout drives the SVG plan, exported plan, register areas and 3D interiors.

## Interaction is part of the visual contract

Held pointer gestures must remain connected across React updates. The native map control connection is owned by the canvas lifecycle, not by changing status callbacks. Pointer cancellation, window blur, repeated gestures and wheel-after-pan are regression cases. Static labels must not intercept map dragging. Two-dimensional mode must stay top-down when selection changes.

On narrow screens, the property inspector defaults to a compact bottom sheet, not a full-height overlay that hides camera controls. Layers have an explicit drawer trigger and dismissal. Document focus enters the dialog, stays within it and returns to its opener. Background map rendering pauses while the register/document overlay is open.

## Integrity

Numeric demo identifiers must remain strings. Do not rebrand generated records as official ULPINs. Every exported legal-looking record must carry a synthetic disclaimer. The aerial-style sheet must explicitly say it is a generated diagram, not captured imagery. Geometry-derived demo checks are not legal compliance decisions.

## UI rules

White surfaces, small consistent corners, fine green-grey borders, restrained accent colours, compact icon labels, clear selection states and functional visible controls. Long identifiers must remain readable. Modal and inspector content scroll independently from the map. Preserve the scene's available width at desktop sizes; collapse side navigation where appropriate.
