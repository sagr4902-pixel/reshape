import { describe, expect, it } from 'vitest';
import { formatPrice, overdueVerifications, resolveMembershipAction } from '@/lib/catalog/resolve';
import { isOfficialStoreUrl } from '@/lib/catalog/store-links';
import type { Membership } from '@/lib/catalog/types';

const NOW = new Date('2026-11-21T12:00:00Z');
const base: Membership = {
  id: 'm',
  title: { ar: 'عضوية', en: 'Membership' },
  programIds: ['calisthenics'],
  branchScope: 'dhahran',
  branchEvidence: { status: 'verified', verifiedAt: '2026-11-21T07:00:00Z' },
  availability: 'available',
  price: { amountMinor: 49900, currency: 'SAR', taxDisplay: 'included', status: 'verified', verifiedAt: '2026-11-21T07:00:00Z', publishApproved: true },
  productUrl: 'https://reshape-sa.com/x/p1',
  linkVerifiedAt: '2026-11-21T07:00:00Z',
  linkVerified: true,
};
const act = (over: Partial<Membership>) => resolveMembershipAction({ ...base, ...over }, { now: NOW });

describe('resolveMembershipAction — CTA decision table', () => {
  it('verified Dhahran product, available, working link → purchase with exact price', () => {
    expect(act({})).toEqual({ kind: 'purchase', url: base.productUrl, price: { kind: 'exact', amountMinor: 49900, currency: 'SAR', taxDisplay: 'included' } });
  });
  it('product exists but Dhahran eligibility unknown → register interest, no purchase', () => {
    expect(act({ branchScope: 'unknown', branchEvidence: { status: 'unknown' } })).toEqual({ kind: 'register-interest', reason: 'branch-unverified' });
  });
  it('branch claimed but only provisional evidence → no purchase', () => {
    expect(act({ branchEvidence: { status: 'provisional' } }).kind).toBe('register-interest');
  });
  it('Dammam product never gets a Dhahran purchase CTA, even with a verified price', () => {
    expect(act({ branchScope: 'dammam' })).toEqual({ kind: 'register-interest', reason: 'not-dhahran' });
  });
  it('planned Dhahran plan without official product → price pending + interest', () => {
    expect(act({ productUrl: undefined, price: undefined, linkVerified: false, availability: 'unknown' })).toEqual({ kind: 'register-interest', reason: 'price-pending' });
  });
  it('unavailable product → honest unavailable state', () => {
    expect(act({ availability: 'unavailable' })).toEqual({ kind: 'unavailable', reason: 'unavailable' });
  });
  it('destination outside the official store → unavailable, never linked', () => {
    expect(act({ productUrl: 'https://reshape-sa.com.evil.example/p1' })).toEqual({ kind: 'unavailable', reason: 'broken-link' });
  });
  it('unverified or stale link → register interest', () => {
    expect(act({ linkVerified: false }).kind).toBe('register-interest');
    expect(act({ linkVerifiedAt: '2026-11-01T00:00:00Z' }).kind).toBe('register-interest');
  });
  it('price not publish-approved or stale → "see current price in store", never a stale amount', () => {
    expect(act({ price: { ...base.price!, publishApproved: false } })).toMatchObject({ kind: 'purchase', price: { kind: 'see-store' } });
    expect(act({ price: { ...base.price!, verifiedAt: '2026-11-10T00:00:00Z' } })).toMatchObject({ kind: 'purchase', price: { kind: 'see-store' } });
    expect(act({ price: { ...base.price!, status: 'provisional' } })).toMatchObject({ kind: 'purchase', price: { kind: 'see-store' } });
  });
  it('flags overdue verifications for maintainers', () => {
    expect(overdueVerifications([{ ...base, linkVerifiedAt: '2026-11-01T00:00:00Z' }], { now: NOW })).toEqual(['m']);
    expect(overdueVerifications([base], { now: NOW })).toEqual([]);
  });
});

describe('official store allow-list', () => {
  it.each(['https://reshape-sa.com/', 'https://reshape-sa.com/kids-one-month/p1148810604', 'https://RESHAPE-SA.com/x'])('accepts %s', (u) => expect(isOfficialStoreUrl(u)).toBe(true));
  it.each([
    'http://reshape-sa.com/',
    'https://reshape-sa.com.evil.example/',
    'https://evil.example/reshape-sa.com',
    'https://reshape-sa.com@evil.example/',
    'https://user:pw@reshape-sa.com/',
    'https://reshape-sa.com:8443/',
    'https://sub.reshape-sa.com/',
    'https://reshape-sa.co/',
    'javascript:alert(1)',
    '//reshape-sa.com/',
    'reshape-sa.com',
    '',
    null,
    42,
  ])('rejects %s', (u) => expect(isOfficialStoreUrl(u)).toBe(false));
});

describe('price formatting', () => {
  it('formats integer halalas as SAR with Latin digits', () => {
    expect(formatPrice(49900, 'en')).toMatch(/499/);
    expect(formatPrice(49900, 'ar')).toMatch(/499/);
    expect(formatPrice(49950, 'en')).toMatch(/499\.50/);
  });
});
