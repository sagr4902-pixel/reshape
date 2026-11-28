import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { designImages, memberships, offer, offerState, programs, publicMemberships, registerHref, zoneIds } from '@/content';
import { validateAll } from '../../scripts/validate-content';

describe('content integrity', () => {
  it('passes schema, cross-reference, asset and translation-parity validation', () => {
    expect(validateAll(new Date('2026-11-29T12:00:00Z')).errors).toEqual([]);
  });

  it('public membership DTO: owner-confirmed Dhahran packages with prices and store links — no evidence notes', () => {
    for (const locale of ['ar', 'en'] as const) {
      const pub = publicMemberships(locale, new Date('2026-11-29T12:00:00Z'));
      expect(pub.map((m) => m.id)).toEqual(['gym-3m', 'gym-6m', 'gym-12m', 'kids-1m', 'kids-3m', 'kids-6m', 'kids-12m', 'pause-1w', 'travel-extra', 'pt-test']);
      expect(JSON.stringify(pub)).not.toMatch(/note|evidence|publishApproved|Owner confirmed/);
      for (const m of pub) {
        expect(m.action.kind, m.id).toBe('purchase');
        if (m.action.kind === 'purchase') expect(m.action.url).toMatch(/^https:\/\/reshape-sa\.com\/[a-z0-9-]+\/p\d+$/);
      }
      const gym6 = pub.find((m) => m.id === 'gym-6m')!.action;
      expect(gym6).toMatchObject({ kind: 'purchase', price: { kind: 'exact', amountMinor: 496000, previousAmountMinor: 504000 } });
    }
  });

  it('owner-confirmed prices stay shown for the review window, then fall back to "see the store"', () => {
    const at = (iso: string) => publicMemberships('ar', new Date(iso)).find((m) => m.id === 'gym-3m')!.action;
    expect(at('2027-01-05T00:00:00Z')).toMatchObject({ kind: 'purchase', price: { kind: 'exact', amountMinor: 270000 } });
    // past 45 days the link is no longer treated as checked: visitors are asked to register instead of buying blind
    expect(at('2027-01-20T00:00:00Z').kind).toBe('register-interest');
  });

  it('every package is sold only on the official store, and Dhahran is the only branch shown', () => {
    for (const m of memberships) {
      expect(m.branchScope, m.id).toBe('dhahran');
      expect(m.productUrl, m.id).toMatch(/^https:\/\/reshape-sa\.com\//);
    }
  });

  it('programs stay planned until confirmed', () => {
    for (const p of programs) expect(p.availability).toBe('planned');
  });

  it('only the facade and teaser crops are published — never full interior renders, the map or zones', () => {
    for (const id of Object.keys(designImages)) expect(id === 'facade' || id.startsWith('t-'), id).toBe(true);
    for (const p of programs) expect(designImages[p.imageId]?.alt.en, p.id).toBeTruthy();
    expect(zoneIds).toEqual([]);
    expect(existsSync('public/assets/scenes')).toBe(false);
    expect(existsSync('src/app/[locale]/explore')).toBe(false);
  });

  it('the offer is never sold without real terms: a draft shows only as a preview sample, production shows nothing', () => {
    expect(offer.status === 'live' || offer.payUrl === null).toBe(true); // a payment link only with a live offer
    const announced = { ...offer, status: 'announced' as const, endsAt: '2030-01-01T00:00:00+03:00' };
    expect(offerState(announced, 'production', new Date('2029-12-01T00:00:00Z')).kind).toBe('announced');
    expect(offerState(announced, 'production', new Date('2030-01-02T00:00:00Z')).kind).toBe('none'); // ended
    const draft = { ...offer, status: 'draft' as const };
    expect(offerState(draft, 'preview').kind).toBe('sample');
    expect(offerState(draft, 'production').kind).toBe('none');
    const live = { ...offer, status: 'live' as const, priceSar: 999, endsAt: '2030-01-01T00:00:00+03:00', payUrl: 'https://reshape-sa.com/x/p1' };
    expect(offerState(live, 'production', new Date('2029-12-31T00:00:00Z')).kind).toBe('live');
    expect(offerState(live, 'production', new Date('2030-01-02T00:00:00Z')).kind).toBe('none'); // expired
    expect(offerState({ ...live, payUrl: null }, 'production', new Date('2029-01-01T00:00:00Z')).kind).toBe('none');
  });

  it('registration links carry only identifiers', () => {
    expect(registerHref({ program: 'kids', zone: 'rig', intent: 'program-inquiry', src: 'explorer' })).toBe(
      '/register?program=kids&zone=rig&intent=program-inquiry&src=explorer',
    );
    expect(registerHref()).toBe('/register');
  });

  it('internal pricing hypotheses and internal tags never appear in shipped source or messages', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const files = [...walk('src/app'), ...walk('src/components'), ...walk('src/features'), 'messages/ar.json', 'messages/en.json'].filter((f) => /\.(tsx?|json)$/.test(f));
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/399|549|449|599|649/); // illustrative ranges from the internal worksheet
    }
  });
});
