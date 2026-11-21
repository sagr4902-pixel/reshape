# Architecture

One deployable Next.js application in `dhahran/`. No microservices, no monorepo tooling, no CMS, no admin UI.

## Stack (pinned in `package.json` / lockfile)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Node.js | 22 (`.nvmrc`, `engines`) |
| App | Next.js App Router, React, TypeScript strict | 16.4.6 / 19.3 |
| Styling | Tailwind CSS v4 + CSS custom properties | 4.3.5 |
| i18n | next-intl (`/ar` default, `/en`) | 4.15.3 |
| Validation | Zod | 4.6.7 |
| Database | PostgreSQL + Drizzle ORM / drizzle-kit migrations, `pg` driver | 0.45.4 |
| Phone | libphonenumber-js (server only) | 1.13.17 |
| Tests | Vitest, Playwright, axe | 5.1 / 1.63 / 4.14 |

Next.js 16 specifics that differ from older versions: the request interceptor file is `src/proxy.ts` (formerly
`middleware`), and `params` / `searchParams` are promises.

## Rendering and data flow

```
Browser ──GET /ar/...──▶ proxy.ts (locale routing) ──▶ Server Components
                                                       │  read typed content (src/content/*.ts)
                                                       │  resolveMembershipAction() decides every membership CTA
                                                       ▼
                                             HTML (prerendered per locale)
Browser ──POST /api/leads (JSON, same-origin)──▶ route.ts
        origin + content-type + 16 KiB limit → collection gate (env) → Zod schema (allow-listed IDs)
        → honeypot → shared rate limit (PostgreSQL) → transaction { lead_submissions + consent_events } → 200
```

- Content pages (`/`, `/programs…`, `/kids`, `/football-performance`, `/memberships`, `/contact`, `/privacy`) are
  prerendered per locale (`dynamic = 'error'`); `/memberships` revalidates hourly so freshness rules apply without a
  redeploy. `/explore` and `/register` render on demand because they read allow-listed query context.
- Client components are small islands: `Explorer`, `LeadForm`, `LocaleSwitch`, `ExternalLink`, `ProgramView`.
  The root layout is a Server Component. No translation catalogue is shipped to the browser
  (`NextIntlClientProvider messages={null}`); client islands receive their strings as props.
- **Environment flags are read at build time for prerendered pages** (launch stage, notice version, canonical origin)
  and at request time for `/register`, `/explore` and the API. Build each environment with its own variables.

## Trust boundaries

| Boundary | Rule |
|---|---|
| Query strings | Only `zone`, `program`, `intent`, `src`; each checked against an allow-list; unknown values ignored. Never used to build HTML or file paths. |
| Lead API | Same-origin `Origin` required, JSON only, 16 KiB cap, strict schema (unknown fields rejected), server-side timestamps, no CORS. |
| Database | Runtime role `reshape_web` (`db/roles.sql`) can insert leads and read four non-personal columns; it cannot read names or mobiles back, update or delete. Staff tooling uses a separate role. |
| Outbound links | Official store links must be HTTPS on exactly `reshape-sa.com` (URL-parsed). No redirect endpoint, no `returnTo`. |
| Server-only code | `server-only` guards `env`, `db`, `seo`; evidence notes and unapproved prices never reach public DTOs (tested against the built bundles). |
| Secrets | Only in environment variables; `.env.example` holds placeholders; production refuses unsafe defaults. |

### Security headers

Set in `next.config.ts`: CSP (`default-src 'self'`; no third-party origins; `frame-ancestors 'none'`; `form-action 'self'`),
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS.
`script-src` includes `'unsafe-inline'` because Next.js emits inline bootstrap scripts and a nonce-based policy would
force every page to render dynamically; `style-src 'unsafe-inline'` is needed for the explorer's inline CSS variables.
This was tested with the real pages (no CSP violations in the E2E console checks). Moving to nonces is possible later
at the cost of static prerendering.

## Homepage facade

`FacadeHero` (server component) renders the owner's facade render on a "plate" that keeps the render's aspect ratio.
The view crops the plate per breakpoint by sliding it horizontally; hotspots and lettering are children of the plate
positioned in percent, so they stay registered with no measuring script. `EnterLink` (small client island) adds the
"walk in" zoom on click and otherwise behaves as a normal link.

## Explorer

Two complementary views of every zone:

- **Design view** — the club's own renders for the zone (`DesignPicture`: AVIF at 240–1600 px with a WebP fallback,
  chosen by `sizes`), with next/previous
  (under the render on phones, over its lower edge from 640 px), thumbnails, caption and the concept label. This is the default once a zone is selected and is what the server
  renders for `?zone=…`.
