# Design analysis — facade and interiors

Analysed on 21 November 2026 from the owner's second delivery, which **supersedes** the SketchUp massing study used for
the first version of the site:

| Set | Issuer / date | Status on the documents | Used as |
|---|---|---|---|
| Facade package, 5 sheets | Tribal Experience (designer Malek Laila), Rev. 02, 05/11/2026 | "For review — not for construction" | Facade geometry and the homepage hero |
| Working drawings "Re-shape #3", 32 sheets | Tribal Experience, issue 20/08/2026 | Working drawings | Shell dimensions, walls, furniture and equipment layout |
| Design submission deck, 67 pages | 21 Aug 2026 ("reshape — Fitness Champer") | Design submission | Materials, lighting, signage, zone imagery |

Every file is listed with checksums in `asset-manifest.json`. Originals stay in `input-assets/` (git-ignored — the
repository is public). The working drawings have no text layer, so dimensions were read visually from the dimension
plan (sheet 4) and cross-checked against the facade package.

## 1. The facade

Two walls meet at a splayed corner: the **entrance wall** (drawn as "right facade", 4.518 m wide) and the **glazed
wall** on the 6.37 m diagonal (drawn as "left facade", 5.291 m of bays). Overall height 5.940 m; ground storey to
+3.450 m.

| Element | Drawing data | Reading |
|---|---|---|
| Sign | Black `reshape` wordmark with the lightning mark, centred on the upper wall, four emblem icons above its right end | Backlit (halo) lettering on off-white textured render; the only signage on the wall — restrained and legible at distance |
| Light bar | Red linear fitting above the sign | Washes the wall; sets the red as the accent of the whole elevation |
| Canopy / fascia | Red band at ≈ +3.45 m running across both walls | Ties the two facades into one horizontal line |
| Chevron strip | 5.207 × 0.598 m overall, 0.100 m border, clear 5.007 × 0.398 m; pitch TBC on the drawing | White chevrons over red: the facade's signature pattern, repeated indoors on the mezzanine balustrade and beams |
| Entrance bay | Glazed bay 2.388 m + door bay 1.979 m; transom member 0.050 m with a small `reshape` sign | Glazing shows the stairs and terrazzo lobby — the route upstairs is visible from the street |
| Door D01 | Double leaf, 1.979 × 2.102 m, two rounded vision lights 0.521 m wide, coloured safety band, long pull handles | Grey leaves with a red band; industrial, not retail |
| Glazed wall | Lower bays 1.884 m and 3.107 m with a 0.300 m pier, 3.450 m high; upper bays 2.294 m high | Bay 1 frames the juice bar, bay 2 the training hall; the upper bays reveal the mezzanine and red roof steel |
| Frames | Red throughout | One frame colour for doors, windows and structure |

**What makes it work:** one accent colour (red-orange) on an off-white wall, black lettering, and a single graphic
pattern (chevrons). The club's activity is the display — every opening shows a different part of the interior.

**How the site adopts it:** the homepage hero *is* the facade render, uncropped on desktop. The copy sits as lettering on
the blank wall to the left of the entrance, under a light fall-off that does not touch any facade element. The door
and the three window groups are links into the matching zones; choosing the door zooms toward it before entering the
tour. The chevron strip returns as the divider under the hero and above the closing section.

## 2. The building (dimension plan)

- Interior 19.67 m wide; 17.83 m deep on the east side, 13.48 m (3.88 + 9.60) on the west; diagonal wall 6.37 m.
- A mezzanine covers the west 8.63 m; the east 11.04 m is a **double-height hall** under a red steel roof.
- Stairs 1.30 m wide on the west wall, starting 3.88 m from the north-west corner.
- Reception block (new walls) under the mezzanine: north face 6.68 m from the north wall; east wall with a 1.70 m
  opening and a 2.00 × 1.00 m portal into the hall; splayed wall 2.45 m meeting the diagonal facade.
- Steel columns 0.20 m: north wall at 4.42 / 4.52 / 2.76 / 7.37 m spacing, south wall 2.40 / 7.37 m.
- Back door 1.10 m wide on the north wall, 6.43 m from the west corner.

The earlier study showed a track loop around a central void and assumed a kids pavilion. **Neither exists in these
drawings**; both were removed from the site.

