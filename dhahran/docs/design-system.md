# Design system

## Concept — THE PROGRESSION HOUSE

The site opens **at the club's front door**: the homepage hero is the facade exactly as designed, and the visitor walks
in through it. Inside, each zone is shown with the club's own design renders and located on an accurate map drawn from
the working drawings.

Two graphic motifs carry the identity:

- **The bar** — a horizontal accent rail with two posts, from a calisthenics bar: under page titles, as the section
  marker (`01 ——`), as the pathway rail.
- **The chevron strip** — taken from the facade's chevron band and the mezzanine balustrade: the divider under the
  hero and above the closing section (`.chevron-band`).

"هنا تبدأ قوّتك / Your strength starts here" is **proposed campaign copy**, not an official slogan
(`messages/*.json → home.hero.title`). Progress is presented as personal: pathways are "directions, not mandatory
stages".

## Registers

| Register | Where | Treatment |
|---|---|---|
| Control (calisthenics) | hero, calisthenics, explorer | Charcoal ground, the design renders at full width, large Arabic headlines |
| Discovery (kids) | kids chapter and page | Warm white surfaces, 28–32 px radii, guardian-first copy, plain answers. No invented kids space is shown. |
| Purpose (performance) | hybrid, functional, football | Structured lists, explicit boundaries box, no dashboards or invented numbers |

## Facade hero

- The render sits on a plate with its own aspect ratio (1672 : 941). The view crops the plate per breakpoint by
  sliding it (`--fx`): full image from 1100 px; 4 : 3 from 640 px; square on phones, centred on the entrance.
- Hotspots and lettering are positioned in percent of the plate, so they stay registered at any size without script.
- From 1100 px the copy is set as lettering on the blank wall left of the entrance, over a light fall-off
  (`.facade-scrim`) that ends before the first facade element. Below that it sits under the image.
- "Enter": the plate scales toward the door (`--door-x/y`) and fades, then the tour opens. Reduced motion, modified
  clicks and no-JavaScript get a plain link.

## Colour tokens (`src/styles/globals.css → @theme`)

| Token | Value | Provenance |
|---|---|---|
| `ink` | `#17181A` | Owner's existing app (`--ink` / theme colour) |
| `deep`, `coal`, `coal-2` | `#111113`, `#202124`, `#2A2B2F` | Owner's app surfaces |
| `paper`, `panel` | `#F7F0E9`, `#FCF7F2` | Owner's app light surfaces |
| `sand`, `line` | `#E9DDD0`, `#DCCFC4` | Owner's app |
| `accent` | `#FF5420` | Owner's app accent (dark theme). Used for fills, lines and text on dark. |
| `accent-ink` | `#B8330C` | **Our derivation** — darker accent for small text on light surfaces (contrast). |
| `steel` | `#E8822E` | Concept-marker diamond only. Structural red in the map (`#E0402A`) is sampled from the design deck. |
| `mute`, `mute-dark` | `#645C55`, `#B4ADA6` | Adjusted from the app's muted tones to meet 4.5:1. |

The store's machine-extracted colours (`#EC562E`, `#FF443A`) are close to the app accent; the logo itself is a redder
`#D91B28`. **The owner should confirm one official accent.** Until then `accent` follows the existing app.
Primary buttons use ink text on the accent fill (≈ 6:1) because white on the accent fails AA.

## Typography

Families are the ones the owner's app already uses, self-hosted through `@fontsource` (SIL OFL) — no third-party
requests.

| Role | Arabic | English |
|---|---|---|
| Display | Zain 800 | Barlow Semi Condensed 600, uppercase |
| Text | IBM Plex Sans Arabic 400/600 | IBM Plex Sans Arabic (Latin glyphs) 400/600 |
| Numerals / index | Barlow Semi Condensed | same |

- Body 17 px; Arabic line-height 1.8, English 1.65. Headings are fluid (`clamp`) with `text-wrap: balance`.
- No letter-spacing or transforms on Arabic. Uppercase and tracking apply to `:lang(en)` only.
- Arabic and English break lines independently; nothing forces equal line counts.
- Class names `t-hero`, `t-1`, `t-2`, `t-3` (not `h-*`, which collides with Tailwind height utilities).

## Layout

- 12-column grid ≥ 1024 px, single column on phones; content width 1280 px; hero illustration bleeds on desktop.
- Section rhythm `clamp(3.5rem, 9vw, 7rem)`.
- Radii: 4 px controls, 8–14 px panels; larger radii are reserved for the kids register.
- Homepage sections are deliberately different shapes: hero split, editorial spread + rail, tile board, light
  chapter, asymmetric program grid, calm band, three statements, closing bar.

## Components and states

- Buttons: min height 48 px (44 px in the header). `btn-primary` (accent), `btn-dark`, `btn-line`. States: hover,
  active (1 px press), focus-visible (3 px accent outline; white on dark), `aria-disabled` while submitting.
- Form fields: 50 px inputs, visible labels, hint text, `aria-invalid` + linked error text, error summary that takes
  focus, success panel that takes focus.
- Concept note: small diamond marker + text beside every concept illustration.

## Bilingual rules

- `lang`/`dir` on `<html>`; CSS logical properties throughout.
- Mirrored: arrows (`.arrow` flips in RTL), text alignment, layout order.
- Never mirrored: logo, illustrations, the explorer stage (`direction: ltr`), phone numbers and handles (`<bdi class="ltr">`).
- Phone input is `dir="ltr"` inside the RTL form.
- Currency through `Intl.NumberFormat` with Latin digits; business times would use `Asia/Riyadh` (none are published yet).

## Motion

| Use | Duration |
|---|---|
| Hover / press | 150 ms |
| Panel entrance, render fade in the tour | 260 ms — only for content swapped in after the first render; server-rendered content paints at once |
| Facade "enter" zoom | 820 ms, then the tour opens; skipped with reduced motion |
| Explorer camera | 560 ms, `cubic-bezier(.2,.7,.2,1)`, interruptible (CSS transition retargets) |

Transforms and opacity only. No parallax, autoplay, custom cursor, intro sequence or scroll hijacking.
`prefers-reduced-motion` and the explorer's "Simple view" remove camera movement; content and actions are identical.
