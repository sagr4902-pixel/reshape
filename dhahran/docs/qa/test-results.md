# Test results

Run on 21 November 2026 in the build container (Linux, Node 22.23, PostgreSQL 16.15 local cluster, Playwright 1.63,
Chromium 153). Everything below was observed in that environment on the final code of revision 2; nothing was run
against a hosted deployment, the live store or real customers.

## Summary

| Check | Command | Result |
|---|---|---|
| Content validation | `npm run content:validate` | Pass — 6 programs, 7 pathways, 9 memberships, 8 zones, 29 design images (alt text in both languages, every encoded file and thumbnail on disk); translation parity OK |
| Map drift | `npm run scenes:check` | Pass |
| Lint | `npm run lint` | Pass, 0 warnings |
| Types | `npm run typecheck` | Pass (strict) |
| Unit | `npm test` | **85 / 85** passed |
| Integration (real PostgreSQL) | `npm run test:integration` | **25 / 25** passed |
| End-to-end (production build) | `npm run test:e2e` | **91 passed, 1 skipped** (keyboard flow is desktop-only) of 92, across `desktop` 1440×900 and `mobile` Pixel 7 emulation |
| Production build | `npm run build` | Pass; content pages prerendered per locale |
| CI workflow | `.github/workflows/dhahran-ci.yml` | Observed green on GitHub: revision 1 (run 44885723226) and revision 2 (run 44899391265 on commit `dafb2ab`: all checks, 91 E2E passed and 1 skipped, `npm audit` 0 vulnerabilities). A file cannot record the run of the commit that contains it — see the repository's Actions tab for later runs. |

**Not run:** Firefox, WebKit/Safari, physical devices, screen-reader passes (NVDA/VoiceOver), load tests, any test
against a deployed URL, dependency secret-scanning service. `npm audit` reported 0 vulnerabilities at install time.

## What the suites prove

**Unit (85)** — Saudi mobile normalisation incl. Arabic-Indic and Persian digits and rejections; the full CTA decision
table (verified Dhahran product, unknown branch, Dammam product, planned plan, unavailable, look-alike host, stale
link, stale/unapproved price); official-store allow-list against 14 malformed/look-alike inputs; lead schema (unknown
IDs, unexpected fields such as child name/email, marketing default false, limits); payload hashing; CSV formula
neutralisation; analytics property allow-list; map projection (south-west camera) and anchors; the scene is marked
as following the supplied drawings and has exactly the eight real zones — none of those invented for version 1;
every zone and program points at catalogued renders with alt text in both languages; environment gates (production
blocked by draft notice / unsafe secret / missing contact / localhost URL; previews never indexable); public
membership DTO free of notes and unapproved prices; no pricing hypotheses or protected brand names in shipped source.

**Integration (25, real database)** — a submission and both consent rows are written atomically and are visible from
a new connection; replay with the same key stores one row; **10 concurrent identical requests → 1 row**; key reuse
with changed data → conflict, nothing changed; a later inquiry is a new row flagged `is_repeat` and earlier marketing
consent is not carried forward; database constraints reject malformed rows and roll back the whole transaction; an
unreachable database never reports success; shared rate limit (sequential and concurrent); staff list/status/export,
erasure dry-run/execute, marketing withdrawal, retention dry-run/execute; the `reshape_web` role can submit but gets
"permission denied" reading names/mobiles, updating or deleting. API: 200 only after commit with `{ok:true}` and no
ids; 409 conflict; no phone-number enumeration; 400 with field codes and no internals; unexpected fields, stale
notice version and bad JSON rejected; 403 cross-origin, 415 wrong content type, 413 over 16 KiB; honeypot stored
nothing; 429 with `Retry-After`; 503 when the database is down or not configured.

**End-to-end (92)** —
- Journeys A–F in Arabic and English on desktop and phone: A ends at an **honest inquiry** (no Dhahran product
  exists — this is not a purchase integration); B stores a guardian inquiry with program and source, marketing
  `declined`, no child fields in the form; C stores a hybrid inquiry and the page contains no HYROX/CrossFit wording;
  D shows service boundaries and stores a consultation request with no medical fields; E goes from a zone through
  its design render to the right program and a persisted inquiry carrying the zone; **F: the homepage is the facade
  render and its door opens the reception zone**.
- Explorer: invalid deep links open the overview; the server renders the focused zone and its first render;
  back/forward; rapid changes end on the last selection; every map hotspot within 2.5 px of its anchor inside the
  drawing on both levels, after zoom, resize, RTL and LTR; identical geometry in both languages; design viewer
  (next, previous, thumbnails, caption, counter, mini-map); **every render and thumbnail of every zone loads with no
  error response**; the server-rendered render does not animate; keyboard selection keeps focus; reduced motion;
  Simple view persisted; blocked map drawings fall back to the renders and the list; native page scrolling over the
  map; without JavaScript the facade door, zone list and server-rendered zone view all work.
