import { describe, expect, it } from 'vitest';
import { readEnv } from '@/lib/env';

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

  it('on Vercel defaults to a non-indexed preview on the deployment address; explicit values win', () => {
    const auto = readEnv({ VERCEL: '1', VERCEL_URL: 'reshape-abc.vercel.app', VERCEL_BRANCH_URL: 'reshape-git-demo.vercel.app' });
    expect(auto.appEnv).toBe('preview');
    expect(auto.siteUrl).toBe('https://reshape-git-demo.vercel.app');
    expect(auto.indexable).toBe(false);
    const explicit = readEnv({ VERCEL: '1', VERCEL_URL: 'x.vercel.app', APP_ENV: 'production', SITE_URL: 'https://example.sa' });
    expect(explicit.appEnv).toBe('production');
    expect(explicit.siteUrl).toBe('https://example.sa');
  });
});
