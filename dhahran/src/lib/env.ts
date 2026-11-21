import 'server-only';
import { z } from 'zod';

/**
 * Validated server environment. APP_ENV (what kind of deployment) and
 * LAUNCH_STAGE (is the club open) are independent flags.
 */
const schema = z.object({
  APP_ENV: z.enum(['development', 'preview', 'production']).default('development'),
  LAUNCH_STAGE: z.enum(['preopening', 'open']).default('preopening'),
  SITE_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.enum(['disable', 'require']).default('disable'),
  LEAD_HASH_SECRET: z.string().optional(),
  PRIVACY_NOTICE_VERSION: z.string().min(1).default('draft'),
  PRIVACY_CONTACT: z.string().optional(),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  ANALYTICS_ENABLED: z.enum(['true', 'false']).default('false'),
});

const UNSAFE_SECRETS = new Set(['', 'replace-with-a-secure-development-value', 'changeme', 'secret']);

export type Env = ReturnType<typeof readEnv>;

export function readEnv(source: Record<string, string | undefined> = process.env) {
  const blankToUndefined = Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, v === '' ? undefined : v]),
  );
  const e = schema.parse(blankToUndefined);
  const siteUrl = e.SITE_URL.replace(/\/+$/, '');
  const hasDb = !!e.DATABASE_URL && !e.DATABASE_URL.includes('USER:PASSWORD');
  const secretOk = !!e.LEAD_HASH_SECRET && !UNSAFE_SECRETS.has(e.LEAD_HASH_SECRET) && e.LEAD_HASH_SECRET.length >= 24;
  const noticeFinal = !e.PRIVACY_NOTICE_VERSION.toLowerCase().startsWith('draft');
  const isProd = e.APP_ENV === 'production';

  // Why lead collection is (un)available — surfaced honestly in the UI and health output.
  const blockers: string[] = [];
  if (!hasDb) blockers.push('DATABASE_URL is not configured');
  if (isProd) {
    if (!secretOk) blockers.push('LEAD_HASH_SECRET is missing or unsafe');
    if (!noticeFinal) blockers.push('PRIVACY_NOTICE_VERSION is still a draft');
    if (!e.PRIVACY_CONTACT) blockers.push('PRIVACY_CONTACT is not configured');
    if (/localhost|127\.0\.0\.1/.test(siteUrl)) blockers.push('SITE_URL is not a public domain');
  }

  return {
    appEnv: e.APP_ENV,
    launchStage: e.LAUNCH_STAGE,
    siteUrl,
    databaseUrl: hasDb ? e.DATABASE_URL! : undefined,
    databaseSsl: e.DATABASE_SSL === 'require',
    // Development fallback keeps local work simple; production never uses it (blocked above).
    leadHashSecret: secretOk ? e.LEAD_HASH_SECRET! : 'dev-only-insecure-hash-secret-000',
    privacyNoticeVersion: e.PRIVACY_NOTICE_VERSION,
    privacyNoticeFinal: noticeFinal,
    privacyContact: e.PRIVACY_CONTACT,
    trustProxy: e.TRUST_PROXY === 'true',
    analyticsEnabled: e.ANALYTICS_ENABLED === 'true',
    leadsEnabled: blockers.length === 0,
    leadBlockers: blockers,
    indexable: isProd && !/localhost|127\.0\.0\.1/.test(siteUrl),
  };
}

let cached: Env | undefined;
export function env(): Env {
  return (cached ??= readEnv());
}