- **Map view** — an accurate axonometric map generated from the working drawings.
  - Pipeline: `src/features/explorer/scene/{engine,model,themes}.ts` → `scripts/build-scenes.ts` →
    `public/assets/scenes/level-*.svg` + `src/content/generated/scene-meta.json`. Deterministic and committed;
    `npm run scenes:check` (also a unit test) fails on drift.
  - Camera: one isometric projection seen from the south-west (facade side). North and east walls are back walls;
    everything else is cut at 1.4 m.
  - Levels: the mezzanine drawing is registered 3.65 m above the ground drawing and shown as a switchable level, so
    one layout fits every screen.
  - Geometry without measuring: the stage has the drawing's aspect ratio, so the SVG never letterboxes. Level
    drawings and hotspots are positioned in percentages; the camera is a CSS transform whose per-zone values come from
    the generated metadata. No ResizeObserver, no JS hit-testing. An E2E test compares every hotspot with its anchor
    point inside the SVG across levels, zoom, resize and both directions.
- **State:** reducer with `overview / transitioning / focused`, `view` (map / design), `level`, image index, `simple`
  and `failed`. Selecting from the map sweeps the camera to the zone, then switches to the design view; the latest
  selection always wins and a timer guarantees leaving `transitioning`. History entries are created only for
  deliberate zone selections. Entrance animations (render fade, panel slide) are enabled only for content swapped
  in after the first render, so a deep link paints its render with the first frame.
- **Progressive enhancement:** every zone control is a link to `?zone=…`; the server renders the zone, its first
  image, panel and CTA, so the tour works without JavaScript. A server-rendered zone list sits below as the equivalent
  alternative. If the map drawings fail to load, the design view and the list still work.
- **Weights (measured):** level drawings 40 KiB + 12 KiB raw (10 KiB + 4 KiB transferred); a render in AVIF is
  33–101 KiB at 1600 px (median 78), 22–64 KiB at 1200 px (median 50) and 12–31 KiB at 800 px; gallery thumbnails
  are 3–7 KiB each. The viewer loads one render at a time.

## Decisions (ADRs)

### ADR-1 — Project location and repository
The session is scoped to existing repositories and cannot create a new one. The app lives in `dhahran/` inside
`sagr4902-pixel/reshape`, next to the untouched single-file app at the root, on branch
`claude/reshape-dhahran-site-pnpzac`. **That repository is public**, so owner-supplied originals and internal pricing
are git-ignored. Recommended: move `dhahran/` to a private `reshape-dhahran` repository (history can be kept with
`git subtree split --prefix=dhahran`).

### ADR-2 — Renderer for the tour
| Option | Verdict |
|---|---|
| **Official renders + generated SVG map + HTML controls** | **Chosen.** The renders are the design, pixel for pixel; the map adds orientation; controls are real links. |
| Hand-drawn / generated illustration only | Used for the first version; replaced once real designs arrived. |
| Canvas / PixiJS | Rejected: separate hit-testing and accessibility work for no measured need. |
| Real-time WebGL 3D | Deferred — see ADR-9. |

### ADR-3 — Animation
CSS transitions only. Motion / GSAP were not added: the camera is one transform transition.

### ADR-4 — Content management
| Option | Verdict |
|---|---|
| **Typed, schema-validated files in Git** | **Chosen.** Six programs, two planned plans; changes are reviewed commits. |
| Headless CMS | Adopt only if non-technical staff need frequent edits and a service is authorised. |
| Custom admin | Deferred. Lead handling uses the CLI in `scripts/leads.ts`. No "protected-looking" page exists. |

### ADR-5 — Rate limiting
Fixed-window counters in PostgreSQL (atomic upsert), keyed by an HMAC of client key + window, so limits hold across
instances and no IP is stored. With `TRUST_PROXY=false` there is one global bucket (120 / 10 min); behind a trusted
proxy each client gets 8 / 10 min. An edge-level limiter can be added in front; none is assumed.

### ADR-6 — No streaming `loading.tsx`
A route-level loading file made Next.js stream page content inside a hidden container that only JavaScript reveals
(blank page without JS) and committed a 200 status before `notFound()` could run. It was removed; pages render in
one pass. Form and explorer have their own loading/failure states.

### ADR-7 — About page
No verified brand story was supplied, so `/about` redirects to the homepage "Our approach" section instead of
publishing a thin page.

### ADR-9 — Real-time 3D
The owner allowed a 3D site if needed. It was **not** needed to show the facade exactly: the supplied renders are
already the 3D design, and a model rebuilt by hand from plans would be less faithful than the designer's own images.
A walkable real-time scene becomes worthwhile once the designer exports the actual 3D model (GLB/FBX with baked
lighting). It would then load on demand inside the existing explorer (the zone model, deep links, panel and fallback
list stay as they are), with the renders as the poster and fallback.

### ADR-8 — No-JavaScript registration
The form needs JavaScript (idempotency key, inline validation). Without it the page shows the official WhatsApp
channel instead. All other content and navigation work without JavaScript.

## Project layout

```
src/app/[locale]/…        public routes          src/app/api/leads/route.ts   submission boundary
src/components/           layout + small UI      src/features/{home,explorer,programs,memberships,leads}/
src/content/              approved structured content (+ generated scene metadata)
src/lib/catalog/          schemas, CTA resolver, store allow-list
src/lib/server/           database + lead service  src/lib/{env,seo,phone,analytics}
db/                       schema, migrations, role grants
scripts/                  scenes, content validation, migrations, staff lead CLI
tests/{unit,integration,e2e}
```
