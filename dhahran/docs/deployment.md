# Deployment

No deployment was performed in this build: no hosting account, domain or production database was available or
authorised. This document covers what any Node-capable host needs. The app cannot be exported as static files — the
lead API and the on-demand pages need a server.

## Requirements

- Node.js 22, ability to run `next build` / `next start` (or a platform that does so).
- PostgreSQL 14+ reachable from the app, TLS enabled (`DATABASE_SSL=require`).
- An HTTPS domain. Set `SITE_URL` to it **at build time** — canonicals, hreflang, sitemap and the same-origin check
  use it.

Suitable shapes: a container/VM host with managed PostgreSQL in the same region, or a serverless Next.js platform
plus a pooled PostgreSQL endpoint (use the provider's pooler URL; the app keeps at most 5 connections per instance).
Choose the region with the owner (see `privacy-operations.md` decision 4). Nothing was purchased or selected.

## Environment (see `.env.example`)

| Variable | Preview | Production |
|---|---|---|
| `APP_ENV` | `preview` (always `noindex`, robots closed) | `production` |
| `LAUNCH_STAGE` | `preopening` | `preopening` until the club opens, then `open` |
| `SITE_URL` | preview URL | the assigned public domain |
| `DATABASE_URL` | separate preview database or empty (form shows "unavailable") | web-role URL |
| `DATABASE_SSL` | `require` on managed databases | `require` |
| `LEAD_HASH_SECRET` | random 32+ chars | random 32+ chars, stored in the secret manager |
| `PRIVACY_NOTICE_VERSION` | `draft-…` | dated label, not starting with `draft` |
| `PRIVACY_CONTACT` | — | verified contact |
| `TRUST_PROXY` | `true` only behind a proxy that sets `X-Forwarded-For` | same |

`APP_ENV` and `LAUNCH_STAGE` are independent. Prerendered pages read these at **build** time: build per environment.

## First deployment

```bash
npm ci
npm run content:validate && npm run lint && npm run typecheck && npm test
# database, as the owner role:
DATABASE_URL=<owner-url> npm run db:migrate
psql <owner-url> -f db/roles.sql && psql <owner-url> -c '\password reshape_web'
# app, with the reshape_web URL in DATABASE_URL:
npm run build && npm run start
```

Migrations run deliberately as a deploy step — never per request. Keep the owner/staff URL out of the app's
environment.

## Smoke test after deploy (preview or production)

1. `/` redirects to `/ar`; `/en` loads; both show the hero and footer credit.
2. `/ar/explore?zone=kids-pavilion` opens focused; drawings load.
3. Response headers include the CSP; `/robots.txt` is closed on preview, open on production.
4. Submit one synthetic inquiry (name "Test", a `0500…` number) → success message →
   `npm run leads -- list --limit 1` shows it → delete it with `leads -- delete --phone … --execute --confirm-delete`.
5. `/ar/memberships` shows no price and no purchase button (until a Dhahran product is verified).

A deployment whose form cannot store a lead is not a verified launch.

## Operations

- **Logs:** the app logs only `[leads] persistence failure: <ErrorName>`. Alert on it.
- **Backups:** enable daily managed backups; restore ownership sits with whoever owns the database account. Align
  backup retention with the lead-retention period.
- **Secret rotation:** rotating `LEAD_HASH_SECRET` resets duplicate grouping and rate-limit buckets; nothing else
  breaks. Rotate database passwords through the provider and redeploy.
- **Rollback:** redeploy the previous build. Migrations so far are additive (one initial migration); for any future
  destructive change, back up first and ship it in a separate release after the code no longer needs the old shape.
- **Retention job:** schedule `npm run privacy:retention:execute -- --days <approved>` with the staff URL.
- **Catalog freshness:** `npm run content:validate` warns when store verification is older than 7 days.

## Readiness gates

| Gate | State |
|---|---|
| Implementation complete | Yes — see `docs/implementation-status.md` |
| Preview verified | Local production build only (no hosted preview) |
| Production ready | No — owner decisions and hosting outstanding |
| Live verified | No — nothing is deployed |
