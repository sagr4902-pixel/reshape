# RESHAPE — Motion Brand System

Source of truth in code: `src/brand/tokens.ts`. Every value below was taken
from the live RESHAPE product (`reshape/index.html`) or measured from the
original logo files. Where motion needed a value the brand never defined, the
derivation is stated. Nothing was invented, and the logo was not redrawn.

## 1. Brand assets (originals, untouched)

Extracted byte-for-byte from `index.html` (`const ASSET = {...}`) into `public/brand/`.

| File | Size | What it is | Use |
|---|---|---|---|
| `logo-primary-red.png` | 420×140 | Mark + wordmark lockup, signal red, ™ | End card, any "official" logo moment |
| `logo-mark-red.png` | 180×166 | Mark only | Small marks, favicon-like use |
| `wordmark-sand.png` | 340×101 | Wordmark only, sand, ® | Inline with copy on dark ("مع reshape") |
| `badge-sand.png` | 240×236 | Circular badge: helmet, crown, star, heart; "Join ReShape and enjoy healthy lifestyle" | Not used in ads yet (too small to read at video scale) |

SHA-256 of each file is listed in `docs/MISSING_ASSETS.md`.

### Logo rules
- Never recolour, outline, add effects to, rotate, distort or re-assemble the logo. Animate only position, opacity, scale (≤ 1.25×, raster limit) and clip masks.
- The end card reveals the **primary lockup itself**: it is clipped to its mark first, then the clip opens to show the wordmark. No home-made lockup.
- Clear space: at least the mark's height on every side (≈ 115 px at 1.25×).
- Minimum size in a 1080-wide frame: primary 420 px wide, wordmark 300 px wide.
- On dark only (`ink` / `deep`). There is no light-background version in the supplied assets.

### Logo animation ("Lockup", template `brand-reveal`)
| Beat | Frames (30 fps) | What happens | Easing |
|---|---|---|---|
| Uncover | cue −4 → +8 | A slanted mask (14°) sweeps across the mark, mark centred on screen | `out` |
| Hold | +8 → +14 | Mark alone, logo sting SFX lands | — |
| Open | +14 → +34 | Mark slides to its lockup position while the clip opens to reveal the wordmark | `inOut` |
| Settle | +30 → +50 | Sand clear-space hairline draws under the lockup; tagline fades in | `out` |

## 2. Colour

| Token | Hex | Source | Role |
|---|---|---|---|
| `signalRed` | `#E71C2B` | sampled: dominant opaque pixel of the red logo files | Brand accent, slam bars, active states, transitions |
| `sand` | `#E8D5C9` | sampled: wordmark/badge | Secondary accent, hairlines, eyebrows |
| `ink` | `#17181A` | app `theme-color`, manifest | Default stage |
| `deep` | `#111113` | app `--deep` (dark) | End card stage |
| `panel` | `#1D1E21` | app `--panel` (dark) | Tiles, cards |
| `line` | `#3A3B40` | app `--line` (dark) | Rules, borders, inactive |
| `track` | `#2A2B2F` | app `--track` (dark) | Empty cells, gauge tracks |
| `muted` | `#8A8B90` | app `--muted` (dark) | Secondary text (≥ 34 px only) |
| `bone` | `#EFE7DF` | app `--ink` (dark) | Primary text on dark |
| `ember` | `#FF5420` | app `--orange` (dark) | Warm glow only (never text) |

Ratio rule: ink stage ≈ 80 %, bone type ≈ 12 %, signal red ≤ 8 % of any frame except the 12-frame wipe.

## 3. Typography

The three families the website already loads (all SIL OFL 1.1, self-hosted in `src/brand/fonts/`):

| Family | Role | Weights |
|---|---|---|
| **Zain** | Arabic display: headlines, hooks, CTA | 700 / 800 / 900 |
| **IBM Plex Sans Arabic** | Arabic + Latin text: captions, labels | 400 / 500 / 600 / 700 |
| **Barlow Semi Condensed** | Numbers, Latin eyebrows, data (italic for energy) | 500–800, italic 600–800 |

### Hierarchy (1080-wide master)

| Role | Font | Size / weight | Line height |
|---|---|---|---|
| `hero` | Zain | 196 / 900 | 1.00 |
| `h1` | Zain | 140 / 900 | 1.04 |
| `h2` | Zain | 92 / 800 | 1.08 |
| `h3` | Zain | 76 / 800 | 1.12 |
| `body` | Plex Arabic | 46 / 500 | 1.45 |
| `label` | Plex Arabic | 36 / 600 | 1.30 |
| `numeral` | Barlow SC italic | 232–300 / 800 | 0.90 |
| `eyebrow` | Barlow SC caps | 34 / 700, +0.24em | 1.00 |