## 3. Interior zones

| Zone | Where (plan) | Design character (deck) | On the site |
|---|---|---|---|
| Reception & store | West half of the block, by the stairs | Terrazzo floor, brass desk with the `reshape` logo, grey tile wall, blue tile panel, dark store shelving under a "RESHAPE STORE" light box | `reception` |
| Juice bar | East half of the block, behind facade bay 1 | Blue floor tile, black counter, communal table with orange and mint chairs, dark dimpled ceiling with a pink neon line, red portal | `juice-bar` |
| Bars & rings | North-east, east and south walls of the hall | Black uprights with red-orange bars, tall red wall bars, rings, low timber bars; perforated steel gallery band; wall graphic of training silhouettes | `rig` |
| Turf lane & cardio | Centre of the hall | Green turf lane ≈ 9.8 × 2.2 m with white marks, tyre and sled; treadmills, rowers, air bikes; yellow soft boxes; emblem light boxes (King, Warrior, Magician, Lover) | `turf-cardio` |
| Re.Build strength area | North-west, under the mezzanine | Black ceiling, brick and blue tile walls, squat racks, lifting platform, dumbbell racks, "Re.Build" sign | `strength` |
| Lockers & changing | Mezzanine, west | Blue lockers, rust-orange wall panels, timber benches, round wall lights, terrazzo vanity | `lockers` |
| Mezzanine walkway | Mezzanine, along the hall edge | White balustrade with large orange chevrons, red beams, linear lights, glazed office at the south end | `overlook` |

**Design language.** Materials: fair-faced concrete, red steel, perforated galvanised steel, terrazzo, blue tile,
brass, brick. Colours: red-orange as the single strong accent; blue, yellow and brass as local accents; charcoal and
concrete as the ground. Graphics: chevrons, the four emblem icons, stencil-like slogans ("Re-create your life",
"Stop wishing, start doing", "Re.Build", "RE-boost menu"). Lighting: linear pendants and wall washers; coloured
light on the rubber floor in the hall.

**Adopted on the site:** the accent stays red-orange (`#FF5420`, already the brand accent); structural red replaces the
study's orange in the map; the chevron pattern is a shared motif; zone imagery is the deck itself. The emblem icons and
slogans are **not** reused as site content — their meaning in the brand has not been explained to us.

## 4. The explorer map

`src/features/explorer/scene/model.ts` redraws both levels from the dimension and furniture-layout plans, seen from
the facade side (south-west), so the entrance wall and glazed bays face the viewer. Equipment positions follow the
layout plan; shapes are pictograms. Convention: back walls to storey height, everything else cut at 1.4 m; the
mezzanine is a second drawing registered 3.65 m above the ground floor and shown as a switchable level.

## 5. Open points for the owner / designer

1. **Location label:** the working-drawing cover reads "AL Dammam-Saudi Arabia"; the facade title block reads
   "Dhahran, Saudi Arabia". Geometry matches in both, so they are treated as the same building — please confirm.
2. **Status:** the facade package is "for review — not for construction" and several facade sizes are "TBC". Renders
   are therefore labelled as visualisations site-wide.
3. **Kids:** no dedicated children's area appears in the designs. The kids pages show the training hall and make no
   claim about where sessions take place.
4. **Entrance door:** the August plan shows a 1.00 m single door; the November facade package shows the 1.979 m double
   door. The newer package is used.
5. **Resolution:** the facade render is 1672 × 941 px and the interior renders 1728 × 972 px. A 4K export of the facade
   would keep the hero sharp on large displays.
6. **Publication rights:** design by Tribal Experience; deck pages carry a "SPORTACUS" mark. We published them on the
   owner's instruction — the designer's consent has not been seen.
7. **Real-time 3D:** would need the designer's 3D model (GLB/FBX export). See `docs/architecture.md`, ADR-9.

## Illustration and image rules

- Renders are never mirrored, recoloured or composited; crops only.
- Every render carries the label "تصوّر مبدئي للنادي — قد تختلف التفاصيل عند الافتتاح / Concept visualization — details may
  change before opening". The map carries its own "schematic" label.
- No text is baked into generated drawings; all labels are HTML.
- When real photographs exist, add them as `actual facility photograph` and replace renders zone by zone.
