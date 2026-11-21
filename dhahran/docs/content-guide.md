# Content guide

All public content is typed configuration in Git. Every change is a commit that passes
`npm run content:validate` (also run in CI and as a unit test). No fact is stored in two places.

| What | File | Then run |
|---|---|---|
| Program copy, audience, themes, FAQs, availability | `src/content/programs.ts` | `npm run content:validate` |
| Calisthenics pathways | `src/content/pathways.ts` | `npm run content:validate` |
| Memberships, prices, store links, branch scope | `src/content/memberships.ts` | `npm run content:validate && npm test` |
| Zones: titles, descriptions, "basis" notes | `src/content/scene.ts` | `npm run content:validate` |
| Zone geometry, equipment, figures | `src/features/explorer/scene/model.ts` | `npm run scenes:build` |
| Illustration colours | `src/features/explorer/scene/themes.ts` | `npm run scenes:build` |
| Contact channels, CR number, footer credit | `src/content/site.ts` | `npm run content:validate` |
| Interface text (buttons, headings, errors, privacy notice) | `messages/ar.json`, `messages/en.json` | `npm run content:validate` (checks parity) |
| Launch stage (pre-opening / open) | env `LAUNCH_STAGE` | rebuild |
| Privacy notice version / contact | env `PRIVACY_NOTICE_VERSION`, `PRIVACY_CONTACT` | rebuild |
| Schedules, opening hours, address | not modelled yet — nothing is confirmed | add to `site.ts` when confirmed |

## Rules that the validator enforces

- Arabic and English are both required; message keys and `{placeholders}` must match.
- IDs referenced between programs, zones, pathways and memberships must exist; images must exist.
- A store link must be `https://reshape-sa.com/...`; a purchase CTA cannot exist without Dhahran eligibility.
- Protected names (CrossFit, HYROX) may appear only in `internalTags`, never in public copy.
- Unverified contact channels cannot be published.
- Warning when a verified store link is older than 7 days.

## Recipes

**Add a program.** Add a record to `programs.ts` (copy an existing one). Set `availability: 'planned'` unless the
owner has confirmed it is running. Use `route: '/programs/<slug>'` — the page, sitemap entry, form option and
explorer links appear automatically. Link zones through `zoneIds` only if a zone really hosts it.

**Confirm a program is running.** Change `availability` to `'confirmed'` and update `evidence` with who confirmed
and when. Review its FAQs — replace "will be announced" answers with the real policy.

**Update a verified price.** In `memberships.ts`: set `price.amountMinor` in **halalas** (SAR 499 → `49900`),
`taxDisplay`, `status: 'verified'`, `verifiedAt` (actual check time, ISO), `sourceUrl`, and `publishApproved: true`
only after the owner approves showing it. Exact amounts older than 7 days fall back to "see the current price in
the official store" automatically.

**Change a product link.** Set `productUrl` to the full product page URL, `linkVerified: true`, `linkVerifiedAt`
to now. Open the link yourself first. Never build cart or checkout URLs.

**Make a plan purchasable for Dhahran.** Needs all of: `branchScope: 'dhahran'` (or `'all-confirmed'`),
`branchEvidence.status: 'verified' | 'owner-confirmed'` with a source, `availability: 'available'`, a verified link.
The button then reads "اشترك عبر متجر ريشيب / Continue to RESHAPE store" everywhere at once.

**Add or move a zone.** Geometry: add bounds and an anchor in `model.ts` (`ZONE_BOUNDS`, `ZONE_ANCHORS`) and draw it
in `buildGround`/`buildUpper`; add the group to `GROUPS`. Content: add the zone to `scene.ts`. Run
`npm run scenes:build`, look at `public/assets/scenes/zone-<id>-dark.svg`, commit both.

**Replace a concept drawing with a real photo.** Put the optimised photo in `public/assets/photos/`, record it in
`docs/assets/asset-manifest.json` as `actual facility photograph` with rights status, point the program's `image` at
it, and remove the concept note next to that image only. Do not rely on a global disclaimer.

**Approve the zone concept.** When the owner confirms the fit-out, set the scene `status` to
`'reference-validated'` and, if the layout is final, `spatialMode: 'verified-layout'`; then reword
`common.conceptNote`.

**Publish a new privacy notice.** Edit `privacy.*` in both message files, set `PRIVACY_NOTICE_VERSION` to a dated
label (anything starting with `draft` blocks production collection), set `PRIVACY_CONTACT`, rebuild. Each lead stores
the version it was submitted under.

**Announce the opening.** Set `LAUNCH_STAGE=open`, add address/hours to `site.ts` and the contact page, review every
"will be announced" string in `messages/*.json`, rebuild.

**Roll back a bad content change.** `git revert <commit>` and redeploy. Content changes never touch the database.