Arabic rules:
- `dir="rtl"` on every Arabic block; layouts start from the right edge.
- Animate whole **words**, never letters — Arabic letters join.
- Word reveal masks are padded 0.35 em above and 0.45 em below the line box. A tight mask clipped the dots of ي and the tanween in «خصيصاً» during the first quality gate; this padding is the fix.
- Keep harakat (ّ ً ئ أ) exactly as written; check them in the contact sheet.
- Latin digits for statistics (the site uses `+10`, `+100`, `2-3`); Arabic-Indic digits are acceptable in body copy where the site uses them (`٥ خطوات`).

## 4. Icons

Lucide (`lucide-react`), the same 24-unit grid and round caps the app's inline SVG icons use.
- Optical stroke fixed at ≈ 7 px in video regardless of icon size (`components/Icon.tsx`).
- Sand by default, signal red when active. Never filled, never multicolour.
- One family per video. No emoji, no mixed icon sets.

## 5. Grid & spacing

- Master canvas 1080×1920, 30 fps.
- Safe area: 96 px sides, 160 px top, 220 px bottom (keeps clear of Reels/TikTok UI).
- 6 columns, 24 px gutters inside the safe area (visible as a faint grid in `kinetic-lines`).
- Spacing scale: 8 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128 (app's 4 px scale × 2).
- Corner radius: cards 36 px, pills fully round.

## 6. Composition templates

See `docs/TEMPLATES.md` for props. Six layouts, each built around a different focal structure:

| Template | Focal structure |
|---|---|
| `sports-impact` | Diagonal poster: outlined Latin backdrop, echoing headline word, slanted red slam bar |
| `kinetic-lines` | Editorial right-aligned stack of giant words, one accented + underlined |
| `service-steps` | Vertical numbered rail with icon tiles, newest step active |
| `week-infographic` | 7-day matrix, three option rows, honest legend |
| `stat-counters` | Giant data numerals with gauge arcs, counted to land on the spoken number |
| `brand-reveal` | Centred official lockup, CTA pill, URL |

## 7. Motion

The brand slant: the wordmark leans **14°** (measured by shear search on `logo-primary-red.png` 14.5°, `wordmark-sand.png` 14.5°, mark 13–14.5°). Every motion device leans at this angle: the scene wipe, the slam bar, the logo uncover mask.

Direction: things enter from and travel toward the reading direction (right → left).

| Token | Value | Source |
|---|---|---|
| `ease.out` | cubic-bezier(0.16, 1, 0.3, 1) | app `--ease-out` — all entrances |
| `ease.inOut` | cubic-bezier(0.65, 0, 0.35, 1) | app `--ease-in-out` — wipes, logo open |
| `ease.spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | app `--ease-spring` — **one** hit per scene max |
| `dur.micro` | 4 f | app 140 ms |
| `dur.ui` | 7 f | app 220 ms |
| `dur.reveal` | 12 f | app 380 ms — default entrance |
| `dur.cheer` | 20 f | app 650 ms — underlines, hairlines, logo open |
| word stagger | follows the voice | cue = the frame the word starts in the real audio |
| scene wipe | 12 f | slant edge + red band + sand hairline |
| ambient push | +3 % scale across a scene | keeps settled frames alive (no frozen holds) |

Never: bouncing loops, continuous spinning, random jitter, letter-by-letter Arabic.

## 8. Sound identity

| Layer | Spec |
|---|---|
| Voice | "RESHAPE Official Voice" (workspace voice `o0I5dklyITreiSjxYrIt`): Saudi male, warm low baritone, coach-to-one-person delivery. `eleven_v4`. |
| Brand name | Written **رِي شَيْب** in every script. Verified blind per job (see PIPELINE.md). |
| Music | Driving half-time pulse, D minor (i–VI–III–VII), ~100 BPM. Drums drop half a beat before the logo so the sting lands in space. Ducked ~-20 dB under voice. |
| SFX palette | `whoosh` (scene wipe), `hit` (slam), `tick` (each icon/row/counter landing), `logo-sting` (logo uncover). Generated with ElevenLabs Sound Effects; prompts in `tokens.ts`. |
| Delivery | -14 LUFS integrated, ≤ -1 dBTP, 48 kHz stereo AAC 256k |
