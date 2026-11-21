# Visual analysis of supplied assets

Source: one PDF (`reshape_sub._1.pdf`, 19 A3 pages) supplied with the brief, plus logo files found in the
owner's existing app. Every file is listed in `asset-manifest.json` (ID, checksum, size, category, rights, use).
Originals are kept locally in `input-assets/` and are git-ignored — this repository is public and the drawings
are not approved for publication.

## What the drawings establish

| Element | Evidence | Used as |
|---|---|---|
| Outline 20.6 × 17.833 m; west part of south wall at 13.48 m; diagonal wall 6.371 m | fp-01, fp-02 | `OUTLINE`, `DIAG_A/B` |
| Storey heights 4.0 m / 0.3 m slab / 3.0 m | in-03 | `H_GROUND`, `SLAB`, `H_UPPER` |
| Stairs along the west wall | fp-01, ex-06, fp-19 | stair run in the entrance group |
| Service block walls with door gaps; lobby (grey floor) and a tiled room | fp-01, fp-19, in-12 | partitions cut at 1.4 m, two floor finishes |
| Steel I-columns (orange) on the north wall, mid-span and south wall | fp-01 (I symbols), all renders | `column()` positions |
| Fair-faced concrete panel walls | in-08…in-11, in-15 | panel joint lines on back walls |
| Mezzanine void 11.02 × 8.433 m with a 1.906 m chamfer | fp-02 | `VOID` |
| Red two-lane track around the void; glazing at the void edge | in-14, in-16, fp-18 | track polygon, lane line, glass |
| Changing cubicles on the upper west side | fp-02, fp-18 | changing partitions |
| Dark screen wall and white counter on the upper level | in-15, fp-18 | screen + counter |
| Bar frames visible behind the glass on the upper level | in-08 | supports a training deck upstairs (not a layout) |

## What they do not establish

- **Which sport uses which area.** No drawing names a room. The calisthenics hall, kids pavilion and performance deck
  positions are our concept. Hence `spatialMode: "conceptual-zones"` and `status: "concept"`.
- Equipment types, counts and positions (everything drawn inside the shell is illustrative).
- The use of the tiled ground-floor room; the reception desk is a concept.
- Construction status, finishes, signage, lighting.
- Glazing height at the void (renders suggest full height; the illustration cuts it at 1.4 m for legibility).

## Illustration system

- **Projection:** one fixed isometric projection for every drawing (`engine.ts`), camera from the south-east.
- **Convention:** sectional axonometric — back walls full height, everything else cut at 1.4 m; each level is its own
  drawing and the page composes them as an exploded stack (portrait on phones, diagonal on wider screens).
- **Line weights:** equipment bars 3 px, posts 2.4 px, thin members 1.5 px, joints 1 px at 30 px/m.
- **Materials:** taken from the renders — steel orange, concrete grey, dark rubber floor, red track, blue glazing.
  One accent bar in the calisthenics rig uses the RESHAPE accent.
- **Figures:** non-identifying pictograms. Children are always drawn beside an adult figure and on low equipment.
- **Text:** none inside the SVG; all labels are HTML so they translate and remain accessible.
- **Proof scenes** built first: calisthenics hall and kids pavilion; inspected at 1440 px and 390 px before the other
  four zones were added.

## Not published

- Raw renders and plans (reference only).
- `in-12` in particular carries placeholder door signage from a model library and must never be shown.
- `brand/reshape-seal-light.png` (meaning and approval unknown).

## Approvals still needed

1. Confirm the logo files are the approved mark and supply a vector master.
2. Approve (or correct) the zone concept so the explorer can move from `concept` to `reference-validated`.
3. Supply real photography when available; mark each as `actual facility photograph` in the manifest.
