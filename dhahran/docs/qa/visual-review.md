# Visual review

Rendered pages were inspected from screenshots of the running app (Chromium, production build), in Arabic and
English, at 1440×900 and 390×844, plus automated overflow checks at 320 px on every route. No physical device,
Firefox or WebKit was available in the build environment — those remain unchecked.

Screenshot set (synthetic data only): `docs/qa/screenshots/`. Regenerate with
`node scripts/dev/review.mjs http://localhost:3100 <dir>` against a running server.

## Pass 1 — composition and hierarchy

| # | Observed | Correction | Verified |
|---|---|---|---|
| 1 | First scene render stacked the upper level over the ground floor: the kids pavilion showed through the mezzanine void and read as being upstairs. | Each level became its own drawing; the page composes an exploded stack — vertical on phones, diagonal on wide screens. | Re-rendered both layouts; zones read on the correct level. |
| 2 | Headings collapsed onto the following text on every section. | Heading size classes were named `h-1/h-2/h-3`, which Tailwind also uses for *height*. Renamed to `t-1/t-2/t-3`. | Full-page capture, both languages. |
| 3 | Explorer on phones: page 700 px wider than the screen; scene cropped arbitrarily. | Grid children lacked `min-width: 0`, so the horizontally scrolling zone chips widened the grid. | 390 px and 320 px overflow = 0 (automated on every route). |
| 4 | Header CTA wrapped onto two lines at 390 px and crowded the logo. | CTA hidden below 640 px (it is the first item in the menu and the hero CTA is directly below). | 390 px capture. |
| 5 | Program pages opened with text only; "Where in the club?" showed one card filling half the row. | Program hero now carries the zone illustration; a single zone renders as a full-width split card. | Calisthenics and football pages. |
| 6 | Homepage "more programs" grid left an empty cell beside the large card. | Large card spans three rows so the three smaller programs stack beside it. | 1440 px capture. |
| 7 | Tour tiles on phones were six full-width cards (very long scroll). | Two columns on phones. | 390 px capture. |

## Pass 2 — details and interaction states

| # | Observed | Correction | Verified |
|---|---|---|---|
| 8 | Hotspot pill was centred on the zone anchor, so the numbered dot sat left or right of the real point depending on language. | The 44 px target is now centred on the anchor; the label hangs beside it (visually hidden but still the accessible name on phones). | E2E: every dot within 2.5 px of its SVG anchor after zoom, resize, RTL and LTR; identical coordinates in both languages. |
| 9 | A figure in the lobby appeared to stand on the reception desk. | Moved in front of the desk. | Kids and entrance crops. |
| 10 | With JavaScript disabled, pages were blank; unknown URLs returned 200. | Route-level `loading.tsx` made Next.js stream content into a hidden container. Removed (ADR-6). | E2E: no-JS test reads content and follows zone links; `/ar/nope` returns 404 with a localized page. |
| 11 | Explorer stayed empty if a drawing failed before React attached its error handler. | Images are re-checked on mount; failure shows a message and the list below remains. | E2E with blocked SVG requests. |
| 12 | Arabic pages downloaded ~250 KiB of fonts including Latin faces they barely used. | Per-language font faces with unicode ranges; display + text face preloaded; language-switch label uses system fonts. | Network log: Arabic 4 files / 138 KiB, English 3 files / 63 KiB. |
| 13 | axe: horizontally scrollable pathway rail was not keyboard-focusable on phones; logo link's accessible name did not contain its visible text. | Rail is focusable and labelled; logo uses image alt text instead of `aria-label`. | axe run: no serious/critical violations on nine key pages × 2 languages × 2 viewports. |

## Known visual limitations

- The logo source is a 420 px PNG; it is displayed at ≤ 126 px wide so it stays sharp, but a vector master is needed
  for larger use.
- In the 4:3 zone crops, neighbouring zones are visible at the edges (they are crops of the same level drawing).
- Equipment is schematic line-art by design; it is a concept, not a specification.
- Native `<select>` arrows follow the browser's own RTL behaviour.
- Camera smoothness was observed only in desktop Chromium; no frame-rate measurement on a real mid-range phone.
