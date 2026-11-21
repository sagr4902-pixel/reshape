import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '@db/schema';
import { leadSchema, type LeadInput } from '@/features/leads/schema';

/**
 * Integration tests run against a real, isolated PostgreSQL database
 * (TEST_DATABASE_URL, default: the local reshape_test database started by
 * scripts/dev-db.sh or docker compose). Synthetic data only.
 */
export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://reshape@127.0.0.1:54329/reshape_test';
if (!/test/.test(new URL(TEST_DB_URL).pathname)) throw new Error('Refusing to run integration tests against a database whose name does not contain "test".');

export const SECRET = 'integration-test-secret-0000000000000000';
export const allow = { programIds: ['calisthenics', 'kids', 'football-performance'], zoneIds: ['kids-pavilion'] };

export async function openDb() {
  const pool = new Pool({ connectionString: TEST_DB_URL, max: 12 });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../db/migrations', import.meta.url)) });
  return { pool, db };
}

export async function truncate(pool: Pool) {
  await pool.query('truncate lead_submissions, consent_events, rate_limits restart identity cascade');
}

/** Synthetic submission. Mobile numbers use the 0500000xxx test range. */
export function lead(over: Record<string, unknown> = {}): LeadInput {
  return leadSchema(allow).parse({
    name: 'مستخدم تجريبي',
    phone: '0500000001',
    programId: 'kids',
    intent: 'program-inquiry',
    locale: 'ar',
    noticeVersion: 'test-1',
    privacyAcknowledged: true,
    marketingConsent: false,
    idempotencyKey: randomUUID(),
    ...over,
  });
}
