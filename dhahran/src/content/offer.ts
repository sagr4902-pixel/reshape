/**
 * The launch offer shown at the end of the homepage.
 *
 * Nothing here is invented: until the owner supplies the real offer, `status`
 * stays 'draft'. A draft is shown only on previews, clearly marked as a sample,
 * and is never rendered in production. To publish, fill every field and set
 * status to 'live' — `npm run content:validate` refuses a live offer without a
 * price, an end date and a payment link on the official store.
 */
export interface Offer {
  status: 'draft' | 'live';
  title: { ar: string; en: string };
  summary: { ar: string; en: string };
  includes: { ar: string[]; en: string[] };
  priceSar: number | null;
  /** Regular price, shown struck through. Only if it is a real, charged price. */
  originalPriceSar: number | null;
  /** ISO date-time with offset, e.g. 2026-12-31T23:59:00+03:00. */
  endsAt: string | null;
  /** Product page on the official store (https://reshape-sa.com/...). */
  payUrl: string | null;
}

export const offer: Offer = {
  status: 'draft',
  title: { ar: 'عرض لفترة محدودة', en: 'A limited-time offer' },
  summary: { ar: 'اشترك الآن واحجز مكانك قبل انتهاء العرض.', en: 'Subscribe now and secure your place before the offer ends.' },
  includes: {
    ar: ['الرياضة التي تختارها', 'برنامجك الخاص', 'مجتمع ومدربون يرافقونك'],
    en: ['The sport you choose', 'Your own program', 'A community and coaches with you'],
  },
  priceSar: null,
  originalPriceSar: null,
  endsAt: null,
  payUrl: null,
};

export type OfferState =
  | { kind: 'live'; endsAt: string; priceSar: number; originalPriceSar: number | null; payUrl: string }
  | { kind: 'sample'; endsAt: string }
  | { kind: 'none' };

/** Single decision point for what the offer section may show. */
export function offerState(o: Offer, appEnv: string, now = new Date()): OfferState {
  if (o.status === 'live' && o.priceSar && o.endsAt && o.payUrl && Date.parse(o.endsAt) > now.getTime())
    return { kind: 'live', endsAt: o.endsAt, priceSar: o.priceSar, originalPriceSar: o.originalPriceSar, payUrl: o.payUrl };
  // Previews show the layout with a sample countdown so the owner can judge it; production shows nothing unreal.
  if (o.status === 'draft' && appEnv !== 'production') return { kind: 'sample', endsAt: new Date(now.getTime() + 10 * 86_400_000).toISOString() };
  return { kind: 'none' };
}
