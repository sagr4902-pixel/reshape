# Content guide

All public content is typed configuration in Git. Every change is a commit that passes
`npm run content:validate` (also run in CI and as a unit test). No fact is stored in two places.

| What | File | Then run |
|---|---|---|
| Program copy, audience, themes, FAQs, availability | `src/content/programs.ts` | `npm run content:validate` |
| Calisthenics pathways | `src/content/pathways.ts` | `npm run content:validate` |
| Memberships, prices, store links, branch scope | `src/content/memberships.ts` | `npm run content:validate && npm test` |
| Zones: titles, descriptions, images, "basis" notes | `src/content/scene.ts` | `npm run content:validate` |
| Design renders (files) | `input-assets/renders/` → `scripts/dev/encode-renders.py` → `public/assets/design/` | `python3 scripts/dev/encode-renders.py` |
| Design renders (alt text) | `src/content/design.ts` | `npm run content:validate` |
| Homepage facade hotspots | `src/app/[locale]/page.tsx` (`hotspots`) | `npm run test:e2e` |
| Map geometry and equipment | `src/features/explorer/scene/model.ts` | `npm run scenes:build` |
| Map colours | `src/features/explorer/scene/themes.ts` | `npm run scenes:build` |
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

**Add or change a design image.** Put the full-resolution PNG in `input-assets/renders/` (or
`input-assets/exterior/`), add it to the list in `scripts/dev/encode-renders.py`, run the script (needs Pillow with
AVIF), add bilingual alt text in `src/content/design.ts`, then reference its id from a zone (`imageIds`) or a program
(`imageId`). The first id in a zone's `imageIds` is its primary image everywhere. To re-encode only some images,
pass their ids: `python3 scripts/dev/encode-renders.py facade d25`.

**Place a render in a new layout.** `DesignPicture` needs a `sizes` value that states how wide the picture is
*drawn*. In a box taller than 16:9 with `object-cover` that is the box height × 16 / 9, not the box width —
otherwise the browser fetches a file that is too small and the render looks blurred. `npm run test:e2e` checks
this on the main pages.

**Replace the facade render.** Save the new render as `input-assets/exterior/facade-render.png` and re-run the
encode script. If the camera angle changes, re-measure the hotspot fractions (`u`, `v`) in the homepage file and the
door position (`--door-x`, `--door-y`) and plate aspect ratio in `globals.css → .facade`.

**Add or move a zone.** Geometry: add bounds and an anchor in `model.ts` (`ZONE_BOUNDS`, `ZONE_ANCHORS`), draw it in
`buildGround` / `buildUpper` and add its group to `GROUPS`. Content: add the zone to `scene.ts` with at least one
image. Run `npm run scenes:build`, check `public/assets/scenes/level-*.svg`, commit both.

**Switch to real photographs.** Encode the photo the same way, record it in `docs/assets/asset-manifest.json` as
`actual facility photograph` with its rights status, point the zone or program at it, and remove the concept label
next to that image only (the label is rendered per image). Do not rely on a global disclaimer.

**Publish a new privacy notice.** Edit `privacy.*` in both message files, set `PRIVACY_NOTICE_VERSION` to a dated
label (anything starting with `draft` blocks production collection), set `PRIVACY_CONTACT`, rebuild. Each lead stores
the version it was submitted under.

**Announce the opening.** Set `LAUNCH_STAGE=open`, add address/hours to `site.ts` and the contact page, review every
"will be announced" string in `messages/*.json`, rebuild.

**Roll back a bad content change.** `git revert <commit>` and redeploy. Content changes never touch the database.
