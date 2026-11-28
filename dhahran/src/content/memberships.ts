import type { Membership } from '@/lib/catalog/types';

/**
 * Dhahran membership packages, sold on the official store (Salla).
 *
 * Owner, 28 Nov 2026: the packages on the store's group-classes page
 * (https://reshape-sa.com/…/c571221986) are the Dhahran club's packages and
 * prices. Titles, prices, previous prices and links were read from that page
 * the same day. Note: the kids product pages also carry a "Dammam" location
 * line; the owner's confirmation is what makes them Dhahran packages here.
 *
 * Prices are owner-confirmed and shown for `reviewDays`; after that the card
 * says "see the current price in the store" until someone re-checks the store
 * and updates CHECKED. To change a price: edit it here, update CHECKED, and run
 * `npm run content:validate`.
 */
const CHECKED = '2026-11-28T08:00:00Z';
const REVIEW_DAYS = 45;
const store = (path: string) => `https://reshape-sa.com/${path}`;

type Row = readonly [id: string, storeTitle: string, ar: string, en: string, months: number | null, sar: number, wasSar: number | null, path: string];

const make =
  (group: 'adult' | 'kids' | 'extra', programIds: string[]) =>
  ([id, storeTitle, ar, en, months, sar, wasSar, path]: Row): Membership => ({
    id,
    title: { ar, en },
    storeTitle,
    group,
    programIds,
    branchScope: 'dhahran',
    branchEvidence: { status: 'owner-confirmed', sourceUrl: store(path), verifiedAt: CHECKED, note: 'Owner confirmed on 28 Nov 2026 that these store packages and prices are for Dhahran.' },
    availability: 'available',
    ...(months ? { duration: { value: months, unit: 'month' as const } } : {}),
    price: {
      amountMinor: sar * 100,
      ...(wasSar ? { previousAmountMinor: wasSar * 100 } : {}),
      currency: 'SAR',
      taxDisplay: 'unknown', // the store shows no tax wording
      status: 'owner-confirmed',
      sourceUrl: store(path),
      verifiedAt: CHECKED,
      publishApproved: true,
    },
    productUrl: store(path),
    linkVerifiedAt: CHECKED,
    linkVerified: true,
    reviewDays: REVIEW_DAYS,
  });

const ADULT_PROGRAMS = ['calisthenics', 'hybrid-endurance', 'functional-training'];
const KIDS_PROGRAMS = ['kids', 'kids-martial-arts'];

export const memberships: Membership[] = [
  ...(
    [
      ['gym-3m', 'Three months - GYM', 'اشتراك النادي — ٣ أشهر', 'Gym — 3 months', 3, 2700, null, 'three-months-gym/p1522254403'],
      ['gym-6m', 'Six months - GYM', 'اشتراك النادي — ٦ أشهر', 'Gym — 6 months', 6, 4960, 5040, 'six-months-gym/p1882410865'],
      ['gym-12m', 'one year - GYM', 'اشتراك النادي — سنة', 'Gym — 1 year', 12, 8840, 9100, 'one-year-gym/p1018656171'],
    ] as const satisfies readonly Row[]
  ).map(make('adult', ADULT_PROGRAMS)),
  ...(
    [
      ['kids-1m', 'KIDs- one month', 'الأطفال — شهر', 'Kids — 1 month', 1, 749, null, 'kids-one-month/p1148810604'],
      ['kids-3m', 'KIDs- 3 months', 'الأطفال — ٣ أشهر', 'Kids — 3 months', 3, 2250, null, 'kids-3-months/p1952352210'],
      ['kids-6m', 'KIDs- 6 months', 'الأطفال — ٦ أشهر', 'Kids — 6 months', 6, 3820, null, 'kids-6-months/p1946581655'],
      ['kids-12m', 'KIDs- One year', 'الأطفال — سنة', 'Kids — 1 year', 12, 6900, null, 'kids-one-year/p1354110888'],
    ] as const satisfies readonly Row[]
  ).map(make('kids', KIDS_PROGRAMS)),
  ...(
    [
      ['pause-1w', 'SUBSCRIPTION PAUSE 1 WEEK', 'إيقاف الاشتراك — أسبوع', 'Subscription pause — 1 week', null, 68, 100, 'subscription-pause-1-week/p1409694364'],
      ['travel-extra', 'Travel program (EXTRA)', 'برنامج السفر (إضافي)', 'Travel program (extra)', null, 90, null, 'travel-program-extra/p1145519985'],
      ['pt-test', 'PT TEST', 'اختبار اللياقة (PT Test)', 'PT test', null, 300, null, 'pt-test/p2083324497'],
    ] as const satisfies readonly Row[]
  ).map(make('extra', [])),
];
