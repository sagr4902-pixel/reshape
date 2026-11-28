import { isOfficialStoreUrl } from './store-links';
import type { Membership, Price } from './types';

/**
 * Single decision point for every membership CTA (cards, program pages,
 * explorer panels). Price evidence and branch evidence are independent:
 * a plan can have a published price and still be ineligible for a Dhahran
 * purchase CTA.
 */
export type MembershipAction =
  | { kind: 'purchase'; url: string; price: PublicPrice | { kind: 'see-store' } }
  | { kind: 'register-interest'; reason: 'branch-unverified' | 'not-dhahran' | 'price-pending' | 'link-unverified' }
  | { kind: 'unavailable'; reason: 'unavailable' | 'broken-link' };

export interface PublicPrice {
  kind: 'exact';
  amountMinor: number;
  previousAmountMinor?: number;
  currency: 'SAR';
  taxDisplay: Price['taxDisplay'];
}

export interface ResolveOptions {
  now?: Date;
  /** Maximum age of price/link verification before the amount is withheld. */
  freshnessDays?: number;
}

const DAY = 86_400_000;
const fresh = (iso: string | undefined, now: Date, days: number) =>
  !!iso && now.getTime() - new Date(iso).getTime() <= days * DAY && new Date(iso).getTime() <= now.getTime() + DAY;

const branchOk = (m: Membership) =>
  (m.branchScope === 'dhahran' || m.branchScope === 'all-confirmed') &&
  (m.branchEvidence.status === 'verified' || m.branchEvidence.status === 'owner-confirmed');

export function resolveMembershipAction(m: Membership, opts: ResolveOptions = {}): MembershipAction {
  const now = opts.now ?? new Date();
  const days = opts.freshnessDays ?? m.reviewDays ?? 7;

  if (m.branchScope === 'dammam') return { kind: 'register-interest', reason: 'not-dhahran' };
  if (!branchOk(m)) return { kind: 'register-interest', reason: 'branch-unverified' };
  if (m.availability === 'unavailable') return { kind: 'unavailable', reason: 'unavailable' };
  if (!m.productUrl) return { kind: 'register-interest', reason: 'price-pending' };
  if (!isOfficialStoreUrl(m.productUrl)) return { kind: 'unavailable', reason: 'broken-link' };
  if (!m.linkVerified || !fresh(m.linkVerifiedAt, now, days) || m.availability !== 'available')
    return { kind: 'register-interest', reason: 'link-unverified' };

  const p = m.price;
  const priceOk =
    !!p && p.publishApproved && (p.status === 'verified' || p.status === 'owner-confirmed') && fresh(p.verifiedAt, now, days);
  return {
    kind: 'purchase',
    url: m.productUrl,
    // stale or unapproved amount → send the visitor to see the current price in the store
    price: priceOk
      ? { kind: 'exact', amountMinor: p.amountMinor, ...(p.previousAmountMinor ? { previousAmountMinor: p.previousAmountMinor } : {}), currency: p.currency, taxDisplay: p.taxDisplay }
      : { kind: 'see-store' },
  };
}

/** Maintainer warning list: verified items whose evidence is past the review window. */
export function overdueVerifications(items: Membership[], opts: ResolveOptions = {}): string[] {
  const now = opts.now ?? new Date();
  const days = opts.freshnessDays ?? 7;
  return items
    .filter((m) => m.linkVerified && !fresh(m.linkVerifiedAt, now, opts.freshnessDays ?? m.reviewDays ?? days))
    .map((m) => m.id);
}

export function formatPrice(amountMinor: number, locale: 'ar' | 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100);
}
