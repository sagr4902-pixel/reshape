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

| Component | Purpose |
|---|---|
| `SafeArea` | Instagram chrome model; `debug` paints forbidden regions |
| `PunchZoom` | Eased programmatic camera punch-ins, face-anchored origin |
| `DynamicReframe` | Eases the speaker aside while a panel occupies the other side |
| `WordCaption` | Word-level kinetic captions, RTL-correct |
| `KeywordHighlight` | Per-word emphasis hierarchy (plain / spoken / keyword) |
| `InfoPopup` | The one panel shell — entrance, exit, chrome, geometry |
| `BloodFlowDiagram` | Self-drawing SVG vessels + flowing cells + muscle response |
| `BloodParticle` | One red cell, deterministic position along a path |
| `MusclePulse` | Restrained 3% tissue pulse |
| `BloodFlowPopup` | The composed blood-flow moment |
| `ScientificStudyCard` | Verified citation, staggered hierarchy |
| `ResearchBadge` | Small uppercase label |
| `AnimatedLabel` | Staggered line reveal inside panels |
| `ArrowCallout` | Self-drawing SVG arrow with head |
| `HookCard` | Arabic myth-framing hook |
| `BrandEndCard` | Brand lockup |
| `SoundCue` | Frame-accurate one-shot SFX |

## Arabic / RTL

Chrome shapes Arabic natively. Captions render each word as its own span inside
a `direction: rtl` flex row — safe because Arabic never joins across a space —
so mixed Arabic/English lines order correctly without manual bidi handling.
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

`BloodFlowPopup` states that flow *increases* during exercise. It must not be
edited to claim a pump causes hypertrophy. `MusclePulse` is capped at 3% for
the same reason — visible inflation would misrepresent the physiology.
