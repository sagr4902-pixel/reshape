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
  /** draft: nothing real yet · announced: real name and end date, price and link still to come · live: can be bought. */
  status: 'draft' | 'announced' | 'live';
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
  // Owner, 23 Nov 2026: name, idea and dates (starts 23 Nov 2026, ends one month later). Price and store link not supplied yet.
  status: 'announced',
  title: { ar: 'عرض شركاء النجاح', en: 'The Success Partners offer' },
  summary: {
    ar: 'المشتركون الأوائل ليسوا مجرد أعضاء — هم من يبنون معنا هذا النادي من يومه الأول. ولأنكم شركاء النجاح، أنتم أول من يستحق الدعم.',
    en: 'Our first members are more than members — they are the people building this club with us from day one. You are our partners in success, so you are the first to deserve our support.',
  },
  includes: {
    ar: ['للمشتركين الجدد', 'تقديرًا لمن آمن بنا من البداية', 'لمدة شهر واحد فقط'],
    en: ['For new members', 'In recognition of those who believed in us from the start', 'For one month only'],
  },
  priceSar: null,
  originalPriceSar: null,
  endsAt: '2026-12-23T23:59:00+03:00',
  payUrl: null,
};

export type OfferState =
  | { kind: 'live'; endsAt: string; priceSar: number; originalPriceSar: number | null; payUrl: string }
  | { kind: 'announced'; endsAt: string }
  | { kind: 'sample'; endsAt: string }
  | { kind: 'none' };

/** Single decision point for what the offer section may show. */
export function offerState(o: Offer, appEnv: string, now = new Date()): OfferState {
  if (o.status === 'live' && o.priceSar && o.endsAt && o.payUrl && Date.parse(o.endsAt) > now.getTime())
    return { kind: 'live', endsAt: o.endsAt, priceSar: o.priceSar, originalPriceSar: o.originalPriceSar, payUrl: o.payUrl };
  if (o.status === 'announced' && o.endsAt && Date.parse(o.endsAt) > now.getTime()) return { kind: 'announced', endsAt: o.endsAt };
  // Previews show the layout with a sample countdown so the owner can judge it; production shows nothing unreal.
  if (o.status === 'draft' && appEnv !== 'production') return { kind: 'sample', endsAt: new Date(now.getTime() + 10 * 86_400_000).toISOString() };
  return { kind: 'none' };
}
