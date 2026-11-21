import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { project } from '@/features/explorer/scene/engine';
import meta from '@/content/generated/scene-meta.json';
import { scene } from '@/content';
import { readEnv } from '@/lib/env';

describe('scene geometry', () => {
  it('uses one projection: plan axes map to the two isometric diagonals, z is vertical', () => {
    const [ox, oy] = project([0, 0, 0]);
    const [xx, xy] = project([1, 0, 0]);
    const [yx, yy] = project([0, 1, 0]);
    const [zx, zy] = project([0, 0, 1]);
    expect(xx - ox).toBeCloseTo(-(yx - ox));
    expect(xy - oy).toBeCloseTo(yy - oy);
    expect(zx).toBeCloseTo(ox);
    expect(zy).toBeLessThan(oy);
  });
  it('every zone has an anchor inside its level drawing and a camera in both layouts', () => {
    for (const z of scene.zones) {
      const m = (meta.zones as Record<string, { level: string; anchor: number[] }>)[z.id];
      expect(m.level).toBe(z.level);
      for (const v of m.anchor) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(100);
      }
      for (const layout of ['portrait', 'landscape'] as const) {
        const cam = (meta.layouts[layout].cameras as Record<string, { s: number }>)[z.id];
        expect(cam.s).toBeGreaterThan(1);
      }
    }
  });
  it('committed illustrations match the generator (deterministic output)', () => {
    expect(() => execFileSync('npx', ['tsx', 'scripts/build-scenes.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});

describe('environment gates', () => {
  const prod = { APP_ENV: 'production', SITE_URL: 'https://example.sa', DATABASE_URL: 'postgresql://u:p@db/x', LEAD_HASH_SECRET: 'x'.repeat(40), PRIVACY_NOTICE_VERSION: '2026-12-01', PRIVACY_CONTACT: 'privacy@example.sa' };
  it('APP_ENV and LAUNCH_STAGE are independent', () => {
    expect(readEnv({ APP_ENV: 'production', LAUNCH_STAGE: 'preopening' }).launchStage).toBe('preopening');
    expect(readEnv({ APP_ENV: 'preview', LAUNCH_STAGE: 'open' }).appEnv).toBe('preview');
  });
  it('fully configured production collects leads and is indexable', () => {
    const e = readEnv(prod);
    expect(e.leadsEnabled).toBe(true);
    expect(e.indexable).toBe(true);
  });
  it('no database → lead collection is off (never a mock backend)', () => {
    expect(readEnv({}).leadsEnabled).toBe(false);
    expect(readEnv({ DATABASE_URL: 'postgresql://USER:PASSWORD@localhost:5432/reshape_dev' }).leadsEnabled).toBe(false);
  });
  it.each([
    ['draft notice', { PRIVACY_NOTICE_VERSION: 'draft' }],
    ['unsafe secret', { LEAD_HASH_SECRET: 'replace-with-a-secure-development-value' }],
    ['missing privacy contact', { PRIVACY_CONTACT: '' }],
    ['localhost site url', { SITE_URL: 'http://localhost:3000' }],
  ])('production with %s blocks collection', (_n, over) => {
    expect(readEnv({ ...prod, ...over }).leadsEnabled).toBe(false);
  });
  it('previews are never indexable', () => {
    expect(readEnv({ ...prod, APP_ENV: 'preview' }).indexable).toBe(false);
  });
});
