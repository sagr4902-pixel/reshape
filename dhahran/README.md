# RESHAPE Dhahran — نادي ريشيب الظهران

Arabic-first, bilingual marketing and lead-capture website for the RESHAPE club in Dhahran.
Calisthenics leads; kids programs are a priority; visitors can **explore** an illustrated cutaway of the club or
**act** by registering interest. Payments stay in the official store (https://reshape-sa.com/) — this site has no
checkout.

> Status: implementation complete and verified locally. Not deployed. See `docs/implementation-status.md` for the
> exact readiness state and what the owner still needs to decide.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · next-intl · Zod · PostgreSQL + Drizzle ·
Vitest · Playwright + axe. Node 22. One deployable app; no CMS, no admin UI.

## Run locally

```bash
cd dhahran
npm ci
cp .env.example .env.local          # then edit values (see below)

# PostgreSQL — either:
docker compose up -d db             # postgres:16 on localhost:54329, password in docker-compose.yml
# …or, without Docker, using system PostgreSQL binaries:
npm run db:local                    # prints the connection URL

DATABASE_URL=<url> npm run db:migrate
npm run dev                         # http://localhost:3000  → redirects to /ar
```

Without `DATABASE_URL` the site still runs; the registration page then shows an honest "unavailable" state instead
of a form (there is no mock storage).

### Environment variables (`.env.example`)

| Variable | Purpose |
|---|---|
| `APP_ENV` | `development` \| `preview` \| `production` — kind of deployment. Only production on a public domain is indexable. |
| `LAUNCH_STAGE` | `preopening` \| `open` — independent of `APP_ENV`. |
| `SITE_URL` | Public origin; used for canonicals, sitemap and the same-origin check. Read at build time for prerendered pages. |
| `DATABASE_URL`, `DATABASE_SSL` | Lead storage. |
| `LEAD_HASH_SECRET` | Keyed hashes for duplicate grouping and rate-limit buckets. |
| `PRIVACY_NOTICE_VERSION`, `PRIVACY_CONTACT` | A `draft…` version or a missing contact blocks lead collection in production. |
| `TRUST_PROXY` | `true` only behind a proxy that sets `X-Forwarded-For`. |
| `ANALYTICS_ENABLED` | Wrapper switch. No provider is bundled. |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js development server / production build / production server |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run content:validate` | Schemas, cross-references, assets, translation parity, publication rules |
| `npm run scenes:build` · `scenes:check` | Regenerate the club illustrations · fail if committed files drift |
| `npm test` | Unit tests (no services needed) |
| `npm run test:integration` | Lead service + API against a real PostgreSQL test database |
| `npm run test:e2e` | Playwright: builds, starts on :3100, runs journeys, explorer, form, quality and axe checks |
| `npm run db:migrate` · `db:generate` · `db:local` | Apply migrations · generate from `db/schema.ts` · start a local PostgreSQL |
| `npm run leads -- <cmd>` · `leads:export` | Staff CLI: list, status, export, delete, withdraw-marketing |
| `npm run privacy:retention:dry-run` · `:execute` | Report / delete leads past the retention window |

Integration and E2E tests default to `postgresql://reshape@127.0.0.1:54329/reshape_test` (from `npm run db:local`);
override with `TEST_DATABASE_URL`. They refuse databases whose name does not contain `test`.

## Where things are

- Content: `src/content/` and `messages/` — see `docs/content-guide.md`.
- Membership / price / purchase-link rules: `src/lib/catalog/resolve.ts`, `docs/catalog-verification.md`.
- Explorer illustration generator: `src/features/explorer/scene/`, `scripts/build-scenes.ts`.
- Lead API and storage: `src/app/api/leads/route.ts`, `src/lib/server/leads.ts`, `db/`.
- Staff workflow and privacy: `docs/privacy-operations.md`.
- Architecture and decisions: `docs/architecture.md`. Design system: `docs/design-system.md`.
- Evidence: `docs/sources.md`, `docs/assets/`. Tests and measurements: `docs/qa/`.
- Deployment: `docs/deployment.md`. CI: `../.github/workflows/dhahran-ci.yml`.

## Notes

- This folder lives inside `sagr4902-pixel/reshape`, which is a **public** repository. Owner-supplied drawings
  (`input-assets/`) and the internal pricing worksheet (`internal/`) are git-ignored for that reason.
- The root `index.html` (remote-coaching app) is a separate product and is untouched.
- Designed & Developed by HIJA — https://hija-tech-sa.com/
