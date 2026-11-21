# Source register

Checked 21 November 2026. Classes: **O** owner-provided · **V** verified external fact · **R** our recommendation · **U** unresolved assumption.
The full research log (all pages, quotes, failures) is in `docs/research/2026-11-21-research-report.md`.

| # | Source | Checked (UTC) | Access method | Observed fact | Limitation | Supports |
|---|---|---|---|---|---|---|
| 1 | Owner brief (project prompt) | 2026-11-21 | Provided in session | **O** New club in Dhahran; calisthenics is the flagship; kids are a priority; planned: hybrid endurance, functional fitness, kids martial arts, football performance; store is reshape-sa.com; HIJA footer credit. | No opening date, address, prices, schedules, coaches or age bands. | Program list (all `planned`), IA, launch stage `preopening`. |
| 2 | `reshape_sub._1.pdf` (19 pages: 2 plans, 1 section, 16 SketchUp views) | 2026-11-21 | Read page by page; images extracted with `pdfimages` | **O** Shell 20.6 × 17.833 m with a 6.371 m diagonal wall; storeys 4.0 m + 0.3 m slab + 3.0 m; mezzanine void 11.02 × 8.433 m; stairs on the west wall; orange steel I-columns; red two-lane track and glazing around the void. | Plans carry no room names or equipment; renders are massing-level. Zone use is **not** stated anywhere. | First version of the map only — **superseded by row 2b**. |
| 2b | Facade package Rev. 02 (5 sheets, 05/11/2026), working drawings "Re-shape #3" (32 sheets, 20/08/2026), design deck (67 pages, 21 Aug 2026) — received later on 21 Nov 2026 | 2026-11-21 | Read page by page; renders extracted with `pdfimages`; dimensions read visually (no text layer) | **O** Interior 19.67 × 17.83 m; mezzanine over the west 8.63 m; double-height hall to the east; entrance wall 4.518 m with a 1.979 × 2.102 m double door; glazed bays 1.884 / 3.107 m; chevron strip 5.207 × 0.598 m; furniture and equipment layout; materials and signage. **Supersedes row 2.** | Facade package is "for review — not for construction"; some sizes TBC. Working-drawing cover says "AL Dammam", facade title block says "Dhahran". No kids area and no upstairs track in these designs. | Homepage hero, explorer zones and map, all zone imagery, `visual-analysis.md`. |
| 3 | Owner's existing app, `/index.html` in this repository | 2026-11-21 | Read from the working tree | **O** Logo files (red mark + wordmark); colour tokens (`#17181A`, `#F7F0E9`, accent `#FF5420` / `#E8401D`); fonts IBM Plex Sans Arabic, Zain, Barlow Semi Condensed. | Tokens belong to the remote-coaching app, not a published brand guide; logo is 420 px wide. | Design tokens, fonts, logo. |
| 4 | https://reshape-sa.com/ (home, 4 category pages, 9 product pages) | 2026-11-21 07:28–07:32 | Firecrawl rendered scrape (the site needs JavaScript; direct fetch from the build container is blocked) | **V** Salla store "RESHAPE". Products: GYM 3/6/12 months (SAR 2,700 / 4,960 / 8,840), KIDs 1/3/6/12 months (SAR 749 / 2,250 / 3,820 / 6,900), PT packages, remote coaching, T-shirts. KIDs pages state "الموقع : الدمام ) حي اسكان الدمام". **No page mentions Dhahran.** WhatsApp +966575954545, Instagram @reshape.sa, CR 2050201542. | Extracted text, not a visual check. Availability is ambiguous (pages contain both add-to-cart and sold-out labels). No tax wording. | `memberships.ts`, `site.ts`, catalog-verification, CTA decisions. |
| 5 | https://hija-tech-sa.com/ | 2026-11-21 07:28 | Firecrawl scrape | **V** Loads (redirects to /ar); "حِجَا \| HIJA", Saudi web studio. | — | Footer credit destination. |
| 6 | https://www.crossfit.com/faq/affiliates | 2026-11-21 07:28 (cached copy 2026-11-19) | Firecrawl scrape | **V** "Only affiliation gives you the legal right to use the CrossFit name for business and/or promotional purposes." | — | Public label "Functional Training / التدريب الوظيفي"; `crossfit` kept only as an internal tag. |
| 7 | https://www.hyrox365.com/meta-pages/terms-and-conditions | 2026-11-21 07:32 | Firecrawl search + scrape | **V** HYROX Training Club title and marks are licensed to affiliated partners; a partner may not use "HYROX" on its own. | Several regional versions; which governs Saudi Arabia is unknown. | Public label "Hybrid Endurance / القوة والتحمّل"; no logos or partner wording. |
| 8 | `node_modules/next/dist/docs` (Next.js 16.4.6) | 2026-11-21 | Read locally | **V** `middleware` convention is renamed `proxy`; async `params`/`searchParams`. | — | `src/proxy.ts`, page signatures. |
| 9 | next-intl 4.15 package types | 2026-11-21 | Read locally | **V** `defineRouting`, `createNavigation`, middleware default export. | — | `src/i18n/*`. |
| 10 | Saudi PDPL implementing regulation (SDAIA) | not re-read | Blocked from the build container | **U** Not reviewed in this session. | No legal review was performed. | Nothing — the privacy notice is an operational draft only. |
| 11 | on.com, technogym.com, big.dk, exploratorium.edu, diriyah.sa/ar | 2026-11-21 07:32 | Firecrawl scrape (markdown only) | **V** Navigation and grouping patterns only. | Extracted text; visual design was **not** observed. | Reference matrix below. |