- Form: localized errors, focused summary, `aria-invalid`/`aria-describedby`, inputs preserved; Arabic-Indic digits
  stored as E.164; double click → one row; simulated 503 shows "nothing was recorded" then a retry with the same key
  stores exactly one row; network failure never shows success; hostile query context ignored.
- Quality: every route × language returns 200 with correct `lang`/`dir`, one `h1`, no raw translation keys, no dead
  links, no broken images, canonical + reciprocal hreflang, `noindex` on preview; **no horizontal overflow at
  320 px** on every route; **no picture is drawn from a file too small for its size** (file pixels per CSS pixel,
  allowing for `object-fit: cover`) on seven image-led pages; **no serious or critical axe violations** (WCAG 2.0/2.1/2.2 A+AA rule tags) on nine key
  pages × 2 languages × 2 viewports; language switch keeps route and zone, drops unknown/personal parameters; alias
  redirects; HIJA credit in both languages; security headers; lead API not readable and without CORS; built client
  bundles contain no draft prices, evidence notes or internal tags.

## Defects found by the final sweep (fixed, with a guard)

| Found | Fix | Guard |
|---|---|---|
| The facade thumbnail in the entrance zone's gallery returned 404 (the facade existed only in its two hero sizes). | Facade encoded at thumbnail and tile sizes too. | Content check requires a thumbnail for every image; new E2E test opens every image of every zone. The test failed on the old build and passes now. |
| A zone opened by link faded its main render in, about 100 ms after the rest of the page. | Entrance animations apply only to content swapped in after the first render. | E2E assertion on the server-rendered render; first paint and largest paint now coincide (measured). |
| The tall program card on the homepage (desktop) and the lead card on the programs page (phones) showed a blurred render: `sizes` described the card, not the wider picture drawn inside it, so a 480 px file was stretched to about 1100 px. | `sizes` now states the drawn width. | A sweep of all 367 picture slots at six viewport/density combinations found no other case; new E2E density test, shown to flag the old value. |

## Persistence across restart (manual, observed in revision 1)

Not repeated for revision 2 — the lead code did not change; the integration and E2E suites above were re-run.

1. Started the production server with the test database; `POST /api/leads` with a synthetic record → `{"ok":true}`.
2. Stopped the server process.
3. `npm run leads -- list` (separate process) showed the record (masked name and number, program, intent, status).
4. Restarted the server and replayed the same request with the same idempotency key → `{"ok":true}`; row count still 1.
5. Exported to CSV, then deleted the record with `leads -- delete … --execute --confirm-delete`.

Storage in this verification was a throw-away **local** PostgreSQL 16 cluster. No hosted database was used.

## Lighthouse (lab)

Tool: Lighthouse 13.6.0, Chromium 153 headless, default mobile preset (emulated Moto G Power, slow 4G, 4× CPU
slowdown). Target: production build served by `next start` on **localhost** in the build container with
`APP_ENV=preview`. Median of 3 runs per URL. Raw medians of the final run: `docs/qa/lighthouse.json`.

### Final run — simulated throttling (Lighthouse default)

