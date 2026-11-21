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

## Pass 3 — adopting the owner's facade and interior designs

| # | Observed | Correction | Verified |
|---|---|---|---|
| 14 | The first-version map showed a track loop upstairs and a kids pavilion; the owner's working drawings contain neither, and the mezzanine covers only the west 8.63 m. | Map redrawn from the dimension and furniture-layout plans; zones replaced by the eight real ones. | Compared with sheets 4, 8 and 11 of the working drawings. |
| 15 | Seen from the south-east, the glazed facade wall was edge-on and invisible. | Map camera moved to the south-west so the entrance wall and glazed bays face the viewer. | Level drawings re-rendered. |
| 16 | Side-by-side levels overlapped on wide screens and wasted space on phones. | The mezzanine became a switchable level registered above the ground floor; one layout for all sizes. | 1440 px and 390 px captures; alignment test across both levels. |
| 17 | Facade wall behind the hero copy is mid-grey: neither dark nor light text reached 4.5 : 1. | A fall-off gradient on the blank wall only (ends before the entrance frame); white lettering on it. | 1440 px capture in both languages; axe run. |
| 18 | On phones the hero image pushed the buttons below the first screen. | Square crop centred on the entrance; tighter copy spacing. | 390 × 844 capture: headline and both buttons visible. |
| 19 | Three map labels near the entrance overlapped; the label on the east rig was clipped. | Labels can hang on either side of their dot (`labelSide`), automatically left near the right edge. | 1440 px capture. |
| 20 | Photo controls covered much of the image on phones. | Back label collapses to its arrow below 640 px (text stays for assistive technology). | 390 px capture. |

## Pass 4 — final verification sweep

| # | Observed | Correction | Verified |
|---|---|---|---|
| 21 | In the entrance zone's gallery the first thumbnail (the facade) was a broken image: the facade had only its two hero sizes, and the content check exempted it from the thumbnail rule. Found by opening every zone and logging failed requests. | Facade encoded at 240 / 480 / 800 px as well; the hero keeps using only 1100 / 1672 px; the content check now requires a thumbnail for every image; a new E2E test opens every image of every zone and fails on any error response. | The new test failed on the old build and passes on the fixed one, desktop and phone. |
| 22 | Opening a zone by link (for example from the facade door) faded the main render in over 260 ms; every other page painted its lead image with the first frame. Unthrottled, the image appeared about 100 ms after the rest of the page. | The fade and the panel slide now apply only to content swapped in after the first render; what the server renders paints at once. | First paint and largest paint now coincide on the zone view (measured over five loads); an E2E assertion checks the server-rendered render has no animation and the next one does. |
| 23 | On the homepage the tall "more programs" card showed a visibly blurred render on desktop: the card is taller than 16:9, so the picture is drawn about 1100 px wide, but `sizes` described the 390 px box and the browser fetched the 480 px file. The programs page lead card had the same fault on phones. Found by an automated sweep of all 367 picture slots at six viewport/density combinations. | `sizes` on both cards now describes the drawn picture, not the box. | Sweep repeated: no picture below 1.09 file pixels per CSS pixel on desktop or 1.59 on phones. New E2E test fails if any picture is drawn from a file that is too small while a larger one exists; it was shown to flag the old value. |
| 24 | On phones the render in the tour was crowded: five controls sat on a 351 × 197 px image, and four thumbnails wrapped three-plus-one. | Below 640 px previous / counter / next sit under the render as outlined buttons; thumbnails share one row. Desktop is unchanged. | 390 px capture. |

## Known visual limitations

- The logo source is a 420 px PNG; it is displayed at ≤ 126 px wide so it stays sharp, but a vector master is needed
  for larger use.
- The facade render is 1672 px wide; on displays wider than about 1700 px it is upscaled and softens.
- Map equipment is schematic by design; positions follow the layout plan, shapes are pictograms.
- The map shows walls cut at 1.4 m, so the double-height roof steel is only visible in the renders.
- Native `<select>` arrows follow the browser's own RTL behaviour.
- Camera smoothness was observed only in desktop Chromium; no frame-rate measurement on a real mid-range phone.
