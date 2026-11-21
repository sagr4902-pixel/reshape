import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { E2E_DB_URL } from '../../playwright.config';

export default async function globalSetup() {
  if (!/test/.test(new URL(E2E_DB_URL).pathname)) throw new Error('E2E database name must contain "test".');
  const pool = new Pool({ connectionString: E2E_DB_URL });
  await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL('../../db/migrations', import.meta.url)) });
  await pool.query('truncate lead_submissions, consent_events, rate_limits restart identity cascade');
  await pool.end();
}
