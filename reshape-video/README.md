# RESHAPE — Transformation Reel

A reusable Remotion template for RESHAPE before/after transformation videos.
1080×1920, 30fps, 15.2 seconds, built for Instagram Reels, TikTok and YouTube
Shorts.

**Fixed brand system. Adaptive editing.** Every reel in the campaign runs the
same structure, the same labels, the same transition and the same end card. What
changes per athlete is which frames of their footage land in each beat.

---

## Making a new reel

1. Drop two clips into `public/`.
2. Point the config at them:

```ts
// src/config/transformationData.ts
export const transformation: Transformation = {
  beforeVideo: "before.mp4",
  afterVideo: "after.mp4",
  language: "en", // or "ar"
};
```

3. Preview, then render:

```bash
npm run dev                              # Remotion Studio
npx remotion render TransformationReel out/reel.mp4
```

That is the whole required configuration. No name, no duration, no weight, no
measurements, no dates — the template has nowhere to put them, by design.

To render the Arabic cut without touching the config:

```bash
npx remotion render TransformationReel out/reel-ar.mp4 \
  --props='{"beforeVideo":"before.mp4","afterVideo":"after.mp4","language":"ar"}'
```

---

## Choosing the frames

`shotList` in the same file is **optional**. Set it to `null` and the template
measures both clips at render time and takes its marks as proportions of their
real durations — never from the first seconds, which are usually someone walking
into frame.

Set it when you have watched the footage:

```ts
export const shotList: ShotList | null = {
  hookFlashes: [12.45, 8.05, 11.25],   // seconds into AFTER
  before: { start: 0.7, focalY: 0.46, scale: 1.14, playbackRate: 0.95 },
  matchFreeze: 4.6,                     // top of the last BEFORE rep
  after: { start: 10.05, focalY: 0.44, scale: 1.14 },
  peak: 12.45,                          // the frame the impact lands on
  coda: { start: 16.6 },                // optional closing beat
  comparison: { before: 4.2, after: 12.45 },
};
```

All times are **seconds into the source clip**.

The one that matters most is `matchFreeze` → `after.start`. Pick a BEFORE frame
and an AFTER frame in the same body position, and the transition becomes a match
cut: same person, same rig, same pose — different result.

### Framing

Any source aspect ratio is fitted to 9:16 by focal point rather than a centre
crop, so a landscape clip and a phone clip both work.

| Field    | Meaning                                       |
| -------- | --------------------------------------------- |
| `focalX` | 0 = left edge, 1 = right edge                 |
| `focalY` | 0 = top, 1 = bottom. Lower values keep heads in |
| `scale`  | 1 fills the frame, above 1 punches in         |

---

## Structure

| Beat       | Frames | What it does                                       |
| ---------- | -----: | -------------------------------------------------- |
| HOOK       |     36 | Three tightening flashes of the pay-off             |
| BEFORE     |    126 | The working set, `/ BEFORE`, slow push in           |
| FREEZE     |     14 | The top of the last rep, held                       |
| AFTER      |     75 | The hero move, revealed by **The Rise**             |
| IMPACT     |     18 | The hit on the strongest frame                      |
| CODA       |     33 | Walking away from it                                |
| COMPARISON |     54 | The only moment both frames share the screen        |
| END CARD   |    100 | Identical in every reel                             |

Beat lengths live in `src/config/timeline.ts`. They are the fixed part of the
system — change them and reels stop feeling like a set.

### The Rise

The signature RESHAPE transition. A single #FF5420 hairline lifts from the
bottom of the frame to the top and the transformed athlete rises into existence
behind it. It runs in the same direction as the movement in the footage, which
is why it reads as progress rather than as a wipe.

This is the one transition that should appear in every RESHAPE transformation
reel. Everything else in the edit adapts to the footage; this shouldn't.

---

## What the template will not do

Hard rules, enforced by there being no code path to break them:

- No trainee name, age, weight, height, body fat, measurements, dates or
  transformation duration.
- No text on footage beyond `BEFORE` / `AFTER` (`قبل` / `بعد`).
- No digital alteration of the athlete's body.
- BEFORE is held back, never made to look bad: slightly restrained saturation,
  a touch more grain, a fractionally slower playback rate. Nothing more.

---

## Brand

`src/brand/tokens.ts` is the single source of truth for colour, type, safe zones
and easing.

| Token        | Value     |
| ------------ | --------- |
| Charcoal     | `#2F3034` |
| Dark Gray    | `#444448` |
| Warm Beige   | `#D9CCC4` |
| Soft Beige   | `#E9DDD7` |
| Accent       | `#FF5420` |

Orange is an edge, a line or a single word — never a fill.

The official logo files in `public/brand/` are extracted from the RESHAPE site
and placed as supplied: same artwork, same colour, scaled uniformly, never
recoloured, stretched or redrawn.

Type is Zain (display) and IBM Plex Sans Arabic (technical/Arabic), self-hosted
in `public/fonts/` as Arabic + Latin subsets so renders never depend on the
network.

### Safe zones

Reels, TikTok and Shorts all put interface over the frame. Nothing that must be
read goes inside `SAFE` in `tokens.ts` — 220px top, 420px bottom, 90px left,
190px right (the right margin clears the like/comment/share rail).

---

## Sound

`public/sfx/` is synthesised from scratch by `scripts/make-sfx.py` — sub-bass
impact, noise whoosh, riser, tick — so the template ships with no audio
licensing attached. Cues are locked to the reveal, the impact, the comparison
and the end card.

Music is intentionally absent. Drop a **licensed** track into `public/music/`
and name it:

```ts
export const audio = {
  music: "music/track.mp3",
  musicVolume: 0.55,
  ambienceVolume: 0.28,  // source-clip park sound underneath
  sfxVolume: 0.85,
};
```

---

## Components

```
src/
  brand/tokens.ts               colour, type, safe zones, easing
  config/transformationData.ts  the only file you need to edit
  config/timeline.ts            beat lengths + fallback shot list
  components/
    SmartVideo.tsx              focal-point crop, grade, freeze
    BrandLabel.tsx              the / BEFORE, / AFTER marker
    BeforeScene.tsx
    AfterScene.tsx
    TransformationReveal.tsx    The Rise
    ImpactFrame.tsx             punch zoom, dim, hairline burst, knock
    SplitComparison.tsx         RTL-aware side by side
    HookFlash.tsx
    FilmTexture.tsx             grain + vignette
    EndCard.tsx
  compositions/TransformationReel.tsx
```

---

## Notes

Renders use Remotion's own Chromium. In a sandbox without access to
`remotion.media`, point it at a local browser:

```bash
npx remotion render TransformationReel out/reel.mp4 \
  --browser-executable=/path/to/chrome
```
