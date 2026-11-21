import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { designImages, memberships, programs, publicMemberships, registerHref, scene } from '@/content';
import { validateAll } from '../../scripts/validate-content';

describe('content integrity', () => {
  it('passes schema, cross-reference, asset and translation-parity validation', () => {
    expect(validateAll(new Date('2026-11-21T12:00:00Z')).errors).toEqual([]);
  });

  it('public membership DTO exposes only Dhahran plans — no store evidence, notes or unapproved prices', () => {
    for (const locale of ['ar', 'en'] as const) {
      const pub = publicMemberships(locale, new Date('2026-11-21T12:00:00Z'));
      expect(pub.map((m) => m.id).sort()).toEqual(['dhahran-adult', 'dhahran-kids']);
      const json = JSON.stringify(pub);
      expect(json).not.toMatch(/note|evidence|amountMinor|2700|749|Dammam|الدمام|reshape-sa\.com/);
      // No Dhahran product is verified in the store → nothing may resolve to a purchase.
      expect(pub.every((m) => m.action.kind === 'register-interest')).toBe(true);
    }
  });

  it('no store product is marked as Dhahran-eligible', () => {
    for (const m of memberships.filter((x) => x.productUrl)) expect(['dammam', 'unknown']).toContain(m.branchScope);
  });

  it('programs stay planned until confirmed; the scene follows the supplied drawings', () => {
    for (const p of programs) expect(p.availability).toBe('planned');
    // Layout follows the owner's working drawings; imagery is still design visualisation.
    expect(scene.status).toBe('reference-validated');
    expect(scene.spatialMode).toBe('verified-layout');
  });

  it('every zone and program points at catalogued design renders with bilingual alt text', () => {
    for (const z of scene.zones) for (const id of z.imageIds) expect(designImages[id]?.alt.ar, `${z.id}/${id}`).toBeTruthy();
    for (const p of programs) expect(designImages[p.imageId]?.alt.en, p.id).toBeTruthy();
    // zones invented for the earlier concept (no evidence in the approved designs) are gone
    const zoneIds = scene.zones.map((z) => z.id);
    for (const invented of ['kids-pavilion', 'track-loop', 'performance-deck', 'calisthenics-hall', 'changing']) expect(zoneIds).not.toContain(invented);
    expect(zoneIds.sort()).toEqual(['entrance', 'juice-bar', 'lockers', 'overlook', 'reception', 'rig', 'strength', 'turf-cardio']);
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
      expect(text, f).not.toMatch(/crossfit|hyrox|كروسفت|هايروكس/i);
    }
  });
});
