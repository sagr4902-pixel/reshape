# Implementation status

Last updated: 21 November 2026. Read this file and the current code before resuming work.

## Readiness — four separate states

| Milestone | State | Evidence / what is missing |
|---|---|---|
| **Implementation complete** | **Yes** | All routes, explorer, lead storage, staff CLI, tests and docs exist and pass locally (`docs/qa/test-results.md`). |
| **Preview verified** | **Local only** | Production build run on `localhost` with a local PostgreSQL 16; inspected and tested there. No hosted preview exists; persistence there is a throw-away local database; not reachable from outside the build container. |
| **Production ready** | **No** | Needs owner decisions (below), hosting + database, approved privacy notice and contact, confirmed accent colour/logo master, zone-concept approval. |
| **Live verified** | **No** | Nothing is deployed. No public URL exists. |

`APP_ENV` (development / preview / production) and `LAUNCH_STAGE` (preopening / open) are independent flags.
Current content assumes `LAUNCH_STAGE=preopening`.

## Phases

| Phase | State | Notes |
|---|---|---|
| 1 Discovery | Done | Tool inventory, 19 drawings classified, store researched, `sources.md`, assumptions listed. |
| 2 Creative / product | Done | Concept, page map, five journeys, reference matrix (`design-system.md`, `sources.md`). |
| 3 Architecture | Done | ADRs, pinned stack, env validation, schemas, migration (`architecture.md`). |
| 4 Design system | Done | Tokens, bilingual type, header/footer, forms, two proof scenes inspected at 1440 and 390 px. |
| 5 Core website | Done | Home, programs (+4 detail pages), kids, football, memberships, register, contact, privacy, 404/error states. |
| 6 Explorer | Done as **concept** | Six zones on two levels from the real shell geometry; zone programming awaits owner validation. |
| 7 Functional systems | Done | Lead API, PostgreSQL, consent evidence, idempotency, shared rate limit, store-link rules, staff CLI. |
| 8 QA | Done locally | Unit, integration (real PostgreSQL), E2E (Chromium desktop + phone emulation), axe, Lighthouse. |
| 9 Visual refinement | Done | Two review passes, 13 logged corrections (`qa/visual-review.md`). |
| 10 Delivery | Done with deviations | Pushed to branch `claude/reshape-dhahran-site-pnpzac` of `sagr4902-pixel/reshape` (public). No new private repository could be created from this session. No deployment. |

## Tools and access in this session

| Capability | State |
|---|---|
| Node 22, npm, PostgreSQL 16 binaries, Chromium + Playwright | Available and used |
| Docker daemon | Not running — local PostgreSQL started from system binaries (`scripts/dev-db.sh`) |
| Direct network to reshape-sa.com, hija-tech-sa.com, on.com… | Blocked by the environment's network policy — researched through the Firecrawl connector instead |
| Firefox / WebKit, physical devices | Not available — not tested |
| GitHub | Scoped to existing repositories; creating a repository is not permitted in this session |
| Image-generation / design connectors | Present but **not used** (they consume paid credits; no authorisation) — all illustrations are generated SVG |
| Hosting / DNS / production database | None available — nothing deployed |
| Sub-agents | One research agent (store catalog, brand-use terms, references); everything else by the primary agent |

## Deviations from the brief (and why)

1. **Repository:** not a new private `reshape-dhahran` repo — the app is in `dhahran/` of the existing public repo.
   Originals and internal pricing are therefore git-ignored.
2. **`/about`:** folded into the homepage (no verified brand story).
3. **Route-level loading state:** removed (it broke no-JS rendering and 404 status codes).
4. **Explorer scene splitting:** not split per zone — both drawings together are ≈ 10 KiB gzip.
5. **Motion library:** none; CSS transitions only.
6. **No-JS registration:** the form needs JavaScript; without it the official WhatsApp channel is shown.
7. **Contact preference field:** omitted — no channel has been confirmed as operational for Dhahran, so the success
   message says "we will contact you on the mobile number you provided".
8. **Notifications to staff:** none — leads must be checked with the CLI.
9. **Saudi PDPL sources:** not reviewed (blocked from the container); the notice is an operational draft.

## Open items, ranked by launch impact

| # | Item | Owner | Blocks |
|---|---|---|---|
| 1 | Hosting, production PostgreSQL, domain | Owner / HIJA | Any real use |
| 2 | Controller identity, privacy contact, lawful basis wording, retention period, hosting region | Owner | Lead collection in production (hard gate in code) |
| 3 | Who checks leads and how often (there are no notifications) | Owner | Useful conversion |
| 4 | Move the code to a private repository | Owner / HIJA | Committing originals and internal docs |
| 5 | Is any store product valid at Dhahran? Dhahran prices and product links | Owner | Purchase CTAs (currently all inquiries) |
| 6 | Approve or correct the zone concept (which sport goes where) | Owner | Explorer status `concept` → validated |
| 7 | Opening date, address, hours, Dhahran phone | Owner | Contact page, `LAUNCH_STAGE=open`, local-business markup |
| 8 | Official accent colour and a vector logo | Owner | Final brand polish |
| 9 | Confirm pathways, kids age bands/policies, martial-arts discipline, football format | Owner | Replacing "to be announced" answers |
| 10 | Rights to use CrossFit / HYROX names, if wanted | Owner | Public labels (currently generic) |
| 11 | Test on real iOS/Android devices, Safari and Firefox | HIJA | Cross-browser confidence |
| 12 | Analytics provider + consent approach, if wanted | Owner | Measurement (wrapper exists, disabled) |

## Next independent actions (no owner input needed)

- Run the E2E suite in Firefox/WebKit where those browsers are installed.
- Add a staff notification (email/WhatsApp) through an outbox table once a provider is chosen.
- Add a `leads correct` CLI command for correction requests.
