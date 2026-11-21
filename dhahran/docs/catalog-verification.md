# Catalog verification

Store: https://reshape-sa.com/ (Salla). Checked 21 November 2026, 07:28–07:32 UTC, by rendered scrape of the public
pages (home, four category pages, nine product pages). No login, cart or checkout was attempted.
Full log: `docs/research/2026-11-21-research-report.md`.

## Result

**No product, category or page mentions Dhahran (الظهران).** Therefore:

- no store product is linked from any Dhahran purchase CTA;
- no store price is displayed on this site;
- the Dhahran plans are `planned` with "prices will be announced later" and an inquiry CTA;
- a separate, clearly labelled link to the existing store is offered on `/memberships`, `/contact` and the footer
  without any eligibility claim.

## Products observed

| Store title | Price (SAR) | Was | URL path | Branch wording on page | Mapping in `memberships.ts` |
|---|---:|---:|---|---|---|
| Three months - GYM | 2,700 | — | `/three-months-gym/p1522254403` | none | `store-gym-3m` · branch `unknown` |
| Six months - GYM | 4,960 | 5,040 | `/six-months-gym/p1882410865` | none | `store-gym-6m` · branch `unknown` |
| one year - GYM | 8,840 | 9,100 | `/one-year-gym/p1018656171` | none | `store-gym-12m` · branch `unknown` |
| KIDs- one month | 749 | — | `/kids-one-month/p1148810604` | "الموقع : الدمام ) حي اسكان الدمام" | `store-kids-1m` · branch `dammam` |
| KIDs- 3 months | 2,250 | — | `/kids-3-months/p1952352210` | same | `store-kids-3m` · branch `dammam` |
| KIDs- 6 months | 3,820 | — | `/kids-6-months/p1946581655` | same | `store-kids-6m` · branch `dammam` |
| KIDs- One year | 6,900 | — | `/kids-one-year/p1354110888` | same | `store-kids-12m` · branch `dammam` |
| PT 30+8 free | 9,900 | — | `/pt-30-8-free/p35437930` | none | not mapped |
| PT TEST | 300 | — | `/pt-test/p2083324497` | none | not mapped |
| SUBSCRIPTION PAUSE 1 WEEK | 68 | 100 | `/subscription-pause-1-week/p1409694364` | not scraped | not mapped |
| Travel program (EXTRA) | 90 | — | `/travel-program-extra/p1145519985` | not scraped | not mapped |

Also listed and not mapped: eight remote-coaching products and two T-shirts.

## Unknowns

| Item | Status |
|---|---|
| Whether GYM products are valid at Dhahran | **Unknown** — not assumed. |
| Availability | **Unknown** — pages carried both "add to cart" and "sold out" strings. Needs a visual check. |
| Tax treatment | **Unknown** — no tax wording on any page (`taxDisplay: "unknown"`). |
| Variants / session counts / age bands | None stated. |
| Sale prices (was/now) | Observed, not reproduced on this site. |

Every store price is recorded with `publishApproved: false`. Even if a branch were later set to Dhahran, the resolver
would show "see the current price in the official store" until a price is explicitly approved and re-verified.

## How a purchase CTA can appear (all must be true)

1. `branchScope` is `dhahran` or `all-confirmed` **and** `branchEvidence.status` is `verified` or `owner-confirmed`;
2. `availability` is `available`;
3. `productUrl` is HTTPS on exactly `reshape-sa.com` (URL-parsed; look-alike hosts fail);
4. `linkVerified` is true and `linkVerifiedAt` is within the review window (7 days — an operational default).

The exact amount is shown only if the price is `publishApproved`, verified, and within the same window.
All of this is one function: `src/lib/catalog/resolve.ts`, covered by `tests/unit/resolve.test.ts`.

## Re-verification

Open each product page in a browser, compare title/price/branch wording/availability, update the record and its
`verifiedAt` / `linkVerifiedAt` to the real check time, then run `npm run content:validate` (it warns when a verified
link is older than 7 days). Direct checkout URLs, cart sessions and variant IDs are never constructed.

## Future synchronisation

Salla offers OAuth merchant authorisation and product APIs. Nothing of that is implemented: there are no credentials
and no requirement yet. `src/content/memberships.ts` is the only catalog source and can be replaced behind
`publicMemberships()` later (tokens server-side, minimal scopes, last-known-good snapshot).
