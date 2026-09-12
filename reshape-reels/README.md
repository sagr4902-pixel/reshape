# RESHAPE Reels — Remotion motion system

Reusable Remotion components for Arabic (RTL) short-form fitness content.
Built for `ReshapeReel`, but every component is content-agnostic.

## Run

```bash
npm install
npm run studio                     # interactive timeline
npx remotion render src/index.ts ReshapeReel out/reel.mp4 \
  --browser-executable=/path/to/chrome --codec=h264 --crf=17
```

## Design system

`src/theme.ts` holds **every** colour, size, radius, stroke, spring and safe
margin. Components read from it; nothing hard-codes a visual value. Change the
accent once and the whole system follows.

`src/timeline.ts` is the edit blueprint: punch-ins, reframes, beats and sound
cues, all in seconds, converted to frames by `sec()`.

## Components

### Subject matte pipeline

`scripts/build-matte.py` runs MediaPipe multiclass selfie segmentation over the
plate and emits three frame-locked assets plus tracking data:

| Asset | What it is |
|---|---|
| `isolate_v3.mp4` | the plate with the world dimmed and desaturated behind a per-frame subject matte |
| `edge_v3.mp4` | the silhouette contour, screen-blended as a rim light |
| `track_v3.json` | per-frame subject bbox and left/right arm centroids |

`scripts/retime.py` then applies ONE frame map to the plate and every matte, so
they can never drift apart: a half-speed ramp as his arms come up, a 0.9s freeze
on the peak pose, and a hold on the final gesture. The audio is rebuilt against
the same map with silence filling the inserted beats.

The freeze lands in a real inter-word gap, so nothing is cut mid-syllable and
the held beat reads as a deliberate pause rather than a dropout.

### Editorial shape

Contrast is the design. The reel opens bare, then alternates hero moment and
clean talking head:

```
COLD OPEN (silhouette + the claim as a question)
  -> chapter mark -> VESSEL BLOOM -> clean -> STRUCK CLAIM -> clean
  -> ramp -> THE POSE (freeze, isolate, rim light, tracked BICEPS labels)
  -> EVIDENCE BARS -> clean -> FROZEN END CARD
```

Each hero moment speaks a *different* visual language on purpose — organic
vector, display typography, data — so nothing reads as a template. An earlier
revision used four near-identical rounded panels; that was the thing worth
throwing away.

| Component | Purpose |
|---|---|
| `SafeArea` | Instagram chrome model; `debug` paints forbidden regions |
| `PunchZoom` | Eased programmatic camera punch-ins, face-anchored origin |
| `DynamicReframe` | Eases the speaker aside while a graphic occupies the other side |
| `FocusVignette` | Drops the background back while a hero graphic owns the frame |
| `WordCaption` | Word-level kinetic captions, RTL-correct, with suppression windows |
| `KeywordHighlight` | Per-word emphasis hierarchy (plain / spoken / keyword) |
| `VesselBloom` | Blood flow grown out of the spoken word PUMP — self-drawing vessels, one-way cells, faint tissue response |
| `BloodParticle` | One red cell, deterministic position along a path |
| `StruckClaim` | The misconception as display type, cancelled by a rule that draws right-to-left |
| `EvidenceBars` | The finding *shown*: two bars land level, equality rule, source tag |
| `TopicTag` | Chapter mark — rule and type, not a panel |
| `SignOff` | Hairline brand lockup |
| `SoundCue` | Frame-accurate one-shot SFX |

## Arabic / RTL

Chrome shapes Arabic natively. Captions render each token as its own span inside
a `direction: rtl` flex row — safe because Arabic never joins across a space.

**Invariant:** a run of consecutive Latin words must arrive as ONE token. Each
token is an atomic flex item, so bidi cannot reorder within it — separate spans
for "LET'S" and "GO" render as "GO LET'S". `captions.json` merges them.
Fonts load via `src/fonts.ts` behind `delayRender`, so no frame paints in a
fallback face.

## Data

- `public/words.json` — per-word timings
- `public/captions.json` — caption groups with per-word emphasis
- Phrase boundaries come from Descript. Word boundaries are derived by
  syllable-weighted onset alignment inside those bounds (Descript's API does
  not expose per-word timing), so treat them as accurate to ~±80ms, not as
  forced-aligner output.

## Scientific constraints baked into the components

`VesselBloom` says only that flow to working muscle *rises*. It must not be
edited to claim a pump causes hypertrophy, and its tissue glow is deliberately
faint — visible inflation would misrepresent the physiology.

`EvidenceBars` shows equal hypertrophy across loads because that is what
Schoenfeld et al. (2017) found for sets taken to failure. The caveat that max
strength still favours heavy loads stays on screen so the chart cannot read as
cherry-picked. Do not remove it.