| Route | Performance | Accessibility | Best practices | SEO (preview) | LCP (simulated) | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/ar` | 84 | 100 | 100 | 69 | 3.5 s | 0 | 326 ms | 504 KiB |
| `/en` | 94 | 100 | 100 | 69 | 2.8 s | 0 | 178 ms | 428 KiB |
| `/ar/kids` | 91 | 100 | 100 | 69 | 2.8 s | 0 | 230 ms | 381 KiB |
| `/ar/programs/calisthenics` | 90 | 100 | 100 | 69 | 2.8 s | 0 | 171 ms | 377 KiB |
| `/ar/memberships` | 95 | 100 | 100 | 69 | 0.8 s | 0 | 263 ms | 368 KiB |
| `/ar/explore` | 88 | 100 | 100 | 69 | 3.4 s | 0.003 | 233 ms | 525 KiB |
| `/ar/explore?zone=rig` | 84 | 100 | 100 | 69 | 3.6 s | 0.003 | 295 ms | 502 KiB |

**The performance score is not stable in this container.** Four complete runs were made on the same day while
finishing the work. Between runs only the zone-view fix (before the third run) touched the first screen of a
measured page; the other corrections were below the fold. Each figure is a median of three; the last one is the
final code:

| Route | Performance across the four runs | Simulated LCP across the four runs |
|---|---|---|
| `/ar` | 91 · 85 · 87 · 84 | 3.0 · 3.2 · 3.8 · 3.5 s |
| `/en` | 92 · 95 · 90 · 94 | 3.3 · 2.7 · 3.5 · 2.8 s |
| `/ar/kids` | 91 · 89 · 84 · 91 | 3.3 · 3.3 · 3.4 · 2.8 s |
| `/ar/programs/calisthenics` | 91 · 87 · 93 · 90 | 3.3 · 3.3 · 2.6 · 2.8 s |
| `/ar/memberships` | 98 · 98 · 98 · 95 | 0.8 s in all four |
| `/ar/explore` | 88 · 87 · 88 · 88 | 3.5 · 3.4 · 3.4 · 3.4 s |
| `/ar/explore?zone=rig` | 84 · 84 · 87 · 84 | 4.0 · 4.2 · **3.5 · 3.6 s** (after the fix) |

So: accessibility 100 and best practices 100 on every route in every run; performance **84–95, not a reliable
≥ 90**, moving by up to seven points between runs with no change to the page (the differences are main-thread
time on a shared machine); simulated LCP above the 2.5 s target on image-led pages.

### Same build — throttling actually applied

Lighthouse's default estimates the throttled timings from an unthrottled trace. On localhost every file arrives in
a few milliseconds, which makes that estimate pessimistic for image-led pages. With the network and CPU limits
really applied (`--throttling-method=devtools`: about 1.5 Mbit/s down, 560 ms request latency, 4× CPU), one run per
route:

| Route | Performance | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|
| `/ar` | 94 | 2.0 s | 2.1 s | 222 ms | 0 |
| `/ar/kids` | 97 | 1.8 s | 1.9 s | 147 ms | 0 |
| `/ar/explore?zone=rig` | 94 | 1.9 s | 2.0 s | 221 ms | 0.003 |

Unthrottled in the same container (phone emulation, median of five loads) first paint and largest paint coincide
at 0.13–0.15 s on the homepage, kids, program and zone pages.

All of these are lab measurements from localhost. **Real LCP, INP and CLS at the 75th percentile can only be known
after deployment with real-user measurement**; hosting (HTTP/2 or 3, Brotli, a CDN) will change them.

- **SEO 69 on preview is by design:** the only failing audit is `is-crawlable`, because preview builds send
  `noindex`. Production mode is covered separately below.
- Attempted and reverted: `content-visibility: auto` on below-the-fold sections gained about two points but made
  Lighthouse and axe report false contrast failures on content that had not been rendered yet.

### Production mode (indexing)

A separate build of the final code with `APP_ENV=production` and a non-localhost test hostname (mapped to the
build container) sent `index, follow`, a canonical and reciprocal `hreflang` links on that hostname, an open
`robots.txt` (only `/api/` and the registration form are disallowed) and a sitemap listing both languages.
Lighthouse SEO scored **100** on `/ar`, `/en/kids` and `/ar/explore` (one run each). Lead collection was off in that
build, as designed: production refuses to collect until the database, secret, final privacy notice and contact are
configured.

## Budgets (measured, final build, localhost, Pixel 7 emulation at 2.6× pixel density, cold cache)

| Budget | Target | Measured |
|---|---|---|
| Initial compressed JavaScript | ≤ 250 KiB | 159 KiB (framework runtime is most of it); 165 KiB on the tour page |
| Homepage transfer | ≤ 1.2 MiB | Arabic 560 KiB on load, 783 KiB after scrolling the whole page; English 483 / 703 KiB |
| Hero image (phone) | ≤ 250 KiB | 54 KiB (AVIF, 1672 px) on high-density phones; 29 KiB (1100 px) at up to 2× density |
| Fonts | ≤ 180 KiB | 138 KiB Arabic (4 files) · 64 KiB English (3 files) |
| First explorer view | ≤ 1.5 MiB | Map: 15 KiB for both level drawings. Zone by link: one render, 63 KiB at 1200 px, plus 3–7 KiB per thumbnail |
| Tour page transfer | — | 643 KiB on load (map), 602 KiB for a zone opened by link; about 840 KiB after scrolling the whole page |
| Explorer code on the homepage | none beyond a preview | none — the homepage links to `/explore` |
| Committed design imagery | — | 233 encoded files, 7.9 MB in the repository (five AVIF widths and a WebP fallback per render); a page downloads only the sizes it needs |

Not measured: frame rate of the facade zoom and the map camera on a real mid-range phone; long tasks under
interaction on real hardware.

## Accessibility — scope of the claim

Automated axe checks and Lighthouse found no serious or critical issues on the pages listed, and keyboard paths for
the explorer and form are covered by tests. That is **not** a WCAG 2.2 AA conformance statement: no manual
screen-reader session, 200 %/400 % zoom walkthrough or contrast review of every state was carried out by a person.

## Known limitations

- Chromium only; phone results are emulation.
- The registration form needs JavaScript.
- No staff notification on new leads.
- `TRUST_PROXY=false` means one global rate-limit bucket (120 / 10 min) rather than per-client limits.
- Store verification was done from extracted page text; availability on the store is ambiguous.
- The facade render is 1672 px wide and softens on very large screens; a 4K export is needed for those.
