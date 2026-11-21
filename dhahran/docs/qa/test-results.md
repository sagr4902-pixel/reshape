# Test results

Run on 21 November 2026 in the build container (Linux, Node 22.23, PostgreSQL 16 local cluster, Playwright 1.63 with
Chromium 1243). Everything below was observed in that environment; nothing was run against a hosted deployment, the
live store or real customers.

## Summary

| Check | Command | Result |
|---|---|---|
| Content validation | `npm run content:validate` | Pass — 6 programs, 7 pathways, 9 memberships, 6 zones; translation parity OK |
| Illustration drift | `npm run scenes:check` | Pass |
| Lint | `npm run lint` | Pass, 0 warnings |
| Types | `npm run typecheck` | Pass (strict) |
| Unit | `npm test` | **84 / 84** passed |
| Integration (real PostgreSQL) | `npm run test:integration` | **25 / 25** passed |
| End-to-end (production build) | `npm run test:e2e` | **81 passed, 1 skipped** (keyboard flow is desktop-only) across `desktop` 1440×900 and `mobile` Pixel 7 emulation |
| Production build | `npm run build` | Pass; content pages prerendered per locale |
| CI workflow | `.github/workflows/dhahran-ci.yml` | Written; **not observed running** (it runs on GitHub after push) |

**Not run:** Firefox, WebKit/Safari, physical devices, screen-reader passes (NVDA/VoiceOver), load tests, any test
against a deployed URL, dependency secret-scanning service. `npm audit` reported 0 vulnerabilities at install time.

## What the suites prove

**Unit (84)** — Saudi mobile normalisation incl. Arabic-Indic and Persian digits and rejections; the full CTA decision
table (verified Dhahran product, unknown branch, Dammam product, planned plan, unavailable, look-alike host, stale
link, stale/unapproved price); official-store allow-list against 14 malformed/look-alike inputs; lead schema (unknown
IDs, unexpected fields such as child name/email, marketing default false, limits); payload hashing; CSV formula
neutralisation; analytics property allow-list; scene projection and anchors; environment gates (production blocked by
draft notice / unsafe secret / missing contact / localhost URL; previews never indexable); public membership DTO free
of notes and unapproved prices; no pricing hypotheses or protected brand names in shipped source.

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

**End-to-end (81)** —
- Journeys A–E in Arabic and English on desktop and phone: A ends at an **honest inquiry** (no Dhahran product
  exists — this is not a purchase integration); B stores a guardian inquiry with program, zone and source, marketing
  `declined`, no child fields in the form; C stores a hybrid inquiry and the page contains no HYROX/CrossFit wording;
  D shows service boundaries and stores a consultation request with no medical fields; E reaches the right program
  and CTA from a zone.
- Explorer: invalid deep links open the overview; server renders the focused zone; back/forward; rapid changes end
  on the last selection; every hotspot within 2.5 px of its SVG anchor after zoom, resize, RTL and LTR; identical
  geometry in both languages; keyboard selection keeps focus; reduced motion; Simple view persisted; blocked drawings
  fall back to the list; native page scrolling over the scene; no-JavaScript zone list and server-rendered focus.
- Form: localized errors, focused summary, `aria-invalid`/`aria-describedby`, inputs preserved; Arabic-Indic digits
  stored as E.164; double click → one row; simulated 503 shows "nothing was recorded" then a retry with the same key
  stores exactly one row; network failure never shows success; hostile query context ignored.
- Quality: every route × language returns 200 with correct `lang`/`dir`, one `h1`, no raw translation keys, no dead
  links, no broken images, canonical + reciprocal hreflang, `noindex` on preview; **no horizontal overflow at
  320 px** on every route; **no serious or critical axe violations** (WCAG 2.0/2.1/2.2 A+AA rule tags) on nine key
  pages × 2 languages × 2 viewports; language switch keeps route and zone, drops unknown/personal parameters; alias
  redirects; HIJA credit in both languages; security headers; lead API not readable and without CORS; built client
  bundles contain no draft prices, evidence notes or internal tags.

## Persistence across restart (manual, observed)

1. Started the production server with the test database; `POST /api/leads` with a synthetic record → `{"ok":true}`.
2. Stopped the server process.
3. `npm run leads -- list` (separate process) showed the record (masked name and number, program, intent, status).
4. Restarted the server and replayed the same request with the same idempotency key → `{"ok":true}`; row count still 1.
5. Exported to CSV, then deleted the record with `leads -- delete … --execute --confirm-delete`.

Storage in this verification was a throw-away **local** PostgreSQL 16 cluster. No hosted database was used.

## Lighthouse (lab)

Tool: Lighthouse 13.6.0, Chrome/Chromium 1243 headless, default mobile preset (emulated Moto G Power, simulated
slow 4G, 4× CPU slowdown). Target: production build served by `next start` on **localhost** in the build container
with `APP_ENV=preview`. Median of 3 runs per URL. Raw medians: `docs/qa/lighthouse.json`.

| Route | Performance | Accessibility | Best practices | SEO (preview) | LCP (simulated) | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/ar` | 91 | 100 | 100 | 69 | 3.3 s | 0 | 139 ms | 396 KiB |
| `/en` | 95 | 100 | 100 | 69 | 2.7 s | 0 | 62 ms | 319 KiB |
| `/ar/kids` | 91 | 100 | 100 | 69 | 3.1 s | 0.069 | 156 ms | 356 KiB |
| `/ar/programs/calisthenics` | 93 | 100 | 100 | 69 | 3.1 s | 0 | 138 ms | 349 KiB |
| `/ar/memberships` | 99 | 100 | 100 | 69 | 0.8 s | 0 | 146 ms | 363 KiB |
| `/ar/explore` | 93 | 100 | 100 | 69 | 3.3 s | 0.001 | 116 ms | 401 KiB |

- **SEO 69 on preview is by design:** the only failing audit is `is-crawlable`, because preview builds send
  `noindex`. A separate production-mode build (`APP_ENV=production`, a non-localhost test hostname) scored **SEO 100**
  on `/ar` and `/en/kids` (one run each) with `index, follow`, an open `robots.txt` and a sitemap.
- **Simulated LCP is 2.7–3.3 s on image-led pages, above the 2.5 s field target.** The LCP element is the hero
  illustration; unthrottled, the same paint completed in ≈ 0.2 s. These are lab simulations from localhost, not field
  data: real LCP/INP/CLS at the 75th percentile can only be known after deployment with real-user measurement.
- Before the font work the Arabic homepage scored 86 with CLS 0.057 and 461 KiB.

## Budgets (measured, phone viewport, Arabic homepage, localhost)

| Budget | Target | Measured |
|---|---|---|
| Initial compressed JavaScript | ≤ 250 KiB | 152 KiB (framework runtime is most of it) |
| Homepage transfer | ≤ 1.2 MiB | 379 KiB including below-the-fold illustrations |
| Hero image (phone) | ≤ 250 KiB | 9 KiB (SVG, compressed) |
| Fonts | ≤ 180 KiB | 136 KiB Arabic (4 files) · 63 KiB English (3 files) |
| First explorer scene | ≤ 1.5 MiB | 10 KiB for both level drawings |
| Explorer code on the homepage | none beyond a preview | none — the homepage links to `/explore` |

Not measured: frame rate of the camera transition on a real mid-range phone; long tasks under interaction on real
hardware.

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
