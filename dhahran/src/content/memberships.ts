import type { Membership } from '@/lib/catalog/types';

/**
 * Membership catalog.
 *
 * Checked on the official store (https://reshape-sa.com/, Salla) on
 * 2026-11-21 ~07:30 UTC via rendered scrape — see docs/catalog-verification.md.
 * Result: NO product mentions Dhahran. KIDs products state Dammam; GYM
 * products state no location. Therefore no store product may carry a Dhahran
 * purchase CTA. Their observed prices are evidence only and are NOT
 * publish-approved for this site.
 *
 * To update a price or link: edit the record, set verifiedAt/linkVerifiedAt to
 * the real check time, then run `npm run content:validate`.
 */
const CHECKED = '2026-11-21T07:30:00Z';
const store = (path: string) => `https://reshape-sa.com/${path}`;
const observed = (sar: number, path: string) => ({
  amountMinor: sar * 100,
  currency: 'SAR' as const,
  taxDisplay: 'unknown' as const, // store pages show no tax wording
  status: 'verified' as const,
  sourceUrl: store(path),
  verifiedAt: CHECKED,
  publishApproved: false,
});

export const memberships: Membership[] = [
  // ── Planned Dhahran plans (no official product or price yet) ─────────────
  {
    id: 'dhahran-adult',
    title: { ar: 'عضوية البالغين — الظهران', en: 'Adult membership — Dhahran' },
    programIds: ['calisthenics', 'hybrid-endurance', 'functional-training'],
    branchScope: 'dhahran',
    branchEvidence: { status: 'owner-confirmed', verifiedAt: '2026-11-21T07:00:00Z', note: 'Planned for the Dhahran club per owner brief; no store product yet.' },
    availability: 'unknown',
    linkVerified: false,
  },
  {
    id: 'dhahran-kids',
    title: { ar: 'عضوية الأطفال — الظهران', en: 'Kids membership — Dhahran' },
    programIds: ['kids', 'kids-martial-arts'],
    branchScope: 'dhahran',
    branchEvidence: { status: 'owner-confirmed', verifiedAt: '2026-11-21T07:00:00Z', note: 'Planned for the Dhahran club per owner brief; no store product yet.' },
    availability: 'unknown',
    linkVerified: false,
  },

  // ── Existing store products (evidence only; not Dhahran-eligible) ────────
  ...(
    [
      ['store-gym-3m', 'Three months - GYM', 3, 2700, 'three-months-gym/p1522254403'],
      ['store-gym-6m', 'Six months - GYM', 6, 4960, 'six-months-gym/p1882410865'],
      ['store-gym-12m', 'one year - GYM', 12, 8840, 'one-year-gym/p1018656171'],
    ] as const
  ).map(
    ([id, storeTitle, months, sar, path]): Membership => ({
      id,
      title: { ar: `اشتراك النادي — ${months} أشهر (المتجر الحالي)`, en: `Gym — ${months} months (existing store)` },
      storeTitle,
      programIds: [],
      branchScope: 'unknown',
      branchEvidence: { status: 'unknown', sourceUrl: store(path), verifiedAt: CHECKED, note: 'Product page states no branch.' },
      availability: 'unknown', // page text contained both add-to-cart and sold-out labels
      duration: { value: months, unit: 'month' },
      price: observed(sar, path),
      productUrl: store(path),
      linkVerifiedAt: CHECKED,
      linkVerified: true,
    }),
  ),
  ...(
    [
      ['store-kids-1m', 'KIDs- one month', 1, 749, 'kids-one-month/p1148810604'],
      ['store-kids-3m', 'KIDs- 3 months', 3, 2250, 'kids-3-months/p1952352210'],
      ['store-kids-6m', 'KIDs- 6 months', 6, 3820, 'kids-6-months/p1946581655'],
      ['store-kids-12m', 'KIDs- One year', 12, 6900, 'kids-one-year/p1354110888'],
    ] as const
  ).map(
    ([id, storeTitle, months, sar, path]): Membership => ({
      id,
      title: { ar: `اشتراك الأطفال — ${months} أشهر (فرع الدمام)`, en: `Kids — ${months} months (Dammam branch)` },
      storeTitle,
      programIds: [],
      branchScope: 'dammam',
      branchEvidence: { status: 'verified', sourceUrl: store(path), verifiedAt: CHECKED, note: 'Page states: "الموقع : الدمام ) حي اسكان الدمام".' },
      availability: 'unknown',
      duration: { value: months, unit: 'month' },
      price: observed(sar, path),
      productUrl: store(path),
      linkVerifiedAt: CHECKED,
      linkVerified: true,
    }),
  ),
];