## Unresolved assumptions (need the owner)

1. Dhahran opening date, address, hours, phone — unknown; site says "to be announced".
2. Whether any existing store product is valid at Dhahran — unknown; treated as **not** eligible.
3. Zones now follow the owner's drawings. Which *program* uses which zone is still our mapping.
3a. No dedicated kids area exists in the designs — where kids sessions run is unknown.
3b. Working drawings say "AL Dammam", facade drawings say "Dhahran" — same geometry; confirm it is one building.
3c. Designer's consent to publish the renders has not been seen (published on the owner's instruction).
4. Calisthenics pathways — proposed (`provisional`).
5. Kids age bands, ratios, coach details, viewing policy — unknown; FAQs say so.
6. Martial-arts discipline — unknown.
7. Football service format and any clinical provider — unknown; copy stays within physical training.
8. Data controller identity, privacy contact, hosting region, retention period — unknown; production collection is blocked until set.
9. Whether +966575954545 handles Dhahran inquiries — unknown; shown as a general RESHAPE channel.

## Creative reference matrix

Observed from extracted page content only (not from the visual design).

| Reference | Observed principle | Customer value | Adaptation to RESHAPE | Cost | Avoid |
|---|---|---|---|---|---|
| On (on.com) | Navigation by activity first, product second. | Visitor self-selects by intent. | Audience routing on the homepage: adult / parent / athlete. | Low | Their product-grid e-commerce layout and imagery. |
| Technogym | Separate journeys for home, business and sport. | Each audience gets its own language. | Kids page written for guardians; football page for athletes. | Low | Corporate catalogue density. |
| BIG (big.dk) | Projects presented as drawings and diagrams, not only photos. | Understanding a space before it exists. | An axonometric map generated from the working drawings sits beside the design renders. | Medium (custom generator) | Their icon grid and typography. |
| Exploratorium | "Explore" and "Visit" are separate, equal entries. | Curiosity and action are both served. | Explore / Act pairing on every primary CTA row. | Low | Museum ticketing patterns. |
| Diriyah (ar) | Arabic-first copy with concise headings. | Natural reading for the primary audience. | Arabic written first, English adapted — not translated word for word. | Medium | Luxury-destination tone; their motifs. |
